import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * LGPD Endpoint - Exclusão de dados do usuário
 * Art. 18, VI - Direito à exclusão de dados
 */
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();

        // ========================================
        // SEGURANÇA: Autenticação obrigatória
        // ========================================
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { error: 'Não autorizado. Faça login para continuar.' },
                { status: 401 }
            );
        }

        // Buscar perfil do usuário logado
        const { data: profile } = await supabase
            .from('users')
            .select('id, email, nome, role, condo_id')
            .eq('id', user.id)
            .single();

        if (!profile) {
            return NextResponse.json(
                { error: 'Perfil não encontrado.' },
                { status: 404 }
            );
        }

        // ========================================
        // VERIFICAR: Exclusão administrativa (superadmin/síndico)
        // ========================================
        const { searchParams } = new URL(request.url);
        const targetUserId = searchParams.get('id');

        // Se há um ID na query string, é exclusão administrativa
        if (targetUserId) {
            // Apenas superadmin e síndico podem excluir outros usuários
            if (profile.role !== 'superadmin' && profile.role !== 'sindico') {
                return NextResponse.json({
                    error: 'Acesso negado',
                    message: 'Apenas administradores podem excluir outros usuários.',
                }, { status: 403 });
            }

            // Não pode excluir a si mesmo via admin
            if (targetUserId === user.id) {
                return NextResponse.json({
                    error: 'Não é possível excluir a própria conta por esta rota',
                    message: 'Use a opção de exclusão de conta na página de perfil.',
                }, { status: 400 });
            }

            // Buscar o usuário alvo
            const { data: targetUser } = await supabase
                .from('users')
                .select('id, nome, role, condo_id')
                .eq('id', targetUserId)
                .single();

            if (!targetUser) {
                return NextResponse.json({
                    error: 'Usuário não encontrado',
                    success: false,
                }, { status: 404 });
            }

            // Não pode excluir superadmin
            if (targetUser.role === 'superadmin') {
                return NextResponse.json({
                    error: 'Não é possível excluir um superadmin',
                    success: false,
                }, { status: 403 });
            }

            // Síndico só pode excluir usuários do próprio condomínio
            if (profile.role === 'sindico' && targetUser.condo_id !== profile.condo_id) {
                return NextResponse.json({
                    error: 'Você só pode excluir usuários do seu condomínio',
                    success: false,
                }, { status: 403 });
            }

            // Executar exclusão via função do banco
            const { data: result, error } = await supabase.rpc('hard_delete_user', {
                p_user_id: targetUserId,
            });

            if (error) {
                console.error('Admin delete error:', error);
                return NextResponse.json({
                    error: 'Erro ao excluir usuário',
                    message: error.message,
                    success: false,
                }, { status: 500 });
            }

            // Verificar resultado da função
            if (result && result.success === false) {
                return NextResponse.json({
                    error: result.error || 'Erro desconhecido',
                    detail: result.detail,
                    success: false,
                }, { status: 500 });
            }

            console.log(`ADMIN: Usuário ${user.id} (${profile.role}) excluiu usuário ${targetUserId}`);

            return NextResponse.json({
                success: true,
                message: 'Usuário excluído permanentemente.',
            });
        }

        // ========================================
        // EXCLUSÃO PRÓPRIA (LGPD) - Requer confirmação
        // ========================================
        let body: any = {};
        try {
            body = await request.json();
        } catch {
            // Body vazio é ok
        }

        if (body.confirmacao !== 'EXCLUIR MEUS DADOS') {
            return NextResponse.json({
                error: 'Confirmação necessária',
                message: 'Para excluir seus dados, envie: { "confirmacao": "EXCLUIR MEUS DADOS" }',
                aviso: 'Esta ação é IRREVERSÍVEL e removerá todos os seus dados pessoais.',
            }, { status: 400 });
        }

        if (profile.role === 'superadmin') {
            return NextResponse.json({
                error: 'Superadmin não pode se auto-excluir',
                message: 'Entre em contato com o suporte técnico.',
            }, { status: 403 });
        }

        if (profile.role === 'sindico' && profile.condo_id) {
            const { data: subscription } = await supabase
                .from('subscriptions')
                .select('status')
                .eq('condo_id', profile.condo_id)
                .eq('status', 'ativo')
                .single();

            if (subscription) {
                return NextResponse.json({
                    error: 'Assinatura ativa',
                    message: 'Cancele a assinatura do condomínio antes de excluir sua conta.',
                }, { status: 400 });
            }
        }

        const { data: result, error } = await supabase.rpc('delete_user_data', {
            p_user_id: user.id,
        });

        if (error) {
            console.error('LGPD delete error:', error);
            return NextResponse.json({
                error: 'Erro ao processar exclusão',
                message: 'Entre em contato com o suporte: suporte@condominiofacil.com.br',
            }, { status: 500 });
        }

        await supabase.auth.signOut();

        console.log(`LGPD: Usuário ${user.id} solicitou exclusão de dados`);

        return NextResponse.json({
            success: true,
            message: 'Seus dados foram removidos/anonimizados conforme LGPD.',
            detalhes: result,
            aviso: 'Sua sessão foi encerrada. Você será redirecionado.',
        });
    } catch (error: any) {
        console.error('LGPD endpoint error:', error);
        return NextResponse.json(
            { error: 'Erro ao processar solicitação' },
            { status: 500 }
        );
    }
}

/**
 * GET - Retornar dados do usuário (portabilidade LGPD)
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { error: 'Não autorizado' },
                { status: 401 }
            );
        }

        // Buscar todos os dados do usuário
        const { data: profile } = await supabase
            .from('users')
            .select(`
                id, nome, email, telefone, role, condo_id, ativo, created_at,
                residents (id, tipo, created_at),
                occurrences:occurrences!criado_por_user_id (id, titulo, created_at),
                notice_reads (id, read_at)
            `)
            .eq('id', user.id)
            .single();

        if (!profile) {
            return NextResponse.json(
                { error: 'Perfil não encontrado' },
                { status: 404 }
            );
        }

        // Buscar aceites legais
        const { data: acceptances } = await supabase
            .from('legal_acceptances')
            .select('tipo, versao, aceito_em')
            .eq('user_id', user.id);

        return NextResponse.json({
            dados_pessoais: {
                nome: profile.nome,
                email: profile.email,
                telefone: profile.telefone,
                cargo: profile.role,
                ativo: profile.ativo,
                cadastrado_em: profile.created_at,
            },
            residencias: profile.residents,
            ocorrencias_criadas: profile.occurrences,
            avisos_lidos: profile.notice_reads?.length || 0,
            aceites_legais: acceptances,
            lgpd: {
                direito_exclusao: '/api/user/delete (DELETE)',
                direito_retificacao: '/perfil (editar)',
                controlador: 'Condomínio Fácil LTDA',
                contato_dpo: 'dpo@condominiofacil.com.br',
            },
        });
    } catch (error: any) {
        console.error('LGPD get error:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar dados' },
            { status: 500 }
        );
    }
}
