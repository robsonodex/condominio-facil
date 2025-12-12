
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GovernanceService } from '@/lib/services/governance';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = params.id;

    try {
        const enquete = await GovernanceService.getEnquete(id);

        // Security check: Ensure enquete belongs to user's condo
        // Ideally GovernanceService handles this, or we check profile.
        // For speed, assuming getEnquete returns whatever matches ID.
        // We should double check condo_id matches user's condo_id.
        const { data: profile } = await supabase
            .from('users')
            .select('condo_id')
            .eq('id', user.id)
            .single();

        if (enquete.condo_id !== profile.condo_id) {
            return NextResponse.json({ error: 'Unauthorized Access to this Enquete' }, { status: 403 });
        }

        return NextResponse.json({ enquete });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
