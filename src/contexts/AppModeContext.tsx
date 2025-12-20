'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface AppModeContextType {
    isAppMode: boolean;
    isMobile: boolean;
    setAppMode: (value: boolean) => void;
}

const AppModeContext = createContext<AppModeContextType>({
    isAppMode: false,
    isMobile: false,
    setAppMode: () => { },
});

/**
 * Provider que gerencia o estado do modo app (WebView)
 * Lê cookie cf_app_mode e detecta dispositivo móvel
 */
export function AppModeProvider({ children }: { children: ReactNode }) {
    const [isAppMode, setIsAppMode] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Detecta cookie cf_app_mode
        const cookies = document.cookie.split(';');
        const appModeCookie = cookies.find(c => c.trim().startsWith('cf_app_mode='));
        const hasAppMode = appModeCookie?.includes('true') || false;

        // Detecta ?app=1 na URL
        const urlParams = new URLSearchParams(window.location.search);
        const hasAppParam = urlParams.get('app') === '1';

        // Detecta rota /app/*
        const isAppRoute = window.location.pathname.startsWith('/app');

        // Detecta mobile via User-Agent
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);

        // Detecta WebView específico
        const isWebView = userAgent.includes('meucondominiofacil') || userAgent.includes('wv)');

        setIsAppMode(hasAppMode || hasAppParam || isAppRoute || isWebView);
        setIsMobile(isMobileDevice);

        // Seta cookie se detectou app mode
        if (hasAppParam || isAppRoute || isWebView) {
            document.cookie = 'cf_app_mode=true; path=/; max-age=2592000; samesite=lax';
        }
    }, []);

    const setAppMode = (value: boolean) => {
        setIsAppMode(value);
        if (value) {
            document.cookie = 'cf_app_mode=true; path=/; max-age=2592000; samesite=lax';
        } else {
            document.cookie = 'cf_app_mode=; path=/; max-age=0';
        }
    };

    return (
        <AppModeContext.Provider value={{ isAppMode, isMobile, setAppMode }}>
            {children}
        </AppModeContext.Provider>
    );
}

/**
 * Hook para acessar o estado do modo app
 */
export function useAppMode() {
    const context = useContext(AppModeContext);
    if (!context) {
        throw new Error('useAppMode deve ser usado dentro de AppModeProvider');
    }
    return context;
}

export default AppModeContext;
