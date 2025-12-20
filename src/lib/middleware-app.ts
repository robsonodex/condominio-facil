/**
 * Middleware de Detecção de App Mode (WebView)
 * 
 * Detecta se o acesso vem do WebView Android e seta cookie para modo app.
 * NÃO altera nenhum comportamento do site web.
 */

import { NextRequest, NextResponse } from 'next/server';

// User-Agent strings que indicam WebView do app
const APP_USER_AGENTS = [
    'MeuCondominioApp',
    'wv)',  // Android WebView marker
];

/**
 * Detecta se a request vem do WebView Android
 */
export function isAppRequest(request: NextRequest): boolean {
    const userAgent = request.headers.get('user-agent') || '';
    const url = new URL(request.url);

    // 1. Detecta via User-Agent
    const isAppUserAgent = APP_USER_AGENTS.some(ua =>
        userAgent.toLowerCase().includes(ua.toLowerCase())
    );

    // 2. Detecta via query param ?app=1
    const hasAppParam = url.searchParams.get('app') === '1';

    // 3. Detecta via rota /app/*
    const isAppRoute = url.pathname.startsWith('/app');

    return isAppUserAgent || hasAppParam || isAppRoute;
}

/**
 * Configura cookies de modo app na response
 */
export function setAppModeCookie(response: NextResponse, isApp: boolean): NextResponse {
    if (isApp) {
        response.cookies.set('cf_app_mode', 'true', {
            path: '/',
            maxAge: 60 * 60 * 24 * 30, // 30 dias
            sameSite: 'lax',
        });
    }
    return response;
}

/**
 * Limpa cookie de modo app
 */
export function clearAppModeCookie(response: NextResponse): NextResponse {
    response.cookies.delete('cf_app_mode');
    return response;
}
