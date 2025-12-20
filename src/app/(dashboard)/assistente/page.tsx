'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ThumbsUp, ThumbsDown, Loader2, AlertCircle, Info } from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    feedback?: 'positivo' | 'negativo';
}

interface AgentInfo {
    nome_agente: string;
    ativo: boolean;
}

export default function AssistentePage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
    const [agentLoading, setAgentLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [usage, setUsage] = useState<{ usado: number; limite: number } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Carregar info do agente
    useEffect(() => {
        fetchAgentInfo();
    }, []);

    // Scroll para última mensagem
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchAgentInfo = async () => {
        try {
            const res = await fetch('/api/ai/agent');
            const data = await res.json();
            if (data.agent) {
                setAgentInfo(data.agent);
            }
        } catch {
            console.error('Erro ao carregar agente');
        } finally {
            setAgentLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pergunta: userMessage.content,
                    historico: messages.slice(-6).map(m => ({
                        role: m.role,
                        content: m.content
                    }))
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || data.error || 'Erro ao enviar mensagem');
                return;
            }

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.resposta,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);

            if (data.usage) {
                setUsage(data.usage);
            }
        } catch {
            setError('Erro de conexão. Tente novamente.');
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleFeedback = async (messageId: string, feedback: 'positivo' | 'negativo') => {
        setMessages(prev => prev.map(m =>
            m.id === messageId ? { ...m, feedback } : m
        ));
        // TODO: Enviar feedback para API
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Loading state
    if (agentLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    // Agente não configurado
    if (!agentInfo) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                    <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-amber-800 mb-2">
                        Assistente não configurado
                    </h2>
                    <p className="text-amber-700">
                        O assistente do condomínio ainda não foi configurado pelo síndico.
                        Entre em contato com a administração para mais informações.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center">
                            <Bot className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">
                                {agentInfo.nome_agente}
                            </h1>
                            <p className="text-sm text-gray-500">
                                Assistente do Condomínio
                            </p>
                        </div>
                    </div>
                    {usage && (
                        <div className="text-right">
                            <p className="text-xs text-gray-500">Uso mensal</p>
                            <p className="text-sm font-medium text-gray-700">
                                {usage.usado} / {usage.limite}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Container */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {/* Messages */}
                <div className="h-[500px] overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center py-8">
                            <Bot className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-600 mb-2">
                                Olá! Sou o {agentInfo.nome_agente}
                            </h3>
                            <p className="text-gray-500 max-w-md mx-auto">
                                Posso ajudar com dúvidas sobre as regras do condomínio,
                                horários, reservas e outras informações.
                            </p>
                            <div className="mt-6 flex flex-wrap gap-2 justify-center">
                                {[
                                    'Qual o horário da piscina?',
                                    'Posso ter pet no apartamento?',
                                    'Como faço uma reserva?'
                                ].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => setInput(suggestion)}
                                        className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-full hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
                        >
                            {message.role === 'assistant' && (
                                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Bot className="h-5 w-5 text-emerald-600" />
                                </div>
                            )}
                            <div className={`max-w-[75%] ${message.role === 'user' ? 'order-1' : ''}`}>
                                <div
                                    className={`rounded-2xl px-4 py-2.5 ${message.role === 'user'
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-gray-100 text-gray-800'
                                        }`}
                                >
                                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                        {message.content}
                                    </p>
                                </div>
                                {message.role === 'assistant' && (
                                    <div className="flex items-center gap-2 mt-1 ml-1">
                                        <button
                                            onClick={() => handleFeedback(message.id, 'positivo')}
                                            className={`p-1 rounded transition-colors ${message.feedback === 'positivo'
                                                    ? 'text-emerald-600 bg-emerald-50'
                                                    : 'text-gray-400 hover:text-emerald-600'
                                                }`}
                                            title="Resposta útil"
                                        >
                                            <ThumbsUp className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleFeedback(message.id, 'negativo')}
                                            className={`p-1 rounded transition-colors ${message.feedback === 'negativo'
                                                    ? 'text-red-600 bg-red-50'
                                                    : 'text-gray-400 hover:text-red-600'
                                                }`}
                                            title="Resposta não foi útil"
                                        >
                                            <ThumbsDown className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            {message.role === 'user' && (
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                    <User className="h-5 w-5 text-gray-600" />
                                </div>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                <Bot className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div className="bg-gray-100 rounded-2xl px-4 py-3">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t p-4">
                    <div className="flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Digite sua pergunta..."
                            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            disabled={loading}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim() || loading}
                            className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Send className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        As respostas são baseadas nos documentos do condomínio.
                    </p>
                </div>
            </div>
        </div>
    );
}
