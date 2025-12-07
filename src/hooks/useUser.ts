'use client';

import { useAuth } from './useAuth';
import { createClient } from '@/lib/supabase/client';
import { User } from '@/types/database';
import { useEffect, useState } from 'react';

export function useUser() {
    const { user, profile, loading } = useAuth();

    return {
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
        canCreateOccurrence: profile?.role !== 'superadmin', // Everyone except superadmin
    };
}

export function useCondo() {
    const { profile } = useAuth();
    const [condo, setCondo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchCondo = async () => {
            if (profile?.condo_id) {
                const { data } = await supabase
                    .from('condos')
                    .select('*, plan:plans(*)')
                    .eq('id', profile.condo_id)
                    .single();
                setCondo(data);
            }
            setLoading(false);
        };

        fetchCondo();
    }, [profile?.condo_id, supabase]);

    return { condo, loading };
}
