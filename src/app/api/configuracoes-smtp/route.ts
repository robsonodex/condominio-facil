import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encryptPassword, isEncrypted } from '@/lib/smtp-crypto';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verificar autenticação
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Buscar perfil do usuário
        const { data: profile } = await supabase
            .from('users')
            .select('id, role, condo_id')
            .eq('id', user.id)
            .single();

        if (!profile || !['sindico', 'superadmin'].includes(profile.role)) {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
        }

        // Buscar configuração SMTP do condomínio
        const { data: config, error } = await supabase
            .from('configuracoes_smtp')
            .select('id, smtp_host, smtp_port, smtp_user, smtp_from_email, smtp_from_name, smtp_secure, is_active, created_at, updated_at')
            .eq('condominio_id', profile.condo_id)
            .single();

        // PGRST116 = nenhuma linha encontrada (ok, não configurado ainda)
        // 42P01 = tabela não existe (precisa executar SQL)
        if (error) {
            if (error.code === 'PGRST116') {
                // Não encontrou configuração - normal
                return NextResponse.json({ configured: false, config: null });
            }
            if (error.code === '42P01') {
                // Tabela não existe - retornar como não configurado
                console.warn('Tabela configuracoes_smtp não existe. Execute o script SQL.');
                return NextResponse.json({ configured: false, config: null, tableNotFound: true });
            }
            console.error('Erro ao buscar config SMTP:', error);
            return NextResponse.json({ error: 'Erro ao buscar configuração' }, { status: 500 });
        }

        return NextResponse.json({
            configured: !!config,
            config: config || null
        });

    } catch (error: any) {
        console.error('Erro na API configuracoes-smtp:', error);
        // Retornar como não configurado em vez de erro para não quebrar a página
        return NextResponse.json({ configured: false, config: null, error: error.message });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verificar autenticação
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Buscar perfil do usuário
        const { data: profile } = await supabase
            .from('users')
            .select('id, role, condo_id')
            .eq('id', user.id)
            .single();

        if (!profile || !['sindico', 'superadmin'].includes(profile.role)) {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
        }

        if (!profile.condo_id) {
            return NextResponse.json({ error: 'Condomínio não encontrado' }, { status: 400 });
        }

        const body = await request.json();
        const {
            smtp_host,
            smtp_port,
            smtp_user,
            smtp_password,
            smtp_from_email,
            smtp_from_name,
            smtp_secure,
            is_active
        } = body;

        // Validar campos obrigatórios
        if (!smtp_host || !smtp_port || !smtp_user || !smtp_from_email) {
            return NextResponse.json({
                error: 'Campos obrigatórios: smtp_host, smtp_port, smtp_user, smtp_from_email'
            }, { status: 400 });
        }

        // Preparar dados para salvar
        const dataToSave: any = {
            condominio_id: profile.condo_id,
            smtp_host,
            smtp_port: parseInt(smtp_port),
            smtp_user,
            smtp_from_email,
            smtp_from_name: smtp_from_name || null,
            smtp_secure: smtp_secure !== false,
            is_active: is_active !== false,
            updated_at: new Date().toISOString()
        };

        // Se senha foi fornecida, criptografar
        if (smtp_password && !isEncrypted(smtp_password)) {
            dataToSave.smtp_password = encryptPassword(smtp_password);
        }

        // Verificar se já existe configuração
        const { data: existing } = await supabase
            .from('configuracoes_smtp')
            .select('id')
            .eq('condominio_id', profile.condo_id)
            .single();

        let result;

        if (existing) {
            // Atualizar existente
            const { data, error } = await supabase
                .from('configuracoes_smtp')
                .update(dataToSave)
                .eq('id', existing.id)
                .select('id, smtp_host, smtp_port, smtp_user, smtp_from_email, smtp_from_name, smtp_secure, is_active')
                .single();

            if (error) throw error;
            result = data;
        } else {
            // Criar nova configuração
            if (!smtp_password) {
                return NextResponse.json({ error: 'Senha SMTP é obrigatória para nova configuração' }, { status: 400 });
            }

            dataToSave.created_by = user.id;
            dataToSave.created_at = new Date().toISOString();

            const { data, error } = await supabase
                .from('configuracoes_smtp')
                .insert(dataToSave)
                .select('id, smtp_host, smtp_port, smtp_user, smtp_from_email, smtp_from_name, smtp_secure, is_active')
                .single();

            if (error) throw error;
            result = data;
        }

        return NextResponse.json({
            success: true,
            message: existing ? 'Configuração atualizada' : 'Configuração criada',
            config: result
        });

    } catch (error: any) {
        console.error('Erro ao salvar config SMTP:', error);
        return NextResponse.json({ error: 'Erro ao salvar configuração' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verificar autenticação
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Buscar perfil do usuário
        const { data: profile } = await supabase
            .from('users')
            .select('id, role, condo_id')
            .eq('id', user.id)
            .single();

        if (!profile || !['sindico', 'superadmin'].includes(profile.role)) {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
        }

        const { error } = await supabase
            .from('configuracoes_smtp')
            .delete()
            .eq('condominio_id', profile.condo_id);

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'Configuração removida' });

    } catch (error: any) {
        console.error('Erro ao remover config SMTP:', error);
        return NextResponse.json({ error: 'Erro ao remover configuração' }, { status: 500 });
    }
}
