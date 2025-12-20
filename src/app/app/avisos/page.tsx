'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MobileHeader, BottomNav } from '@/components/mobile';
import { Bell, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Notice {
    id: string;
    titulo: string;
    mensagem: string;
    data_publicacao: string;
    prioridade: string;
}

/**
 * Lista de Avisos Mobile
 */
export default function AppAvisosPage() {
    const [notices, setNotices] = useState<Notice[]>([]);
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
            .select('role, condo_id')
            .eq('auth_id', user.id)
            .single();

        if (profile) {
            setRole(profile.role as any);

            const { data: noticesData } = await supabase
                .from('notices')
                .select('*')
                .eq('condo_id', profile.condo_id)
                .order('data_publicacao', { ascending: false })
                .limit(20);

            setNotices(noticesData || []);
        }
        setLoading(false);
    };

    const getPrioridadeColor = (prioridade: string) => {
        switch (prioridade) {
            case 'alta': return '#ef4444';
            case 'media': return '#f59e0b';
            default: return '#10b981';
        }
    };

    return (
        <>
            <MobileHeader title="Avisos" showBack />

            <main className="app-content">
                {loading ? (
                    <div className="app-loading">
                        <div className="app-spinner" />
                    </div>
                ) : notices.length === 0 ? (
                    <div className="app-card app-text-center" style={{ padding: 32 }}>
                        <Bell size={48} style={{ color: '#d1d5db', marginBottom: 16 }} />
                        <p style={{ color: '#6b7280' }}>Nenhum aviso publicado</p>
                    </div>
                ) : (
                    <div style={{ borderRadius: 12, overflow: 'hidden' }}>
                        {notices.map((notice) => (
                            <div key={notice.id} className="app-list-item app-ripple">
                                <div style={{
                                    width: 4,
                                    height: 40,
                                    borderRadius: 2,
                                    background: getPrioridadeColor(notice.prioridade),
                                    marginRight: 12
                                }} />
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 600, color: '#111827', fontSize: 15 }}>
                                        {notice.titulo}
                                    </p>
                                    <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4, lineHeight: 1.4 }}>
                                        {notice.mensagem?.substring(0, 80)}
                                        {notice.mensagem?.length > 80 && '...'}
                                    </p>
                                    <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 6 }}>
                                        {new Date(notice.data_publicacao).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <BottomNav role={role} />
        </>
    );
}
