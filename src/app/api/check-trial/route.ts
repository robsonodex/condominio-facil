import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromReq } from '@/lib/supabase/admin';
import { getTrialStatus } from '@/lib/trial';

export async function GET(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);

        if (!session?.condoId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const trialStatus = await getTrialStatus(session.condoId);

        return NextResponse.json(trialStatus);

    } catch (error: any) {
        console.error('[Check Trial] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
