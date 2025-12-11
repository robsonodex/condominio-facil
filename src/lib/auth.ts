import { NextRequest } from 'next/server';
import { getSessionFromReq } from '@/lib/supabase/admin';

export async function getUserFromReq(req: NextRequest | Request) {
    const session = await getSessionFromReq(req);
    if (!session) return null;

    return {
        id: session.userId,
        email: session.email,
        role: session.role,
        condo_id: session.condoId
    };
}
