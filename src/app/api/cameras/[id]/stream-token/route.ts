import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// GET: Obter token de stream para a câmera
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: cameraId } = await params;
        const { searchParams } = new URL(request.url);
        const streamType = searchParams.get('type') || 'webrtc';

        // Autenticação
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Buscar câmera
        const { data: camera, error } = await supabaseAdmin
            .from('cameras')
            .select('*, gateway:camera_gateways(*)')
            .eq('id', cameraId)
            .single();

        if (error || !camera) {
            return NextResponse.json({ error: 'Câmera não encontrada' }, { status: 404 });
        }

        // Verificar se está ativa
        if (camera.status !== 'ativo') {
            return NextResponse.json({
                error: 'Câmera não está ativa. Execute o probe para verificar a conexão.'
            }, { status: 400 });
        }

        // Gerar token
        const streamToken = generateToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

        // Montar URL do stream
        let streamUrl = '';
        if (camera.gateway) {
            if (streamType === 'hls') {
                streamUrl = `http://${camera.gateway.ip_address}:${camera.gateway.port}/hls/${camera.id}/index.m3u8?token=${streamToken}`;
            } else {
                streamUrl = `ws://${camera.gateway.ip_address}:${camera.gateway.port}/webrtc/${camera.id}?token=${streamToken}`;
            }
        }

        // Inserir token no banco
        const { data: stream, error: streamError } = await supabaseAdmin
            .from('camera_streams')
            .insert({
                camera_id: cameraId,
                user_id: user.id,
                stream_token: streamToken,
                stream_type: streamType,
                stream_url: streamUrl,
                expires_at: expiresAt.toISOString()
            })
            .select()
            .single();

        if (streamError) throw streamError;

        // Log evento
        await supabaseAdmin
            .from('camera_events')
            .insert({
                camera_id: cameraId,
                condo_id: camera.condo_id,
                tipo: 'acesso',
                descricao: `Stream ${streamType} iniciado`,
                user_id: user.id
            });

        return NextResponse.json({
            token: streamToken,
            stream_url: streamUrl,
            stream_type: streamType,
            expires_at: expiresAt.toISOString(),
            camera: {
                id: camera.id,
                nome: camera.nome,
                localizacao: camera.localizacao
            }
        });

    } catch (error: any) {
        console.error('Error generating stream token:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 64; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}
