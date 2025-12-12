import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Get ATA for an assembly
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: assemblyId } = await params;

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: ata, error } = await supabase
            .from('assembly_atas')
            .select('*')
            .eq('assembly_id', assemblyId)
            .single();

        if (error || !ata) {
            return NextResponse.json({
                error: 'Ata não encontrada. A assembleia pode não ter sido encerrada ainda.'
            }, { status: 404 });
        }

        return NextResponse.json({ ata });
    } catch (e: any) {
        console.error('Exception in ata GET:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
