```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GovernanceService } from '@/lib/services/governance';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Validate role
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (!profile || !['sindico', 'superadmin'].includes(profile.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params; // Await params here
    const body = await req.json();

    try {
        const pauta = await GovernanceService.createPauta({
            assembleia_id: params.id,
            title: body.title,
            description: body.description,
            order_index: body.order_index
        });
        return NextResponse.json({ pauta });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
