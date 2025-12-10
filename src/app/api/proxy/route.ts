import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

const IMPERSONATION_COOKIE_NAME = 'impersonation_session';

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const impId = cookieStore.get(IMPERSONATION_COOKIE_NAME)?.value;

        if (!impId) {
            return NextResponse.json({ error: 'Impersonation required' }, { status: 401 });
        }

        // 1. Validate Impersonation Session
        const { data: imp } = await supabaseAdmin
            .from('impersonations')
            .select('*')
            .eq('id', impId)
            .is('ended_at', null)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (!imp) {
            return NextResponse.json({ error: 'Invalid or expired impersonation session' }, { status: 403 });
        }

        // 2. Parse Request
        const body = await request.json();
        const { method: targetMethod, path: targetPath, payload } = body;

        // 3. Execute Action as Service Role (Acting as Target)
        // Note: For simple CRUD, Supabase Client usually chains methods. 
        // Here we need to map the "payload" to actual Supabase calls.
        // OR, the frontend sends "table", "action", "filters", "data".
        // Let's implement a generic "table operation" proxy.
        // { table: 'financial_entries', action: 'select', query: ... } -> Too complex to serialize QueryBuilder.

        // BETTER APPROACH: 
        // The user prompt suggested: "frontend altera baseUrl" OR "proxy endpoint".
        // If frontend alters baseURL, it still hits Supabase directly... but Supabase Auth won't match imp cookie.
        // So we MUST proxy.

        // Simpler Proxy Payload:
        // { table, operation: 'select' | 'insert' | 'update' | 'delete', match: {}, data: {}, select: '*' }

        const { table, operation, match, data, select, order, limit } = payload;

        // Audit Payload
        const auditPayload = { ...payload };

        let query = supabaseAdmin.from(table);
        let result;

        switch (operation) {
            case 'select':
                let q = query.select(select || '*');
                if (match) {
                    Object.entries(match).forEach(([k, v]) => { q = q.eq(k, v) });
                }
                if (order) {
                    // order format: { column: 'date', ascending: false }
                    q = q.order(order.column, { ascending: order.ascending });
                }
                if (limit) {
                    q = q.limit(limit);
                }
                result = await q;
                break;

            case 'insert':
                // Check if data is array or object
                // Also, we should ideally Override 'profile_id' or similar ownership fields if the DB doesn't handle defaults?
                // RLS on the table might check auth.uid(). 
                // Since we are using Service Role (supabaseAdmin), RLS is BYPASSED.
                // WE ARE RESPONSIBLE FOR SECURITY HERE.
                // We trust the Superadmin to be acting as the target.
                // But we should ensure we are not creating data for WRONG user if data contains user_id.
                // (Though Superadmin *can* do that).

                result = await query.insert(data).select(select || '*');
                break;

            case 'update':
                let u = query.update(data);
                if (match) {
                    Object.entries(match).forEach(([k, v]) => { u = u.eq(k, v) });
                } else {
                    throw new Error('Update requires match criteria');
                }
                result = await u.select(select || '*');
                break;

            case 'delete':
                let d = query.delete();
                if (match) {
                    Object.entries(match).forEach(([k, v]) => { d = d.eq(k, v) });
                } else {
                    throw new Error('Delete requires match criteria');
                }
                result = await d;
                break;

            default:
                return NextResponse.json({ error: 'Unsupported operation' }, { status: 400 });
        }

        // 4. Log Action
        await supabaseAdmin.from('impersonation_action_logs').insert({
            impersonation_id: imp.id,
            impersonator_id: imp.impersonator_id,
            target_user_id: imp.target_user_id,
            method: `PROXY_${operation.toUpperCase()}`,
            path: table,
            payload: auditPayload,
            response_status: result.error ? 500 : 200 // Approximate
        });

        if (result.error) {
            return NextResponse.json({ error: result.error.message }, { status: 500 });
        }

        return NextResponse.json({ data: result.data, count: result.count });

    } catch (error: any) {
        console.error('Proxy Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Proxy Error' }, { status: 500 });
    }
}
