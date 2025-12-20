import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

interface ImportRow {
    nome: string;
    email: string;
    telefone?: string;
    bloco?: string;
    unidade: string;
    tipo: string;
}

interface ImportResult {
    success: boolean;
    linha: number;
    nome: string;
    email: string;
    erro?: string;
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Autenticação
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        // Buscar perfil e verificar se é síndico
        const { data: profile } = await supabase
            .from('users')
            .select('condo_id, role')
            .eq('id', user.id)
            .single();

        if (!profile?.condo_id || profile.role !== 'sindico') {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const condoId = profile.condo_id;

        // Receber dados
        const body = await request.json();
        const { moradores } = body as { moradores: ImportRow[] };

        if (!moradores || !Array.isArray(moradores) || moradores.length === 0) {
            return NextResponse.json({ error: 'Nenhum morador para importar' }, { status: 400 });
        }

        const resultados: ImportResult[] = [];
        let importados = 0;
        let erros = 0;

        for (let i = 0; i < moradores.length; i++) {
            const row = moradores[i];
            const linha = i + 2; // +2 porque linha 1 é header

            try {
                // Validar campos obrigatórios
                if (!row.nome?.trim()) {
                    throw new Error('Nome é obrigatório');
                }
                if (!row.email?.trim()) {
                    throw new Error('Email é obrigatório');
                }
                if (!row.unidade?.trim()) {
                    throw new Error('Unidade é obrigatória');
                }
                if (!row.tipo?.trim()) {
                    throw new Error('Tipo é obrigatório');
                }

                const tipoNormalizado = row.tipo.toLowerCase().trim();
                if (!['proprietario', 'inquilino'].includes(tipoNormalizado)) {
                    throw new Error('Tipo deve ser "proprietario" ou "inquilino"');
                }

                // Verificar se email já existe no condomínio
                const { data: existingUser } = await supabaseAdmin
                    .from('users')
                    .select('id')
                    .eq('condo_id', condoId)
                    .eq('email', row.email.toLowerCase().trim())
                    .single();

                if (existingUser) {
                    throw new Error('Email já cadastrado neste condomínio');
                }

                // Buscar ou criar unidade
                let unidadeId: string;
                const blocoNormalizado = row.bloco?.trim() || null;
                const numeroUnidade = row.unidade.trim();

                const { data: existingUnit } = await supabaseAdmin
                    .from('units')
                    .select('id')
                    .eq('condo_id', condoId)
                    .eq('bloco', blocoNormalizado)
                    .eq('numero_unidade', numeroUnidade)
                    .single();

                if (existingUnit) {
                    unidadeId = existingUnit.id;
                } else {
                    // Criar unidade
                    const { data: newUnit, error: unitError } = await supabaseAdmin
                        .from('units')
                        .insert({
                            condo_id: condoId,
                            bloco: blocoNormalizado,
                            numero_unidade: numeroUnidade
                        })
                        .select()
                        .single();

                    if (unitError) throw new Error('Erro ao criar unidade');
                    unidadeId = newUnit.id;
                }

                // Criar usuário no Auth (senha temporária)
                const senhaTemporaria = `Temp${Math.random().toString(36).slice(-8)}!`;
                const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
                    email: row.email.toLowerCase().trim(),
                    password: senhaTemporaria,
                    email_confirm: true
                });

                if (authCreateError) {
                    throw new Error(`Erro ao criar conta: ${authCreateError.message}`);
                }

                // Criar registro na tabela users
                const { error: userError } = await supabaseAdmin
                    .from('users')
                    .insert({
                        id: authData.user.id,
                        nome: row.nome.trim(),
                        email: row.email.toLowerCase().trim(),
                        telefone: row.telefone?.trim() || null,
                        role: 'morador',
                        condo_id: condoId,
                        unidade_id: unidadeId,
                        ativo: true
                    });

                if (userError) {
                    // Tentar deletar usuário do Auth se falhar
                    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
                    throw new Error('Erro ao criar perfil do morador');
                }

                // Criar registro na tabela residents
                const { error: residentError } = await supabaseAdmin
                    .from('residents')
                    .insert({
                        user_id: authData.user.id,
                        condo_id: condoId,
                        unidade_id: unidadeId,
                        tipo: tipoNormalizado as 'proprietario' | 'inquilino',
                        ativo: true
                    });

                if (residentError) {
                    throw new Error('Erro ao vincular morador à unidade');
                }

                resultados.push({
                    success: true,
                    linha,
                    nome: row.nome,
                    email: row.email
                });
                importados++;

            } catch (err: any) {
                resultados.push({
                    success: false,
                    linha,
                    nome: row.nome || '',
                    email: row.email || '',
                    erro: err.message
                });
                erros++;
            }
        }

        return NextResponse.json({
            success: true,
            resumo: {
                total: moradores.length,
                importados,
                erros
            },
            resultados
        });

    } catch (error: any) {
        console.error('[Import Moradores] Erro:', error);
        return NextResponse.json({ error: 'Erro ao processar importação' }, { status: 500 });
    }
}
