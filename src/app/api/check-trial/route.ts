import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromReq } from '@/lib/supabase/admin';
import { getTrialStatus } from '@/lib/trial';

export async function GET(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);

        // Superadmin sem condoId - retornar status neutro
        if (!session?.condoId) {
            // Se é superadmin, retornar dados neutros (não é trial)
            if (session?.isSuperadmin) {
                return NextResponse.json({
                    isOnTrial: false,
                    daysRemaining: 0,
                    trialEnded: false,
                    hasActiveSubscription: true
                });
            }
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const trialStatus = await getTrialStatus(session.condoId);

        return NextResponse.json(trialStatus);

    } catch (error: any) {
        console.error('[Check Trial] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

