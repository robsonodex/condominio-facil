'use client';

import { useEffect, useState, useRef } from 'react';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
    MessageCircle, Send, X, Check, CheckCheck, Star,
    ChevronUp, ChevronDown, Plus, Edit, Search
} from 'lucide-react';

interface Conversa {
    id: string;
    categoria: string;
    assunto: string;
    status: string;
    mensagens_nao_lidas_morador: number;
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

export function ChatSindicoButton() {
    const { session } = useAuth();
    const { profile, isMorador, isPorteiro, condoId } = useUser();

    const [isExpanded, setIsExpanded] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    const [conversas, setConversas] = useState<Conversa[]>([]);
    const [activeConversa, setActiveConversa] = useState<Conversa | null>(null);
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalNaoLidas, setTotalNaoLidas] = useState(0);
    const [userId, setUserId] = useState('');
    const [chatAtivo, setChatAtivo] = useState(false);

    // Form states
    const [novaMensagem, setNovaMensagem] = useState('');
    const [sending, setSending] = useState(false);

    // Nova conversa
    const [showNovaConversa, setShowNovaConversa] = useState(false);
    const [novaCategoria, setNovaCategoria] = useState('geral');
    const [novoAssunto, setNovoAssunto] = useState('');
    const [novaMensagemInicial, setNovaMensagemInicial] = useState('');

    // Avaliação
    const [showAvaliacao, setShowAvaliacao] = useState(false);
    const [avaliacao, setAvaliacao] = useState(0);
    const [avaliacaoComentario, setAvaliacaoComentario] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const canUseChat = (isMorador || isPorteiro) && chatAtivo;

    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
    });

    // Verificar se chat está ativo para o condomínio
    useEffect(() => {
        if (condoId && (isMorador || isPorteiro)) {
            fetch(`/api/plan-features`, {
                headers: getAuthHeaders(),
                credentials: 'include'
            })
                .then(res => res.json())
                .then(data => {
                    setChatAtivo(data?.hasChatSindico === true);
                })
                .catch(() => setChatAtivo(false));
        }
    }, [condoId, isMorador, isPorteiro, session]);

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
                c.id === conversaId ? { ...c, mensagens_nao_lidas_morador: 0 } : c
            ));
            setTotalNaoLidas(prev => Math.max(0, prev - (activeConversa?.mensagens_nao_lidas_morador || 0)));
        } catch (e) {
            console.error(e);
        }
    };

    const criarConversa = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!novaMensagemInicial.trim()) return;

        setSending(true);
        try {
            const res = await fetch('/api/chat-sindico', {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({
                    action: 'nova_conversa',
                    categoria: novaCategoria,
                    assunto: novoAssunto,
                    mensagem: novaMensagemInicial
                })
            });

            const data = await res.json();
            if (res.ok && data.conversa) {
                setShowNovaConversa(false);
                setNovaCategoria('geral');
                setNovoAssunto('');
                setNovaMensagemInicial('');
                fetchConversas();
                setActiveConversa(data.conversa);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
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

    const enviarAvaliacao = async () => {
        if (!activeConversa || avaliacao === 0) return;

        try {
            await fetch('/api/chat-sindico', {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({
                    action: 'avaliar',
                    conversa_id: activeConversa.id,
                    avaliacao,
                    comentario: avaliacaoComentario
                })
            });
            setShowAvaliacao(false);
            setAvaliacao(0);
            setAvaliacaoComentario('');
            fetchConversas();
            setActiveConversa(null);
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

    if (!canUseChat) return null;

    // Quando oculto, mostra apenas ícone flutuante (igual LinkedInChat)
    if (isHidden) {
        return (
            <div className="fixed bottom-4 right-8 z-[100] pointer-events-auto">
                <button
                    onClick={() => setIsHidden(false)}
                    className="relative w-12 h-12 bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                    title="Falar com o Síndico"
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
            {/* Chat Window - Estilo LinkedIn */}
            <div className={cn(
                "w-[280px] bg-white border border-gray-200 shadow-xl rounded-t-xl transition-all duration-300 pointer-events-auto",
                isExpanded ? "h-[460px]" : "h-12"
            )}>
                {/* Bar Header - Igual LinkedInChat */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between px-4 h-12 bg-white rounded-t-xl border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <MessageCircle className="h-4 w-4 text-blue-600" />
                            </div>
                            {totalNaoLidas > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                    {totalNaoLidas}
                                </span>
                            )}
                        </div>
                        <span className="font-semibold text-gray-700 text-sm">Síndico</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                        <Edit
                            className="h-4 w-4 hover:text-blue-600 cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsExpanded(true);
                                setShowNovaConversa(true);
                                setActiveConversa(null);
                            }}
                        />
                        <span title="Ocultar chat">
                            <X
                                className="h-4 w-4 hover:text-red-500 cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsHidden(true);
                                    setActiveConversa(null);
                                }}
                            />
                        </span>
                        {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                    </div>
                </button>

                {/* Content */}
                {isExpanded && (
                    <div className="flex flex-col h-[calc(460px-48px)]">
                        {showNovaConversa ? (
                            /* Formulário nova conversa */
                            <div className="flex-1 flex flex-col p-3 overflow-y-auto">
                                <form onSubmit={criarConversa} className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
                                        <div className="grid grid-cols-3 gap-1">
                                            {[
                                                { value: 'geral', label: '💬' },
                                                { value: 'financeiro', label: '💰' },
                                                { value: 'manutencao', label: '🔧' },
                                                { value: 'sugestao', label: '💡' },
                                                { value: 'reclamacao', label: '⚠️' },
                                                { value: 'outro', label: '📋' },
                                            ].map(cat => (
                                                <button
                                                    key={cat.value}
                                                    type="button"
                                                    onClick={() => setNovaCategoria(cat.value)}
                                                    className={`p-2 text-lg rounded-lg border ${novaCategoria === cat.value
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                    title={cat.value}
                                                >
                                                    {cat.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <input
                                        type="text"
                                        value={novoAssunto}
                                        onChange={(e) => setNovoAssunto(e.target.value)}
                                        placeholder="Assunto (opcional)"
                                        className="w-full px-3 py-2 text-sm border rounded-lg"
                                    />

                                    <textarea
                                        value={novaMensagemInicial}
                                        onChange={(e) => setNovaMensagemInicial(e.target.value)}
                                        placeholder="Escreva sua mensagem..."
                                        className="w-full p-3 border rounded-lg resize-none text-sm h-24"
                                        required
                                    />

                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowNovaConversa(false)}
                                            className="flex-1 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!novaMensagemInicial.trim() || sending}
                                            className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {sending ? '...' : 'Enviar'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : activeConversa ? (
                            /* Conversa ativa */
                            <>
                                <div className="p-2 border-b bg-gray-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setActiveConversa(null)} className="p-1 hover:bg-gray-200 rounded">
                                            <ChevronDown className="h-4 w-4 rotate-90" />
                                        </button>
                                        <span className="text-sm font-medium truncate">
                                            {getCategoriaEmoji(activeConversa.categoria)} {activeConversa.assunto || 'Conversa'}
                                        </span>
                                    </div>
                                    {activeConversa.status === 'em_atendimento' && (
                                        <button onClick={() => setShowAvaliacao(true)} className="text-xs text-blue-600 hover:underline">
                                            ⭐
                                        </button>
                                    )}
                                </div>

                                <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-100">
                                    {loading ? (
                                        <div className="text-center text-gray-500 text-sm">...</div>
                                    ) : mensagens.length === 0 ? (
                                        <div className="text-center text-gray-500 text-sm">Sem mensagens</div>
                                    ) : (
                                        mensagens.map(msg => {
                                            const isMe = msg.sender_id === userId;
                                            const isSindico = msg.sender_role === 'sindico';
                                            return (
                                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[85%] rounded-lg p-2 text-sm ${isMe
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-white shadow'
                                                        }`}>
                                                        {!isMe && (
                                                            <p className="text-[10px] text-gray-500 mb-0.5 font-medium">
                                                                {isSindico ? '👔 Síndico' : msg.sender?.nome}
                                                            </p>
                                                        )}
                                                        <p className="whitespace-pre-wrap">{msg.mensagem}</p>
                                                        <div className={`flex items-center justify-end gap-1 mt-0.5 text-[10px] ${isMe ? 'text-blue-100' : 'text-gray-400'
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
                                        placeholder="Mensagem..."
                                        className="flex-1 px-3 py-2 text-sm border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={sending || activeConversa.status === 'resolvida'}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!novaMensagem.trim() || sending}
                                        className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50"
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                </form>
                            </>
                        ) : (
                            /* Lista de conversas */
                            <>
                                <div className="p-3 border-b border-gray-100">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Pesquisar..."
                                            className="w-full pl-9 pr-3 py-1.5 bg-gray-100 border-none rounded-md text-xs focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto">
                                    {conversas.length === 0 ? (
                                        <div className="p-6 text-center">
                                            <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                            <p className="text-gray-500 text-xs mb-2">Nenhuma conversa</p>
                                            <button
                                                onClick={() => setShowNovaConversa(true)}
                                                className="text-xs text-blue-600 hover:underline"
                                            >
                                                Iniciar conversa
                                            </button>
                                        </div>
                                    ) : (
                                        conversas.map(conv => (
                                            <div
                                                key={conv.id}
                                                onClick={() => setActiveConversa(conv)}
                                                className="p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <p className="font-medium text-sm truncate">
                                                        {getCategoriaEmoji(conv.categoria)} {conv.assunto || 'Conversa'}
                                                    </p>
                                                    {conv.mensagens_nao_lidas_morador > 0 && (
                                                        <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                                            {conv.mensagens_nao_lidas_morador}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-gray-500 mt-0.5">
                                                    {conv.status === 'resolvida' ? '✅' : conv.status === 'em_atendimento' ? '🔵' : '🟡'}
                                                    {' '}{conv.status === 'resolvida' ? 'Resolvida' : conv.status === 'em_atendimento' ? 'Em atendimento' : 'Aguardando'}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Modal de avaliação */}
            {showAvaliacao && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[101] pointer-events-auto">
                    <div className="bg-white rounded-xl p-6 w-80 shadow-2xl">
                        <h3 className="text-lg font-bold mb-4">⭐ Avaliar Atendimento</h3>
                        <p className="text-gray-600 text-sm mb-4">Como foi o atendimento?</p>

                        <div className="flex justify-center gap-1 mb-4">
                            {[1, 2, 3, 4, 5].map(n => (
                                <button
                                    key={n}
                                    onClick={() => setAvaliacao(n)}
                                    className={`p-1 transition-transform ${avaliacao >= n ? 'text-yellow-400 scale-110' : 'text-gray-300'}`}
                                >
                                    <Star className="h-7 w-7 fill-current" />
                                </button>
                            ))}
                        </div>

                        <textarea
                            value={avaliacaoComentario}
                            onChange={(e) => setAvaliacaoComentario(e.target.value)}
                            placeholder="Comentário (opcional)"
                            className="w-full p-3 border rounded-lg resize-none h-16 text-sm mb-4"
                        />

                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setShowAvaliacao(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                            <button onClick={enviarAvaliacao} disabled={avaliacao === 0} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Enviar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
