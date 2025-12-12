import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GovernanceService } from '@/lib/services/governance';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await req.json();
        const { vote, unit_id } = body;

        if (!unit_id) {
            return NextResponse.json({ error: 'Unit ID is required' }, { status: 400 });
        }

        const result = await GovernanceService.votePauta(id, user.id, vote, unit_id);
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
