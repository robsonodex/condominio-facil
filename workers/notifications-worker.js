const { createClient } = require('@supabase/supabase-js');
// Uses native fetch in Node 18+
// const fetch = require('node-fetch'); 

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('[Worker] Starting polling loop...');
    while (true) {
        try {
            // 1. Check for pending notifications
            const { data: queue, error } = await supabase
                .from('notification_queue') // Assumes this table exists or we use system_logs events
                .select('*')
                .eq('status', 'pending')
                .limit(10);

            if (queue && queue.length > 0) {
                for (const item of queue) {
                    console.log(`Processing ${item.id} - ${item.type}`);
                    // Simulate sending
                    await new Promise(r => setTimeout(r, 500));

                    await supabase.from('notification_queue')
                        .update({ status: 'sent', sent_at: new Date() })
                        .eq('id', item.id);
                }
            } else {
                // No notifications, sleep
            }

        } catch (e) {
            console.error('Worker error', e);
            // Log error
            await supabase.from('system_errors').insert({
                source: 'worker',
                message: e.message,
                level: 'medium',
                condo_id: null
            });
        }
        await new Promise(r => setTimeout(r, 10000)); // 10s sleep
    }
}

run();
