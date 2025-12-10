import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/log
 * Client-side error logging endpoint
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { event, level, meta, userId, condoId } = body;

        if (!event) {
            return NextResponse.json({ error: 'Event is required' }, { status: 400 });
        }

        // Insert log entry
        const { error } = await supabaseAdmin.from('system_logs').insert({
            event,
            level: level || 'info',
            meta: meta || {},
            user_id: userId || null,
            condo_id: condoId || null,
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            user_agent: request.headers.get('user-agent'),
            created_at: new Date().toISOString(),
        });

        if (error) {
            console.error('[LOG_API] Insert error:', error);
            // Don't return error to client - logging shouldn't break the app
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[LOG_API] Unexpected error:', error);
        return NextResponse.json({ success: false });
    }
}

/**
 * GET /api/log
 * Get recent logs (superadmin only)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const level = searchParams.get('level');
        const limit = parseInt(searchParams.get('limit') || '100');

        let query = supabaseAdmin
            .from('system_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (level) {
            query = query.eq('level', level);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });

    } catch (error: any) {
        console.error('[LOG_API] GET error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
