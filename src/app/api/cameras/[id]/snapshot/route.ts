import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// POST: Capturar snapshot da câmera (TTL 24h)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: cameraId } = await params;
        const body = await request.json();
        const { motivo, occurrence_id, visitor_id } = body;

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

        if (camera.status !== 'ativo') {
            return NextResponse.json({
                error: 'Câmera não está ativa'
            }, { status: 400 });
        }

        // Em produção, o gateway capturaria o snapshot real via RTSP
        // Aqui geramos uma URL placeholder
        const snapshotId = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

        // URL do snapshot (em produção seria gerada pelo gateway)
        const imageUrl = camera.gateway
            ? `http://${camera.gateway.ip_address}:${camera.gateway.port}/snapshot/${camera.id}/${snapshotId}.jpg`
            : `/api/cameras/${cameraId}/snapshot-placeholder.jpg`;

        // Salvar snapshot
        const { data: snapshot, error: snapError } = await supabaseAdmin
            .from('camera_snapshots')
            .insert({
                camera_id: cameraId,
                user_id: user.id,
                image_url: imageUrl,
                motivo: motivo || 'manual',
                occurrence_id,
                visitor_id,
                expires_at: expiresAt.toISOString()
            })
            .select()
            .single();

        if (snapError) throw snapError;

        // Log evento
        await supabaseAdmin
            .from('camera_events')
            .insert({
                camera_id: cameraId,
                condo_id: camera.condo_id,
                tipo: 'snapshot',
                descricao: `Snapshot capturado: ${motivo || 'manual'}`,
                user_id: user.id,
                metadata: { snapshot_id: snapshot.id, occurrence_id, visitor_id }
            });

        return NextResponse.json({
            success: true,
            snapshot: {
                id: snapshot.id,
                image_url: imageUrl,
                expires_at: expiresAt.toISOString(),
                motivo: motivo || 'manual'
            },
            message: 'Snapshot capturado! Expira em 24 horas.'
        });

    } catch (error: any) {
        console.error('Error capturing snapshot:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET: Listar snapshots da câmera
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: cameraId } = await params;

        const { data, error } = await supabaseAdmin
            .from('camera_snapshots')
            .select('*')
            .eq('camera_id', cameraId)
            .gt('expires_at', new Date().toISOString()) // Apenas não expirados
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        return NextResponse.json({ snapshots: data });

    } catch (error: any) {
        console.error('Error fetching snapshots:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
