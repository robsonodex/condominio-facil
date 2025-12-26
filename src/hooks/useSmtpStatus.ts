'use client';

import { useState, useEffect, useCallback } from 'react';

interface SmtpStatus {
    configured: boolean;
    provider: string | null;
    type: 'condo' | 'global' | 'global_fallback' | 'none';
    configUrl: string;
    message?: string;
}

export function useSmtpStatus() {
    const [status, setStatus] = useState<SmtpStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const checkStatus = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/smtp-status');
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Erro ao verificar SMTP');
                setStatus({ configured: false, provider: null, type: 'none', configUrl: '/configuracoes/email' });
            } else {
                setStatus(data);
                setError(null);
            }
        } catch (err: any) {
            setError('Erro ao verificar configuração de e-mail');
            setStatus({ configured: false, provider: null, type: 'none', configUrl: '/configuracoes/email' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkStatus();
    }, [checkStatus]);

    return {
        smtpConfigured: status?.configured ?? false,
        smtpProvider: status?.provider,
        smtpType: status?.type,
        configUrl: status?.configUrl ?? '/configuracoes/email',
        message: status?.message,
        loading,
        error,
        refresh: checkStatus
    };
}
