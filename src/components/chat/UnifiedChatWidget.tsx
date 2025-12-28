'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Loader2, ChevronUp, Headphones, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

// Tipos
interface ChatOption {
    id: 'suporte' | 'sindico';
    label: string;
    icon: React.ReactNode;
    description: string;
    color: string;
    bgColor: string;
}

interface Message {
    id: string;
    mensagem: string;
    sender_type?: 'user' | 'admin';
    sender_id: string;
    sender_role?: string;
    created_at: string;
    lida?: boolean;
}

interface Chat {
    id: string;
    assunto?: string;
    categoria?: string;
    status: string;
    unread_count?: number;
    mensagens_nao_lidas_morador?: number;
}

export function UnifiedChatWidget() {
    const { session } = useAuth();
    const { profile, isSindico, isMorador, isPorteiro, isSuperAdmin, condoId } = useUser();
    const supabase = createClient();

    const [isOpen, setIsOpen] = useState(false);
    const [activeChat, setActiveChat] = useState<'suporte' | 'sindico' | null>(null);
    const [activeChatData, setActiveChatData] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [unreadSuport, setUnreadSuport] = useState(0);
    const [unreadSindico, setUnreadSindico] = useState(0);
    const [chatAtivo, setChatAtivo] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const userId = profile?.id || '';

    // Definir opções de chat baseado no role
    const chatOptions: ChatOption[] = [];

    // Suporte - apenas síndico e superadmin
    if (isSindico || isSuperAdmin) {
        chatOptions.push({
            id: 'suporte',
            label: 'Suporte',
            icon: <Headphones className="h-5 w-5" />,
            description: 'Falar com equipe de suporte',
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-500'
        });
    }

    // Chat Síndico - morador e porteiro (se ativo)
    if ((isMorador || isPorteiro) && chatAtivo) {
        chatOptions.push({
            id: 'sindico',
            label: 'Síndico',
            icon: <User className="h-5 w-5" />,
            description: 'Falar com o síndico',
            color: 'text-blue-600',
            bgColor: 'bg-blue-500'
        });
    }

    // Verificar se chat síndico está ativo para o condomínio
    useEffect(() => {
        if (condoId && (isMorador || isPorteiro)) {
            fetch(`/api/plan-features?condoId=${condoId}`)
                .then(res => res.json())
                .then(data => setChatAtivo(data.hasChatSindico))
                .catch(() => setChatAtivo(false));
        }
    }, [condoId, isMorador, isPorteiro]);

    // Buscar contagem de não lidas
    useEffect(() => {
        if (session?.access_token) {
            fetchUnreadCounts();
            const interval = setInterval(fetchUnreadCounts, 30000);

            // Realtime
            const channel = supabase
                .channel('unified-chat-realtime')
                .on('postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'chat_messages' },
                    () => fetchUnreadCounts()
                )
                .on('postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'chat_sindico_mensagens' },
                    (payload) => {
                        fetchUnreadCounts();
                        if (activeChat === 'sindico' && activeChatData) {
                            fetchMessages();
                        }
                    }
                )
                .subscribe();

            return () => {
                clearInterval(interval);
                supabase.removeChannel(channel);
            };
        }
    }, [session, activeChat, activeChatData]);

    const fetchUnreadCounts = async () => {
        try {
            // Suporte
            if (isSindico || isSuperAdmin) {
                const res = await fetch('/api/support-chat', {
                    headers: { 'Authorization': `Bearer ${session?.access_token}` }
                });
                const data = await res.json();
                if (data.chats) {
                    setUnreadSuport(data.chats.reduce((sum: number, c: Chat) => sum + (c.unread_count || 0), 0));
                }
            }

            // Chat Síndico
            if ((isMorador || isPorteiro) && chatAtivo) {
                const res = await fetch('/api/chat-sindico', {
                    headers: { 'Authorization': `Bearer ${session?.access_token}` }
                });
                const data = await res.json();
                if (data.conversas) {
                    setUnreadSindico(data.conversas.reduce((sum: number, c: Chat) =>
                        sum + (c.mensagens_nao_lidas_morador || 0), 0));
                }
            }
        } catch (e) {
            console.error('Erro ao buscar não lidas:', e);
        }
    };

    const fetchMessages = async (showLoading = true) => {
        if (!activeChatData) return;
        if (showLoading) setLoading(true);
        try {
            const endpoint = activeChat === 'suporte'
                ? `/api/support-chat?chat_id=${activeChatData.id}`
                : `/api/chat-sindico?conversa_id=${activeChatData.id}`;

            const res = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            const data = await res.json();
            setMessages(data.messages || data.mensagens || []);
        } catch (e) {
            console.error('Erro ao buscar mensagens:', e);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || sending) return;

        const tempMessage = newMessage;
        setNewMessage('');
        setSending(true);

        try {
            const endpoint = activeChat === 'suporte' ? '/api/support-chat' : '/api/chat-sindico';

            let body;
            if (!activeChatData) {
                // Criar nova conversa se não existir
                body = activeChat === 'suporte'
                    ? { action: 'create_chat', assunto: 'Suporte Geral', mensagem: tempMessage }
                    : { action: 'nova_conversa', assunto: 'Contato Morador', mensagem: tempMessage };
            } else {
                body = activeChat === 'suporte'
                    ? { action: 'send_message', chat_id: activeChatData.id, mensagem: tempMessage }
                    : { action: 'enviar_mensagem', conversa_id: activeChatData.id, mensagem: tempMessage };
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                const data = await res.json();
                if (!activeChatData) {
                    const newChat = data.chat || data.conversa;
                    if (newChat) {
                        setActiveChatData(newChat);
                    }
                } else {
                    fetchMessages(false); // Não mostrar loading global ao enviar mensagem em chat aberto
                }
            } else {
                const errorData = await res.json();
                console.error('Erro ao enviar mensagem:', errorData.error);
                setNewMessage(tempMessage); // Devolve a mensagem em caso de erro
            }
        } catch (e) {
            console.error('Erro ao enviar:', e);
            setNewMessage(tempMessage); // Devolve a mensagem em caso de erro
        } finally {
            setSending(false);
        }
    };

    const handleSelectChatType = async (type: 'suporte' | 'sindico') => {
        setActiveChat(type);
        setLoading(true);

        try {
            const endpoint = type === 'suporte' ? '/api/support-chat' : '/api/chat-sindico';
            const res = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            const data = await res.json();

            const chats = data.chats || data.conversas || [];
            if (chats.length > 0) {
                setActiveChatData(chats[0]);
                // Se já temos chat, buscar mensagens sem mostrar spinner global depois
                // fetchMessages() já é chamado pelo useEffect [activeChatData]
            } else {
                setActiveChatData(null);
                setMessages([]);
                setLoading(false);
            }
        } catch (e) {
            console.error('Erro:', e);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeChatData) {
            fetchMessages();
        }
    }, [activeChatData]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Não mostrar se não tem opções
    if (chatOptions.length === 0) return null;

    const totalUnread = unreadSuport + unreadSindico;
    const currentOption = chatOptions.find(o => o.id === activeChat);

    return (
        <>
            {/* Botão Flutuante Fixo */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "fixed bottom-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-full shadow-xl transition-all duration-300",
                    isOpen ? "bg-gray-700" : "bg-emerald-600 hover:bg-emerald-700"
                )}
            >
                {isOpen ? (
                    <X className="h-5 w-5 text-white" />
                ) : (
                    <>
                        <MessageSquare className="h-5 w-5 text-white" />
                        <span className="text-white font-medium text-sm hidden sm:inline">Precisa de ajuda?</span>
                        {totalUnread > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                {totalUnread > 9 ? '9+' : totalUnread}
                            </span>
                        )}
                    </>
                )}
            </button>

            {/* Painel de Chat */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-[100] w-[340px] bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className={cn(
                        "px-4 py-3 text-white",
                        activeChat ? currentOption?.bgColor : "bg-gradient-to-r from-emerald-600 to-emerald-500"
                    )}>
                        <div className="flex items-center justify-between">
                            {activeChat ? (
                                <button
                                    onClick={() => { setActiveChat(null); setActiveChatData(null); setMessages([]); }}
                                    className="flex items-center gap-2 hover:opacity-80"
                                >
                                    <ChevronUp className="h-4 w-4 -rotate-90" />
                                    <span className="font-semibold">{currentOption?.label}</span>
                                </button>
                            ) : (
                                <h3 className="font-semibold">Como podemos ajudar?</h3>
                            )}
                            <button onClick={() => setIsOpen(false)} className="hover:opacity-80">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="h-[380px] flex flex-col">
                        {!activeChat ? (
                            /* Menu de Opções */
                            <div className="flex-1 p-4 space-y-3">
                                {chatOptions.map(option => (
                                    <button
                                        key={option.id}
                                        onClick={() => handleSelectChatType(option.id)}
                                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all text-left"
                                    >
                                        <div className={cn("p-3 rounded-full", option.bgColor)}>
                                            <span className="text-white">{option.icon}</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold text-gray-800">{option.label}</h4>
                                                {(option.id === 'suporte' ? unreadSuport : unreadSindico) > 0 && (
                                                    <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                                                        {option.id === 'suporte' ? unreadSuport : unreadSindico}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500">{option.description}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            /* Chat Ativo */
                            <>
                                <div className="flex-1 p-3 overflow-y-auto bg-gray-50 space-y-2">
                                    {loading ? (
                                        <div className="flex items-center justify-center h-full">
                                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                            Envie uma mensagem para começar
                                        </div>
                                    ) : (
                                        messages.map(msg => {
                                            const isMe = msg.sender_id === userId || msg.sender_type === 'user';
                                            return (
                                                <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                                                    <div className={cn(
                                                        "max-w-[80%] px-3 py-2 rounded-2xl text-sm",
                                                        isMe
                                                            ? `${currentOption?.bgColor} text-white rounded-br-none`
                                                            : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"
                                                    )}>
                                                        <p className="whitespace-pre-wrap">{msg.mensagem}</p>
                                                        <span className={cn(
                                                            "text-[10px] float-right mt-1",
                                                            isMe ? "text-white/70" : "text-gray-400"
                                                        )}>
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <div className="p-3 border-t bg-white">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Digite sua mensagem..."
                                            className="flex-1 px-3 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!newMessage.trim() || sending}
                                            className={cn(
                                                "p-2 rounded-full transition-colors",
                                                newMessage.trim()
                                                    ? `${currentOption?.bgColor} text-white`
                                                    : "bg-gray-200 text-gray-400"
                                            )}
                                        >
                                            {sending ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Send className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
