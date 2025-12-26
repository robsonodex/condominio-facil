import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getSessionFromReq } from '@/lib/supabase/admin';
import { createClient } from '@supabase/supabase-js';

// No GET allowed
export async function GET(request: NextRequest) {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function POST(request: NextRequest) {
    try {
        console.log('[ADMIN_CREATE_USER] Request received');

        // 1. Auth Check using shared helper
        const session = await getSessionFromReq(request);

        if (!session) {
            console.log('[ADMIN_CREATE_USER] No session found - returning 401');
            return NextResponse.json({
                error: 'Não autorizado. Por favor, faça login novamente.'
            }, { status: 401 });
        }

        console.log('[ADMIN_CREATE_USER] Session found - Role:', session.role);

        // Only Superadmin or Sindico
        if (!session.isSuperadmin && !session.isSindico) {
            console.log('[ADMIN_CREATE_USER] Permission denied for role:', session.role);
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
        }

        // 2. Parse Body
        const body = await request.json();
        const {
            nome,
            email,
            senha,
            telefone,
            role,
            condo_id,
            ativo,
            // Campos extras para síndico
            condo_nome,
            plano_id,
            periodo_teste,
            ativar_imediatamente,
            enviar_email = true // Por padrão envia e-mail
        } = body;

        // 3. Validate
        if (!nome || !email || !senha) {
            return NextResponse.json({
                error: 'Nome, email e senha são obrigatórios'
            }, { status: 400 });
        }

        // 4. Check email existence (using Admin to be sure)
        const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return NextResponse.json({
                error: `Já existe um usuário cadastrado com o email "${email}". Por favor, use outro email.`
            }, { status: 400 });
        }

        // 5. Create Auth User (Service Role)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: senha,
            email_confirm: true,
            user_metadata: { nome }
        });

        if (authError) {
            if (authError.message.includes('already') || authError.message.includes('exists')) {
                return NextResponse.json({
                    error: `Já existe um usuário cadastrado com o email "${email}".`
                }, { status: 400 });
            }
            return NextResponse.json({
                error: `Erro ao criar usuário: ${authError.message}`
            }, { status: 500 });
        }

        if (!authData.user) {
            return NextResponse.json({ error: 'Falha ao gerar usuário' }, { status: 500 });
        }

        // SAFETY: Force email confirmation explicitly to ensure login works immediately
        if (!authData.user.email_confirmed_at) {
            await supabaseAdmin.auth.admin.updateUserById(authData.user.id, {
                email_confirm: true
            });
        }

        let finalCondoId = condo_id || null;
        let planData: { valor_mensal?: number; nome_plano?: string } | null = null;

        // 6. Handle Sindico Setup (Condo + Subscription)
        if (role === 'sindico' && condo_nome && plano_id) {
            const { data: plan } = await supabaseAdmin
                .from('plans')
                .select('valor_mensal, nome_plano')
                .eq('id', plano_id)
                .single();

            planData = plan;

            const hoje = new Date();
            let dataRenovacao = new Date(hoje);
            let condoStatus = 'ativo';

            if (ativar_imediatamente) {
                // Ativo + 1 mês
                dataRenovacao.setMonth(dataRenovacao.getMonth() + 1);
            } else if (periodo_teste) {
                condoStatus = 'teste';
                dataRenovacao.setDate(dataRenovacao.getDate() + 7);
            } else {
                dataRenovacao.setMonth(dataRenovacao.getMonth() + 1);
            }

            // Gerar condo_numero sequencial
            const { data: maxCondoRow } = await supabaseAdmin
                .from('condos')
                .select('condo_numero')
                .order('condo_numero', { ascending: false })
                .limit(1)
                .single();

            const condoNumero = (maxCondoRow?.condo_numero || 0) + 1;

            // Create Condo
            const { data: newCondo, error: condoError } = await supabaseAdmin
                .from('condos')
                .insert({
                    nome: condo_nome,
                    plano_id: plano_id,
                    status: condoStatus,
                    data_inicio: hoje.toISOString().split('T')[0],
                    data_fim_teste: periodo_teste ? dataRenovacao.toISOString().split('T')[0] : null,
                    condo_numero: condoNumero,
                })
                .select('id, condo_numero')
                .single();

            if (condoError) {
                await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
                return NextResponse.json({
                    error: `Erro ao criar condomínio: ${condoError.message}`
                }, { status: 500 });
            }

            finalCondoId = newCondo.id;

            // Create Subscription
            await supabaseAdmin
                .from('subscriptions')
                .insert({
                    condo_id: newCondo.id,
                    plano_id: plano_id,
                    status: 'ativo',
                    data_inicio: hoje.toISOString().split('T')[0],
                    data_renovacao: dataRenovacao.toISOString().split('T')[0],
                    valor_mensal_cobrado: plan?.valor_mensal || 0,
                    observacoes: periodo_teste ? 'Período de teste - 7 dias' : null,
                });
        }

        // 7. Create Profile
        // Gerar cliente_id para síndicos (ID sequencial)
        let clienteId = null;
        if (role === 'sindico') {
            const { data: maxIdRow } = await supabaseAdmin
                .from('users')
                .select('cliente_id')
                .eq('role', 'sindico')
                .order('cliente_id', { ascending: false })
                .limit(1)
                .single();

            clienteId = (maxIdRow?.cliente_id || 0) + 1;
        }

        const { error: dbError } = await supabaseAdmin
            .from('users')
            .insert({
                id: authData.user.id,
                nome,
                email,
                telefone: telefone || null,
                role: role || 'morador',
                condo_id: finalCondoId,
                ativo: ativo !== false,
                cliente_id: clienteId
            });

        if (dbError) {
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            return NextResponse.json({
                error: `Erro ao salvar perfil: ${dbError.message}`
            }, { status: 500 });
        }

        // 8. Send welcome emails (only if enviar_email is true)
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://meucondominiofacil.com';

        // 8.1 Send credentials email to new user
        if (enviar_email) {
            try {
                await fetch(`${baseUrl}/api/email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tipo: 'user_credentials',
                        destinatario: email,
                        dados: {
                            nome,
                            email,
                            password: senha,
                            role: role === 'sindico' ? 'Síndico' : role === 'superadmin' ? 'Admin' : role === 'porteiro' ? 'Porteiro' : 'Morador',
                            condoNome: condo_nome || '',
                            loginUrl: `${baseUrl}/login`
                        },
                        internalCall: true
                    })
                });
                console.log('[ADMIN_CREATE_USER] Credentials email sent to:', email);
            } catch (emailError) {
                console.error('[ADMIN_CREATE_USER] Failed to send credentials email:', emailError);
            }
        }

        // 8.2 Send trial/active email for síndico with new condo
        if (role === 'sindico' && condo_nome && finalCondoId) {
            try {
                const emailType = periodo_teste ? 'condo_trial' : 'condo_active';
                const dataFim = new Date();
                dataFim.setDate(dataFim.getDate() + 7);

                await fetch(`${baseUrl}/api/email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tipo: emailType,
                        destinatario: email,
                        dados: {
                            nome,
                            condoNome: condo_nome,
                            dataFim: dataFim.toLocaleDateString('pt-BR'),
                            plano: planData?.nome_plano || 'Básico',
                            proximoVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
                            loginUrl: `${baseUrl}/login`
                        },
                        condoId: finalCondoId,
                        internalCall: true
                    })
                });
                console.log(`[ADMIN_CREATE_USER] ${emailType} email sent to:`, email);
            } catch (emailError) {
                console.error('[ADMIN_CREATE_USER] Failed to send trial/active email:', emailError);
            }
        }

        // Success Message Construction
        let message = `Usuário "${nome}" criado com sucesso!`;
        if (role === 'sindico' && condo_nome) {
            message += ` Condomínio "${condo_nome}" criado em modo ${periodo_teste ? 'TESTE' : 'ATIVO'}. E-mail de boas-vindas enviado.`;
        }

        return NextResponse.json({
            success: true,
            message,
            user: {
                id: authData.user.id,
                email,
                nome
            }
        });

    } catch (error: any) {
        console.error('[ADMIN_CREATE_USER] Error:', error);
        return NextResponse.json({
            error: `Erro inesperado: ${error.message}`
        }, { status: 500 });
    }
}
