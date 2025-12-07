'use client';

import { useEffect, useState } from 'react';
import { X, Bell, AlertTriangle, Info, CreditCard } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Notification {
    id: string;
    titulo: string;
    mensagem: string;
    tipo: 'aviso' | 'vencimento' | 'atraso' | 'sistema';
    lida: boolean;
    created_at: string;
}

export function NotificationPopup() {
    const { profile } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showPopup, setShowPopup] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        if (profile?.id) {
            fetchNotifications();
        }
    }, [profile?.id]);

    const fetchNotifications = async () => {
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', profile?.id)
            .eq('lida', false)
            .order('created_at', { ascending: false })
            .limit(5);

        if (data && data.length > 0) {
            setNotifications(data);
            setShowPopup(true);
        }
    };

    const markAsRead = async (id: string) => {
        await supabase
            .from('notifications')
            .update({ lida: true, data_leitura: new Date().toISOString() })
            .eq('id', id);

        setNotifications(prev => prev.filter(n => n.id !== id));
        if (notifications.length <= 1) {
            setShowPopup(false);
        }
    };

    const markAllAsRead = async () => {
        await supabase
            .from('notifications')
            .update({ lida: true, data_leitura: new Date().toISOString() })
            .eq('user_id', profile?.id)
            .eq('lida', false);

        setNotifications([]);
        setShowPopup(false);
    };

    const getIcon = (tipo: string) => {
        switch (tipo) {
            case 'vencimento':
                return <CreditCard className="h-5 w-5 text-yellow-500" />;
            case 'atraso':
                return <AlertTriangle className="h-5 w-5 text-red-500" />;
            case 'sistema':
                return <Info className="h-5 w-5 text-blue-500" />;
            default:
                return <Bell className="h-5 w-5 text-emerald-500" />;
        }
    };

    const getBgColor = (tipo: string) => {
        switch (tipo) {
            case 'atraso':
                return 'bg-red-50 border-red-200';
            case 'vencimento':
                return 'bg-yellow-50 border-yellow-200';
            default:
                return 'bg-white border-gray-200';
        }
    };

    if (!showPopup || notifications.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full space-y-2">
            {notifications.map((notification) => (
                <div
                    key={notification.id}
                    className={`${getBgColor(notification.tipo)} border rounded-lg shadow-lg p-4 animate-slide-in`}
                >
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                            {getIcon(notification.tipo)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-sm">
                                {notification.titulo}
                            </h4>
                            <p className="text-gray-600 text-sm mt-1">
                                {notification.mensagem}
                            </p>
                        </div>
                        <button
                            onClick={() => markAsRead(notification.id)}
                            className="flex-shrink-0 p-1 hover:bg-gray-100 rounded"
                        >
                            <X className="h-4 w-4 text-gray-400" />
                        </button>
                    </div>
                </div>
            ))}
            {notifications.length > 1 && (
                <button
                    onClick={markAllAsRead}
                    className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2"
                >
                    Marcar todas como lidas
                </button>
            )}
        </div>
    );
}

// Add to globals.css
// @keyframes slide-in {
//   from { transform: translateX(100%); opacity: 0; }
//   to { transform: translateX(0); opacity: 1; }
// }
// .animate-slide-in { animation: slide-in 0.3s ease-out; }
