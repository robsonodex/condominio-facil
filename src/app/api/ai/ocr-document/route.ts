import { NextRequest, NextResponse } from 'next/server';

const MINDEE_API_KEY = process.env.MINDEE_API_KEY;
const MINDEE_API_URL = 'https://api.mindee.net/v1/products/mindee/idcard_br/v1/predict';

export async function POST(req: NextRequest) {
    try {
        const { image } = await req.json();

        if (!image) {
            return NextResponse.json({ error: 'Imagem não fornecida' }, { status: 400 });
        }

        if (!MINDEE_API_KEY) {
            return NextResponse.json({
                error: 'MINDEE_API_KEY não configurada',
                fallbackToClient: true
            }, { status: 500 });
        }

        console.log('[Mindee] Iniciando análise de documento brasileiro...');

        // Extrai o base64 da imagem (remove o prefixo data:image/...)
        const base64Data = image.includes(',') ? image.split(',')[1] : image;

        // Monta o form data para Mindee
        const formData = new FormData();

        // Converte base64 para Blob
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'image/jpeg' });
        formData.append('document', blob, 'document.jpg');

        const response = await fetch(MINDEE_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${MINDEE_API_KEY}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Mindee] Erro API:', response.status, errorText);
            return NextResponse.json({
                error: `Erro Mindee: ${response.status}`,
                fallbackToClient: true
            }, { status: response.status });
        }

        const data = await response.json();
        console.log('[Mindee] Resposta completa:', JSON.stringify(data, null, 2));

        // Extrai os campos do documento
        const prediction = data.document?.inference?.prediction;

        if (!prediction) {
            console.error('[Mindee] Sem prediction no response');
            return NextResponse.json({
                error: 'Documento não reconhecido',
                fallbackToClient: true
            }, { status: 422 });
        }

        // Mindee retorna campos específicos para documentos brasileiros
        const fullName = prediction.given_names?.join(' ') || '';
        const surname = prediction.surname?.value || '';
        const name = surname ? `${fullName} ${surname}`.trim() : fullName;

        // CPF tem prioridade sobre outros documentos
        const cpf = prediction.cpf_number?.value || null;
        const rg = prediction.id_number?.value || null;
        const doc = cpf || rg;

        console.log('[Mindee] Extraído:', { name, doc });

        return NextResponse.json({
            name: name || null,
            doc: doc || null,
            provider: 'mindee-idcard-br'
        });

    } catch (error: any) {
        console.error('[Mindee] Erro:', error);
        return NextResponse.json({
            error: error.message,
            fallbackToClient: true
        }, { status: 500 });
    }
}
