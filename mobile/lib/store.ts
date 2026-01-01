import { create } from 'zustand'
import { Session } from '@supabase/supabase-js'

interface UserProfile {
    id: string
    role: 'morador' | 'sindico' | 'porteiro'
    nome: string
    email: string
    avatar_url?: string
    condominio_id: string
    unidade?: string
    telefone?: string
    // Add other profile fields as needed
}

interface AuthState {
    session: Session | null
    user: UserProfile | null
    isAuthenticated: boolean
    setSession: (session: Session | null) => void
    setUser: (user: UserProfile | null) => void
    logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
    session: null,
    user: null,
    isAuthenticated: false,
    setSession: (session) => set((state) => ({
        session,
        isAuthenticated: !!session
    })),
    setUser: (user) => set({ user }),
    logout: () => set({ session: null, user: null, isAuthenticated: false }),
}))
