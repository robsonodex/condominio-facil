import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
    // Secured by CRON_SECRET header if needed, but for now public or basic auth
    try {
        const today = new Date().toISOString().split('T')[0];

        // Find maintenance due soon
        const { data: schedules } = await supabaseAdmin
            .from('manutencao_schedule')
            .select('*, manutencao_equipments(name)')
            .lte('next_date', today)
            .eq('notified', false);

        if (!schedules || schedules.length === 0) return NextResponse.json({ processed: 0 });

        for (const sch of schedules) {
            // Create notification (mock)
            await supabaseAdmin.from('system_logs').insert({
                event: 'maintenance_alert',
                meta: { equipment: sch.manutencao_equipments.name, date: sch.next_date, condo_id: sch.condo_id }
            });

            // Mark notified
            await supabaseAdmin.from('manutencao_schedule').update({ notified: true }).eq('id', sch.id);
        }

        return NextResponse.json({ processed: schedules.length });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
