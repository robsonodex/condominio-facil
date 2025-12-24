'use client';

import { useEffect, useState, useRef } from 'react';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
    MessageCircle, Send, ChevronUp, ChevronDown, Home, Phone,
    Check, CheckCheck, Archive, Search, X
} from 'lucide-react';

interface Conversa {
    id: string;
    categoria: string;
    assunto: string;
    status: string;
    mensagens_nao_lidas_sindico: number;
    ultima_mensagem_em: string;
    morador: {
        id: string;
        nome: string;
        email: string;
        telefone: string;
        unidade: { bloco: string; numero_unidade: string } | null;
    } | null;
}

interface Mensagem {
    id: string;
    mensagem: string;
    sender_id: string;
    sender_role: string;
    lida: boolean;
    created_at: string;
    sender: { id: string; nome: string; role: string } | null;
}

export function ChatSindicoPanel() {
    const { session } = useAuth();
    const { profile, isSindico, isSuperAdmin } = useUser();

    const [isExpanded, setIsExpanded] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    const [conversas, setConversas] = useState<Conversa[]>([]);
    const [activeConversa, setActiveConversa] = useState<Conversa | null>(null);
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalNaoLidas, setTotalNaoLidas] = useState(0);
    const [userId, setUserId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [novaMensagem, setNovaMensagem] = useState('');
    const [sending, setSending] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const canUseChat = isSindico || isSuperAdmin;

    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
    });

    useEffect(() => {
        if (canUseChat && session?.access_token) {
            fetchConversas();
            const interval = setInterval(fetchConversas, 30000);
            return () => clearInterval(interval);
        }
    }, [canUseChat, session]);

    useEffect(() => {
        if (activeConversa) {
            fetchMensagens(activeConversa.id);
            marcarComoLida(activeConversa.id);
        }
    }, [activeConversa]);

    useEffect(() => {
        scrollToBottom();
    }, [mensagens]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchConversas = async () => {
        try {
            const res = await fetch('/api/chat-sindico', {
                headers: getAuthHeaders(),
                credentials: 'include'
            });
            const data = await res.json();
            setConversas(data.conversas || []);
            setTotalNaoLidas(data.totalNaoLidas || 0);
            setUserId(data.userId || '');
        } catch (e) {
            console.error(e);
        }
    };

    const fetchMensagens = async (conversaId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/chat-sindico/${conversaId}`, {
                headers: getAuthHeaders(),
                credentials: 'include'
            });
            const data = await res.json();
            setMensagens(data.mensagens || []);
            setUserId(data.userId || '');
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const marcarComoLida = async (conversaId: string) => {
        try {
            await fetch('/api/chat-sindico', {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({ action: 'marcar_lida', conversa_id: conversaId })
            });
            setConversas(prev => prev.map(c =>
                c.id === conversaId ? { ...c, mensagens_nao_lidas_sindico: 0 } : c
            ));
            setTotalNaoLidas(prev => Math.max(0, prev - (activeConversa?.mensagens_nao_lidas_sindico || 0)));
        } catch (e) {
            console.error(e);
        }
    };

    const enviarMensagem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!novaMensagem.trim() || !activeConversa) return;

        setSending(true);
        try {
            const res = await fetch('/api/chat-sindico', {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({
                    action: 'enviar_mensagem',
                    conversa_id: activeConversa.id,
                    mensagem: novaMensagem
                })
            });

            if (res.ok) {
                setNovaMensagem('');
                fetchMensagens(activeConversa.id);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    const atualizarStatus = async (status: string) => {
        if (!activeConversa) return;
        try {
            await fetch('/api/chat-sindico', {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({
                    action: 'atualizar_status',
                    conversa_id: activeConversa.id,
                    status
                })
            });
            setActiveConversa({ ...activeConversa, status });
            fetchConversas();
        } catch (e) {
            console.error(e);
        }
    };

    const getCategoriaEmoji = (cat: string) => {
        switch (cat) {
            case 'financeiro': return '💰';
            case 'manutencao': return '🔧';
            case 'sugestao': return '💡';
            case 'reclamacao': return '⚠️';
            default: return '💬';
        }
    };

    const filteredConversas = conversas.filter(c => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return c.morador?.nome?.toLowerCase().includes(term) ||
            c.assunto?.toLowerCase().includes(term) ||
            c.morador?.unidade?.numero_unidade?.includes(term);
    });

    if (!canUseChat) return null;

    // Quando oculto, mostra ícone flutuante
    if (isHidden) {
        return (
            <div className="fixed bottom-4 right-8 z-[100] pointer-events-auto">
                <button
                    onClick={() => setIsHidden(false)}
                    className="relative w-12 h-12 bg-emerald-600 rounded-full shadow-lg hover:bg-emerald-700 transition-colors flex items-center justify-center"
                    title="Chat Moradores"
                >
                    <MessageCircle className="h-5 w-5 text-white" />
                    {totalNaoLidas > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                            {totalNaoLidas > 9 ? '9+' : totalNaoLidas}
                        </span>
                    )}
                </button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-0 right-8 z-[100] flex items-end gap-3 pointer-events-none">
            {/* Chat Panel - Estilo LinkedIn */}
            <div className={cn(
                "w-[340px] bg-white border border-gray-200 shadow-xl rounded-t-xl transition-all duration-300 pointer-events-auto",
                isExpanded ? "h-[520px]" : "h-12"
            )}>
                {/* Header Bar */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between px-4 h-12 bg-emerald-600 rounded-t-xl hover:bg-emerald-700 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-white" />
                        <span className="font-medium text-white text-sm">Chat Moradores</span>
                        {totalNaoLidas > 0 && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                {totalNaoLidas > 9 ? '9+' : totalNaoLidas}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1 text-white">
                        <span title="Ocultar chat">
                            <X
                                className="h-4 w-4 hover:text-red-300 cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsHidden(true);
                                    setActiveConversa(null);
                                }}
                            />
                        </span>
                        {isExpanded ? (
                            <ChevronDown className="h-5 w-5" />
                        ) : (
                            <ChevronUp className="h-5 w-5" />
                        )}
                    </div>
                </button>

                {/* Content */}
                {isExpanded && (
                    <div className="h-[calc(100%-48px)] flex flex-col">
                        {activeConversa ? (
                            /* Conversa ativa */
                            <>
                                <div className="p-2 border-b bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setActiveConversa(null)} className="p-1 hover:bg-gray-200 rounded">
                                                <ChevronDown className="h-4 w-4 rotate-90" />
                                            </button>
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold">
                                                {activeConversa.morador?.nome?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{activeConversa.morador?.nome || 'Morador'}</p>
                                                <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                                    <Home className="h-3 w-3" />
                                                    {activeConversa.morador?.unidade
                                                        ? `${activeConversa.morador.unidade.bloco} ${activeConversa.morador.unidade.numero_unidade}`
                                                        : 'Sem unidade'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="relative group">
                                            <button className="text-xs text-gray-500 hover:text-gray-700">⋮</button>
                                            <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded border py-1 hidden group-hover:block z-10 w-32">
                                                <button
                                                    onClick={() => atualizarStatus('resolvida')}
                                                    className="w-full text-left px-3 py-1 hover:bg-gray-100 text-xs"
                                                >
                                                    ✅ Resolvida
                                                </button>
                                                <button
                                                    onClick={() => atualizarStatus('arquivada')}
                                                    className="w-full text-left px-3 py-1 hover:bg-gray-100 text-xs"
                                                >
                                                    📁 Arquivar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-gray-600 mt-1 truncate">
                                        {getCategoriaEmoji(activeConversa.categoria)} {activeConversa.assunto || 'Sem assunto'}
                                    </p>
                                </div>

                                <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-100">
                                    {loading ? (
                                        <div className="text-center text-gray-500 text-sm">Carregando...</div>
                                    ) : mensagens.length === 0 ? (
                                        <div className="text-center text-gray-500 text-sm">Nenhuma mensagem</div>
                                    ) : (
                                        mensagens.map(msg => {
                                            const isMe = msg.sender_id === userId;
                                            return (
                                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[85%] rounded-lg p-2 text-sm ${isMe
                                                        ? 'bg-emerald-500 text-white'
                                                        : 'bg-white shadow'
                                                        }`}>
                                                        {!isMe && (
                                                            <p className="text-[10px] text-gray-500 mb-0.5 font-medium">
                                                                {msg.sender?.nome || 'Morador'}
                                                            </p>
                                                        )}
                                                        <p className="whitespace-pre-wrap">{msg.mensagem}</p>
                                                        <div className={`flex items-center justify-end gap-1 mt-0.5 text-[10px] ${isMe ? 'text-emerald-100' : 'text-gray-400'
                                                            }`}>
                                                            <span>{formatDateTime(msg.created_at).split(' ')[1]}</span>
                                                            {isMe && (msg.lida ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                <form onSubmit={enviarMensagem} className="p-2 border-t bg-white flex gap-2">
                                    <input
                                        type="text"
                                        value={novaMensagem}
                                        onChange={(e) => setNovaMensagem(e.target.value)}
                                        placeholder="Responder..."
                                        className="flex-1 px-3 py-2 text-sm border rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        disabled={sending || activeConversa.status === 'resolvida'}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!novaMensagem.trim() || sending}
                                        className="w-8 h-8 flex items-center justify-center bg-emerald-500 text-white rounded-full hover:bg-emerald-600 disabled:opacity-50"
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                </form>
                            </>
                        ) : (
                            /* Lista de conversas */
                            <>
                                <div className="p-2 border-b">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Buscar morador..."
                                            className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto">
                                    {filteredConversas.length === 0 ? (
                                        <div className="p-6 text-center">
                                            <MessageCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                            <p className="text-gray-500 text-sm">Nenhuma conversa</p>
                                        </div>
                                    ) : (
                                        filteredConversas.map(conv => (
                                            <div
                                                key={conv.id}
                                                onClick={() => setActiveConversa(conv)}
                                                className="p-2 border-b cursor-pointer hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold flex-shrink-0">
                                                        {conv.morador?.nome?.charAt(0).toUpperCase() || '?'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <p className="font-medium text-sm truncate">{conv.morador?.nome || 'Morador'}</p>
                                                            {conv.mensagens_nao_lidas_sindico > 0 && (
                                                                <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0">
                                                                    {conv.mensagens_nao_lidas_sindico}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-gray-500 truncate">
                                                            {conv.morador?.unidade
                                                                ? `${conv.morador.unidade.bloco} ${conv.morador.unidade.numero_unidade}`
                                                                : ''} · {getCategoriaEmoji(conv.categoria)} {conv.assunto || 'Sem assunto'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
