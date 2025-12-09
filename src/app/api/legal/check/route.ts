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

        // Chamar função SQL para verificar aceite
        const { data: hasAccepted, error: checkError } = await supabase
            .rpc('has_user_signed_required_documents', {
                p_user_id: user.id
            });

        if (checkError) {
            console.error('Error checking acceptance:', checkError);
            return NextResponse.json({ error: 'Erro ao verificar aceite' }, { status: 500 });
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

    } catch (error: any) {
        console.error('Check API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
