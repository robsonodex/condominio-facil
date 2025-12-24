'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Bell, Check, CheckCheck, Trash2, CreditCard, AlertTriangle, Info, Megaphone } from 'lucide-react';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'aviso' | 'vencimento' | 'atraso' | 'sistema' | 'billing';
    is_read: boolean;
    link?: string;
    created_at: string;
}

export default function MinhasNotificacoesPage() {
    const { profile } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (profile?.id) {
            fetchNotifications();
        }
    }, [profile?.id]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', profile?.id)
                .order('created_at', { ascending: false })
                .limit(50);

            setNotifications(data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        await supabase
            .from('notifications')
            .update({ is_read: true, data_leitura: new Date().toISOString() })
            .eq('id', id);

        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, is_read: true } : n)
        );
    };

    const markAllAsRead = async () => {
        await supabase
            .from('notifications')
            .update({ is_read: true, data_leitura: new Date().toISOString() })
            .eq('user_id', profile?.id)
            .eq('is_read', false);

        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    };

    const deleteNotification = async (id: string) => {
        await supabase
            .from('notifications')
            .delete()
            .eq('id', id);

        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.is_read) {
            markAsRead(notification.id);
        }
        if (notification.link) {
            router.push(notification.link);
        }
    };

    const getIcon = (tipo: string) => {
        switch (tipo) {
            case 'vencimento':
                return <CreditCard className="h-5 w-5 text-yellow-500" />;
            case 'atraso':
                return <AlertTriangle className="h-5 w-5 text-red-500" />;
            case 'sistema':
                return <Info className="h-5 w-5 text-blue-500" />;
            case 'aviso':
                return <Megaphone className="h-5 w-5 text-purple-500" />;
            default:
                return <Bell className="h-5 w-5 text-emerald-500" />;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Agora mesmo';
        if (diffMins < 60) return `${diffMins} min atrás`;
        if (diffHours < 24) return `${diffHours}h atrás`;
        if (diffDays < 7) return `${diffDays} dias atrás`;
        return date.toLocaleDateString('pt-BR');
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Minhas Notificações</h1>
                    <p className="text-gray-500">
                        {unreadCount > 0
                            ? `Você tem ${unreadCount} notificação${unreadCount > 1 ? 'ões' : ''} não lida${unreadCount > 1 ? 's' : ''}`
                            : 'Todas as notificações foram lidas'
                        }
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button onClick={markAllAsRead} variant="outline">
                        <CheckCheck className="h-4 w-4 mr-2" />
                        Marcar todas como lidas
                    </Button>
                )}
            </div>

            <Card>
                <CardContent className="p-0">
                    {notifications.length === 0 ? (
                        <div className="text-center py-12">
                            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">Nenhuma notificação</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-emerald-50/50' : ''
                                        } ${notification.link ? 'cursor-pointer' : ''}`}
                                    onClick={() => notification.link && handleNotificationClick(notification)}
                                >
                                    <div className="flex-shrink-0 mt-1">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className={`font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                                                {notification.title}
                                            </h4>
                                            {!notification.is_read && (
                                                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-2">
                                            {formatDate(notification.created_at)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {!notification.is_read && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markAsRead(notification.id);
                                                }}
                                                className="p-2 hover:bg-gray-100 rounded-lg"
                                                title="Marcar como lida"
                                            >
                                                <Check className="h-4 w-4 text-gray-400" />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteNotification(notification.id);
                                            }}
                                            className="p-2 hover:bg-red-50 rounded-lg"
                                            title="Excluir notificação"
                                        >
                                            <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
