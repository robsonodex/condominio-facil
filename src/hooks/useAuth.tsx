'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback, useRef } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { User } from '@/types/database';

interface AuthContextType {
    user: SupabaseUser | null;
    session: Session | null;
    profile: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string, nome: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
    resetPassword: (email: string) => Promise<{ error: Error | null }>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const initDone = useRef(false);

    const supabase = useMemo(() => createClient(), []);

    // Fetch profile via API - pass access token for server-side auth
    const fetchProfile = useCallback(async (email: string, accessToken?: string): Promise<User | null> => {
        console.log('[AUTH] Fetching profile for email:', email, 'hasToken:', !!accessToken);

        // Retry up to 3 times
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const headers: Record<string, string> = {
                    'Cache-Control': 'no-cache',
                    'Content-Type': 'application/json',
                };

                // Pass access token in Authorization header
                if (accessToken) {
                    headers['Authorization'] = `Bearer ${accessToken}`;
                }

                const response = await fetch('/api/auth/profile', {
                    credentials: 'include',
                    cache: 'no-store',
                    headers,
                });

                if (!response.ok) {
                    console.error('[AUTH] Profile API error:', response.status, 'attempt:', attempt);
                    if (attempt < 3) {
                        await new Promise(r => setTimeout(r, 500 * attempt));
                        continue;
                    }
                    return null;
                }

                const data = await response.json();

                if (data.profile) {
                    console.log('[AUTH] Profile loaded - Role:', data.profile.role, 'Email:', data.profile.email);
                    return data.profile;
                } else {
                    console.warn('[AUTH] Profile API returned null, attempt:', attempt);
                    if (attempt < 3) {
                        await new Promise(r => setTimeout(r, 500 * attempt));
                        continue;
                    }
                }
            } catch (err) {
                console.error('[AUTH] Profile fetch exception, attempt:', attempt, err);
                if (attempt < 3) {
                    await new Promise(r => setTimeout(r, 500 * attempt));
                    continue;
                }
            }
        }

        console.error('[AUTH] Failed to fetch profile after 3 attempts');
        return null;
    }, []);

    // Refresh profile (for use after updates)
    const refreshProfile = useCallback(async () => {
        if (user?.email && session?.access_token) {
            const profileData = await fetchProfile(user.email, session.access_token);
            setProfile(profileData);
        }
    }, [user, session, fetchProfile]);

    // Initialize auth state with timeout
    useEffect(() => {
        if (initDone.current) return;
        initDone.current = true;

        let mounted = true;
        let timeoutId: NodeJS.Timeout;

        const initializeAuth = async () => {
            try {
                // Add timeout to prevent infinite loading
                const timeoutPromise = new Promise<null>((resolve) => {
                    timeoutId = setTimeout(() => {
                        console.warn('[AUTH] getSession timeout - assuming no session');
                        resolve(null);
                    }, 5000);
                });

                const sessionPromise = supabase.auth.getSession().then(res => res.data.session);

                const initialSession = await Promise.race([sessionPromise, timeoutPromise]);
                clearTimeout(timeoutId);

                if (!mounted) return;

                if (initialSession?.user) {
                    setSession(initialSession);
                    setUser(initialSession.user);
                    const profileData = await fetchProfile(initialSession.user.email!, initialSession.access_token);
                    setProfile(profileData);
                } else {
                    setSession(null);
                    setUser(null);
                    setProfile(null);
                }
            } catch (err) {
                console.error('[AUTH] Init error:', err);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (!mounted) return;

            console.log('[AUTH] State change:', event);

            if (event === 'SIGNED_OUT') {
                setSession(null);
                setUser(null);
                setProfile(null);
                setLoading(false);
            } else if (event === 'SIGNED_IN' && newSession?.user) {
                setSession(newSession);
                setUser(newSession.user);
                const profileData = await fetchProfile(newSession.user.email!, newSession.access_token);
                setProfile(profileData);
                setLoading(false);
            } else if (event === 'TOKEN_REFRESHED' && newSession?.user) {
                setSession(newSession);
                setUser(newSession.user);
            }
        });

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, [supabase, fetchProfile]);

    const signIn = useCallback(async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            return { error: error as Error | null };
        } catch (err) {
            return { error: err as Error };
        }
    }, [supabase]);

    const signUp = useCallback(async (email: string, password: string, nome: string) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { nome }
                    // Removed emailRedirectTo to prevent auto-login
                }
            });

            if (!error && data.user) {
                // Create user profile with ativo=false (pending email confirmation)
                await supabase.from('users').insert({
                    id: data.user.id,
                    email,
                    nome,
                    role: 'sindico', // New registrations are síndicos (trial)
                    ativo: false // Requires email confirmation
                });

                // Send welcome email
                try {
                    await fetch('/api/email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            tipo: 'welcome',
                            destinatario: email,
                            dados: {
                                nome,
                                loginUrl: `${window.location.origin}/login`
                            },
                            internalCall: true
                        })
                    });
                    console.log('[AUTH] Welcome email sent to:', email);
                } catch (emailError) {
                    console.error('[AUTH] Failed to send welcome email:', emailError);
                }

                // Sign out immediately to prevent auto-login
                await supabase.auth.signOut();
            }

            return { error: error as Error | null };
        } catch (err) {
            return { error: err as Error };
        }
    }, [supabase]);

    const signOut = useCallback(async () => {
        setLoading(true);

        try {
            // Clear all state first
            setSession(null);
            setUser(null);
            setProfile(null);

            // Sign out from Supabase
            await supabase.auth.signOut();

            // Clear any localStorage/sessionStorage that might persist
            if (typeof window !== 'undefined') {
                // Clear Supabase keys
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.startsWith('sb-')) {
                        localStorage.removeItem(key);
                    }
                });

                // Also clear sessionStorage
                const sessionKeys = Object.keys(sessionStorage);
                sessionKeys.forEach(key => {
                    if (key.startsWith('sb-')) {
                        sessionStorage.removeItem(key);
                    }
                });
            }
        } catch (error) {
            console.error('[AUTH] Logout error:', error);
        } finally {
            setLoading(false);

            // Force redirect to login page
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }
    }, [supabase]);

    const signInWithMagicLink = useCallback(async (email: string) => {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
        });
        return { error: error as Error | null };
    }, [supabase]);

    const resetPassword = useCallback(async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        });
        return { error: error as Error | null };
    }, [supabase]);

    const value = useMemo(() => ({
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithMagicLink,
        resetPassword,
        refreshProfile
    }), [user, session, profile, loading, signIn, signUp, signOut, signInWithMagicLink, resetPassword, refreshProfile]);

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
