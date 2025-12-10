import { NextResponse, NextRequest } from 'next/server';

// MIDDLEWARE COMPLETAMENTE DESABILITADO
// Removido pois causava loop de redirect no login
export async function middleware(request: NextRequest) {
    return NextResponse.next();
}

export const config = {
    matcher: [],
};
