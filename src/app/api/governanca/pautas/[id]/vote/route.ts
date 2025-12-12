
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GovernanceService } from '@/lib/services/governance';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { vote, unit_id } = body; // expect unit_id from frontend selection

        if (!unit_id) {
            return NextResponse.json({ error: 'Unit ID is required' }, { status: 400 });
        }

        const result = await GovernanceService.votePauta({
            pauta_id: params.id,
            user_id: user.id,
            unit_id,
            vote
        });

        return NextResponse.json(result);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
