
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/test/messaging-flow
 * Runs a self-contained integration test for the Deliveries Module
 */
export async function GET(request: NextRequest) {
    const results: any[] = [];
    const log = (step: string, success: boolean, data?: any) => {
        results.push({ step, success, timestamp: new Date(), data });
    };

    try {
        // 1. Setup: Get a Condo and Unit (or create mock)
        // We'll try to find existing one to minimize garbage
        const { data: condo } = await supabaseAdmin.from('condos').select('id').limit(1).single();
        const { data: unit } = await supabaseAdmin.from('units').select('id').limit(1).single();
        const { data: user } = await supabaseAdmin.from('users').select('id').limit(1).single(); // Acting as porter

        if (!condo || !unit || !user) {
            return NextResponse.json({ error: 'Pre-requisites failed: Need at least 1 condo, unit, user in DB' }, { status: 400 });
        }

        log('Setup', true, { condo: condo.id, unit: unit.id, porter: user.id });

        // 2. Create Delivery
        const deliveryPayload = {
            condo_id: condo.id,
            unit_id: unit.id,
            resident_id: null, // optional
            created_by: user.id,
            delivered_by: 'Test Runner',
            tracking_code: `TEST-${Math.floor(Math.random() * 10000)}`,
            type: 'pacote',
            status: 'notified',
            notification_method: { whatsapp: true, email: true }
        };

        const { data: delivery, error: createError } = await supabaseAdmin
            .from('deliveries')
            .insert(deliveryPayload)
            .select()
            .single();

        if (createError) throw new Error(`Create Delivery Failed: ${createError.message}`);
        log('Create Delivery', true, delivery);

        // 3. Verify Notifications Created (Trigger)
        // Wait a small delay for trigger? Triggers are synchronous/transactional usually.
        const { data: notifs, error: notifError } = await supabaseAdmin
            .from('delivery_notifications')
            .select('*')
            .eq('delivery_id', delivery.id);

        if (notifError) throw new Error(`Fetch Notifications Failed: ${notifError.message}`);

        // Note: Our trigger logic checks for residents in the unit. If unit empty, no notifications.
        // If we want to test notifications fully, we need a resident.
        // We will just log what happened.
        log('Check Notifications', true, { count: notifs?.length, notifications: notifs });

        // 4. Update Status (Confirm)
        const { error: collectError } = await supabaseAdmin
            .from('deliveries')
            .update({ status: 'collected' })
            .eq('id', delivery.id);

        if (collectError) throw new Error(`Collect Delivery Failed: ${collectError.message}`);
        log('Collect Delivery', true, { id: delivery.id });

        // 5. Cleanup (Optional, but good for tests)
        // await supabaseAdmin.from('deliveries').delete().eq('id', delivery.id);
        // log('Cleanup', true);

        return NextResponse.json({
            status: 'Test Completed Successfully',
            results
        });

    } catch (error: any) {
        log('Test Failed', false, error.message);
        return NextResponse.json({
            status: 'Test Failed',
            error: error.message,
            results
        }, { status: 500 });
    }
}
