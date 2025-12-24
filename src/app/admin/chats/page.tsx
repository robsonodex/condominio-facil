'use client';

import { useEffect, useState, useRef } from 'react';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { formatDateTime } from '@/lib/utils';
import {
    MessageCircle, Send, Building2, Search, User,
    Check, CheckCheck, ChevronLeft, Archive, Home
} from 'lucide-react';

interface Condo {
    id: string;
    nome: string;
}

interface Conversa {
    id: string;
    condo_id: string;
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
    condo: { nome: string } | null;
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

export default function AdminChatsPage() {
    const { session } = useAuth();
    const { isSuperAdmin } = useUser();

    const [condos, setCondos] = useState<Condo[]>([]);
    const [selectedCondo, setSelectedCondo] = useState<Condo | null>(null);
    const [conversas, setConversas] = useState<Conversa[]>([]);
    const [activeConversa, setActiveConversa] = useState<Conversa | null>(null);
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [userId, setUserId] = useState('');

    const [novaMensagem, setNovaMensagem] = useState('');
    const [sending, setSending] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
    });

    // Buscar condos com chat ativo
    useEffect(() => {
        if (session?.access_token && isSuperAdmin) {
            fetchCondos();
        }
    }, [session, isSuperAdmin]);

    // Buscar conversas quando selecionar condo
    useEffect(() => {
        if (selectedCondo) {
            fetchConversas(selectedCondo.id);
        }
    }, [selectedCondo]);

    useEffect(() => {
        if (activeConversa) {
            fetchMensagens(activeConversa.id);
        }
    }, [activeConversa]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensagens]);

    const fetchCondos = async () => {
        try {
            const res = await fetch('/api/admin/condos-chat', {
                headers: getAuthHeaders(),
                credentials: 'include'
            });
            const data = await res.json();
            setCondos(data.condos || []);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchConversas = async (condoId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/chats?condo_id=${condoId}`, {
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
        try {
            const res = await fetch(`/api/admin/chats/${conversaId}`, {
                headers: getAuthHeaders(),
                credentials: 'include'
            });
            const data = await res.json();
            setMensagens(data.mensagens || []);
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
            c.assunto?.toLowerCase().includes(term);
    });

    if (!isSuperAdmin) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500">Acesso negado</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <MessageCircle className="h-6 w-6 text-emerald-600" />
                    Chats Morador-Síndico
                </h1>
                <p className="text-gray-500 mt-1">Visualize todas as conversas de todos os condomínios</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Lista de Condomínios */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Building2 className="h-5 w-5" /> Condomínios
                    </h2>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                        {condos.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4">
                                Nenhum condomínio com chat ativo
                            </p>
                        ) : (
                            condos.map(condo => (
                                <button
                                    key={condo.id}
                                    onClick={() => { setSelectedCondo(condo); setActiveConversa(null); }}
                                    className={`w-full text-left p-3 rounded-lg transition-colors ${selectedCondo?.id === condo.id
                                        ? 'bg-emerald-50 border-emerald-500 border'
                                        : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                                        }`}
                                >
                                    <p className="font-medium text-sm">{condo.nome}</p>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Lista de Conversas */}
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                            <User className="h-5 w-5" /> Conversas
                        </h2>
                    </div>

                    {selectedCondo ? (
                        <>
                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Buscar..."
                                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg"
                                />
                            </div>

                            <div className="space-y-2 max-h-[550px] overflow-y-auto">
                                {loading ? (
                                    <p className="text-center text-gray-500 py-4">Carregando...</p>
                                ) : filteredConversas.length === 0 ? (
                                    <p className="text-center text-gray-500 py-4 text-sm">Nenhuma conversa</p>
                                ) : (
                                    filteredConversas.map(conv => (
                                        <button
                                            key={conv.id}
                                            onClick={() => setActiveConversa(conv)}
                                            className={`w-full text-left p-3 rounded-lg transition-colors ${activeConversa?.id === conv.id
                                                ? 'bg-blue-50 border-blue-500 border'
                                                : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium text-sm truncate">{conv.morador?.nome || 'Morador'}</p>
                                                {conv.mensagens_nao_lidas_sindico > 0 && (
                                                    <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                                        {conv.mensagens_nao_lidas_sindico}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-gray-500 truncate mt-1">
                                                {conv.morador?.unidade
                                                    ? `${conv.morador.unidade.bloco} ${conv.morador.unidade.numero_unidade} · `
                                                    : ''}
                                                {getCategoriaEmoji(conv.categoria)} {conv.assunto || 'Sem assunto'}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                {conv.status === 'resolvida' ? '✅' : conv.status === 'em_atendimento' ? '🔵' : '🟡'}
                                                {' '}{conv.status}
                                            </p>
                                        </button>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <p className="text-center text-gray-500 py-8 text-sm">
                            Selecione um condomínio
                        </p>
                    )}
                </div>

                {/* Painel de Mensagens */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border flex flex-col h-[650px]">
                    {activeConversa ? (
                        <>
                            {/* Header */}
                            <div className="p-4 border-b bg-gray-50 rounded-t-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                        {activeConversa.morador?.nome?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold">{activeConversa.morador?.nome || 'Morador'}</p>
                                        <p className="text-xs text-gray-500 flex items-center gap-2">
                                            <Home className="h-3 w-3" />
                                            {activeConversa.morador?.unidade
                                                ? `${activeConversa.morador.unidade.bloco} ${activeConversa.morador.unidade.numero_unidade}`
                                                : 'Sem unidade'}
                                            {activeConversa.morador?.telefone && (
                                                <span>· 📞 {activeConversa.morador.telefone}</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 mt-2">
                                    {getCategoriaEmoji(activeConversa.categoria)} {activeConversa.assunto || 'Sem assunto'}
                                </p>
                            </div>

                            {/* Mensagens */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-100">
                                {mensagens.map(msg => {
                                    const isSindicoOrAdmin = msg.sender_role === 'sindico' || msg.sender_role === 'superadmin';
                                    return (
                                        <div key={msg.id} className={`flex ${isSindicoOrAdmin ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] rounded-lg p-3 ${isSindicoOrAdmin
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-white shadow'
                                                }`}>
                                                {!isSindicoOrAdmin && (
                                                    <p className="text-xs text-gray-500 mb-1 font-medium">
                                                        {msg.sender?.nome || 'Morador'}
                                                    </p>
                                                )}
                                                {isSindicoOrAdmin && (
                                                    <p className="text-xs text-emerald-100 mb-1 font-medium">
                                                        {msg.sender_role === 'superadmin' ? '👑 Admin' : '👔 Síndico'}
                                                    </p>
                                                )}
                                                <p className="whitespace-pre-wrap">{msg.mensagem}</p>
                                                <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${isSindicoOrAdmin ? 'text-emerald-100' : 'text-gray-400'
                                                    }`}>
                                                    <span>{formatDateTime(msg.created_at).split(' ')[1]}</span>
                                                    {isSindicoOrAdmin && (msg.lida ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Info - superadmin só visualiza */}
                            <div className="p-3 border-t bg-gray-50 text-center">
                                <p className="text-xs text-gray-500">
                                    📖 Modo visualização - O síndico responde as mensagens
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <MessageCircle className="h-12 w-12 mx-auto mb-3" />
                                <p>Selecione uma conversa para visualizar</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
