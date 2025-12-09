import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getClientIP } from '@/lib/legal/documents';

// POST /api/legal/accept - Registrar aceite de documentos legais
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Autenticação obrigatória
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { documents } = body;

        if (!documents || !Array.isArray(documents) || documents.length === 0) {
            return NextResponse.json({ error: 'Documentos não fornecidos' }, { status: 400 });
        }

        // Obter IP do cliente
        const ipAddress = getClientIP(request);

        // Preparar dados para a função SQL
        const documentsJson = JSON.stringify(documents);

        // Chamar função SQL para registrar aceites
        const { data: result, error } = await supabase
            .rpc('register_legal_acceptances', {
                p_user_id: user.id,
                p_ip_address: ipAddress,
                p_documents: documentsJson
            });

        if (error) {
            console.error('Error registering acceptances:', error);
            return NextResponse.json({ error: 'Erro ao registrar aceites' }, { status: 500 });
        }

        // Enviar email de confirmação
        try {
            const { data: profile } = await supabase
                .from('users')
                .select('nome, email')
                .eq('id', user.id)
                .single();

            if (profile) {
                await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tipo: 'legal_acceptance_confirmed',
                        destinatario: profile.email,
                        dados: {
                            nome: profile.nome,
                            documents: documents.map((d: any) => d.document_type).join(', '),
                            ip_address: ipAddress,
                            plan: result.plan || 'Básico',
                            accepted_at: new Date().toLocaleString('pt-BR')
                        }
                    })
                });
            }
        } catch (emailError) {
            console.error('Email error:', emailError);
            // Não bloqueia o aceite por falha no email
        }

        return NextResponse.json({
            success: true,
            count: result.count,
            plan: result.plan
        });

    } catch (error: any) {
        console.error('Accept API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
