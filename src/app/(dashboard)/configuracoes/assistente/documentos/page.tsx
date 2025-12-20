'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Loader2, CheckCircle, AlertCircle, ToggleLeft, ToggleRight, ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';

interface Document {
    id: string;
    tipo: string;
    titulo: string;
    ativo: boolean;
    created_at: string;
    versao: number;
}

const tiposDocumento = [
    { value: 'regimento', label: 'Regimento Interno' },
    { value: 'convencao', label: 'Convenção' },
    { value: 'ata', label: 'Ata de Assembleia' },
    { value: 'decisao', label: 'Decisão/Circular' },
    { value: 'faq', label: 'Perguntas Frequentes' },
    { value: 'outro', label: 'Outro' }
];

export default function DocumentosAssistentePage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        tipo: 'regimento',
        titulo: '',
        conteudo_texto: ''
    });

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const res = await fetch('/api/ai/documents');
            const data = await res.json();
            setDocuments(data.documents || []);
        } catch {
            console.error('Erro ao carregar documentos');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!formData.titulo || !formData.conteudo_texto) {
            setError('Preencha todos os campos');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const res = await fetch('/api/ai/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Erro ao adicionar documento');
                return;
            }

            setSuccess('Documento adicionado com sucesso!');
            setShowModal(false);
            setFormData({ tipo: 'regimento', titulo: '', conteudo_texto: '' });
            fetchDocuments();
            setTimeout(() => setSuccess(null), 3000);
        } catch {
            setError('Erro de conexão');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (id: string, ativo: boolean) => {
        try {
            const res = await fetch('/api/ai/documents', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ativo: !ativo })
            });

            if (res.ok) {
                setDocuments(prev => prev.map(d =>
                    d.id === id ? { ...d, ativo: !ativo } : d
                ));
            }
        } catch {
            console.error('Erro ao atualizar documento');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este documento?')) return;

        try {
            const res = await fetch(`/api/ai/documents?id=${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setDocuments(prev => prev.filter(d => d.id !== id));
                setSuccess('Documento removido');
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch {
            console.error('Erro ao remover documento');
        }
    };

    const getTipoLabel = (value: string) => {
        return tiposDocumento.find(t => t.value === value)?.label || value;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/configuracoes/assistente"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Base de Conhecimento</h1>
                        <p className="text-gray-500 mt-1">
                            Documentos que o assistente usa para responder perguntas
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Adicionar Documento
                </button>
            </div>

            {/* Success Message */}
            {success && (
                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
                    <CheckCircle className="h-5 w-5" />
                    <p>{success}</p>
                </div>
            )}

            {/* Documents List */}
            <div className="bg-white rounded-xl shadow-sm border">
                {documents.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">
                            Nenhum documento adicionado
                        </h3>
                        <p className="text-gray-500 mb-4">
                            Adicione documentos para que o assistente possa responder perguntas sobre o condomínio.
                        </p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            <Upload className="h-4 w-4" />
                            Adicionar Primeiro Documento
                        </button>
                    </div>
                ) : (
                    <div className="divide-y">
                        {documents.map((doc) => (
                            <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${doc.ativo ? 'bg-emerald-100' : 'bg-gray-100'
                                        }`}>
                                        <FileText className={`h-5 w-5 ${doc.ativo ? 'text-emerald-600' : 'text-gray-400'
                                            }`} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{doc.titulo}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                                {getTipoLabel(doc.tipo)}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                v{doc.versao}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggle(doc.id, doc.ativo)}
                                        className={`p-2 rounded-lg transition-colors ${doc.ativo
                                                ? 'text-emerald-600 hover:bg-emerald-50'
                                                : 'text-gray-400 hover:bg-gray-100'
                                            }`}
                                        title={doc.ativo ? 'Desativar' : 'Ativar'}
                                    >
                                        {doc.ativo ? (
                                            <ToggleRight className="h-5 w-5" />
                                        ) : (
                                            <ToggleLeft className="h-5 w-5" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(doc.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Remover"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-medium text-blue-800 mb-2">📚 Tipos de Documentos Recomendados</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• <strong>Regimento Interno:</strong> Regras de convivência, horários, multas</li>
                    <li>• <strong>Convenção:</strong> Normas do condomínio</li>
                    <li>• <strong>Atas de Assembleia:</strong> Decisões recentes</li>
                    <li>• <strong>FAQ:</strong> Perguntas frequentes que você já respondeu várias vezes</li>
                </ul>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-900">Adicionar Documento</h2>
                            <p className="text-gray-500 text-sm mt-1">
                                Cole o texto do documento para que o assistente possa usá-lo
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Tipo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tipo de Documento
                                </label>
                                <select
                                    value={formData.tipo}
                                    onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    {tiposDocumento.map((tipo) => (
                                        <option key={tipo.value} value={tipo.value}>
                                            {tipo.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Título */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Título
                                </label>
                                <input
                                    type="text"
                                    value={formData.titulo}
                                    onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                                    placeholder="Ex: Regimento Interno 2024"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            {/* Conteúdo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Conteúdo do Documento
                                </label>
                                <textarea
                                    value={formData.conteudo_texto}
                                    onChange={(e) => setFormData(prev => ({ ...prev, conteudo_texto: e.target.value }))}
                                    placeholder="Cole aqui o texto completo do documento..."
                                    rows={12}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none font-mono text-sm"
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    {formData.conteudo_texto.length.toLocaleString()} caracteres
                                </p>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
                                    <AlertCircle className="h-5 w-5" />
                                    <p className="text-sm">{error}</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setError(null);
                                    setFormData({ tipo: 'regimento', titulo: '', conteudo_texto: '' });
                                }}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAdd}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                            >
                                {saving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="h-4 w-4" />
                                )}
                                Adicionar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
