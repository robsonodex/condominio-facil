'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, Button, Badge } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { MessageCircle, Send, CheckCircle, Clock, XCircle, Users, Loader2, Trash2 } from 'lucide-react';

interface Message {
    id: string;
    mensagem: string;
    sender_type: 'user' | 'admin';
    sender_id: string;
    created_at: string;
    sender?: { nome: string };
}

interface Chat {
    id: string;
    assunto: string;
    status: string;
    created_at: string;
    unread_count: number;
    user?: { nome: string; email: string };
    atendente?: { nome: string };
}

export default function AdminSuportePage() {
    const { session } = useAuth();
    const supabase = createClient();
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [userId, setUserId] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
    });

    useEffect(() => {
        if (session?.access_token) {
            fetchChats();
        }
    }, [session]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Realtime para novos chats e mensagens
    useEffect(() => {
        const channel = supabase
            .channel('admin-chats-global')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'support_chats' },
                () => fetchChats()
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'chat_messages' },
                (payload) => {
                    const newMsg = payload.new as any;
                    // Se a mensagem não é do admin, tocar som
                    if (newMsg.sender_type === 'user') {
                        try {
                            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleBALbLzO6JVhGBdft9DpmGQXE2C31OmaZhQPY7fU6JtkFBBkt9TomGQWE2O31OiaZRUQYbfT6JllFRFit9TomGQXE2O31OaZZBUQYrfT55ljFRFht9PmmWMVEWK30+aZYxURYrfT5pljFRFitdPmmWMVEGK10+aZYxUQYbXS5pljFRBhtdLlmGMVD2G00OWXYhYPYbPQ5JdiFg9hs9DklmIWD2Gzz+OVYRYPYbPP45VhFg9hs8/jlWEWD2GzzeKUYBYOYbPN4pRgFg5hss3ilGAWDmGyzOGTXxYOYLLM4ZNfFg5gssvgkl8WDV+yy+CSXxYNX7HL35FeFg1fsMvfkV4WDV+wy9+RXhYNX7DL35FeFg1fsMvfkV4WDV+wy9+RXhYNX7DL35FeFAxesMvfkV0VC16wy9+RXRULXa/K3pBcFQtdr8rekFwVC12uyN2PWxULXK7I3Y9bFQtcrcjdjlsVC1ytyN2OWxULXK3I3Y5bFQtcrMfcjVoVC1usxtqMWhULW6zG2oxaFAtbrMbai1oUC1usxdqLWRQLWqzF2YtZFAtaq8TYilkUC1qrxNiKWRQLWavE2IlYFAtZq8TYiVgUC1mqw9eIWBQLWanD1ohYEwtZqcPWiFcTC1mow9WIVBMLWKPB04ZUFA==');
                            audio.volume = 0.6;
                            audio.play().catch(() => { });
                        } catch (e) { }
                        // Atualizar lista de chats
                        fetchChats();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Realtime para mensagens do chat selecionado
    useEffect(() => {
        if (!selectedChat?.id) return;

        const channel = supabase
            .channel(`admin-chat-${selectedChat.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `chat_id=eq.${selectedChat.id}`,
                },
                (payload) => {
                    const newMsg = payload.new as Message;
                    if (newMsg.sender_id !== userId) {
                        setMessages(prev => [...prev, newMsg]);
                        // Notificação sonora
                        try {
                            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleBALbLzO6JVhGBdft9DpmGQXE2C31OmaZhQPY7fU6JtkFBBkt9TomGQWE2O31OiaZRUQYbfT6JllFRFit9TomGQXE2O31OaZZBUQYrfT55ljFRFht9PmmWMVEWK30+aZYxURYrfT5pljFRFitdPmmWMVEGK10+aZYxUQYbXS5pljFRBhtdLlmGMVD2G00OWXYhYPYbPQ5JdiFg9hs9DklmIWD2Gzz+OVYRYPYbPP45VhFg9hs8/jlWEWD2GzzeKUYBYOYbPN4pRgFg5hss3ilGAWDmGyzOGTXxYOYLLM4ZNfFg5gssvgkl8WDV+yy+CSXxYNX7HL35FeFg1fsMvfkV4WDV+wy9+RXhYNX7DL35FeFg1fsMvfkV4WDV+wy9+RXhYNX7DL35FeFAxesMvfkV0VC16wy9+RXRULXa/K3pBcFQtdr8rekFwVC12uyN2PWxULXK7I3Y9bFQtcrcjdjlsVC1ytyN2OWxULXK3I3Y5bFQtcrMfcjVoVC1usxtqMWhULW6zG2oxaFAtbrMbai1oUC1usxdqLWRQLWqzF2YtZFAtaq8TYilkUC1qrxNiKWRQLWavE2IlYFAtZq8TYiVgUC1mqw9eIWBQLWanD1ohYEwtZqcPWiFcTC1mow9WIVBMLWKPB04ZUFA==');
                            audio.volume = 0.5;
                            audio.play().catch(() => { });
                        } catch (e) { }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedChat?.id, userId]);

    const fetchChats = async () => {
        try {
            const res = await fetch('/api/support-chat', { headers: getAuthHeaders() });
            const data = await res.json();
            setChats(data.chats || []);
            setUserId(data.userId || '');
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (chatId: string) => {
        try {
            const res = await fetch(`/api/support-chat?chat_id=${chatId}`, { headers: getAuthHeaders() });
            const data = await res.json();
            setMessages(data.messages || []);
        } catch (e) {
            console.error(e);
        }
    };

    const selectChat = async (chat: Chat) => {
        setSelectedChat(chat);
        await fetchMessages(chat.id);
    };

    const handleSendMessage = async () => {
        if (!newMessage || !selectedChat) return;

        const tempMessage = newMessage;
        setNewMessage('');
        setSending(true);

        // Optimistic update
        const optimisticMsg: Message = {
            id: 'temp-' + Date.now(),
            mensagem: tempMessage,
            sender_type: 'admin',
            sender_id: userId,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimisticMsg]);

        try {
            await fetch('/api/support-chat', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    action: 'send_message',
                    chat_id: selectedChat.id,
                    mensagem: tempMessage,
                }),
            });
            fetchChats();
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    const updateStatus = async (status: string) => {
        if (!selectedChat) return;

        try {
            await fetch('/api/support-chat', {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ chat_id: selectedChat.id, status }),
            });
            setSelectedChat({ ...selectedChat, status });
            fetchChats();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteChat = async (chatId: string) => {
        if (!confirm('Tem certeza que deseja excluir esta conversa? Esta ação não pode ser desfeita.')) return;

        try {
            // Primeiro excluir mensagens
            await supabase.from('chat_messages').delete().eq('chat_id', chatId);
            // Depois excluir o chat
            await supabase.from('support_chats').delete().eq('id', chatId);

            alert('✅ Conversa excluída!');
            setSelectedChat(null);
            setMessages([]);
            fetchChats();
        } catch (e) {
            console.error(e);
            alert('❌ Erro ao excluir conversa');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'aberto': return <Badge variant="primary"><Clock className="h-3 w-3 mr-1" /> Aberto</Badge>;
            case 'em_atendimento': return <Badge variant="warning"><MessageCircle className="h-3 w-3 mr-1" /> Em Atendimento</Badge>;
            case 'resolvido': return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" /> Resolvido</Badge>;
            case 'fechado': return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" /> Fechado</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    const openChats = chats.filter(c => c.status === 'aberto').length;
    const inProgressChats = chats.filter(c => c.status === 'em_atendimento').length;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <MessageCircle className="h-6 w-6 text-emerald-500" />
                    Central de Suporte
                </h1>
                <p className="text-gray-500">Gerencie todas as conversas de suporte em tempo real</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                    <CardContent className="py-3 px-4 text-center">
                        <Clock className="h-5 w-5 mx-auto mb-1 opacity-80" />
                        <p className="text-xl font-bold">{openChats}</p>
                        <p className="text-xs text-blue-100">Aguardando</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
                    <CardContent className="py-3 px-4 text-center">
                        <MessageCircle className="h-5 w-5 mx-auto mb-1 opacity-80" />
                        <p className="text-xl font-bold">{inProgressChats}</p>
                        <p className="text-xs text-amber-100">Em Atendimento</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
                    <CardContent className="py-3 px-4 text-center">
                        <CheckCircle className="h-5 w-5 mx-auto mb-1 opacity-80" />
                        <p className="text-xl font-bold">{chats.filter(c => c.status === 'resolvido').length}</p>
                        <p className="text-xs text-emerald-100">Resolvidos</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                    <CardContent className="py-3 px-4 text-center">
                        <Users className="h-5 w-5 mx-auto mb-1 opacity-80" />
                        <p className="text-xl font-bold">{chats.length}</p>
                        <p className="text-xs text-purple-100">Total</p>
                    </CardContent>
                </Card>
            </div>

            {/* Layout principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lista de chats */}
                <Card className="lg:col-span-1">
                    <CardContent className="p-4">
                        <h3 className="font-semibold mb-4">Conversas</h3>
                        {loading ? (
                            <div className="text-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                            </div>
                        ) : chats.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">Nenhuma conversa</p>
                        ) : (
                            <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                {chats.map(chat => (
                                    <button
                                        key={chat.id}
                                        onClick={() => selectChat(chat)}
                                        className={`w-full p-3 rounded-lg text-left transition ${selectedChat?.id === chat.id
                                            ? 'bg-emerald-50 border-2 border-emerald-500'
                                            : 'bg-gray-50 hover:bg-gray-100'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-gray-900 truncate">{chat.user?.nome || 'Usuário'}</span>
                                            {chat.unread_count > 0 && (
                                                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                                                    {chat.unread_count}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 truncate">{chat.assunto}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            {getStatusBadge(chat.status)}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Área do chat */}
                <Card className="lg:col-span-2">
                    <CardContent className="p-0 h-[600px] flex flex-col">
                        {selectedChat ? (
                            <>
                                {/* Header do chat */}
                                <div className="p-4 border-b bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold">{selectedChat.user?.nome || 'Usuário'}</h3>
                                            <p className="text-sm text-gray-500">{selectedChat.assunto}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {selectedChat.status !== 'resolvido' && (
                                                <Button size="sm" variant="outline" onClick={() => updateStatus('resolvido')}>
                                                    <CheckCircle className="h-4 w-4 mr-1" /> Resolver
                                                </Button>
                                            )}
                                            {selectedChat.status !== 'fechado' && (
                                                <Button size="sm" variant="ghost" onClick={() => updateStatus('fechado')}>
                                                    <XCircle className="h-4 w-4 mr-1" /> Fechar
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDeleteChat(selectedChat.id)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Mensagens */}
                                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                                    {messages.map(msg => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[70%] p-3 rounded-2xl ${msg.sender_type === 'admin'
                                                    ? 'bg-emerald-500 text-white rounded-br-md'
                                                    : 'bg-gray-100 text-gray-900 rounded-bl-md'
                                                    }`}
                                            >
                                                <p className="text-sm">{msg.mensagem}</p>
                                                <p className={`text-xs mt-1 ${msg.sender_type === 'admin' ? 'text-emerald-100' : 'text-gray-500'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <div className="border-t p-4 bg-gray-50">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Digite sua resposta..."
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-emerald-500"
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!newMessage || sending}
                                            className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center hover:bg-emerald-600 disabled:opacity-50"
                                        >
                                            <Send className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-500">
                                <div className="text-center">
                                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Selecione uma conversa</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
