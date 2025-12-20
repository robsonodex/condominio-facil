'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MobileHeader, BottomNav } from '@/components/mobile';
import { AlertTriangle, Plus, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Occurrence {
    id: string;
    titulo: string;
    descricao: string;
    tipo: string;
    status: string;
    prioridade: string;
    created_at: string;
}

/**
 * Lista de Ocorrências Mobile
 */
export default function AppOcorrenciasPage() {
    const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<'sindico' | 'morador' | 'porteiro'>('morador');
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/app/login');
            return;
        }

        const { data: profile } = await supabase
            .from('users')
            .select('id, role, condo_id')
            .eq('auth_id', user.id)
            .single();

        if (profile) {
            setRole(profile.role as any);

            let query = supabase
                .from('occurrences')
                .select('*')
                .eq('condo_id', profile.condo_id)
                .order('created_at', { ascending: false })
                .limit(20);

            // Morador vê só as próprias
            if (profile.role === 'morador') {
                query = query.eq('morador_id', profile.id);
            }

            const { data: occsData } = await query;
            setOccurrences(occsData || []);
        }
        setLoading(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'aberta': return { bg: '#fef3c7', text: '#d97706' };
            case 'em_andamento': return { bg: '#dbeafe', text: '#2563eb' };
            case 'resolvida': return { bg: '#dcfce7', text: '#16a34a' };
            default: return { bg: '#f3f4f6', text: '#6b7280' };
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'aberta': return 'Aberta';
            case 'em_andamento': return 'Em Andamento';
            case 'resolvida': return 'Resolvida';
            default: return status;
        }
    };

    return (
        <>
            <MobileHeader title="Ocorrências" showBack />

            <main className="app-content">
                {loading ? (
                    <div className="app-loading">
                        <div className="app-spinner" />
                    </div>
                ) : occurrences.length === 0 ? (
                    <div className="app-card app-text-center" style={{ padding: 32 }}>
                        <AlertTriangle size={48} style={{ color: '#d1d5db', marginBottom: 16 }} />
                        <p style={{ color: '#6b7280', marginBottom: 16 }}>Nenhuma ocorrência registrada</p>
                        <button
                            className="app-button app-button-primary"
                            onClick={() => router.push('/app/ocorrencias/nova')}
                        >
                            <Plus size={20} style={{ marginRight: 8 }} />
                            Abrir Ocorrência
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Botão Nova Ocorrência */}
                        <button
                            className="app-button app-button-primary app-w-full"
                            onClick={() => router.push('/app/ocorrencias/nova')}
                            style={{ marginBottom: 16 }}
                        >
                            <Plus size={20} style={{ marginRight: 8 }} />
                            Nova Ocorrência
                        </button>

                        {/* Lista */}
                        <div style={{ borderRadius: 12, overflow: 'hidden' }}>
                            {occurrences.map((occ) => {
                                const statusStyle = getStatusColor(occ.status);
                                return (
                                    <div key={occ.id} className="app-list-item app-ripple">
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                <span style={{
                                                    padding: '2px 8px',
                                                    borderRadius: 12,
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    background: statusStyle.bg,
                                                    color: statusStyle.text
                                                }}>
                                                    {getStatusLabel(occ.status)}
                                                </span>
                                                <span style={{ color: '#6b7280', fontSize: 11 }}>
                                                    {occ.tipo}
                                                </span>
                                            </div>
                                            <p style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>
                                                {occ.titulo}
                                            </p>
                                            <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>
                                                {new Date(occ.created_at).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                        <ChevronRight size={20} style={{ color: '#9ca3af' }} />
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </main>

            <BottomNav role={role} />
        </>
    );
}
