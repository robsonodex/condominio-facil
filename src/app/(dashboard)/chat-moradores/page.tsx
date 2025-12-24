'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { Card, CardContent, Button, Input, Badge } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { formatDateTime, formatDate } from '@/lib/utils';
import {
    MessageCircle, Send, Search, User, Home, Phone, Mail,
    Check, CheckCheck, Archive, Star, Clock, AlertCircle,
    ChevronLeft, MoreVertical
} from 'lucide-react';

interface Conversa {
    id: string;
    categoria: string;
    assunto: string;
    status: string;
    mensagens_nao_lidas_sindico: number;
    ultima_mensagem_em: string;
    avaliacao: number;
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
    tipo: string;
    sender_id: string;
    sender_role: string;
    lida: boolean;
    created_at: string;
    sender: { id: string; nome: string; role: string } | null;
}

export default function ChatMoradoresPage() {
    const { session } = useAuth();
    const { condoId, isSindico, isSuperAdmin } = useUser();
    const supabase = useMemo(() => createClient(), []);

    const [conversas, setConversas] = useState<Conversa[]>([]);
    const [selectedConversa, setSelectedConversa] = useState<Conversa | null>(null);
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMensagens, setLoadingMensagens] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [novaMensagem, setNovaMensagem] = useState('');
    const [sending, setSending] = useState(false);
    const [userId, setUserId] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
    });

    useEffect(() => {
        if (session?.access_token) {
            fetchConversas();
        }
    }, [session]);

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
            const res = await fetch(`/api/chat-sindico${filterStatus ? `?status=${filterStatus}` : ''}`, {
                headers: getAuthHeaders(),
                credentials: 'include'
            });
            const data = await res.json();
            setConversas(data.conversas || []);
            setUserId(data.userId || '');
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchMensagens = async (conversaId: string) => {
        setLoadingMensagens(true);
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
            setLoadingMensagens(false);
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
            // Atualizar contador local
            setConversas(prev => prev.map(c =>
                c.id === conversaId ? { ...c, mensagens_nao_lidas_sindico: 0 } : c
            ));
        } catch (e) {
            console.error(e);
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

    const atualizarStatus = async (status: string) => {
        if (!selectedConversa) return;
        try {
            await fetch('/api/chat-sindico', {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({
                    action: 'atualizar_status',
                    conversa_id: selectedConversa.id,
                    status
                })
            });
            setSelectedConversa({ ...selectedConversa, status });
            fetchConversas();
        } catch (e) {
            console.error(e);
        }
    };

    const getCategoriaIcon = (categoria: string) => {
        switch (categoria) {
            case 'financeiro': return '💰';
            case 'manutencao': return '🔧';
            case 'sugestao': return '💡';
            case 'reclamacao': return '⚠️';
            default: return '💬';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'aberta': return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" /> Aberta</Badge>;
            case 'em_atendimento': return <Badge variant="primary"><MessageCircle className="h-3 w-3 mr-1" /> Em atendimento</Badge>;
            case 'resolvida': return <Badge variant="success"><Check className="h-3 w-3 mr-1" /> Resolvida</Badge>;
            case 'arquivada': return <Badge variant="secondary"><Archive className="h-3 w-3 mr-1" /> Arquivada</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    const filteredConversas = conversas.filter(c => {
        const matchesSearch = !searchTerm ||
            c.morador?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.assunto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.morador?.unidade?.numero_unidade?.includes(searchTerm);
        const matchesStatus = !filterStatus || c.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const canManage = isSindico || isSuperAdmin;

    if (!canManage) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <MessageCircle className="h-16 w-16 text-gray-300" />
                <h2 className="text-xl font-bold text-gray-700">Acesso Restrito</h2>
                <p className="text-gray-500">Apenas o síndico pode acessar o chat com moradores.</p>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <MessageCircle className="h-6 w-6 text-blue-500" />
                        Chat com Moradores
                    </h1>
                    <p className="text-gray-500">Gerencie as conversas com os moradores do condomínio</p>
                </div>
                <Badge variant="primary" className="text-lg px-4 py-2">
                    {conversas.reduce((sum, c) => sum + (c.mensagens_nao_lidas_sindico || 0), 0)} não lidas
                </Badge>
            </div>

            <div className="flex-1 flex gap-4 min-h-0">
                {/* Lista de conversas */}
                <Card className={`${selectedConversa ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 min-h-0`}>
                    <div className="p-3 border-b">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar por nome ou apartamento..."
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2 mt-2">
                            {['', 'aberta', 'em_atendimento', 'resolvida'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setFilterStatus(s)}
                                    className={`text-xs px-2 py-1 rounded-full ${filterStatus === s
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {s === '' ? 'Todas' : s === 'em_atendimento' ? 'Em atendimento' : s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-gray-500">Carregando...</div>
                        ) : filteredConversas.length === 0 ? (
                            <div className="p-8 text-center">
                                <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">Nenhuma conversa encontrada</p>
                            </div>
                        ) : (
                            filteredConversas.map(conversa => (
                                <div
                                    key={conversa.id}
                                    onClick={() => setSelectedConversa(conversa)}
                                    className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${selectedConversa?.id === conversa.id ? 'bg-blue-50' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                            {conversa.morador?.nome?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium text-gray-900 truncate">
                                                    {conversa.morador?.nome || 'Morador'}
                                                </p>
                                                {conversa.mensagens_nao_lidas_sindico > 0 && (
                                                    <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                                                        {conversa.mensagens_nao_lidas_sindico}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                <Home className="h-3 w-3" />
                                                {conversa.morador?.unidade
                                                    ? `${conversa.morador.unidade.bloco} ${conversa.morador.unidade.numero_unidade}`
                                                    : 'Sem unidade'}
                                            </p>
                                            <p className="text-sm text-gray-600 truncate mt-1">
                                                {getCategoriaIcon(conversa.categoria)} {conversa.assunto || 'Sem assunto'}
                                            </p>
                                            <div className="flex items-center justify-between mt-1">
                                                {getStatusBadge(conversa.status)}
                                                <span className="text-xs text-gray-400">
                                                    {conversa.ultima_mensagem_em
                                                        ? formatDate(conversa.ultima_mensagem_em)
                                                        : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Área de mensagens */}
                <Card className={`${selectedConversa ? 'flex' : 'hidden md:flex'} flex-col flex-1 min-h-0`}>
                    {selectedConversa ? (
                        <>
                            {/* Header da conversa */}
                            <div className="p-4 border-b bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setSelectedConversa(null)}
                                            className="md:hidden p-1 hover:bg-gray-200 rounded"
                                        >
                                            <ChevronLeft className="h-5 w-5" />
                                        </button>
                                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold">
                                            {selectedConversa.morador?.nome?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">
                                                {selectedConversa.morador?.nome || 'Morador'}
                                            </h3>
                                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                                {selectedConversa.morador?.unidade && (
                                                    <span className="flex items-center gap-1">
                                                        <Home className="h-3 w-3" />
                                                        {selectedConversa.morador.unidade.bloco} {selectedConversa.morador.unidade.numero_unidade}
                                                    </span>
                                                )}
                                                {selectedConversa.morador?.telefone && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3" />
                                                        {selectedConversa.morador.telefone}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getStatusBadge(selectedConversa.status)}
                                        <div className="relative group">
                                            <button className="p-2 hover:bg-gray-200 rounded">
                                                <MoreVertical className="h-5 w-5 text-gray-500" />
                                            </button>
                                            <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-lg border py-1 hidden group-hover:block z-10 w-40">
                                                <button
                                                    onClick={() => atualizarStatus('resolvida')}
                                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                                                >
                                                    ✅ Marcar resolvida
                                                </button>
                                                <button
                                                    onClick={() => atualizarStatus('arquivada')}
                                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                                                >
                                                    📁 Arquivar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {selectedConversa.assunto && (
                                    <p className="text-sm text-gray-600 mt-2">
                                        <strong>Assunto:</strong> {getCategoriaIcon(selectedConversa.categoria)} {selectedConversa.assunto}
                                    </p>
                                )}
                            </div>

                            {/* Mensagens */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100">
                                {loadingMensagens ? (
                                    <div className="text-center text-gray-500">Carregando mensagens...</div>
                                ) : mensagens.length === 0 ? (
                                    <div className="text-center text-gray-500">Nenhuma mensagem ainda</div>
                                ) : (
                                    mensagens.map(msg => {
                                        const isMe = msg.sender_id === userId;
                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[70%] rounded-lg p-3 ${isMe
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-white shadow'
                                                    }`}>
                                                    {!isMe && (
                                                        <p className="text-xs text-gray-500 mb-1 font-medium">
                                                            {msg.sender?.nome || 'Morador'}
                                                        </p>
                                                    )}
                                                    <p className="whitespace-pre-wrap">{msg.mensagem}</p>
                                                    <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${isMe ? 'text-blue-100' : 'text-gray-400'
                                                        }`}>
                                                        <span>{formatDateTime(msg.created_at).split(' ')[1]}</span>
                                                        {isMe && (
                                                            msg.lida
                                                                ? <CheckCheck className="h-3 w-3" />
                                                                : <Check className="h-3 w-3" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input de mensagem */}
                            <form onSubmit={enviarMensagem} className="p-4 border-t bg-white">
                                <div className="flex gap-2">
                                    <Input
                                        value={novaMensagem}
                                        onChange={(e) => setNovaMensagem(e.target.value)}
                                        placeholder="Digite sua resposta..."
                                        className="flex-1"
                                        disabled={sending}
                                    />
                                    <Button type="submit" disabled={!novaMensagem.trim() || sending}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p>Selecione uma conversa para visualizar</p>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
