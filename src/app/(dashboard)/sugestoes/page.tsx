'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, Button, Input, Badge } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/hooks/useAuth';
import { Lightbulb, ThumbsUp, Plus, Filter, MessageSquare, CheckCircle, Clock, XCircle, TrendingUp } from 'lucide-react';

interface Suggestion {
    id: string;
    titulo: string;
    descricao: string;
    categoria: string;
    status: string;
    votes_count: number;
    user_voted: boolean;
    created_at: string;
    resposta_admin?: string;
    autor: { nome: string; email: string };
}

export default function SugestoesPage() {
    const { session } = useAuth();
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState<string>('all');
    const [isAdmin, setIsAdmin] = useState(false);

    // Form
    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [categoria, setCategoria] = useState('funcionalidade');
    const [saving, setSaving] = useState(false);

    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
    });

    useEffect(() => {
        if (session?.access_token) {
            fetchSuggestions();
        }
    }, [session]);

    const fetchSuggestions = async () => {
        try {
            const res = await fetch('/api/suggestions', { headers: getAuthHeaders() });
            const data = await res.json();
            setSuggestions(data.suggestions || []);
            setIsAdmin(data.isAdmin || false);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!titulo || !descricao) return;

        setSaving(true);
        try {
            const res = await fetch('/api/suggestions', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ titulo, descricao, categoria }),
            });

            const data = await res.json();
            if (data.success) {
                alert('✅ Sugestão enviada com sucesso! Obrigado pela contribuição.');
                setShowModal(false);
                setTitulo('');
                setDescricao('');
                fetchSuggestions();
            } else {
                alert('❌ Erro: ' + data.error);
            }
        } catch (e: any) {
            alert('❌ Erro: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleVote = async (suggestionId: string) => {
        try {
            const res = await fetch('/api/suggestions', {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ action: 'vote', suggestionId }),
            });

            const data = await res.json();
            if (data.success) {
                setSuggestions(prev => prev.map(s =>
                    s.id === suggestionId
                        ? { ...s, user_voted: data.voted, votes_count: s.votes_count + (data.voted ? 1 : -1) }
                        : s
                ));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pendente': return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" /> Pendente</Badge>;
            case 'em_analise': return <Badge variant="primary"><TrendingUp className="h-3 w-3 mr-1" /> Em Análise</Badge>;
            case 'implementado': return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" /> Implementado</Badge>;
            case 'rejeitado': return <Badge variant="danger"><XCircle className="h-3 w-3 mr-1" /> Rejeitado</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    const getCategoryLabel = (cat: string) => {
        const labels: Record<string, string> = {
            funcionalidade: '🚀 Nova Funcionalidade',
            melhoria: '✨ Melhoria',
            bug: '🐛 Correção de Bug',
            interface: '🎨 Interface',
            geral: '💡 Geral',
        };
        return labels[cat] || cat;
    };

    const filteredSuggestions = suggestions.filter(s => {
        if (filter === 'all') return true;
        if (filter === 'meus') return s.user_voted;
        return s.status === filter;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Lightbulb className="h-6 w-6 text-amber-500" />
                        Sugestões de Melhorias
                    </h1>
                    <p className="text-gray-500">Compartilhe suas ideias para melhorar o sistema</p>
                </div>
                <Button onClick={() => setShowModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Sugestão
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0 cursor-pointer" onClick={() => setFilter('all')}>
                    <CardContent className="py-4 text-center">
                        <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <p className="text-2xl font-bold">{suggestions.length}</p>
                        <p className="text-sm text-amber-100">Total</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 cursor-pointer" onClick={() => setFilter('pendente')}>
                    <CardContent className="py-4 text-center">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <p className="text-2xl font-bold">{suggestions.filter(s => s.status === 'pendente').length}</p>
                        <p className="text-sm text-blue-100">Pendentes</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 cursor-pointer" onClick={() => setFilter('em_analise')}>
                    <CardContent className="py-4 text-center">
                        <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <p className="text-2xl font-bold">{suggestions.filter(s => s.status === 'em_analise').length}</p>
                        <p className="text-sm text-purple-100">Em Análise</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 cursor-pointer" onClick={() => setFilter('implementado')}>
                    <CardContent className="py-4 text-center">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <p className="text-2xl font-bold">{suggestions.filter(s => s.status === 'implementado').length}</p>
                        <p className="text-sm text-emerald-100">Implementados</p>
                    </CardContent>
                </Card>
            </div>

            {/* Lista de sugestões */}
            <div className="space-y-4">
                {loading ? (
                    <Card><CardContent className="p-8 text-center text-gray-500">Carregando...</CardContent></Card>
                ) : filteredSuggestions.length === 0 ? (
                    <Card><CardContent className="p-8 text-center text-gray-500">Nenhuma sugestão encontrada. Seja o primeiro a contribuir!</CardContent></Card>
                ) : (
                    filteredSuggestions.map(suggestion => (
                        <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex gap-4">
                                    {/* Votos */}
                                    <div className="flex flex-col items-center">
                                        <button
                                            onClick={() => handleVote(suggestion.id)}
                                            className={`p-2 rounded-lg transition-colors ${suggestion.user_voted
                                                    ? 'bg-emerald-100 text-emerald-600'
                                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                }`}
                                        >
                                            <ThumbsUp className={`h-5 w-5 ${suggestion.user_voted ? 'fill-current' : ''}`} />
                                        </button>
                                        <span className="font-bold text-lg mt-1">{suggestion.votes_count}</span>
                                        <span className="text-xs text-gray-500">votos</span>
                                    </div>

                                    {/* Conteúdo */}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{suggestion.titulo}</h3>
                                                <p className="text-sm text-gray-500 mt-1">{getCategoryLabel(suggestion.categoria)}</p>
                                            </div>
                                            {getStatusBadge(suggestion.status)}
                                        </div>
                                        <p className="text-gray-600 mt-2">{suggestion.descricao}</p>

                                        {suggestion.resposta_admin && (
                                            <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                                <p className="text-sm font-medium text-emerald-800 flex items-center gap-1">
                                                    <MessageSquare className="h-4 w-4" /> Resposta da equipe:
                                                </p>
                                                <p className="text-sm text-emerald-700 mt-1">{suggestion.resposta_admin}</p>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                                            <span>Por: {suggestion.autor?.nome || 'Anônimo'}</span>
                                            <span>{new Date(suggestion.created_at).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Modal Nova Sugestão */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nova Sugestão" size="md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                        <Input
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            placeholder="Resumo da sua ideia"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                        <select
                            value={categoria}
                            onChange={(e) => setCategoria(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="funcionalidade">🚀 Nova Funcionalidade</option>
                            <option value="melhoria">✨ Melhoria</option>
                            <option value="bug">🐛 Correção de Bug</option>
                            <option value="interface">🎨 Interface/Design</option>
                            <option value="geral">💡 Geral</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
                        <textarea
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            placeholder="Descreva sua ideia em detalhes. Quanto mais informações, melhor!"
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            required
                        />
                    </div>

                    <div className="bg-amber-50 p-3 rounded-lg text-sm text-amber-800">
                        <Lightbulb className="h-4 w-4 inline mr-1" />
                        Sua sugestão será visível para todos os usuários que podem votar nela!
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                        <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
                        <Button type="submit" loading={saving}>Enviar Sugestão</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
