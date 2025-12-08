'use client';

import { useAuth } from './useAuth';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState, useMemo } from 'react';

// Cache para dados do condomínio
let condoCache: { [key: string]: any } = {};

export function useUser() {
    const { user, profile, loading } = useAuth();

    // Memoize computed values to prevent re-calculations
    return useMemo(() => ({
        user,
        profile,
        loading,
        isSuperAdmin: profile?.role === 'superadmin',
        isSindico: profile?.role === 'sindico',
        isPorteiro: profile?.role === 'porteiro',
        isMorador: profile?.role === 'morador',
        condoId: profile?.condo_id,
        unidadeId: profile?.unidade_id,
        canAccessFinanceiro: profile?.role === 'superadmin' || profile?.role === 'sindico',
        canManageUsers: profile?.role === 'superadmin' || profile?.role === 'sindico',
        canManageVisitors: profile?.role === 'superadmin' || profile?.role === 'sindico' || profile?.role === 'porteiro',
        canCreateOccurrence: profile?.role !== 'superadmin',
    }), [user, profile, loading]);
}

export function useCondo() {
    const { profile } = useAuth();
    const [condo, setCondo] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Memoize supabase client
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        const fetchCondo = async () => {
            if (!profile?.condo_id) {
                setLoading(false);
                return;
            }

            // Check cache first
            if (condoCache[profile.condo_id]) {
                setCondo(condoCache[profile.condo_id]);
                setLoading(false);
                return;
            }

            const { data } = await supabase
                .from('condos')
                .select('*, plan:plans(*)')
                .eq('id', profile.condo_id)
                .single();

            if (data) {
                condoCache[profile.condo_id] = data;
                setCondo(data);
            }
            setLoading(false);
        };

        fetchCondo();
    }, [profile?.condo_id, supabase]);

    return { condo, loading };
}

// Limpar cache quando necessário
export function clearUserCache() {
    condoCache = {};
}
