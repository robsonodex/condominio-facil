'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [profile, setProfile] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();


    useEffect(() => {
        const fetchProfile = async (userId: string, email: string) => {
            try {
                // Try by ID first
                let { data: profileData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', userId)
                    .single();

                // If not found by ID, try by email
                if (!profileData) {
                    const { data: profileByEmail } = await supabase
                        .from('users')
                        .select('*')
                        .eq('email', email)
                        .single();
                    profileData = profileByEmail;
                }

                // If still no profile, create one automatically
                if (!profileData) {
                    console.log('Creating new user profile for:', email);
                    const { data: newProfile } = await supabase
                        .from('users')
                        .insert({
                            id: userId,
                            email: email,
                            nome: email.split('@')[0],
                            role: 'morador',
                            ativo: true
                        })
                        .select()
                        .single();
                    profileData = newProfile;
                }

                return profileData;
            } catch (error) {
                return null;
            }
        };

        const getUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);

                if (user && user.email) {
                    const profileData = await fetchProfile(user.id, user.email);
                    setProfile(profileData);
                }
            } catch (error) {
            } finally {
                setLoading(false);
            }
        };

        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            setUser(session?.user ?? null);

            if (session?.user && session.user.email) {
                const profileData = await fetchProfile(session.user.id, session.user.email);
                setProfile(profileData);
            } else {
                setProfile(null);
            }

            setLoading(false);
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
            options: {
                data: { nome }
            }
        });

        if (!error && data.user) {
            // Create user profile
            await supabase.from('users').insert({
                id: data.user.id,
                email,
                nome,
                role: 'morador', // Default role
                ativo: true
            });
        }

        return { error: error as Error | null };
    };

    const signOut = async () => {
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
            redirectTo: `${window.location.origin}/auth/reset-password`
        });
        return { error: error as Error | null };
    };

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            loading,
            signIn,
            signUp,
            signOut,
            signInWithMagicLink,
            resetPassword
        }}>
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
