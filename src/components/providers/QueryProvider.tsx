'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * QueryProvider - Provider global do TanStack Query v5
 * 
 * Configurações otimizadas para o Condomínio Fácil:
 * - staleTime: 5 minutos - dados ficam "frescos" por 5 min
 * - gcTime: 10 minutos - cache mantido por 10 min após inatividade
 * - refetchOnWindowFocus: false - evita refetch excessivo
 * - retry: 2 - tentativas em caso de erro de rede
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
    // Criamos o QueryClient dentro de um useState para evitar
    // recriação em cada render (padrão recomendado para Next.js)
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Dados ficam "frescos" por 5 minutos
                        staleTime: 5 * 60 * 1000,
                        // Cache mantido por 10 minutos após inatividade
                        gcTime: 10 * 60 * 1000,
                        // Não refetch ao focar a janela (evita requests desnecessários)
                        refetchOnWindowFocus: false,
                        // Não refetch ao reconectar
                        refetchOnReconnect: false,
                        // 2 tentativas em caso de erro
                        retry: 2,
                        // Delay entre tentativas (exponencial)
                        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
                    },
                    mutations: {
                        // Não retry mutations por padrão
                        retry: 0,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
