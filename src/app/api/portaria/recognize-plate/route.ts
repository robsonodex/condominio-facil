import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * License Plate OCR API
 * Utiliza Tesseract.js ou provedor externo (Google Vision/OCR.space)
 */
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { imageBase64, condoId } = await request.json();

    if (!imageBase64 || !condoId) {
        return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    try {
        // 1. Simulação do OCR (em produção usaria Tesseract.js ou cloud API)
        // const { data: { text } } = await Tesseract.recognize(Buffer.from(imageBase64, 'base64'));
        const recognizedPlate = "ABC1D23"; // Exemplo de placa MercoSul

        // 2. Verificar se a placa está autorizada no condomínio
        const { data: vehicle } = await supabase
            .from('vehicles')
            .select('*, residents(*)')
            .eq('condo_id', condoId)
            .eq('plate', recognizedPlate)
            .single();

        if (vehicle) {
            // 3. Registrar entrada automática
            await supabase.from('portaria_acessos').insert({
                condo_id: condoId,
                resident_id: vehicle.resident_id,
                tipo: 'entrada',
                metodo: 'ocr_placa',
                status: 'autorizado',
                metadata: { plate: recognizedPlate, vehicle_model: vehicle.model }
            });

            return NextResponse.json({
                success: true,
                message: `Acesso liberado: Placa ${recognizedPlate}`,
                vehicle
            });
        }

        // 4. Se não for morador, verificar se é visitante autorizado
        const { data: visitor } = await supabase
            .from('visitors')
            .select('*')
            .eq('condo_id', condoId)
            .eq('vehicle_plate', recognizedPlate)
            .eq('status', 'authorized')
            .single();

        if (visitor) {
            await supabase.from('portaria_acessos').insert({
                condo_id: condoId,
                visitor_id: visitor.id,
                tipo: 'entrada',
                metodo: 'ocr_placa',
                status: 'autorizado'
            });

            return NextResponse.json({
                success: true,
                message: `Visitante autorizado: Placa ${recognizedPlate}`,
                visitor
            });
        }

        return NextResponse.json({
            success: false,
            message: `Placa ${recognizedPlate} não reconhecida ou sem autorização`
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
