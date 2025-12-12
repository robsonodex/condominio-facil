import { NextRequest, NextResponse } from 'next/server';
import { runManutencaoCheck } from './task';

export async function GET(req: NextRequest) {
    // Secured by CRON_SECRET header if needed, but for now public or basic auth
    try {
        const result = await runManutencaoCheck();
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
