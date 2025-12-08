'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
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

    useEffect(() => {
        // Fast initial check using getSession (faster than getUser)
        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    setUser(session.user);

                    // Check cache first
                    if (profileCache[session.user.id]) {
                        setProfile(profileCache[session.user.id]);
                        setLoading(false);
                        return;
                    }

                    // Single optimized query with OR condition
                    const { data: profileData } = await supabase
                        .from('users')
                        .select('*')
                        .or(`id.eq.${session.user.id},email.eq.${session.user.email}`)
                        .limit(1)
                        .single();

                    if (profileData) {
                        profileCache[session.user.id] = profileData;
                        setProfile(profileData);
                    } else if (session.user.email) {
                        // Auto-create profile only if really needed
                        const { data: newProfile } = await supabase
                            .from('users')
                            .insert({
                                id: session.user.id,
                                email: session.user.email,
                                nome: session.user.email.split('@')[0],
                                role: 'morador',
                                ativo: true
                            })
                            .select()
                            .single();

                        if (newProfile) {
                            profileCache[session.user.id] = newProfile;
                            setProfile(newProfile);
                        }
                    }
                }
            } catch (error) {
                console.error('Auth init error:', error);
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT') {
                setUser(null);
                setProfile(null);
                profileCache = {};
                return;
            }

            if (session?.user) {
                setUser(session.user);

                // Check cache
                if (profileCache[session.user.id]) {
                    setProfile(profileCache[session.user.id]);
                    return;
                }

                // Fetch profile
                const { data: profileData } = await supabase
                    .from('users')
                    .select('*')
                    .or(`id.eq.${session.user.id},email.eq.${session.user.email}`)
                    .limit(1)
                    .single();

                if (profileData) {
                    profileCache[session.user.id] = profileData;
                    setProfile(profileData);
                }
            } else {
                setUser(null);
                setProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error as Error | null };
    };

    const signUp = async (email: string, password: string, nome: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { nome } }
        });

        if (!error && data.user) {
            await supabase.from('users').insert({
                id: data.user.id,
                email,
                nome,
                role: 'morador',
                ativo: true
            });
        }

        return { error: error as Error | null };
    };

    const signOut = async () => {
        profileCache = {};
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
    };

    const signInWithMagicLink = async (email: string) => {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`
            }
        });
        return { error: error as Error | null };
    };

    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        });
        return { error: error as Error | null };
    };

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
    }), [user, profile, loading]);

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
