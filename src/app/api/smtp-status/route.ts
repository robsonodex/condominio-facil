import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Buscar perfil do usuário
        const { data: profile } = await supabase
            .from('users')
            .select('condo_id, role')
            .eq('id', user.id)
            .single();

        if (!profile) {
            return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
        }

        // Superadmin: verificar SMTP global
        if (profile.role === 'superadmin') {
            const { data: globalSmtp } = await supabase
                .from('configuracoes_smtp')
                .select('id, smtp_host, is_active')
                .is('condominio_id', null)
                .eq('is_active', true)
                .single();

            return NextResponse.json({
                configured: !!globalSmtp,
                provider: globalSmtp?.smtp_host || null,
                type: 'global',
                configUrl: '/admin/email'
            });
        }

        // Síndico/outros: verificar SMTP do condomínio
        if (!profile.condo_id) {
            return NextResponse.json({
                configured: false,
                provider: null,
                type: 'condo',
                configUrl: '/configuracoes/email',
                message: 'Condomínio não encontrado'
            });
        }

        // Primeiro, verificar SMTP do condomínio
        const { data: condoSmtp } = await supabase
            .from('configuracoes_smtp')
            .select('id, smtp_host, is_active')
            .eq('condominio_id', profile.condo_id)
            .eq('is_active', true)
            .single();

        if (condoSmtp) {
            return NextResponse.json({
                configured: true,
                provider: condoSmtp.smtp_host,
                type: 'condo',
                configUrl: '/configuracoes/email'
            });
        }

        // Se não tem SMTP do condo, verificar SMTP global (fallback)
        const { data: globalSmtp } = await supabase
            .from('configuracoes_smtp')
            .select('id, smtp_host, is_active')
            .is('condominio_id', null)
            .eq('is_active', true)
            .single();

        if (globalSmtp) {
            return NextResponse.json({
                configured: true,
                provider: globalSmtp.smtp_host,
                type: 'global_fallback',
                configUrl: '/configuracoes/email'
            });
        }

        // Nenhum SMTP configurado
        return NextResponse.json({
            configured: false,
            provider: null,
            type: 'none',
            configUrl: '/configuracoes/email',
            message: 'Configure o servidor de e-mail para enviar mensagens'
        });

    } catch (error: any) {
        console.error('[SMTP-STATUS] Erro:', error);
        return NextResponse.json(
            { error: 'Erro ao verificar status SMTP', details: error.message },
            { status: 500 }
        );
    }
}
