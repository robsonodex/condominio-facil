'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import {
    MessageCircle, Send, CheckCircle, Clock, XCircle,
    Users, Loader2, Trash2, Search, MoreVertical,
    FileText, AlertCircle, Filter, ChevronLeft
} from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';

interface Message {
    id: string;
    mensagem: string;
    sender_type: 'user' | 'admin';
    sender_id: string;
    created_at: string;
    sender?: { nome: string };
    attachment_url?: string;
    attachment_type?: string;
}

interface Chat {
    id: string;
    assunto: string;
    status: string;
    created_at: string;
    unread_count: number;
    user?: { nome: string; email: string; avatar_url?: string };
    atendente?: { nome: string };
    ultima_mensagem_at?: string;
}

export default function AdminSuportePage() {
    const { session } = useAuth();
    const supabase = useMemo(() => createClient(), []);

    const [chats, setChats] = useState<Chat[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

    // UI States
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'aberto' | 'em_atendimento' | 'resolvido'>('all');
    const [newMessage, setNewMessage] = useState('');
    const [userId, setUserId] = useState<string>('');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeChat = useMemo(() =>
        chats.find(c => c.id === selectedChatId),
        [chats, selectedChatId]);

    const filteredChats = useMemo(() => {
        return chats.filter(chat => {
            const matchesSearch = !searchTerm ||
                chat.user?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                chat.assunto.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = filterStatus === 'all' || chat.status === filterStatus;

            return matchesSearch && matchesStatus;
        });
    }, [chats, searchTerm, filterStatus]);

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
        if (selectedChatId) {
            fetchMessages(selectedChatId);
        }
    }, [selectedChatId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Realtime Setup
    useEffect(() => {
        const channel = supabase
            .channel('admin-chats-global')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'support_chats' },
                () => fetchChats()
            )
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' },
                (payload) => {
                    const newMsg = payload.new as any;
                    if (newMsg.sender_type === 'user') {
                        playNotificationSound();
                        fetchChats();
                        if (selectedChatId === newMsg.chat_id) {
                            fetchMessages(selectedChatId);
                        }
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [selectedChatId]);

    const playNotificationSound = () => {
        try {
            const audio = new Audio('/notification.mp3'); // Fallback or use base64 if needed
            audio.play().catch(() => { });
        } catch (e) { }
    };

    const fetchChats = async () => {
        try {
            const res = await fetch('/api/support-chat', { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.chats) {
                setChats(data.chats);
                setUserId(data.userId);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (chatId: string) => {
        setLoadingMessages(true);
        try {
            const res = await fetch(`/api/support-chat?chat_id=${chatId}`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.messages) setMessages(data.messages);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || !selectedChatId || sending) return;

        const tempMsg = newMessage;
        setNewMessage('');
        setSending(true);

        try {
            await fetch('/api/support-chat', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    action: 'send_message',
                    chat_id: selectedChatId,
                    mensagem: tempMsg,
                }),
            });
            fetchMessages(selectedChatId);
            fetchChats(); // Update timestamp order
        } catch (e) {
            console.error(e);
            setNewMessage(tempMsg); // Restore on error
        } finally {
            setSending(false);
        }
    };

    const updateStatus = async (status: string) => {
        if (!selectedChatId) return;
        try {
            await fetch('/api/support-chat', {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ chat_id: selectedChatId, status }),
            });
            fetchChats();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteChat = async () => {
        if (!selectedChatId) return;
        if (!confirm('Tem certeza que deseja excluir esta conversa? Ela será removida da sua visualização.')) return;

        try {
            const res = await fetch(`/api/support-chat?chat_id=${selectedChatId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            if (res.ok) {
                setChats(prev => prev.filter(c => c.id !== selectedChatId));
                setSelectedChatId(null);
                setMessages([]);
            } else {
                alert('Erro ao excluir conversa');
            }
        } catch (e) {
            console.error(e);
            alert('Erro ao excluir conversa');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'aberto': return <Badge className="bg-blue-500 hover:bg-blue-600">Aberto</Badge>;
            case 'em_atendimento': return <Badge className="bg-amber-500 hover:bg-amber-600">Em Atendimento</Badge>;
            case 'resolvido': return <Badge className="bg-emerald-500 hover:bg-emerald-600">Resolvido</Badge>;
            case 'fechado': return <Badge variant="secondary">Fechado</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] bg-gray-50/50">
            {/* Header / Stats */}
            <div className="mb-6 px-1">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-1">
                    Central de Suporte Premium
                </h1>
                <p className="text-gray-500 text-sm mb-6">Painel exclusivo para atendimento VIP aos usuários</p>

                <div className="grid grid-cols-4 gap-4">
                    <Card className="bg-white border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Aguardando</p>
                                <h3 className="text-2xl font-bold text-blue-600">{chats.filter(c => c.status === 'aberto').length}</h3>
                            </div>
                            <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center">
                                <Clock className="h-5 w-5 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-amber-100 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Em Atendimento</p>
                                <h3 className="text-2xl font-bold text-amber-600">{chats.filter(c => c.status === 'em_atendimento').length}</h3>
                            </div>
                            <div className="h-10 w-10 bg-amber-50 rounded-full flex items-center justify-center">
                                <MessageCircle className="h-5 w-5 text-amber-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Resolvidos</p>
                                <h3 className="text-2xl font-bold text-emerald-600">{chats.filter(c => c.status === 'resolvido').length}</h3>
                            </div>
                            <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 text-emerald-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-purple-100 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total</p>
                                <h3 className="text-2xl font-bold text-purple-600">{chats.length}</h3>
                            </div>
                            <div className="h-10 w-10 bg-purple-50 rounded-full flex items-center justify-center">
                                <Users className="h-5 w-5 text-purple-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-h-0 container mx-auto p-0">
                <Card className="h-full flex overflow-hidden border-0 shadow-lg ring-1 ring-black/5 bg-white">
                    {/* Sidebar */}
                    <div className={cn(
                        "w-full md:w-80 lg:w-96 flex flex-col border-r bg-gray-50/50",
                        selectedChatId ? "hidden md:flex" : "flex"
                    )}>
                        {/* Search & Filter */}
                        <div className="p-4 space-y-4 border-b bg-white">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Buscar conversa..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 bg-gray-50"
                                />
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {['all', 'aberto', 'em_atendimento', 'resolvido'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status as any)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                                            filterStatus === status
                                                ? "bg-gray-900 text-white"
                                                : "bg-white border hover:bg-gray-100 text-gray-600"
                                        )}
                                    >
                                        {status === 'all' ? 'Todos' : status === 'em_atendimento' ? 'Atendimento' : status.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Chat List */}
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center py-8 text-gray-400">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : filteredChats.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    <p>Nenhuma conversa encontrada</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {filteredChats.map((chat) => (
                                        <button
                                            key={chat.id}
                                            onClick={() => setSelectedChatId(chat.id)}
                                            className={cn(
                                                "w-full p-4 flex items-start gap-3 hover:bg-white transition-colors text-left",
                                                selectedChatId === chat.id ? "bg-white shadow-[inset_3px_0_0_0_#22c55e]" : "transparent"
                                            )}
                                        >
                                            <Avatar className="h-10 w-10 border">
                                                <AvatarFallback className="bg-emerald-100 text-emerald-700 font-medium">
                                                    {chat.user?.nome?.charAt(0).toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={cn(
                                                        "font-medium truncate",
                                                        selectedChatId === chat.id ? "text-gray-900" : "text-gray-700"
                                                    )}>
                                                        {chat.user?.nome || 'Usuário'}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {chat.ultima_mensagem_at ? formatDateTime(chat.ultima_mensagem_at).split(' ')[0] : ''}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 truncate mb-2">{chat.assunto}</p>
                                                <div className="flex items-center justify-between">
                                                    {getStatusBadge(chat.status)}
                                                    {chat.unread_count > 0 && (
                                                        <Badge variant="destructive" className="h-5 min-w-5 px-1.5 flex items-center justify-center">
                                                            {chat.unread_count}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    {activeChat ? (
                        <div className={cn(
                            "flex-1 flex flex-col bg-white w-full",
                            !selectedChatId ? "hidden md:flex" : "flex"
                        )}>
                            {/* Chat Header */}
                            <div className="h-16 border-b flex items-center justify-between px-6 bg-white shrink-0">
                                <div className="flex items-center gap-4">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="md:hidden"
                                        onClick={() => setSelectedChatId(null)}
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </Button>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarFallback className="bg-emerald-600 text-white">
                                                {activeChat.user?.nome?.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{activeChat.user?.nome}</h3>
                                            <p className="text-xs text-gray-500 flex items-center gap-2">
                                                {activeChat.user?.email}
                                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                Assunto: {activeChat.assunto}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {activeChat.status !== 'resolvido' && (
                                        <Button size="sm" onClick={() => updateStatus('resolvido')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Resolver
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={handleDeleteChat}
                                        title="Excluir Conversa"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
                                {loadingMessages ? (
                                    <div className="flex items-center justify-center h-full text-gray-400">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const isAdmin = msg.sender_type === 'admin';
                                        return (
                                            <div key={msg.id} className={cn("flex w-full", isAdmin ? "justify-end" : "justify-start")}>
                                                <div className={cn(
                                                    "max-w-[70%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed",
                                                    isAdmin
                                                        ? "bg-emerald-600 text-white rounded-br-none"
                                                        : "bg-white border rounded-bl-none text-gray-700"
                                                )}>
                                                    <p>{msg.mensagem}</p>
                                                    <div className={cn(
                                                        "flex items-center gap-1 mt-2 text-[10px]",
                                                        isAdmin ? "text-emerald-100 justify-end" : "text-gray-400"
                                                    )}>
                                                        {formatDateTime(msg.created_at)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 border-t bg-white shrink-0">
                                <form
                                    onSubmit={handleSendMessage}
                                    className="flex items-center gap-3 max-w-4xl mx-auto bg-gray-50 p-2 rounded-full border focus-within:ring-2 focus-within:ring-emerald-200 focus-within:border-emerald-300 transition-all"
                                >
                                    <Input
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Digite sua resposta..."
                                        className="flex-1 border-0 bg-transparent focus-visible:ring-0 px-4 h-10 shadow-none"
                                        disabled={sending}
                                    />
                                    <Button
                                        type="submit"
                                        size="icon"
                                        className="h-9 w-9 rounded-full bg-emerald-600 hover:bg-emerald-700 transition-all shrink-0"
                                        disabled={!newMessage.trim() || sending}
                                    >
                                        <Send className="h-4 w-4 text-white" />
                                    </Button>
                                </form>
                            </div>
                        </div>
                    ) : (
                        <div className="hidden md:flex flex-1 items-center justify-center flex-col text-gray-400 bg-gray-50/30">
                            <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <MessageCircle className="h-10 w-10 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">Selecione uma conversa</h3>
                            <p className="max-w-xs text-center text-sm">Escolha uma conversa da lista ao lado para ver detalhes e responder</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
