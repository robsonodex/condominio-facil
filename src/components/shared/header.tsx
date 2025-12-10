'use client';

import { Menu, Bell, LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUser, useCondo } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface HeaderProps {
    onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const { signOut } = useAuth();
    const { profile, isSuperAdmin, loading: userLoading } = useUser();
    const { condo } = useCondo();
    const router = useRouter();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleSignOut = async () => {
        if (isLoggingOut) return; // Prevent double-click
        setIsLoggingOut(true);
        setShowUserMenu(false);

        try {
            await signOut();
            // Use window.location for clean redirect without router state issues
            window.location.href = '/login';
        } catch (error) {
            console.error('[Header] Logout error:', error);
            setIsLoggingOut(false);
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
                        <div className="hidden sm:block">
                            <p className="text-sm font-medium text-gray-900">{condo.nome}</p>
                            <p className="text-xs text-gray-500">{condo.cidade}, {condo.estado}</p>
                        </div>
                    )}
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2">
                    {/* Notifications - Em breve */}
                    <button
                        className="p-2 rounded-lg hover:bg-gray-100 relative opacity-50 cursor-not-allowed"
                        title="Notificações em breve"
                        disabled
                    >
                        <Bell className="h-5 w-5 text-gray-400" />
                    </button>

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
                                <p className="text-sm font-medium text-gray-900">{profile?.nome || 'Usuário'}</p>
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
                                        <p className="text-sm font-medium text-gray-900">{profile?.nome}</p>
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
