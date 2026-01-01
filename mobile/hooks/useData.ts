import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../lib/store'
import { useEffect } from 'react'

export interface Occurrence {
    id: string
    titulo: string
    descricao: string
    status: 'pendente' | 'em_analise' | 'em_andamento' | 'resolvido'
    prioridade: 'baixa' | 'media' | 'alta'
    created_at: string
    updated_at: string
    usuario_id: string
    condominio_id: string
    fotos?: string[]
}

export function useOccurrences() {
    const { user } = useAuthStore()
    const queryClient = useQueryClient()

    useEffect(() => {
        if (!user?.condominio_id) return

        const channel = supabase
            .channel('ocorrencias_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'ocorrencias',
                    filter: `condominio_id=eq.${user.condominio_id}`,
                },
                (payload) => {
                    console.log('Ocorrência atualizada:', payload)
                    queryClient.invalidateQueries({ queryKey: ['occurrences', user.condominio_id] })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user?.condominio_id, queryClient])

    return useQuery({
        queryKey: ['occurrences', user?.condominio_id],
        queryFn: async () => {
            if (!user?.condominio_id) return []

            const { data, error } = await supabase
                .from('ocorrencias')
                .select('*')
                .eq('condominio_id', user.condominio_id)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data as Occurrence[]
        },
        enabled: !!user?.condominio_id,
    })
}

export function useCreateOccurrence() {
    const queryClient = useQueryClient()
    const { user } = useAuthStore()

    return useMutation({
        mutationFn: async (occurrence: Partial<Occurrence>) => {
            const { data, error } = await supabase
                .from('ocorrencias')
                .insert({
                    ...occurrence,
                    usuario_id: user?.id,
                    condominio_id: user?.condominio_id,
                    status: 'pendente',
                })
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: () => {
            // No need to manually invalidate here if realtime is working, 
            // but satisfying to keep for immediate local feedback or fallback
            queryClient.invalidateQueries({ queryKey: ['occurrences'] })
        },
    })
}

export function useNotices() {
    const { user } = useAuthStore()
    const queryClient = useQueryClient()

    useEffect(() => {
        if (!user?.condominio_id) return

        const channel = supabase
            .channel('avisos_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'avisos',
                    filter: `condominio_id=eq.${user.condominio_id}`,
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['notices', user.condominio_id] })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user?.condominio_id, queryClient])

    return useQuery({
        queryKey: ['notices', user?.condominio_id],
        queryFn: async () => {
            if (!user?.condominio_id) return []

            const { data, error } = await supabase
                .from('avisos')
                .select('*')
                .eq('condominio_id', user.condominio_id)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data
        },
        enabled: !!user?.condominio_id,
    })
}
