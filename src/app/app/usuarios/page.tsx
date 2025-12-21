'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MobileHeader, BottomNav } from '@/components/mobile';
import { Users, ChevronRight, Plus } from 'lucide-react';

interface Usuario {
    id: string;
    nome: string;
    email: string;
    role: string;
    ativo: boolean;
}

/**
 * Usuários - Síndico
 */
export default function AppUsuariosPage() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
            router.push('/app/login');
            return;
        }

        try {
            const response = await fetch('/api/auth/profile', {
                credentials: 'include',
                headers: { 'Authorization': `Bearer ${session.access_token}` },
            });

            if (response.ok) {
                const data = await response.json();
                const profile = data.profile;

                if (profile?.role !== 'sindico' && profile?.role !== 'superadmin') {
                    router.push('/app/dashboard');
                    return;
                }

                const { data: usuariosData } = await supabase
                    .from('users')
                    .select('id, nome, email, role, ativo')
                    .eq('condo_id', profile.condo_id)
                    .order('nome')
                    .limit(50);

                setUsuarios(usuariosData || []);
            }
        } catch (err) {
            console.error('[APP] Erro:', err);
        }
        setLoading(false);
    };

    const getRoleLabel = (role: string) => {
        const labels: Record<string, string> = {
            sindico: 'Síndico',
            morador: 'Morador',
            porteiro: 'Porteiro'
        };
        return labels[role] || role;
    };

    const getRoleColor = (role: string) => {
        const colors: Record<string, string> = {
            sindico: '#8b5cf6',
            morador: '#10b981',
            porteiro: '#3b82f6'
        };
        return colors[role] || '#6b7280';
    };

    if (loading) {
        return (
            <>
                <MobileHeader title="Usuários" showBack />
                <main className="app-content">
                    <div className="app-loading"><div className="app-spinner" /></div>
                </main>
            </>
        );
    }

    return (
        <>
            <MobileHeader title="Usuários" showBack />

            <main className="app-content">
                {/* Botão Cadastrar */}
                <button
                    className="app-button app-button-primary app-w-full"
                    style={{ marginBottom: 16 }}
                    onClick={() => router.push('/app/usuarios/novo')}
                >
                    <Plus size={20} style={{ marginRight: 8 }} />
                    Cadastrar Usuário
                </button>

                <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
                    {usuarios.length} usuário(s) com acesso ao sistema
                </p>

                {usuarios.length === 0 ? (
                    <div className="app-card" style={{ textAlign: 'center', padding: 32 }}>
                        <Users size={48} style={{ color: '#d1d5db', marginBottom: 16 }} />
                        <p style={{ color: '#6b7280' }}>Nenhum usuário cadastrado</p>
                    </div>
                ) : (
                    <div style={{ borderRadius: 12, overflow: 'hidden' }}>
                        {usuarios.map((usuario) => (
                            <div key={usuario.id} className="app-list-item">
                                <div style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    background: `${getRoleColor(usuario.role)}20`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: 12
                                }}>
                                    <Users size={20} style={{ color: getRoleColor(usuario.role) }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>{usuario.nome}</p>
                                    <p style={{ color: '#6b7280', fontSize: 12 }}>{usuario.email}</p>
                                </div>
                                <span style={{
                                    padding: '4px 10px',
                                    borderRadius: 12,
                                    fontSize: 11,
                                    fontWeight: 500,
                                    background: `${getRoleColor(usuario.role)}20`,
                                    color: getRoleColor(usuario.role)
                                }}>
                                    {getRoleLabel(usuario.role)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <BottomNav role="sindico" />
        </>
    );
}
