'use client';

import { useAuth } from './useAuth';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState, useMemo, useCallback } from 'react';

// Cache para dados do condomínio
let condoCache: { [key: string]: any } = {};

const VIEW_AS_STORAGE_KEY = 'cf_view_as_role';

export function useUser() {
    const { user, profile: authProfile, loading: authLoading } = useAuth();
    const [impersonatedProfile, setImpersonatedProfile] = useState<any>(null);
    const [impersonationLoading, setImpersonationLoading] = useState(true);
    const [isImpersonating, setIsImpersonating] = useState(false);
    const [originalAdminId, setOriginalAdminId] = useState<string | null>(null);
    const [viewAsRole, setViewAsRole] = useState<string | null>(null);

    // Load viewAsRole from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(VIEW_AS_STORAGE_KEY);
            if (stored) setViewAsRole(stored);

            // Listen for changes from RoleViewSwitcher
            const handleChange = (e: CustomEvent<string>) => {
                setViewAsRole(e.detail);
            };
            window.addEventListener('viewAsRoleChange', handleChange as EventListener);
            return () => window.removeEventListener('viewAsRoleChange', handleChange as EventListener);
        }
    }, []);

    // Fetch Impersonation Status
    const checkImpersonation = useCallback(async () => {
        if (!user) {
            setImpersonationLoading(false);
            return;
        }
        try {
            const res = await fetch('/api/impersonate', { method: 'GET' });
            if (res.ok) {
                const data = await res.json();
                if (data.active && data.impersonation && data.impersonation.target_user_id) {
                    setIsImpersonating(true);
                    setImpersonatedProfile({
                        id: data.impersonation.target_user_id,
                        ...data.targetUser,
                    });
                    setOriginalAdminId(data.impersonation.impersonator_id);
                } else {
                    setIsImpersonating(false);
                    setImpersonatedProfile(null);
                    setOriginalAdminId(null);
                }
            } else {
                // If 404 or other, assume distinct
                setIsImpersonating(false);
            }
        } catch (e) {
            console.error('Failed to check impersonation', e);
        } finally {
            setImpersonationLoading(false);
        }
    }, [user]);

    // Check impersonation on mount/auth load
    useEffect(() => {
        if (!authLoading) {
            checkImpersonation();
        }
    }, [authLoading, checkImpersonation]);

    // Fetch full data for target user if impersonating
    useEffect(() => {
        const fetchTargetProfile = async () => {
            if (isImpersonating && impersonatedProfile?.id && !impersonatedProfile.condo_id) {
                const supabase = createClient();
                const { data, error } = await supabase.from('users').select('*').eq('id', impersonatedProfile.id).single();
                if (data) {
                    setImpersonatedProfile(data);
                }
            }
        };
        fetchTargetProfile();
    }, [isImpersonating, impersonatedProfile?.id, impersonatedProfile?.condo_id]);

    const effectiveProfile = isImpersonating ? impersonatedProfile : authProfile;

    // Role checks
    const isSuperAdminReal = authProfile?.role === 'superadmin';

    // Effective Role (what the UI sees)
    const effectiveRole = effectiveProfile?.role;

    const isSuperAdmin = effectiveRole === 'superadmin';
    const isSindico = effectiveRole === 'sindico';
    const isPorteiro = effectiveRole === 'porteiro';
    const isMorador = effectiveRole === 'morador';

    // Loading state is true if auth is loading OR if checking impersonation
    // We want to avoid "flicker" of Superadmin view before switching to Impersonated view
    const loading = authLoading || impersonationLoading;

    return useMemo(() => ({
        user,
        profile: effectiveProfile,
        loading,

        // Impersonation State
        isImpersonating,
        originalAdminId,
        refetchUser: checkImpersonation,

        // Real Role Flags
        isSuperAdminReal,

        // Effective UI Flags
        isSuperAdmin,
        isSindico,
        isPorteiro,
        isMorador,

        // IDs
        condoId: effectiveProfile?.condo_id,
        unidadeId: effectiveProfile?.unidade_id,

        // PERMISSIONS
        canAccessFinanceiro: effectiveRole === 'superadmin' || effectiveRole === 'sindico',
        canManageUsers: effectiveRole === 'superadmin' || effectiveRole === 'sindico',
        canManageVisitors: effectiveRole === 'superadmin' || effectiveRole === 'sindico' || effectiveRole === 'porteiro',
        canCreateOccurrence: true,
        canManageUnits: effectiveRole === 'superadmin' || effectiveRole === 'sindico',
        canManageResidents: effectiveRole === 'superadmin' || effectiveRole === 'sindico',
        canManageNotices: effectiveRole === 'superadmin' || effectiveRole === 'sindico',
        canAccessPortaria: effectiveRole === 'superadmin' || effectiveRole === 'sindico' || effectiveRole === 'porteiro',
        canAccessReports: effectiveRole === 'superadmin' || effectiveRole === 'sindico',
        canManageSettings: effectiveRole === 'superadmin' || effectiveRole === 'sindico',
        canAccessAdmin: effectiveRole === 'superadmin',
        canAccessAll: effectiveRole === 'superadmin',

        hasAdminAccess: effectiveRole === 'superadmin' || effectiveRole === 'sindico',

        shouldShowSindicoUI: effectiveRole === 'superadmin' || effectiveRole === 'sindico',
        shouldShowPorteiroUI: effectiveRole === 'porteiro',
        shouldShowMoradorUI: effectiveRole === 'morador',
    }), [user, effectiveProfile, loading, isImpersonating, originalAdminId, checkImpersonation, isSuperAdminReal, isSuperAdmin, isSindico, isPorteiro, isMorador, effectiveRole]);
}

export function useCondo() {
    const { profile } = useUser();
    const [condo, setCondo] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        const fetchCondo = async () => {
            if (!profile?.condo_id) {
                setLoading(false);
                return;
            }

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

export function clearUserCache() {
    condoCache = {};
}
