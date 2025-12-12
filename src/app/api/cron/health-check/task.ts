import { createClient } from '@supabase/supabase-js';

export async function runHealthCheck() {
    try {
        const startTime = Date.now();
        const results: Record<string, { status: string; latency: number; error?: string }> = {};

        // 1. Check Supabase connection
        try {
            const supabaseStart = Date.now();
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );
            const { error } = await supabase.from('condos').select('id').limit(1);
            results.supabase = {
                status: error ? 'error' : 'ok',
                latency: Date.now() - supabaseStart,
                error: error?.message
            };
        } catch (e: any) {
            results.supabase = { status: 'error', latency: 0, error: e.message };
        }

        // 2. Check Mercado Pago
        try {
            const mpStart = Date.now();
            const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
            if (mpToken) {
                const response = await fetch('https://api.mercadopago.com/users/me', {
                    headers: { 'Authorization': `Bearer ${mpToken}` }
                });
                results.mercadopago = {
                    status: response.ok ? 'ok' : 'error',
                    latency: Date.now() - mpStart,
                    error: response.ok ? undefined : `HTTP ${response.status}`
                };
            } else {
                results.mercadopago = { status: 'not_configured', latency: 0 };
            }
        } catch (e: any) {
            results.mercadopago = { status: 'error', latency: 0, error: e.message };
        }

        // 3. Check WhatsApp
        results.whatsapp = {
            status: process.env.WHATSAPP_TOKEN ? 'configured' : 'not_configured',
            latency: 0
        };

        // 4. Calculate overall status
        const hasErrors = Object.values(results).some(r => r.status === 'error');
        const allOk = Object.values(results).every(r => r.status === 'ok' || r.status === 'configured' || r.status === 'not_configured');
        const overallStatus = hasErrors ? 'degraded' : allOk ? 'healthy' : 'warning';

        // 5. Log health check
        try {
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            await supabase.from('system_logs').insert([{
                level: hasErrors ? 'error' : 'info',
                source: 'health_check',
                message: `Health check: ${overallStatus}`,
                metadata: { results, totalLatency: Date.now() - startTime }
            }]);

            // 6. Send alert if errors detected
            if (hasErrors) {
                const errorServices = Object.entries(results)
                    .filter(([_, v]) => v.status === 'error')
                    .map(([k, _]) => k)
                    .join(', ');

                await supabase.from('system_logs').insert([{
                    level: 'error',
                    source: 'health_alert',
                    message: `ALERT: Services degraded: ${errorServices}`,
                    metadata: { results }
                }]);
            }
        } catch (logError) {
            console.error('[Health] Failed to log:', logError);
        }

        return {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            latency: Date.now() - startTime,
            services: results
        };

    } catch (error: any) {
        console.error('[Health] Error:', error);
        throw error;
    }
}
