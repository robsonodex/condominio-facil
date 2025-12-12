import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json(); // { option_id }
    const enqueteId = params.id;

    // Fetch enquete to check status and existing votes
    const { data: enquete, error: fetchError } = await supabase
        .from('enquetes')
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

    const { error: updateError } = await supabase
        .from('enquetes')
        .update({ votes: newVotes })
        .eq('id', enqueteId);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    return NextResponse.json({ status: 'ok' });
}
