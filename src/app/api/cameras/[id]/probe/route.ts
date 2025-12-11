import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// POST: Probe câmera (verificar rede + RTSP + ONVIF)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: cameraId } = await params;

        // Buscar câmera
        const { data: camera, error } = await supabaseAdmin
            .from('cameras')
            .select('*, gateway:camera_gateways(*)')
            .eq('id', cameraId)
            .single();

        if (error || !camera) {
            return NextResponse.json({ error: 'Câmera não encontrada' }, { status: 404 });
        }

        const probeResult: ProbeResult = {
            timestamp: new Date().toISOString(),
            ip_address: camera.ip_address,
            checks: {
                network: { status: 'pending', message: '' },
                rtsp: { status: 'pending', message: '' },
                onvif: { status: 'pending', message: '' },
            },
            overall: 'pending'
        };

        // 1. Validar sub-rede
        if (camera.gateway) {
            const sameSubnet = validateSubnet(
                camera.ip_address,
                camera.gateway.ip_address,
                camera.gateway.subnet_mask
            );

            if (sameSubnet) {
                probeResult.checks.network = {
                    status: 'ok',
                    message: `Câmera na mesma sub-rede do gateway (${camera.gateway.ip_address})`
                };
            } else {
                probeResult.checks.network = {
                    status: 'error',
                    message: `Câmera (${camera.ip_address}) NÃO está na mesma rede do gateway (${camera.gateway.ip_address}). Reconfigure a rede.`
                };
            }
        } else {
            probeResult.checks.network = {
                status: 'error',
                message: 'Nenhum gateway vinculado. Configure o gateway primeiro.'
            };
        }

        // 2. Simulação de teste RTSP (em produção conectaria ao gateway real)
        // Em ambiente real, o gateway local faria o teste via POST para /probe
        const rtspUrl = `rtsp://${camera.rtsp_username}:***@${camera.ip_address}:${camera.port}${camera.rtsp_path}`;

        // Simular resposta (em produção, gateway testaria a conexão)
        probeResult.checks.rtsp = {
            status: probeResult.checks.network.status === 'ok' ? 'ok' : 'error',
            message: probeResult.checks.network.status === 'ok'
                ? `Stream RTSP configurado: ${camera.ip_address}:${camera.port}${camera.rtsp_path}`
                : 'Não foi possível testar RTSP - verifique a rede primeiro',
            url: rtspUrl
        };

        // 3. Teste ONVIF
        probeResult.checks.onvif = {
            status: camera.onvif_enabled ? 'ok' : 'skip',
            message: camera.onvif_enabled
                ? `ONVIF habilitado na porta ${camera.onvif_port}`
                : 'ONVIF desabilitado na câmera'
        };

        // 4. Resultado geral
        const hasError = Object.values(probeResult.checks).some(c => c.status === 'error');
        const allOk = Object.values(probeResult.checks).every(c => c.status === 'ok' || c.status === 'skip');

        probeResult.overall = hasError ? 'error' : (allOk ? 'ok' : 'warning');

        // Atualizar câmera
        await supabaseAdmin
            .from('cameras')
            .update({
                reachable: probeResult.overall === 'ok',
                last_probe: probeResult.timestamp,
                probe_result: probeResult,
                status: probeResult.overall === 'ok' ? 'ativo' : 'erro',
                updated_at: new Date().toISOString()
            })
            .eq('id', cameraId);

        // Log evento
        await supabaseAdmin
            .from('camera_events')
            .insert({
                camera_id: cameraId,
                condo_id: camera.condo_id,
                tipo: 'probe',
                descricao: `Probe ${probeResult.overall}: ${JSON.stringify(probeResult.checks)}`,
                metadata: probeResult
            });

        return NextResponse.json({
            success: true,
            probe: probeResult,
            camera_status: probeResult.overall === 'ok' ? 'ativo' : 'erro'
        });

    } catch (error: any) {
        console.error('Error probing camera:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

interface ProbeResult {
    timestamp: string;
    ip_address: string;
    checks: {
        network: { status: string; message: string };
        rtsp: { status: string; message: string; url?: string };
        onvif: { status: string; message: string };
    };
    overall: string;
}

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
