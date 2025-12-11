import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// GET: Listar gateways do condomínio
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const condoId = searchParams.get('condo_id');

        if (!condoId) {
            return NextResponse.json({ error: 'condo_id é obrigatório' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('camera_gateways')
            .select('*')
            .eq('condo_id', condoId);

        if (error) throw error;

        return NextResponse.json({ gateways: data });
    } catch (error: any) {
        console.error('Error fetching gateways:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Registrar gateway do condomínio
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { condo_id, nome, descricao, ip_address, subnet_mask, port, api_key, api_secret } = body;

        if (!condo_id || !ip_address) {
            return NextResponse.json({
                error: 'condo_id e ip_address são obrigatórios'
            }, { status: 400 });
        }

        // Verificar se já existe gateway
        const { data: existing } = await supabaseAdmin
            .from('camera_gateways')
            .select('id')
            .eq('condo_id', condo_id)
            .single();

        if (existing) {
            // Atualizar existente
            const { data, error } = await supabaseAdmin
                .from('camera_gateways')
                .update({
                    nome: nome || 'Gateway Principal',
                    descricao,
                    ip_address,
                    subnet_mask: subnet_mask || '255.255.255.0',
                    port: port || 8554,
                    api_key,
                    api_secret,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id)
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json({ gateway: data, updated: true });
        }

        // Criar novo
        const { data, error } = await supabaseAdmin
            .from('camera_gateways')
            .insert({
                condo_id,
                nome: nome || 'Gateway Principal',
                descricao,
                ip_address,
                subnet_mask: subnet_mask || '255.255.255.0',
                port: port || 8554,
                api_key,
                api_secret,
                status: 'pendente'
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            gateway: data,
            message: 'Gateway registrado com sucesso. As câmeras devem estar na mesma rede: ' + ip_address
        });
    } catch (error: any) {
        console.error('Error creating gateway:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
