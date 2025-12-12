
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GovernanceService } from '@/lib/services/governance';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { question_answers, unit_id } = body;

        if (!unit_id) {
            return NextResponse.json({ error: 'Unit ID is required' }, { status: 400 });
        }

        if (!question_answers || !Array.isArray(question_answers)) {
            return NextResponse.json({ error: 'Answers are required' }, { status: 400 });
        }

        const result = await GovernanceService.voteEnquete({
            question_answers,
            user_id: user.id,
            unit_id
        });

        return NextResponse.json(result);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
