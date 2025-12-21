'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MobileHeader, BottomNav } from '@/components/mobile';
import { Video, Play, AlertCircle } from 'lucide-react';

/**
 * Câmeras - Porteiro
 * Visualização de câmeras do condomínio
 */
export default function AppCamerasPage() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
            router.push('/app/login');
            return;
        }

        const response = await fetch('/api/auth/profile', {
            credentials: 'include',
            headers: { 'Authorization': `Bearer ${session.access_token}` },
        });

        if (response.ok) {
            const data = await response.json();
            setProfile(data.profile);
        }
        setLoading(false);
    };

    // Câmeras exemplo (placeholder)
    const cameras = [
        { id: '1', nome: 'Entrada Principal', status: 'online' },
        { id: '2', nome: 'Garagem', status: 'online' },
        { id: '3', nome: 'Piscina', status: 'offline' },
        { id: '4', nome: 'Salão de Festas', status: 'online' },
    ];

    const role = (profile?.role as 'sindico' | 'morador' | 'porteiro') || 'porteiro';

    if (loading) {
        return (
            <>
                <MobileHeader title="Câmeras" showBack />
                <main className="app-content">
                    <div className="app-loading"><div className="app-spinner" /></div>
                </main>
            </>
        );
    }

    return (
        <>
            <MobileHeader title="Câmeras" showBack />

            <main className="app-content">
                <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
                    Monitoramento em tempo real
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {cameras.map((camera) => (
                        <div
                            key={camera.id}
                            className="app-card"
                            style={{
                                textAlign: 'center',
                                padding: 16,
                                cursor: camera.status === 'online' ? 'pointer' : 'default',
                                opacity: camera.status === 'online' ? 1 : 0.6
                            }}
                            onClick={() => {
                                if (camera.status === 'online') {
                                    alert(`Abrindo câmera: ${camera.nome}\n\n(Integração com sistema de CFTV será implementada)`);
                                }
                            }}
                        >
                            <div style={{
                                width: '100%',
                                height: 60,
                                background: camera.status === 'online' ? '#1f2937' : '#d1d5db',
                                borderRadius: 8,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 8
                            }}>
                                {camera.status === 'online' ? (
                                    <Play size={24} style={{ color: '#10b981' }} />
                                ) : (
                                    <AlertCircle size={24} style={{ color: '#9ca3af' }} />
                                )}
                            </div>
                            <p style={{ fontWeight: 600, color: '#111827', fontSize: 13 }}>
                                {camera.nome}
                            </p>
                            <span style={{
                                display: 'inline-block',
                                marginTop: 4,
                                padding: '2px 8px',
                                borderRadius: 10,
                                fontSize: 10,
                                fontWeight: 500,
                                background: camera.status === 'online' ? '#dcfce7' : '#f3f4f6',
                                color: camera.status === 'online' ? '#166534' : '#6b7280'
                            }}>
                                {camera.status === 'online' ? '● Online' : '○ Offline'}
                            </span>
                        </div>
                    ))}
                </div>

                <p style={{
                    textAlign: 'center',
                    color: '#9ca3af',
                    fontSize: 12,
                    marginTop: 24
                }}>
                    Configure as câmeras pelo painel web
                </p>
            </main>

            <BottomNav role={role} />
        </>
    );
}
