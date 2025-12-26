'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Flame, Plus, FileText, Upload, ExternalLink, CheckCircle, Clock, AlertTriangle, X } from 'lucide-react';
import { format } from 'date-fns';

interface FireTax {
    id: string;
    exercicio: number;
    data_vencimento: string | null;
    data_pagamento: string | null;
    valor: number | null;
    comprovante_url: string | null;
    status: 'pendente' | 'pago' | 'vencido';
}

interface Condo {
    cbmerj_numero: string | null;
    certificado_bombeiros_url: string | null;
    certificado_bombeiros_validade: string | null;
}

export default function TaxaIncendioPage() {
    const [taxes, setTaxes] = useState<FireTax[]>([]);
    const [condo, setCondo] = useState<Condo | null>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showCbmerjModal, setShowCbmerjModal] = useState(false);
    const [condoId, setCondoId] = useState<string | null>(null);

    // Form states
    const [exercicio, setExercicio] = useState(new Date().getFullYear());
    const [dataVencimento, setDataVencimento] = useState('');
    const [valor, setValor] = useState('');
    const [comprovante, setComprovante] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    // CBMERJ form
    const [cbmerjNumero, setCbmerjNumero] = useState('');
    const [certificadoFile, setCertificadoFile] = useState<File | null>(null);
    const [certificadoValidade, setCertificadoValidade] = useState('');

    const supabase = createClient();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('users')
                .select('condo_id')
                .eq('id', user.id)
                .single();

            if (profile?.condo_id) {
                setCondoId(profile.condo_id);

                // Carregar dados do condomínio
                const { data: condoData } = await supabase
                    .from('condos')
                    .select('cbmerj_numero, certificado_bombeiros_url, certificado_bombeiros_validade')
                    .eq('id', profile.condo_id)
                    .single();

                setCondo(condoData);
                if (condoData?.cbmerj_numero) {
                    setCbmerjNumero(condoData.cbmerj_numero);
                }

                // Carregar taxas
                const { data: taxesData } = await supabase
                    .from('fire_tax_payments')
                    .select('*')
                    .eq('condo_id', profile.condo_id)
                    .order('exercicio', { ascending: false });

                setTaxes(taxesData || []);
            }
        } catch (error) {
            console.error('Erro ao carregar:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCbmerj = async () => {
        if (!condoId) return;

        setSaving(true);
        try {
            let certificadoUrl = condo?.certificado_bombeiros_url;

            if (certificadoFile) {
                const fileName = `${condoId}/bombeiros/${Date.now()}_${certificadoFile.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(fileName, certificadoFile);

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('documents')
                        .getPublicUrl(fileName);
                    certificadoUrl = publicUrl;
                }
            }

            const { error } = await supabase
                .from('condos')
                .update({
                    cbmerj_numero: cbmerjNumero || null,
                    certificado_bombeiros_url: certificadoUrl,
                    certificado_bombeiros_validade: certificadoValidade || null,
                })
                .eq('id', condoId);

            if (error) throw error;

            setShowCbmerjModal(false);
            loadData();
            alert('✅ Dados CBMERJ salvos!');
        } catch (error: any) {
            alert('❌ Erro: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitTax = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!condoId) return;

        setSaving(true);
        try {
            let comprovanteUrl = null;

            if (comprovante) {
                const fileName = `${condoId}/funesbom/${Date.now()}_${comprovante.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(fileName, comprovante);

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('documents')
                        .getPublicUrl(fileName);
                    comprovanteUrl = publicUrl;
                }
            }

            const { error } = await supabase
                .from('fire_tax_payments')
                .upsert({
                    condo_id: condoId,
                    cbmerj_numero: cbmerjNumero,
                    exercicio,
                    data_vencimento: dataVencimento || null,
                    valor: valor ? parseFloat(valor) : null,
                    comprovante_url: comprovanteUrl,
                    status: comprovanteUrl ? 'pago' : 'pendente',
                    data_pagamento: comprovanteUrl ? new Date().toISOString().split('T')[0] : null,
                }, { onConflict: 'condo_id,exercicio' });

            if (error) throw error;

            setShowModal(false);
            setExercicio(new Date().getFullYear());
            setDataVencimento('');
            setValor('');
            setComprovante(null);
            loadData();

            alert('✅ Taxa registrada!');
        } catch (error: any) {
            alert('❌ Erro: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const currentYearTax = taxes.find(t => t.exercicio === new Date().getFullYear());

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                        <Flame className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Taxa de Incêndio</h1>
                        <p className="text-sm text-gray-500">Controle FUNESBOM - Corpo de Bombeiros RJ</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                    <Plus className="h-4 w-4" /> Registrar Pagamento
                </button>
            </div>

            {/* Widget Status do Ano Atual */}
            <div className="grid md:grid-cols-2 gap-4">
                {/* Status do ano atual */}
                <div className={`rounded-xl p-6 border ${currentYearTax?.status === 'pago'
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-amber-50 border-amber-200'
                    }`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Exercício {new Date().getFullYear()}</h3>
                        {currentYearTax?.status === 'pago' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                                <CheckCircle className="h-3 w-3" /> Pago
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                                <Clock className="h-3 w-3" /> Pendente
                            </span>
                        )}
                    </div>

                    {currentYearTax ? (
                        <div className="text-sm text-gray-600 space-y-1">
                            {currentYearTax.valor && (
                                <p><strong>Valor:</strong> R$ {currentYearTax.valor.toFixed(2)}</p>
                            )}
                            {currentYearTax.data_pagamento && (
                                <p><strong>Pago em:</strong> {format(new Date(currentYearTax.data_pagamento), 'dd/MM/yyyy')}</p>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-amber-700">Nenhum pagamento registrado para este ano.</p>
                    )}

                    {currentYearTax?.comprovante_url && (
                        <a
                            href={currentYearTax.comprovante_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-3 text-sm text-emerald-600 hover:text-emerald-700"
                        >
                            <FileText className="h-4 w-4" /> Ver Comprovante
                        </a>
                    )}
                </div>

                {/* Dados CBMERJ */}
                <div className="bg-white rounded-xl p-6 border shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Dados CBMERJ</h3>
                        <button
                            onClick={() => setShowCbmerjModal(true)}
                            className="text-sm text-blue-600 hover:text-blue-700"
                        >
                            Editar
                        </button>
                    </div>

                    {condo?.cbmerj_numero ? (
                        <div className="text-sm text-gray-600 space-y-2">
                            <p><strong>Nº CBMERJ:</strong> {condo.cbmerj_numero}</p>
                            {condo.certificado_bombeiros_validade && (
                                <p><strong>Validade:</strong> {format(new Date(condo.certificado_bombeiros_validade), 'dd/MM/yyyy')}</p>
                            )}
                            {condo.certificado_bombeiros_url && (
                                <a
                                    href={condo.certificado_bombeiros_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                                >
                                    <FileText className="h-4 w-4" /> Ver Certificado
                                </a>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">Nenhum número CBMERJ cadastrado.</p>
                    )}
                </div>
            </div>

            {/* Link para FUNESBOM */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                    <h3 className="font-medium text-blue-800">Gerar Boleto FUNESBOM</h3>
                    <p className="text-sm text-blue-600">Acesse o site oficial para gerar ou consultar seu boleto.</p>
                </div>
                <a
                    href="https://funesbom.rj.gov.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    <ExternalLink className="h-4 w-4" /> Acessar FUNESBOM
                </a>
            </div>

            {/* Histórico */}
            <div>
                <h3 className="font-semibold text-gray-900 mb-4">Histórico de Pagamentos</h3>
                {taxes.length === 0 ? (
                    <div className="bg-white rounded-xl border p-8 text-center">
                        <Flame className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Nenhum pagamento registrado.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Exercício</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Valor</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Comprovante</th>
                                </tr>
                            </thead>
                            <tbody>
                                {taxes.map(tax => (
                                    <tr key={tax.id} className="border-t">
                                        <td className="px-4 py-3 font-medium">{tax.exercicio}</td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {tax.valor ? `R$ ${tax.valor.toFixed(2)}` : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {tax.status === 'pago' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                                                    <CheckCircle className="h-3 w-3" /> Pago
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs">
                                                    <Clock className="h-3 w-3" /> Pendente
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {tax.comprovante_url ? (
                                                <a
                                                    href={tax.comprovante_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-700 text-sm"
                                                >
                                                    Ver PDF
                                                </a>
                                            ) : (
                                                <span className="text-gray-400 text-sm">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Registrar Pagamento */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold">Registrar Pagamento</h2>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmitTax} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Exercício (Ano)</label>
                                <input
                                    type="number"
                                    value={exercicio}
                                    onChange={(e) => setExercicio(parseInt(e.target.value))}
                                    min="2020"
                                    max="2030"
                                    className="w-full rounded-lg border-gray-300 shadow-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={valor}
                                    onChange={(e) => setValor(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 shadow-sm"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Comprovante (PDF)</label>
                                <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-400 hover:bg-red-50">
                                    <Upload className="h-5 w-5 text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                        {comprovante ? comprovante.name : 'Selecionar...'}
                                    </span>
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.png"
                                        className="hidden"
                                        onChange={(e) => setComprovante(e.target.files?.[0] || null)}
                                    />
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    {saving ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Dados CBMERJ */}
            {showCbmerjModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold">Dados CBMERJ</h2>
                            <button onClick={() => setShowCbmerjModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nº CBMERJ</label>
                                <input
                                    type="text"
                                    value={cbmerjNumero}
                                    onChange={(e) => setCbmerjNumero(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 shadow-sm"
                                    placeholder="Código do imóvel no Corpo de Bombeiros"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Validade do Certificado</label>
                                <input
                                    type="date"
                                    value={certificadoValidade}
                                    onChange={(e) => setCertificadoValidade(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 shadow-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Certificado (PDF)</label>
                                <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50">
                                    <Upload className="h-5 w-5 text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                        {certificadoFile ? certificadoFile.name : 'Selecionar...'}
                                    </span>
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.png"
                                        className="hidden"
                                        onChange={(e) => setCertificadoFile(e.target.files?.[0] || null)}
                                    />
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCbmerjModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveCbmerj}
                                    disabled={saving}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {saving ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
