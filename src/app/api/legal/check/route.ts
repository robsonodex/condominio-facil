import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/legal/check - Verificar se usuário aceitou todos os documentos obrigatórios
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Autenticação obrigatória
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Timeout de 3s para evitar bloqueio
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        try {
            // Chamar função SQL para verificar aceite
            const { data: hasAccepted, error: checkError } = await supabase
                .rpc('has_user_signed_required_documents', {
                    p_user_id: user.id
                });

            clearTimeout(timeoutId);

            if (checkError) {
                console.error('[LEGAL_CHECK_ERROR] Error checking acceptance:', checkError);
                // Fallback permissivo em caso de erro
                return NextResponse.json({
                    accepted: true,
                    fallback: true,
                    error: 'Database error - permitting access'
                }, { status: 200 });
            }

            // Se não aceitou, buscar documentos faltantes
            let missingDocuments: string[] = [];

            if (!hasAccepted) {
                const { data: missing, error: missingError } = await supabase
                    .rpc('get_missing_documents', {
                        p_user_id: user.id
                    });

                if (!missingError && missing) {
                    missingDocuments = missing;
                }
            }

            return NextResponse.json({
                accepted: hasAccepted || false,
                missing_documents: missingDocuments
            });

        } catch (timeoutError) {
            clearTimeout(timeoutId);
            console.error('[LEGAL_CHECK_ERROR] Timeout or abort:', timeoutError);
            // Fallback permissivo em caso de timeout
            return NextResponse.json({
                accepted: true,
                fallback: true,
                error: 'Timeout - permitting access'
            }, { status: 200 });
        }

    } catch (error: any) {
        console.error('[LEGAL_CHECK_ERROR] Unexpected error:', error);
        // Fallback permissivo em caso de erro inesperado
        return NextResponse.json({
            accepted: true,
            fallback: true,
            error: error.message
        }, { status: 200 });
    }
}
