import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// GET: Listar câmeras do condomínio
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const condoId = searchParams.get('condo_id');

        if (!condoId) {
            return NextResponse.json({ error: 'condo_id é obrigatório' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('cameras')
            .select('*, gateway:camera_gateways(*)')
            .eq('condo_id', condoId)
            .order('localizacao');

        if (error) throw error;

        return NextResponse.json({ cameras: data });
    } catch (error: any) {
        console.error('Error fetching cameras:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Cadastrar nova câmera
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            condo_id, gateway_id, nome, descricao, localizacao,
            ip_address, port, rtsp_path, rtsp_username, rtsp_password,
            onvif_enabled, onvif_port, resolucao, fps
        } = body;

        if (!condo_id || !nome || !ip_address) {
            return NextResponse.json({
                error: 'condo_id, nome e ip_address são obrigatórios'
            }, { status: 400 });
        }

        // Validar se tem gateway configurado
        let gatewayId = gateway_id;
        if (!gatewayId) {
            const { data: gateway } = await supabaseAdmin
                .from('camera_gateways')
                .select('id, ip_address, subnet_mask')
                .eq('condo_id', condo_id)
                .single();

            if (!gateway) {
                return NextResponse.json({
                    error: 'Nenhum gateway configurado. Configure o gateway antes de adicionar câmeras.'
                }, { status: 400 });
            }
            gatewayId = gateway.id;

            // Validar mesma sub-rede
            const sameSubnet = validateSubnet(ip_address, gateway.ip_address, gateway.subnet_mask);
            if (!sameSubnet) {
                return NextResponse.json({
                    error: `A câmera (${ip_address}) deve estar na mesma rede local do gateway (${gateway.ip_address}). Verifique a configuração de rede.`
                }, { status: 400 });
            }
        }

        const { data, error } = await supabaseAdmin
            .from('cameras')
            .insert({
                condo_id,
                gateway_id: gatewayId,
                nome,
                descricao,
                localizacao,
                ip_address,
                port: port || 554,
                rtsp_path: rtsp_path || '/stream1',
                rtsp_username,
                rtsp_password,
                onvif_enabled: onvif_enabled ?? true,
                onvif_port: onvif_port || 80,
                resolucao: resolucao || '720p',
                fps: fps || 15,
                network_type: 'local',
                status: 'pendente'
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ camera: data, message: 'Câmera cadastrada com sucesso' });
    } catch (error: any) {
        console.error('Error creating camera:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Função para validar sub-rede
function validateSubnet(cameraIp: string, gatewayIp: string, subnetMask: string = '255.255.255.0'): boolean {
    const cameraParts = cameraIp.split('.').map(Number);
    const gatewayParts = gatewayIp.split('.').map(Number);
    const maskParts = subnetMask.split('.').map(Number);

    for (let i = 0; i < 4; i++) {
        if ((cameraParts[i] & maskParts[i]) !== (gatewayParts[i] & maskParts[i])) {
            return false;
        }
    }
    return true;
}
