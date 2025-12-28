'use client';

import { useState, useEffect, useRef } from 'react';
import {
    MessageSquare,
    X,
    Send,
    Loader2,
    ChevronUp,
    ChevronDown,
    MoreHorizontal,
    Paperclip,
    Image as ImageIcon,
    FileText,
    Search,
    Edit,
    CheckCheck,
    Minimize2,
    Square
} from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

// --- Types ---
interface Message {
    id: string;
    mensagem: string;
    sender_type: 'user' | 'admin';
    sender_id: string;
    created_at: string;
    attachment_url?: string;
    attachment_type?: string;
}

interface Chat {
    id: string;
    assunto: string;
    status: string;
    created_at: string;
    unread_count: number;
    last_message?: string;
}

// --- LinkedInChat Component ---
export function LinkedInChat() {
    const { session, profile } = useAuth();
    const supabase = createClient();
    const [isListExpanded, setIsListExpanded] = useState(false);
    const [isHidden, setIsHidden] = useState(false); // Estado para ocultar completamente
    const [chats, setChats] = useState<Chat[]>([]);
    const [activeChat, setActiveChat] = useState<Chat | null>(null);
    const [showNewChat, setShowNewChat] = useState(false);
    const [loading, setLoading] = useState(false);
    const [totalUnread, setTotalUnread] = useState(0);

    // Esconder chat de suporte para morador, inquilino e porteiro (só síndico e admin veem)
    const userRole = profile?.role || '';
    const shouldHideForRole = ['morador', 'inquilino', 'porteiro'].includes(userRole);

    // Initial load
    useEffect(() => {
        if (session?.access_token && !shouldHideForRole) {
            fetchChats();
        }
    }, [session, shouldHideForRole]);

    const fetchChats = async () => {
        try {
            const res = await fetch('/api/support-chat', {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                }
            });
            const data = await res.json();
            if (data.chats) {
                setChats(data.chats);
                setTotalUnread(data.chats.reduce((sum: number, c: Chat) => sum + (c.unread_count || 0), 0));
            }
        } catch (e) {
            console.error('Error fetching chats:', e);
        }
    };

    const handleOpenChat = (chat: Chat) => {
        setActiveChat(chat);
        setIsListExpanded(true);
        setShowNewChat(false);
    };

    // Esconder completamente para morador, inquilino e porteiro
    if (shouldHideForRole) {
        return null;
    }

    // Quando oculto, mostra apenas ícone flutuante
    if (isHidden) {
        return (
            <div className="fixed bottom-4 right-80 z-[100] pointer-events-auto">
                <button
                    onClick={() => setIsHidden(false)}
                    className="relative w-12 h-12 bg-emerald-600 rounded-full shadow-lg hover:bg-emerald-700 transition-colors flex items-center justify-center"
                    title="Abrir mensagens"
                >
                    <MessageSquare className="h-5 w-5 text-white" />
                    {totalUnread > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                            {totalUnread > 9 ? '9+' : totalUnread}
                        </span>
                    )}
                </button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-0 right-80 z-[100] flex items-end gap-3 pointer-events-none">
            {/* Chat List Window */}
            <div className={cn(
                "w-[280px] bg-white border border-gray-200 shadow-xl rounded-t-xl transition-all duration-300 pointer-events-auto",
                isListExpanded ? "h-[460px]" : "h-12"
            )}>
                {/* Bar Header - Barra Verde */}
                <button
                    onClick={() => setIsListExpanded(!isListExpanded)}
                    className="w-full flex items-center justify-between px-4 h-12 bg-emerald-600 rounded-t-xl hover:bg-emerald-700 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-white" />
                        <span className="font-medium text-white text-sm">Suporte</span>
                        {totalUnread > 0 && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                {totalUnread > 9 ? '9+' : totalUnread}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-white">
                        <Edit
                            className="h-4 w-4 hover:text-emerald-200 cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsListExpanded(true);
                                setShowNewChat(true);
                                setActiveChat(null);
                            }}
                        />
                        <span title="Ocultar chat">
                            <X
                                className="h-4 w-4 hover:text-red-300 cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsHidden(true);
                                    setActiveChat(null);
                                }}
                            />
                        </span>
                        {isListExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                    </div>
                </button>

                {/* List Content */}
                {isListExpanded && (
                    <div className="flex flex-col h-[calc(460px-48px)]">
                        {/* Search (LinkedIn style sub-header) */}
                        <div className="p-3 border-b border-gray-100">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Pesquisar mensagens"
                                    className="w-full pl-9 pr-3 py-1.5 bg-gray-100 border-none rounded-md text-xs focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {showNewChat ? (
                                <NewChatView
                                    onChatCreated={(chat) => {
                                        fetchChats();
                                        handleOpenChat(chat);
                                    }}
                                    onCancel={() => setShowNewChat(false)}
                                />
                            ) : chats.length > 0 ? (
                                chats.map(chat => (
                                    <button
                                        key={chat.id}
                                        onClick={() => handleOpenChat(chat)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0",
                                            activeChat?.id === chat.id && "bg-emerald-50 hover:bg-emerald-100"
                                        )}
                                    >
                                        <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center font-bold text-gray-500">
                                            {chat.assunto.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <h4 className="font-semibold text-gray-800 text-sm truncate">{chat.assunto}</h4>
                                                <span className="text-[10px] text-gray-400">
                                                    {new Date(chat.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 truncate line-clamp-1">
                                                {chat.last_message || "Sem mensagens ainda..."}
                                            </p>
                                        </div>
                                        {chat.unread_count > 0 && (
                                            <div className="w-2 h-2 rounded-full bg-red-500" />
                                        )}
                                    </button>
                                ))
                            ) : (
                                <div className="p-8 text-center">
                                    <p className="text-sm text-gray-500">Nenhuma conversa encontrada.</p>
                                    <Button
                                        variant="outline"
                                        className="text-emerald-600 mt-2"
                                        onClick={() => setShowNewChat(true)}
                                    >
                                        Iniciar suporte
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Active Chat Window (LinkedIn Floating Window) */}
            {activeChat && (
                <ChatWindow
                    chat={activeChat}
                    userId={profile?.id || ''}
                    onClose={() => setActiveChat(null)}
                />
            )}
        </div>
    );
}

// --- Sub-Components ---

function NewChatView({ onChatCreated, onCancel }: { onChatCreated: (chat: Chat) => void, onCancel: () => void }) {
    const { session } = useAuth();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!subject || !message) return;
        setLoading(true);
        try {
            const res = await fetch('/api/support-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({
                    action: 'create_chat',
                    assunto: subject,
                    mensagem: message,
                }),
            });
            const data = await res.json();
            if (data.success) {
                onChatCreated(data.chat);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 space-y-4 animate-in fade-in duration-300">
            <h3 className="font-semibold text-gray-700">Novo Suporte</h3>
            <Input
                placeholder="Sobre o que você precisa de ajuda?"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="text-xs"
            />
            <textarea
                placeholder="Descreva seu problema..."
                className="w-full p-2 text-xs border border-gray-200 rounded-md h-32 focus:ring-1 focus:ring-emerald-500"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
            />
            <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={onCancel}>Cancelar</Button>
                <Button size="sm" className="flex-1 text-xs" onClick={handleCreate} disabled={loading}>
                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Começar'}
                </Button>
            </div>
        </div>
    );
}

function ChatWindow({ chat, userId, onClose }: { chat: Chat, userId: string, onClose: () => void }) {
    const { session } = useAuth();
    const supabase = createClient();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchMessages();
        const channel = subscribeToRealtime();
        return () => {
            supabase.removeChannel(channel);
        };
    }, [chat.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/support-chat?chat_id=${chat.id}`, {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            const data = await res.json();
            if (data.messages) setMessages(data.messages);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const subscribeToRealtime = () => {
        return supabase
            .channel(`chat-${chat.id}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `chat_id=eq.${chat.id}` },
                (payload) => {
                    const newMsg = payload.new as Message;
                    if (newMsg.sender_id !== userId) {
                        setMessages(prev => [...prev, newMsg]);
                        // Notification sound here if needed
                    }
                }
            )
            .subscribe();
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || sending) return;

        const tempMessage = newMessage;
        setNewMessage('');
        setSending(true);

        // Optimistic update
        const optMsg: Message = {
            id: 'temp-' + Date.now(),
            mensagem: tempMessage,
            sender_type: 'user',
            sender_id: userId,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, optMsg]);

        try {
            await fetch('/api/support-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({
                    action: 'send_message',
                    chat_id: chat.id,
                    mensagem: tempMessage,
                }),
            });
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className={cn(
            "w-[330px] bg-white border border-gray-200 shadow-2xl rounded-t-xl overflow-hidden flex flex-col transition-all pointer-events-auto",
            isMinimized ? "h-12" : "h-[450px]"
        )}>
            {/* Header */}
            <div className="px-3 h-12 border-b flex items-center justify-between bg-emerald-600 text-white shrink-0">
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex-shrink-0 flex items-center justify-center font-bold text-xs ring-1 ring-white/30">
                        {chat.assunto.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-semibold text-xs truncate leading-tight">{chat.assunto}</h4>
                        <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span className="text-[10px] text-emerald-100">Suporte Online</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="hover:bg-white/20 p-1 rounded transition-colors"
                    >
                        {isMinimized ? <ChevronUp className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                    </button>
                    <button
                        onClick={onClose}
                        className="hover:bg-white/20 p-1 rounded transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Content */}
            {!isMinimized && (
                <>
                    <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar bg-gray-50/50">
                        {loading && messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                            </div>
                        ) : (
                            messages.map((msg, i) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.sender_type === 'admin' && (
                                        <div className="w-6 h-6 rounded-full bg-gray-200 flex-shrink-0 mr-1.5 flex items-center justify-center text-[10px] font-bold self-end mb-1">
                                            S
                                        </div>
                                    )}
                                    <div
                                        className={cn(
                                            "max-w-[75%] p-2.5 rounded-2xl text-xs break-words shadow-sm",
                                            msg.sender_type === 'user'
                                                ? 'bg-emerald-600 text-white rounded-br-none'
                                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                                        )}
                                    >
                                        <p className="whitespace-pre-wrap">{msg.mensagem}</p>
                                        <div className={cn(
                                            "flex items-center justify-end gap-1 mt-1 text-[9px]",
                                            msg.sender_type === 'user' ? 'text-emerald-100' : 'text-gray-400'
                                        )}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {msg.sender_type === 'user' && <CheckCheck className="h-2.5 w-2.5" />}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Footer / Input */}
                    <div className="p-3 bg-white border-t border-gray-100">
                        <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-2 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
                            <button className="text-gray-400 hover:text-emerald-600 p-1 transition-colors">
                                <Paperclip className="h-4 w-4" />
                            </button>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Enviar mensagem..."
                                className="flex-1 bg-transparent border-none py-2 text-xs focus:ring-0"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim() || sending}
                                className="text-emerald-600 hover:text-emerald-700 p-1 disabled:text-gray-300 transition-all"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
