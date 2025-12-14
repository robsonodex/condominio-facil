import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromReq } from '@/lib/supabase/admin';
import { getPlanFeatures } from '@/lib/plan-features';

export async function GET(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);

        if (!session?.condoId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const features = await getPlanFeatures(session.condoId);

        return NextResponse.json(features);

    } catch (error: any) {
        console.error('[Plan Features] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
