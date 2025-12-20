import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: Buscar agente do condomínio do usuário logado
export async function GET() {
    try {
        const supabase = await createClient();

        // Verificar autenticação
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        // Buscar perfil do usuário para pegar condo_id
        const { data: profile } = await supabase
            .from('users')
            .select('condo_id, role')
            .eq('id', user.id)
            .single();

        if (!profile?.condo_id) {
            return NextResponse.json({ error: 'Usuário sem condomínio' }, { status: 400 });
        }

        // Buscar agente do condomínio
        const { data: agent, error } = await supabase
            .from('ai_agents')
            .select('*')
            .eq('condo_id', profile.condo_id)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
            console.error('[AI Agent] Erro ao buscar agente:', error);
            return NextResponse.json({ error: 'Erro ao buscar agente' }, { status: 500 });
        }

        // Buscar settings também
        const { data: settings } = await supabase
            .from('ai_settings')
            .select('*')
            .eq('condo_id', profile.condo_id)
            .single();

        return NextResponse.json({
            agent: agent || null,
            settings: settings || null,
            hasAgent: !!agent
        });
    } catch (error) {
        console.error('[AI Agent] Erro:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

// POST: Criar ou atualizar agente do condomínio
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verificar autenticação
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        // Verificar se é síndico
        const { data: profile } = await supabase
            .from('users')
            .select('condo_id, role')
            .eq('id', user.id)
            .single();

        if (!profile?.condo_id) {
            return NextResponse.json({ error: 'Usuário sem condomínio' }, { status: 400 });
        }

        if (profile.role !== 'sindico' && profile.role !== 'superadmin') {
            return NextResponse.json({ error: 'Apenas síndicos podem configurar o agente' }, { status: 403 });
        }

        const body = await request.json();
        const { nome_agente, tom_resposta, instrucoes_personalizadas, ativo } = body;

        // Validar campos
        if (!nome_agente || nome_agente.length < 3) {
            return NextResponse.json({ error: 'Nome do agente deve ter pelo menos 3 caracteres' }, { status: 400 });
        }

        const validTons = ['formal', 'direto', 'amigavel'];
        if (tom_resposta && !validTons.includes(tom_resposta)) {
            return NextResponse.json({ error: 'Tom de resposta inválido' }, { status: 400 });
        }

        // Verificar se já existe agente
        const { data: existing } = await supabase
            .from('ai_agents')
            .select('id')
            .eq('condo_id', profile.condo_id)
            .single();

        let result;

        if (existing) {
            // Atualizar existente
            result = await supabase
                .from('ai_agents')
                .update({
                    nome_agente,
                    tom_resposta: tom_resposta || 'formal',
                    instrucoes_personalizadas: instrucoes_personalizadas || null,
                    ativo: ativo !== undefined ? ativo : true
                })
                .eq('id', existing.id)
                .select()
                .single();
        } else {
            // Criar novo
            result = await supabase
                .from('ai_agents')
                .insert({
                    condo_id: profile.condo_id,
                    nome_agente,
                    tom_resposta: tom_resposta || 'formal',
                    instrucoes_personalizadas: instrucoes_personalizadas || null,
                    ativo: ativo !== undefined ? ativo : true,
                    created_by: user.id
                })
                .select()
                .single();

            // Criar settings padrão também
            await supabase
                .from('ai_settings')
                .insert({
                    condo_id: profile.condo_id,
                    roles_permitidos: ['sindico', 'morador', 'inquilino'],
                    limite_mensagens_mes: 500,
                    mensagens_usadas_mes: 0,
                    mes_referencia: new Date().toISOString().slice(0, 7)
                });
        }

        if (result.error) {
            console.error('[AI Agent] Erro ao salvar agente:', result.error);
            return NextResponse.json({ error: 'Erro ao salvar agente' }, { status: 500 });
        }

        // Registrar no audit log
        await supabase.from('ai_audit_log').insert({
            condo_id: profile.condo_id,
            acao: existing ? 'agente_atualizado' : 'agente_criado',
            descricao: `Agente "${nome_agente}" ${existing ? 'atualizado' : 'criado'}`,
            user_id: user.id,
            dados_novos: { nome_agente, tom_resposta, ativo }
        });

        return NextResponse.json({
            success: true,
            agent: result.data,
            message: existing ? 'Agente atualizado com sucesso' : 'Agente criado com sucesso'
        });
    } catch (error) {
        console.error('[AI Agent] Erro:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
