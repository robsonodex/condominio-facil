import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromReq } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const user = await getUserFromReq(req);
    if (!user) return NextResponse.json({ error: 'unauth' }, { status: 401 });

    const body = await req.json(); // { option_id }
    const enqueteId = params.id;

    // Fetch enquete to check status and existing votes
    const { data: enquete, error: fetchError } = await supabaseAdmin
        .from('governanca_enquetes')
        .select('*')
        .eq('id', enqueteId)
        .single();

    if (fetchError || !enquete) return NextResponse.json({ error: 'not found' }, { status: 404 });

    // Check double vote
    const votes = (enquete.votes || []) as any[];
    if (votes.find(v => v.user_id === user.id)) {
        return NextResponse.json({ error: 'already voted' }, { status: 400 });
    }

    // Add vote
    const newVote = {
        user_id: user.id,
        option_id: body.option_id,
        at: new Date().toISOString()
    };

    const newVotes = [...votes, newVote];

    const { error: updateError } = await supabaseAdmin
        .from('governanca_enquetes')
        .update({ votes: newVotes })
        .eq('id', enqueteId);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    return NextResponse.json({ status: 'ok' });
}
