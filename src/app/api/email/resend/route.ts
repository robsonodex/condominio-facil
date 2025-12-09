import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/email/resend
 * Reenvia e-mail de boas-vindas manualmente
 * Autorizado apenas para superadmin e sindico
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Autenticação obrigatória
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { error: 'Não autorizado' },
                { status: 401 }
            );
        }

        // Buscar perfil
        const { data: profile } = await supabase
            .from('users')
            .select('id, role, condo_id')
            .eq('id', user.id)
            .single();

        if (!profile) {
            return NextResponse.json(
                { error: 'Perfil não encontrado' },
                { status: 403 }
            );
        }

        // Verificar role
        const allowedRoles = ['superadmin', 'sindico'];
        if (!allowedRoles.includes(profile.role)) {
            return NextResponse.json(
                { error: 'Sem permissão para reenviar e-mails' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { userId: targetUserId, tipo } = body;

        if (!targetUserId || !tipo) {
            return NextResponse.json(
                { error: 'userId e tipo são obrigatórios' },
                { status: 400 }
            );
        }

        // Validar tipos permitidos
        const allowedTypes = ['welcome', 'payment_confirmed'];
        if (!allowedTypes.includes(tipo)) {
            return NextResponse.json(
                { error: 'Tipo de e-mail inválido' },
                { status: 400 }
            );
        }

        // Buscar dados do usuário alvo
        const { data: targetUser } = await supabase
            .from('users')
            .select('id, nome, email, condo_id')
            .eq('id', targetUserId)
            .single();

        if (!targetUser) {
            return NextResponse.json(
                { error: 'Usuário não encontrado' },
                { status: 404 }
            );
        }

        // Verificar permissão (sindico só pode reenviar para users do seu condo)
        if (profile.role === 'sindico' && targetUser.condo_id !== profile.condo_id) {
            return NextResponse.json(
                { error: 'Sem permissão para este usuário' },
                { status: 403 }
            );
        }

        // Buscar dados do condomínio
        let condoName = 'Seu Condomínio';
        if (targetUser.condo_id) {
            const { data: condo } = await supabase
                .from('condos')
                .select('nome')
                .eq('id', targetUser.condo_id)
                .single();

            if (condo) {
                condoName = condo.nome;
            }
        }

        // Preparar dados do e-mail
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://meucondominiofacil.com';
        const emailData: any = {
            nome: targetUser.nome,
            loginUrl: `${appUrl}/login`,
        };

        if (tipo === 'welcome') {
            emailData.condoName = condoName;
        }

        // Chamar API de e-mail
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tipo,
                destinatario: targetUser.email,
                dados: emailData,
                condoId: targetUser.condo_id,
                userId: targetUser.id,
                internalCall: true
            }),
        });

        const emailResult = await emailResponse.json();

        if (!emailResult.success) {
            return NextResponse.json(
                { error: 'Falha ao enviar e-mail', details: emailResult.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'E-mail reenviado com sucesso',
            destinatario: targetUser.email,
            tipo
        });
    } catch (error: any) {
        console.error('Resend email error:', error);
        return NextResponse.json(
            { error: 'Erro ao reenviar e-mail' },
            { status: 500 }
        );
    }
}
