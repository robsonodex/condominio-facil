import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: Listar documentos da base de conhecimento
export async function GET() {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('users')
            .select('condo_id, role')
            .eq('id', user.id)
            .single();

        if (!profile?.condo_id) {
            return NextResponse.json({ error: 'Usuário sem condomínio' }, { status: 400 });
        }

        // Síndico vê todos, outros veem apenas ativos
        const query = supabase
            .from('ai_documents')
            .select('id, tipo, titulo, ativo, created_at, updated_at, versao')
            .eq('condo_id', profile.condo_id)
            .order('created_at', { ascending: false });

        if (profile.role !== 'sindico' && profile.role !== 'superadmin') {
            query.eq('ativo', true);
        }

        const { data: documents, error } = await query;

        if (error) {
            console.error('[AI Documents] Erro ao buscar documentos:', error);
            return NextResponse.json({ error: 'Erro ao buscar documentos' }, { status: 500 });
        }

        return NextResponse.json({ documents: documents || [] });
    } catch (error) {
        console.error('[AI Documents] Erro:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

// POST: Adicionar novo documento
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('users')
            .select('condo_id, role')
            .eq('id', user.id)
            .single();

        if (!profile?.condo_id) {
            return NextResponse.json({ error: 'Usuário sem condomínio' }, { status: 400 });
        }

        if (profile.role !== 'sindico' && profile.role !== 'superadmin') {
            return NextResponse.json({ error: 'Apenas síndicos podem adicionar documentos' }, { status: 403 });
        }

        const body = await request.json();
        const { tipo, titulo, conteudo_texto } = body;

        // Validações
        const tiposValidos = ['regimento', 'convencao', 'ata', 'decisao', 'faq', 'outro'];
        if (!tipo || !tiposValidos.includes(tipo)) {
            return NextResponse.json({ error: 'Tipo de documento inválido' }, { status: 400 });
        }

        if (!titulo || titulo.length < 3) {
            return NextResponse.json({ error: 'Título deve ter pelo menos 3 caracteres' }, { status: 400 });
        }

        if (!conteudo_texto || conteudo_texto.length < 50) {
            return NextResponse.json({ error: 'Conteúdo deve ter pelo menos 50 caracteres' }, { status: 400 });
        }

        // Limite de tamanho (500KB de texto)
        if (conteudo_texto.length > 500000) {
            return NextResponse.json({ error: 'Documento muito grande. Limite: 500KB de texto' }, { status: 400 });
        }

        const { data: document, error } = await supabase
            .from('ai_documents')
            .insert({
                condo_id: profile.condo_id,
                tipo,
                titulo,
                conteudo_texto,
                ativo: true,
                created_by: user.id,
                aprovado_por: user.id,
                aprovado_em: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('[AI Documents] Erro ao criar documento:', error);
            return NextResponse.json({ error: 'Erro ao criar documento' }, { status: 500 });
        }

        // Audit log
        await supabase.from('ai_audit_log').insert({
            condo_id: profile.condo_id,
            acao: 'documento_adicionado',
            descricao: `Documento "${titulo}" (${tipo}) adicionado`,
            user_id: user.id,
            dados_novos: { tipo, titulo, tamanho: conteudo_texto.length }
        });

        return NextResponse.json({
            success: true,
            document,
            message: 'Documento adicionado à base de conhecimento'
        });
    } catch (error) {
        console.error('[AI Documents] Erro:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

// DELETE: Desativar documento (soft delete)
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('users')
            .select('condo_id, role')
            .eq('id', user.id)
            .single();

        if (!profile?.condo_id) {
            return NextResponse.json({ error: 'Usuário sem condomínio' }, { status: 400 });
        }

        if (profile.role !== 'sindico' && profile.role !== 'superadmin') {
            return NextResponse.json({ error: 'Apenas síndicos podem remover documentos' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const documentId = searchParams.get('id');

        if (!documentId) {
            return NextResponse.json({ error: 'ID do documento não fornecido' }, { status: 400 });
        }

        // Buscar documento para log
        const { data: existing } = await supabase
            .from('ai_documents')
            .select('titulo, tipo')
            .eq('id', documentId)
            .eq('condo_id', profile.condo_id)
            .single();

        if (!existing) {
            return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });
        }

        // Soft delete
        const { error } = await supabase
            .from('ai_documents')
            .update({ ativo: false })
            .eq('id', documentId)
            .eq('condo_id', profile.condo_id);

        if (error) {
            console.error('[AI Documents] Erro ao desativar documento:', error);
            return NextResponse.json({ error: 'Erro ao remover documento' }, { status: 500 });
        }

        // Audit log
        await supabase.from('ai_audit_log').insert({
            condo_id: profile.condo_id,
            acao: 'documento_removido',
            descricao: `Documento "${existing.titulo}" removido`,
            user_id: user.id,
            dados_anteriores: existing
        });

        return NextResponse.json({
            success: true,
            message: 'Documento removido da base de conhecimento'
        });
    } catch (error) {
        console.error('[AI Documents] Erro:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

// PATCH: Atualizar status do documento (ativar/desativar)
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('users')
            .select('condo_id, role')
            .eq('id', user.id)
            .single();

        if (!profile?.condo_id) {
            return NextResponse.json({ error: 'Usuário sem condomínio' }, { status: 400 });
        }

        if (profile.role !== 'sindico' && profile.role !== 'superadmin') {
            return NextResponse.json({ error: 'Apenas síndicos podem modificar documentos' }, { status: 403 });
        }

        const body = await request.json();
        const { id, ativo } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID do documento não fornecido' }, { status: 400 });
        }

        const { data: document, error } = await supabase
            .from('ai_documents')
            .update({ ativo })
            .eq('id', id)
            .eq('condo_id', profile.condo_id)
            .select()
            .single();

        if (error) {
            console.error('[AI Documents] Erro ao atualizar documento:', error);
            return NextResponse.json({ error: 'Erro ao atualizar documento' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            document,
            message: ativo ? 'Documento ativado' : 'Documento desativado'
        });
    } catch (error) {
        console.error('[AI Documents] Erro:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
