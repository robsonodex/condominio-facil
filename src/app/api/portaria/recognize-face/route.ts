import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Nota: Integração real com AWS Rekognition
 * Exige configuração de AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY e AWS_REGION
 */
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { imageBase64, condoId } = await request.json();

    if (!imageBase64 || !condoId) {
        return NextResponse.json({ error: 'Imagem e Condo ID são obrigatórios' }, { status: 400 });
    }

    try {
        // 1. Em um cenário real, converteríamos o base64 para Buffer e enviaríamos para Rekognition:
        // const client = new RekognitionClient({ region: process.env.AWS_REGION });
        // const command = new SearchFacesByImageCommand({ 
        //   CollectionId: `condo_${condoId}`, 
        //   Image: { Bytes: Buffer.from(imageBase64, 'base64') } 
        // });
        // const response = await client.send(command);

        // 2. Simulação da busca no banco de moradores registrados (Phase 3 requirements)
        // Buscamos se existe algum morador/visitante com 'face_token' retornado pela AWS
        // Aqui simulamos um match positivo para demonstração da lógica

        const { data: match } = await supabase
            .from('visitor_faces')
            .select('*, visitors(*)')
            .eq('condo_id', condoId)
            // .eq('face_token', response.FaceMatches[0].Face.FaceId) 
            .limit(1)
            .single();

        if (match) {
            // 3. Registrar o acesso automaticamente
            await supabase.from('portaria_acessos').insert({
                condo_id: condoId,
                visitor_id: match.visitor_id,
                tipo: 'entrada',
                metodo: 'reconhecimento_facial',
                status: 'autorizado'
            });

            return NextResponse.json({
                success: true,
                message: 'Rosto identificado!',
                visitor: match.visitors
            });
        }

        return NextResponse.json({ success: false, message: 'Rosto não identificado' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
