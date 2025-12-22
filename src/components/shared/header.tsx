'use client';

import { Menu, Bell, LogOut, User, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUser, useCondo } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface HeaderProps {
    onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const { signOut } = useAuth();
    const { profile, isSuperAdmin, condoId, loading: userLoading } = useUser();
    const { condo } = useCondo();
    const router = useRouter();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const supabase = createClient();

    // Buscar avisos não lidos
    useEffect(() => {
        if (condoId && profile?.id) {
            fetchUnreadNotices();
        }
    }, [condoId, profile?.id]);

    const fetchUnreadNotices = async () => {
        try {
            // Buscar avisos do condomínio nos últimos 30 dias
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data: notices } = await supabase
                .from('notices')
                .select('id')
                .eq('condo_id', condoId)
                .gte('data_publicacao', thirtyDaysAgo.toISOString())
                .in('publico_alvo', ['todos', 'somente_moradores']);

            // Buscar avisos já lidos pelo usuário
            const { data: readNotices } = await supabase
                .from('notice_reads')
                .select('notice_id')
                .eq('user_id', profile?.id);

            const readIds = new Set(readNotices?.map(r => r.notice_id) || []);
            const unread = notices?.filter(n => !readIds.has(n.id)) || [];

            setUnreadCount(unread.length);
        } catch (error) {
            console.error('Error fetching unread notices:', error);
        }
    };

    const handleSignOut = async () => {
        if (isLoggingOut) return; // Prevent double-click
        setIsLoggingOut(true);
        setShowUserMenu(false);

        try {
            // Timeout de 3 segundos para evitar travamento
            const signOutPromise = signOut();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 3000)
            );

            await Promise.race([signOutPromise, timeoutPromise]);
        } catch (error) {
            console.error('[Header] Logout error:', error);
        } finally {
            // Redireciona independente de sucesso ou erro
            window.location.href = '/login';
        }
    };

    return (
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between h-full px-4 lg:px-6">
                {/* Left side */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
                    >
                        <Menu className="h-5 w-5 text-gray-600" />
                    </button>

                    {!isSuperAdmin && condo && (
                        <div className="hidden sm:flex items-center gap-3">
                            {/* Logo or default icon */}
                            {(condo as any).logo_url ? (
                                <img
                                    src={(condo as any).logo_url}
                                    alt={condo.nome}
                                    className="w-10 h-10 rounded-lg object-contain bg-gray-50"
                                />
                            ) : (
                                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                    <Building2 className="h-5 w-5 text-emerald-600" />
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-medium text-gray-900">{condo.nome}</p>
                                {(condo.cidade || condo.estado) && (
                                    <p className="text-xs text-gray-500">
                                        {[condo.cidade, condo.estado].filter(Boolean).join(', ')}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2">
                    {/* Notifications */}
                    <Link
                        href="/avisos"
                        className="p-2 rounded-lg hover:bg-gray-100 relative"
                        title="Ver avisos"
                    >
                        <Bell className="h-5 w-5 text-gray-600" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </Link>

                    {/* User menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
                        >
                            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div className="hidden sm:block text-left">
                                <p className="text-sm font-medium text-gray-900">{profile?.nome || profile?.email || 'Carregando...'}</p>
                                <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
                            </div>
                        </button>

                        {showUserMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowUserMenu(false)}
                                />
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                    <div className="p-3 border-b border-gray-200 sm:hidden">
                                        <p className="text-sm font-medium text-gray-900">{profile?.nome || profile?.email}</p>
                                        <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
                                    </div>
                                    <button
                                        onClick={handleSignOut}
                                        disabled={isLoggingOut}
                                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        <LogOut className={`h-4 w-4 ${isLoggingOut ? 'animate-spin' : ''}`} />
                                        {isLoggingOut ? 'Saindo...' : 'Sair'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
