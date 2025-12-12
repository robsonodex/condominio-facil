import { supabaseAdmin } from '@/lib/supabase/admin';

export async function runManutencaoCheck() {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Find maintenance due soon
        const { data: schedules } = await supabaseAdmin
            .from('manutencao_schedule')
            .select('*, manutencao_equipments(name)')
            .lte('next_date', today)
            .eq('notified', false);

        if (!schedules || schedules.length === 0) return { processed: 0 };

        for (const sch of schedules) {
            // Create notification (mock)
            await supabaseAdmin.from('system_logs').insert({
                event: 'maintenance_alert',
                meta: { equipment: sch.manutencao_equipments.name, date: sch.next_date, condo_id: sch.condo_id }
            });

            // Mark notified
            await supabaseAdmin.from('manutencao_schedule').update({ notified: true }).eq('id', sch.id);
        }

        return { processed: schedules.length };
    } catch (e: any) {
        throw e;
    }
}
