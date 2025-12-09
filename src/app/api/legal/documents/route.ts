import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loadRequiredDocuments, formatDocumentForDisplay } from '@/lib/legal/documents';

// GET /api/legal/documents - Obter documentos legais para aceite
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Autenticação obrigatória
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Buscar plano do usuário
        const { data: profile } = await supabase
            .from('users')
            .select(`
                id,
                condo_id,
                condos (
                    id,
                    subscriptions (
                        plans (
                            nome_plano
                        )
                    )
                )
            `)
            .eq('id', user.id)
            .single();

        let planName = 'Básico'; // Padrão

        // Type assertion para evitar erro de tipagem profunda
        const profileWithPlan = profile as any;
        const subscription = profileWithPlan?.condos?.subscriptions?.[0];
        if (subscription?.plans?.nome_plano) {
            planName = subscription.plans.nome_plano;
        }

        // Carregar documentos obrigatórios
        const documents = await loadRequiredDocuments(planName);

        // Formatar documentos para exibição
        const formattedDocs = documents.map(doc => ({
            type: doc.type,
            version: doc.version,
            hash: doc.hash,
            content: formatDocumentForDisplay(doc.content)
        }));

        return NextResponse.json({
            documents: formattedDocs,
            plan: planName
        });

    } catch (error: any) {
        console.error('Documents API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
