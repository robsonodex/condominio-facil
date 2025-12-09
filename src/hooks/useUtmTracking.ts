'use client';

import { useEffect, useState } from 'react';

interface UTMParams {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
}

export function useUtmTracking() {
    const [utmParams, setUtmParams] = useState<UTMParams>({});

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const params = new URLSearchParams(window.location.search);
        const utm: UTMParams = {};

        // Extract UTM parameters
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
            const value = params.get(param);
            if (value) {
                utm[param as keyof UTMParams] = value;
            }
        });

        // Save to localStorage if we have UTM params
        if (Object.keys(utm).length > 0) {
            localStorage.setItem('utm_params', JSON.stringify(utm));
            setUtmParams(utm);
        } else {
            // Try to load from localStorage
            const stored = localStorage.getItem('utm_params');
            if (stored) {
                setUtmParams(JSON.parse(stored));
            }
        }
    }, []);

    return utmParams;
}

export function getStoredUtmParams(): UTMParams {
    if (typeof window === 'undefined') return {};

    const stored = localStorage.getItem('utm_params');
    return stored ? JSON.parse(stored) : {};
}
