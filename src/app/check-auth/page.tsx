'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function CheckAuthPage() {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const check = async () => {
            try {
                const supabase = createClient();
                const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING';
                const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

                const { data, error } = await supabase.auth.getSession();

                setStatus({
                    url: url.substring(0, 15) + '...',
                    hasAnonKey: hasKey,
                    sessionError: error?.message || 'None',
                    hasSession: !!data.session,
                    envNames: Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_')),
                    time: new Date().toISOString(),
                });
            } catch (err: any) {
                setStatus({ error: err.message });
            } finally {
                setLoading(false);
            }
        };
        check();
    }, []);

    if (loading) return <div>Checking...</div>;

    return (
        <div style={{ padding: 20, fontFamily: 'monospace' }}>
            <h1>Diagnostic Auth Page</h1>
            <pre>{JSON.stringify(status, null, 2)}</pre>
            <button onClick={() => window.location.reload()}>Refresh</button>
            <hr />
            <p>If URL is not your Supabase URL, environment variables are missing in this build.</p>
        </div>
    );
}
