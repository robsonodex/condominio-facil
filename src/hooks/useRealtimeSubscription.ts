'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface UseRealtimeOptions<T> {
    table: string;
    schema?: string;
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
    filter?: string;
    onInsert?: (payload: T) => void;
    onUpdate?: (payload: T, oldRecord?: T) => void;
    onDelete?: (oldRecord: T) => void;
    enabled?: boolean;
}

/**
 * Reusable hook for Supabase Realtime subscriptions
 * 
 * @example
 * // Subscribe to reservation updates for a specific condo
 * useRealtimeSubscription({
 *     table: 'reservations',
 *     filter: `condo_id=eq.${condoId}`,
 *     onUpdate: (newReservation) => {
 *         setReservations(prev => prev.map(r => r.id === newReservation.id ? newReservation : r));
 *     }
 * });
 */
export function useRealtimeSubscription<T = Record<string, unknown>>({
    table,
    schema = 'public',
    event = '*',
    filter,
    onInsert,
    onUpdate,
    onDelete,
    enabled = true,
}: UseRealtimeOptions<T>) {
    const channelRef = useRef<RealtimeChannel | null>(null);

    const handleChange = useCallback(
        (payload: RealtimePostgresChangesPayload<T>) => {
            console.log(`[REALTIME] ${table}:`, payload.eventType, payload.new);

            switch (payload.eventType) {
                case 'INSERT':
                    onInsert?.(payload.new as T);
                    break;
                case 'UPDATE':
                    onUpdate?.(payload.new as T, payload.old as T);
                    break;
                case 'DELETE':
                    onDelete?.(payload.old as T);
                    break;
            }
        },
        [table, onInsert, onUpdate, onDelete]
    );

    useEffect(() => {
        if (!enabled) return;

        const supabase = createClient();

        const channelConfig: {
            event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
            schema: string;
            table: string;
            filter?: string;
        } = {
            event,
            schema,
            table,
        };

        if (filter) {
            channelConfig.filter = filter;
        }

        const channel = supabase
            .channel(`realtime-${table}-${Date.now()}`)
            .on(
                'postgres_changes',
                channelConfig,
                handleChange as (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => void
            )
            .subscribe((status) => {
                console.log(`[REALTIME] ${table} subscription:`, status);
            });

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [table, schema, event, filter, enabled, handleChange]);

    return {
        unsubscribe: () => {
            if (channelRef.current) {
                const supabase = createClient();
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        },
    };
}

export default useRealtimeSubscription;
