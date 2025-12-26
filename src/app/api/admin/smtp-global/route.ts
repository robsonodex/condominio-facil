import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * API para gerenciar configuração SMTP global (superadmin only)
 * GET: Buscar configuração global
 * POST: Salvar configuração global
 * DELETE: Remover configuração global
 */

async function getSuperadminFromRequest(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
        // Try cookies
        const cookieHeader = request.headers.get('cookie');
        const accessToken = cookieHeader?.split(';').find(c => c.trim().startsWith('sb-'))?.split('=')[1];
        if (!accessToken) return null;
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token || '');
    if (error || !user) return null;

    const { data: profile } = await supabaseAdmin
        .from('users')
        .select('id, role')
        .eq('email', user.email)
        .single();

    if (!profile || profile.role !== 'superadmin') return null;
    return profile;
}

export async function GET(request: NextRequest) {
    try {
        const profile = await getSuperadminFromRequest(request);
        if (!profile) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Buscar config global (condominio_id = NULL)
        const { data, error } = await supabaseAdmin
            .from('configuracoes_smtp')
            .select('*')
            .is('condominio_id', null)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('[SMTP Global] Error fetching:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ configured: false, config: null });
        }

        // Não retornar a senha
        const { smtp_password, ...safeConfig } = data;
        return NextResponse.json({ configured: true, config: safeConfig });

    } catch (error: any) {
        console.error('[SMTP Global GET] Exception:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const profile = await getSuperadminFromRequest(request);
        if (!profile) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
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

        // Verificar se já existe config global
        const { data: existing } = await supabaseAdmin
            .from('configuracoes_smtp')
            .select('id, smtp_password')
            .is('condominio_id', null)
            .single();

        const configData: any = {
            condominio_id: null,
            smtp_host,
            smtp_port: parseInt(smtp_port),
            smtp_user,
            smtp_from_email,
            smtp_from_name: smtp_from_name || 'Meu Condomínio Fácil',
            smtp_secure: smtp_secure !== false,
            is_active: is_active !== false,
            updated_at: new Date().toISOString()
        };

        // Só atualiza senha se foi fornecida
        if (smtp_password) {
            configData.smtp_password = smtp_password;
        }

        let result;
        if (existing) {
            // Atualizar
            if (!smtp_password) {
                configData.smtp_password = existing.smtp_password;
            }
            result = await supabaseAdmin
                .from('configuracoes_smtp')
                .update(configData)
                .eq('id', existing.id);
        } else {
            // Criar
            if (!smtp_password) {
                return NextResponse.json({ error: 'Senha SMTP é obrigatória' }, { status: 400 });
            }
            configData.smtp_password = smtp_password;
            result = await supabaseAdmin
                .from('configuracoes_smtp')
                .insert(configData);
        }

        if (result.error) {
            console.error('[SMTP Global] Error saving:', result.error);
            return NextResponse.json({ error: result.error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[SMTP Global POST] Exception:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const profile = await getSuperadminFromRequest(request);
        if (!profile) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { error } = await supabaseAdmin
            .from('configuracoes_smtp')
            .delete()
            .is('condominio_id', null);

        if (error) {
            console.error('[SMTP Global] Error deleting:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[SMTP Global DELETE] Exception:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
