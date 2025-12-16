'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, ArrowLeft, XCircle } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

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
}

export function ChatWidget() {
    const { session } = useAuth();
    const supabase = createClient();
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<'list' | 'chat' | 'new'>('list');
    const [chats, setChats] = useState<Chat[]>([]);
    const [currentChat, setCurrentChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [newSubject, setNewSubject] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [userId, setUserId] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
    });

    useEffect(() => {
        if (session?.access_token && isOpen) {
            fetchChats();
        }
    }, [session, isOpen]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Realtime subscription
    useEffect(() => {
        if (!currentChat?.id) return;

        const channel = supabase
            .channel(`chat-${currentChat.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `chat_id=eq.${currentChat.id}`,
                },
                (payload) => {
                    const newMsg = payload.new as Message;
                    if (newMsg.sender_id !== userId) {
                        setMessages(prev => [...prev, newMsg]);
                        // Tocar som de notificação
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
    }, [currentChat?.id, userId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchChats = async () => {
        setLoading(true);
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

    const openChat = async (chat: Chat) => {
        setCurrentChat(chat);
        setView('chat');
        await fetchMessages(chat.id);
    };

    const handleCreateChat = async () => {
        if (!newSubject || !newMessage) return;

        setSending(true);
        try {
            const res = await fetch('/api/support-chat', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    action: 'create_chat',
                    assunto: newSubject,
                    mensagem: newMessage,
                }),
            });

            const data = await res.json();
            if (data.success) {
                setNewSubject('');
                setNewMessage('');
                await fetchChats();
                openChat(data.chat);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage || !currentChat) return;

        const tempMessage = newMessage;
        setNewMessage('');
        setSending(true);

        // Optimistic update
        const optimisticMsg: Message = {
            id: 'temp-' + Date.now(),
            mensagem: tempMessage,
            sender_type: 'user',
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
                    chat_id: currentChat.id,
                    mensagem: tempMessage,
                }),
            });
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    const handleCloseChat = async () => {
        if (!currentChat) return;
        if (!confirm('Encerrar esta conversa?')) return;

        try {
            await fetch('/api/support-chat', {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    chat_id: currentChat.id,
                    status: 'fechado',
                }),
            });
            setCurrentChat({ ...currentChat, status: 'fechado' });
            fetchChats();
            alert('✅ Conversa encerrada!');
            setView('list');
            setCurrentChat(null);
        } catch (e) {
            console.error(e);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'aberto': return 'bg-blue-100 text-blue-700';
            case 'em_atendimento': return 'bg-amber-100 text-amber-700';
            case 'resolvido': return 'bg-emerald-100 text-emerald-700';
            case 'fechado': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const totalUnread = chats.reduce((sum, c) => sum + c.unread_count, 0);

    return (
        <>
            {/* Botão flutuante */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 ${isOpen ? 'bg-gray-600' : 'bg-emerald-500'
                    }`}
            >
                {isOpen ? (
                    <X className="h-6 w-6 text-white" />
                ) : (
                    <>
                        <MessageCircle className="h-6 w-6 text-white" />
                        {totalUnread > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                {totalUnread}
                            </span>
                        )}
                    </>
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-96 h-[500px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 text-white flex items-center gap-3">
                        {view !== 'list' && (
                            <button onClick={() => { setView('list'); setCurrentChat(null); }} className="hover:bg-white/20 p-1 rounded">
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                        )}
                        <div className="flex-1">
                            <h3 className="font-bold">
                                {view === 'list' && 'Suporte'}
                                {view === 'new' && 'Nova Conversa'}
                                {view === 'chat' && currentChat?.assunto}
                            </h3>
                            {view === 'list' && <p className="text-sm text-emerald-100">Como podemos ajudar?</p>}
                        </div>
                        {view === 'chat' && currentChat?.status !== 'fechado' && (
                            <button
                                onClick={handleCloseChat}
                                className="hover:bg-white/20 p-1 rounded text-white/80 hover:text-white"
                                title="Encerrar conversa"
                            >
                                <XCircle className="h-5 w-5" />
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto">
                        {view === 'list' && (
                            <div className="p-4">
                                <Button onClick={() => setView('new')} className="w-full mb-4">
                                    Nova Conversa
                                </Button>

                                {loading ? (
                                    <div className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                                    </div>
                                ) : chats.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">Nenhuma conversa ainda</p>
                                ) : (
                                    <div className="space-y-2">
                                        {chats.map(chat => (
                                            <button
                                                key={chat.id}
                                                onClick={() => openChat(chat)}
                                                className="w-full p-3 bg-gray-50 rounded-lg text-left hover:bg-gray-100 transition"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-gray-900 truncate">{chat.assunto}</span>
                                                    {chat.unread_count > 0 && (
                                                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                                            {chat.unread_count}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(chat.status)}`}>
                                                        {chat.status === 'aberto' && 'Aberto'}
                                                        {chat.status === 'em_atendimento' && 'Em Atendimento'}
                                                        {chat.status === 'resolvido' && 'Resolvido'}
                                                        {chat.status === 'fechado' && 'Fechado'}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(chat.created_at).toLocaleDateString('pt-BR')}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {view === 'new' && (
                            <div className="p-4 space-y-4">
                                <Input
                                    label="Assunto"
                                    value={newSubject}
                                    onChange={(e) => setNewSubject(e.target.value)}
                                    placeholder="Ex: Dúvida sobre cobranças"
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
                                    <textarea
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Descreva sua dúvida ou problema..."
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <Button onClick={handleCreateChat} loading={sending} className="w-full">
                                    Iniciar Conversa
                                </Button>
                            </div>
                        )}

                        {view === 'chat' && (
                            <div className="flex flex-col h-full">
                                <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                                    {messages.map(msg => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[80%] p-3 rounded-2xl ${msg.sender_type === 'user'
                                                    ? 'bg-emerald-500 text-white rounded-br-md'
                                                    : 'bg-gray-100 text-gray-900 rounded-bl-md'
                                                    }`}
                                            >
                                                {msg.sender_type === 'admin' && (
                                                    <p className="text-xs font-medium text-emerald-600 mb-1">Suporte</p>
                                                )}
                                                <p className="text-sm">{msg.mensagem}</p>
                                                <p className={`text-xs mt-1 ${msg.sender_type === 'user' ? 'text-emerald-100' : 'text-gray-500'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input de mensagem (apenas na view chat) */}
                    {view === 'chat' && (
                        <div className="border-t p-3 bg-gray-50">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Digite sua mensagem..."
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                    )}
                </div>
            )}
        </>
    );
}
