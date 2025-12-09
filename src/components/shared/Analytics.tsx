'use client';

import { useEffect } from 'react';

declare global {
    interface Window {
        gtag?: (...args: any[]) => void;
        dataLayer?: any[];
    }
}

export function Analytics() {
    useEffect(() => {
        // Google Analytics
        const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

        if (!GA_ID) return;

        // Load GA script
        const script1 = document.createElement('script');
        script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
        script1.async = true;
        document.head.appendChild(script1);

        // Initialize GA
        window.dataLayer = window.dataLayer || [];
        function gtag(...args: any[]) {
            window.dataLayer?.push(arguments);
        }
        window.gtag = gtag;

        gtag('js', new Date());
        gtag('config', GA_ID);

    }, []);

    return null;
}

export function trackEvent(eventName: string, params?: Record<string, any>) {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, params);
    }
}
