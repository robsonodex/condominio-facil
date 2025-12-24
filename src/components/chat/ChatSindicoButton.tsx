'use client';

import { useEffect, useState, useRef } from 'react';
import { Button, Input, Badge } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { formatDateTime } from '@/lib/utils';
import {
    MessageCircle, Send, X, Check, CheckCheck, Star,
    ChevronDown, User
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
    const { profile, isMorador, condoId } = useUser();

    const [isOpen, setIsOpen] = useState(false);
    const [conversas, setConversas] = useState<Conversa[]>([]);
    const [selectedConversa, setSelectedConversa] = useState<Conversa | null>(null);
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

    const canUseChat = isMorador && chatAtivo;

    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
    });

    // Verificar se chat está ativo para o condomínio
    useEffect(() => {
        if (condoId && isMorador) {
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
    }, [condoId, isMorador, session]);

    useEffect(() => {
        if (canUseChat && session?.access_token) {
            fetchConversas();
            // Polling a cada 30s
            const interval = setInterval(fetchConversas, 30000);
            return () => clearInterval(interval);
        }
    }, [canUseChat, session]);

    useEffect(() => {
        if (selectedConversa) {
            fetchMensagens(selectedConversa.id);
            marcarComoLida(selectedConversa.id);
        }
    }, [selectedConversa]);

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
            setTotalNaoLidas(prev => Math.max(0, prev - (selectedConversa?.mensagens_nao_lidas_morador || 0)));
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
            if (res.ok) {
                setShowNovaConversa(false);
                setNovaCategoria('geral');
                setNovoAssunto('');
                setNovaMensagemInicial('');
                fetchConversas();
                if (data.conversa) {
                    setSelectedConversa(data.conversa);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    const enviarMensagem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!novaMensagem.trim() || !selectedConversa) return;

        setSending(true);
        try {
            const res = await fetch('/api/chat-sindico', {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({
                    action: 'enviar_mensagem',
                    conversa_id: selectedConversa.id,
                    mensagem: novaMensagem
                })
            });

            if (res.ok) {
                setNovaMensagem('');
                fetchMensagens(selectedConversa.id);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    const enviarAvaliacao = async () => {
        if (!selectedConversa || avaliacao === 0) return;

        try {
            await fetch('/api/chat-sindico', {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({
                    action: 'avaliar',
                    conversa_id: selectedConversa.id,
                    avaliacao,
                    comentario: avaliacaoComentario
                })
            });
            setShowAvaliacao(false);
            setAvaliacao(0);
            setAvaliacaoComentario('');
            fetchConversas();
            setSelectedConversa(null);
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

    return (
        <>
            {/* Botão flutuante */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 right-6 z-40 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
                title="Falar com o Síndico"
            >
                <MessageCircle className="h-6 w-6" />
                {totalNaoLidas > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {totalNaoLidas > 9 ? '9+' : totalNaoLidas}
                    </span>
                )}
            </button>

            {/* Modal de chat */}
            <Modal
                isOpen={isOpen}
                onClose={() => { setIsOpen(false); setSelectedConversa(null); setShowNovaConversa(false); }}
                title="💬 Falar com o Síndico"
                size="lg"
            >
                <div className="h-[500px] flex flex-col">
                    {showNovaConversa ? (
                        /* Formulário nova conversa */
                        <form onSubmit={criarConversa} className="flex-1 flex flex-col p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: 'geral', label: '💬 Geral' },
                                        { value: 'financeiro', label: '💰 Financeiro' },
                                        { value: 'manutencao', label: '🔧 Manutenção' },
                                        { value: 'sugestao', label: '💡 Sugestão' },
                                        { value: 'reclamacao', label: '⚠️ Reclamação' },
                                        { value: 'outro', label: '📋 Outro' },
                                    ].map(cat => (
                                        <button
                                            key={cat.value}
                                            type="button"
                                            onClick={() => setNovaCategoria(cat.value)}
                                            className={`p-2 text-sm rounded-lg border ${novaCategoria === cat.value
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Input
                                label="Assunto (opcional)"
                                value={novoAssunto}
                                onChange={(e) => setNovoAssunto(e.target.value)}
                                placeholder="Ex: Problema com vazamento"
                            />

                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem *</label>
                                <textarea
                                    value={novaMensagemInicial}
                                    onChange={(e) => setNovaMensagemInicial(e.target.value)}
                                    placeholder="Descreva sua dúvida ou solicitação..."
                                    className="w-full h-32 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button type="button" variant="ghost" onClick={() => setShowNovaConversa(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" loading={sending} disabled={!novaMensagemInicial.trim()}>
                                    <Send className="h-4 w-4 mr-1" /> Enviar
                                </Button>
                            </div>
                        </form>
                    ) : selectedConversa ? (
                        /* Tela de conversa */
                        <>
                            <div className="p-3 border-b flex items-center justify-between bg-gray-50">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setSelectedConversa(null)} className="p-1 hover:bg-gray-200 rounded">
                                        <ChevronDown className="h-5 w-5 rotate-90" />
                                    </button>
                                    <div>
                                        <p className="font-medium">
                                            {getCategoriaEmoji(selectedConversa.categoria)} {selectedConversa.assunto || 'Conversa com Síndico'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {selectedConversa.status === 'resolvida' ? '✅ Resolvida' : '🔵 Em andamento'}
                                        </p>
                                    </div>
                                </div>
                                {selectedConversa.status === 'em_atendimento' && (
                                    <Button size="sm" variant="outline" onClick={() => setShowAvaliacao(true)}>
                                        <Star className="h-4 w-4 mr-1" /> Avaliar
                                    </Button>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-100">
                                {loading ? (
                                    <div className="text-center text-gray-500">Carregando...</div>
                                ) : mensagens.length === 0 ? (
                                    <div className="text-center text-gray-500">Nenhuma mensagem</div>
                                ) : (
                                    mensagens.map(msg => {
                                        const isMe = msg.sender_id === userId;
                                        const isSindico = msg.sender_role === 'sindico';
                                        return (
                                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] rounded-lg p-3 ${isMe
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-white shadow'
                                                    }`}>
                                                    {!isMe && (
                                                        <p className="text-xs text-gray-500 mb-1 font-medium flex items-center gap-1">
                                                            {isSindico ? '👔 Síndico' : msg.sender?.nome}
                                                        </p>
                                                    )}
                                                    <p className="whitespace-pre-wrap">{msg.mensagem}</p>
                                                    <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${isMe ? 'text-blue-100' : 'text-gray-400'
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

                            <form onSubmit={enviarMensagem} className="p-3 border-t bg-white flex gap-2">
                                <Input
                                    value={novaMensagem}
                                    onChange={(e) => setNovaMensagem(e.target.value)}
                                    placeholder="Digite sua mensagem..."
                                    className="flex-1"
                                    disabled={sending || selectedConversa.status === 'resolvida'}
                                />
                                <Button type="submit" disabled={!novaMensagem.trim() || sending || selectedConversa.status === 'resolvida'}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </>
                    ) : (
                        /* Lista de conversas */
                        <>
                            <div className="p-3 border-b flex items-center justify-between">
                                <p className="font-medium text-gray-700">Minhas conversas</p>
                                <Button size="sm" onClick={() => setShowNovaConversa(true)}>
                                    + Nova conversa
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {conversas.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 mb-4">Você ainda não tem conversas</p>
                                        <Button onClick={() => setShowNovaConversa(true)}>
                                            Iniciar conversa com o Síndico
                                        </Button>
                                    </div>
                                ) : (
                                    conversas.map(conv => (
                                        <div
                                            key={conv.id}
                                            onClick={() => setSelectedConversa(conv)}
                                            className="p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium">
                                                    {getCategoriaEmoji(conv.categoria)} {conv.assunto || 'Conversa'}
                                                </p>
                                                {conv.mensagens_nao_lidas_morador > 0 && (
                                                    <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                                                        {conv.mensagens_nao_lidas_morador}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {conv.status === 'resolvida' ? '✅ Resolvida' : conv.status === 'em_atendimento' ? '🔵 Em atendimento' : '🟡 Aguardando'}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>
            </Modal>

            {/* Modal de avaliação */}
            <Modal isOpen={showAvaliacao} onClose={() => setShowAvaliacao(false)} title="⭐ Avaliar Atendimento" size="sm">
                <div className="space-y-4">
                    <p className="text-gray-600">Como foi o atendimento do síndico?</p>

                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map(n => (
                            <button
                                key={n}
                                onClick={() => setAvaliacao(n)}
                                className={`p-2 transition-transform ${avaliacao >= n ? 'text-yellow-400 scale-110' : 'text-gray-300'}`}
                            >
                                <Star className="h-8 w-8 fill-current" />
                            </button>
                        ))}
                    </div>

                    <textarea
                        value={avaliacaoComentario}
                        onChange={(e) => setAvaliacaoComentario(e.target.value)}
                        placeholder="Comentário (opcional)"
                        className="w-full p-3 border rounded-lg resize-none h-20"
                    />

                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" onClick={() => setShowAvaliacao(false)}>Cancelar</Button>
                        <Button onClick={enviarAvaliacao} disabled={avaliacao === 0}>Enviar Avaliação</Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
