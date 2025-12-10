'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { User } from '@/types/database';

interface AuthContextType {
    user: SupabaseUser | null;
    profile: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string, nome: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
    resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cache para evitar múltiplas consultas
let profileCache: { [key: string]: User } = {};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [profile, setProfile] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Memoize supabase client to avoid recreating
    const supabase = useMemo(() => createClient(), []);

    // Função para buscar perfil do usuário
    const fetchProfile = useCallback(async (sessionUser: SupabaseUser) => {
        try {
            // Check cache first
            if (profileCache[sessionUser.id]) {
                setProfile(profileCache[sessionUser.id]);
                return profileCache[sessionUser.id];
            }

            // Buscar por email
            const { data: profileData, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', sessionUser.email)
                .eq('ativo', true)
                .maybeSingle();

            if (error) {
                console.error('Error fetching profile:', error);
                return null;
            }

            if (profileData) {
                profileCache[sessionUser.id] = profileData;
                setProfile(profileData);
                return profileData;
            }

            return null;
        } catch (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
    }, [supabase]);

    useEffect(() => {
        let isMounted = true;

        // Fast initial check using getSession
        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!isMounted) return;

                if (session?.user) {
                    setUser(session.user);
                    await fetchProfile(session.user);
                } else {
                    setUser(null);
                    setProfile(null);
                }
            } catch (error) {
                console.error('Auth init error:', error);
                if (isMounted) {
                    setUser(null);
                    setProfile(null);
                }
            } finally {
                // CRITICAL: Always set loading to false
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!isMounted) return;

            if (event === 'SIGNED_OUT') {
                setUser(null);
                setProfile(null);
                profileCache = {};
                setLoading(false);
                return;
            }

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                if (session?.user) {
                    setUser(session.user);
                    await fetchProfile(session.user);
                }
                setLoading(false);
            }

            if (event === 'INITIAL_SESSION') {
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [supabase]); // Only depend on supabase, not fetchProfile

    const signIn = useCallback(async (email: string, password: string) => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setLoading(false);
        }
        return { error: error as Error | null };
    }, [supabase]);

    const signUp = useCallback(async (email: string, password: string, nome: string) => {
        setLoading(true);
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { nome },
                emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`
            }
        });

        if (!error && data.user) {
            // Criar perfil no banco
            await supabase.from('users').insert({
                id: data.user.id,
                email,
                nome,
                role: 'morador',
                ativo: true
            });

            // ========================================
            // ENVIAR E-MAIL DE BOAS-VINDAS
            // ========================================
            try {
                const appUrl = window.location.origin;
                await fetch('/api/email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tipo: 'welcome',
                        destinatario: email,
                        dados: {
                            nome: nome,
                            loginUrl: `${appUrl}/login`
                        },
                        userId: data.user.id,
                        internalCall: true // Permitir envio sem autenticação
                    }),
                });
                console.log('E-mail de boas-vindas enviado para:', email);
            } catch (emailError) {
                // Não bloquear registro se e-mail falhar
                console.error('Erro ao enviar e-mail de boas-vindas:', emailError);
            }
        }

        setLoading(false);
        return { error: error as Error | null };
    }, [supabase]);

    const signOut = useCallback(async () => {
        setLoading(true);
        profileCache = {};
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setLoading(false);
    }, [supabase]);

    const signInWithMagicLink = useCallback(async (email: string) => {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`
            }
        });
        return { error: error as Error | null };
    }, [supabase]);

    const resetPassword = useCallback(async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        });
        return { error: error as Error | null };
    }, [supabase]);

    // Memoize context value to prevent unnecessary re-renders
    const value = useMemo(() => ({
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithMagicLink,
        resetPassword
    }), [user, profile, loading, signIn, signUp, signOut, signInWithMagicLink, resetPassword]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
