import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const IMPERSONATION_COOKIE_NAME = 'impersonation_session';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let effectiveUserId = user.id;

        // 1. Check for active impersonation
        const cookieStore = await cookies();
        const impId = cookieStore.get(IMPERSONATION_COOKIE_NAME)?.value;

        if (impId) {
            const { data: imp } = await supabaseAdmin
                .from('impersonations')
                .select('target_user_id')
                .eq('id', impId)
                .is('ended_at', null)
                .single();

            if (imp) effectiveUserId = imp.target_user_id;
        }

        // 2. Get profile for condo_id
        const { data: profile } = await supabase
            .from('users')
            .select('condo_id, role')
            .eq('id', effectiveUserId)
            .single();

        if (!profile?.condo_id) {
            return NextResponse.json({ error: 'Condo not found' }, { status: 404 });
        }

        const { data: config, error } = await supabase
            .from('condo_sidebar_config')
            .select('*')
            .eq('condo_id', profile.condo_id)
            .maybeSingle();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(config || { menu_items: [] }, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('users')
            .select('condo_id, role')
            .eq('id', user.id)
            .single();

        if (!profile?.condo_id || !['sindico', 'superadmin'].includes(profile.role)) {
            return NextResponse.json({ error: 'Only administrators or superadmins can change sidebar configuration' }, { status: 403 });
        }

        const body = await request.json();
        const { menu_items, theme } = body;

        const { data, error } = await supabase
            .from('condo_sidebar_config')
            .upsert({
                condo_id: profile.condo_id,
                menu_items: menu_items || [],
                theme: theme || { primaryColor: '#059669', sidebarBg: '#ffffff' },
                updated_at: new Date().toISOString(),
                updated_by: user.id
            }, { onConflict: 'condo_id' })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
