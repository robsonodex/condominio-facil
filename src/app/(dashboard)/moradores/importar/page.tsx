'use client';

import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle, Loader2, AlertCircle, ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';

interface MoradorRow {
    nome: string;
    email: string;
    telefone: string;
    bloco: string;
    unidade: string;
    tipo: string;
    valido: boolean;
    erro?: string;
}

interface ImportResult {
    success: boolean;
    linha: number;
    nome: string;
    email: string;
    erro?: string;
}

export default function ImportarMoradoresPage() {
    const [dados, setDados] = useState<MoradorRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [resultado, setResultado] = useState<{
        total: number;
        importados: number;
        erros: number;
        detalhes: ImportResult[];
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const parseCSV = (text: string): MoradorRow[] => {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];

        const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
        const rows: MoradorRow[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const row: Record<string, string> = {};

            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });

            // Validar
            const erros: string[] = [];
            if (!row.nome) erros.push('Nome obrigatório');
            if (!row.email) erros.push('Email obrigatório');
            if (!row.unidade) erros.push('Unidade obrigatória');
            if (!row.tipo) erros.push('Tipo obrigatório');
            if (row.tipo && !['proprietario', 'inquilino'].includes(row.tipo.toLowerCase())) {
                erros.push('Tipo deve ser proprietario ou inquilino');
            }

            rows.push({
                nome: row.nome || '',
                email: row.email || '',
                telefone: row.telefone || '',
                bloco: row.bloco || '',
                unidade: row.unidade || '',
                tipo: row.tipo || '',
                valido: erros.length === 0,
                erro: erros.length > 0 ? erros.join(', ') : undefined
            });
        }

        return rows;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setResultado(null);

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const parsed = parseCSV(text);
            setDados(parsed);
            setLoading(false);
        };
        reader.onerror = () => {
            setLoading(false);
            alert('Erro ao ler arquivo');
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        const validos = dados.filter(d => d.valido);
        if (validos.length === 0) {
            alert('Nenhum registro válido para importar');
            return;
        }

        setImporting(true);

        try {
            const response = await fetch('/api/moradores/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    moradores: validos.map(d => ({
                        nome: d.nome,
                        email: d.email,
                        telefone: d.telefone,
                        bloco: d.bloco,
                        unidade: d.unidade,
                        tipo: d.tipo
                    }))
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao importar');
            }

            setResultado({
                total: result.resumo.total,
                importados: result.resumo.importados,
                erros: result.resumo.erros,
                detalhes: result.resultados
            });

        } catch (err: any) {
            alert(err.message || 'Erro ao importar');
        } finally {
            setImporting(false);
        }
    };

    const totalValidos = dados.filter(d => d.valido).length;
    const totalInvalidos = dados.filter(d => !d.valido).length;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/moradores"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-500" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Importar Moradores</h1>
                        <p className="text-gray-500">Importe moradores em lote via arquivo CSV</p>
                    </div>
                </div>
                <a
                    href="/templates/modelo_moradores.csv"
                    download
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                    <Download className="h-4 w-4" />
                    Baixar Modelo CSV
                </a>
            </div>

            {/* Resultado da importação */}
            {resultado && (
                <div className={`rounded-xl p-6 ${resultado.erros === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                    <div className="flex items-center gap-4 mb-4">
                        {resultado.erros === 0 ? (
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        ) : (
                            <AlertCircle className="h-8 w-8 text-yellow-600" />
                        )}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Importação Concluída</h3>
                            <p className="text-gray-600">
                                {resultado.importados} de {resultado.total} moradores importados com sucesso
                            </p>
                        </div>
                    </div>

                    {resultado.erros > 0 && (
                        <div className="mt-4 bg-white rounded-lg p-4 max-h-48 overflow-y-auto">
                            <p className="text-sm font-medium text-red-700 mb-2">Erros ({resultado.erros}):</p>
                            {resultado.detalhes.filter(d => !d.success).map((d, i) => (
                                <div key={i} className="text-sm text-red-600 py-1">
                                    Linha {d.linha}: {d.nome} - {d.erro}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-4 flex gap-3">
                        <Link
                            href="/moradores"
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            Ver Moradores
                        </Link>
                        <button
                            onClick={() => { setDados([]); setResultado(null); }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Nova Importação
                        </button>
                    </div>
                </div>
            )}

            {/* Upload Area */}
            {!resultado && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors"
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        {loading ? (
                            <Loader2 className="h-12 w-12 text-emerald-600 mx-auto animate-spin" />
                        ) : (
                            <>
                                <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-lg font-medium text-gray-700 mb-2">
                                    Clique para selecionar ou arraste o arquivo CSV
                                </p>
                                <p className="text-sm text-gray-500">
                                    Formato: nome, email, telefone, bloco, unidade, tipo
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Preview Table */}
            {dados.length > 0 && !resultado && (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="p-4 border-b flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Users className="h-5 w-5 text-emerald-600" />
                            <span className="font-medium text-gray-900">
                                {dados.length} registros encontrados
                            </span>
                            {totalValidos > 0 && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                    {totalValidos} válidos
                                </span>
                            )}
                            {totalInvalidos > 0 && (
                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                    {totalInvalidos} com erros
                                </span>
                            )}
                        </div>
                        <button
                            onClick={handleImport}
                            disabled={importing || totalValidos === 0}
                            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                            {importing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Upload className="h-4 w-4" />
                            )}
                            {importing ? 'Importando...' : `Importar ${totalValidos} Moradores`}
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bloco</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidade</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {dados.map((row, index) => (
                                    <tr key={index} className={row.valido ? '' : 'bg-red-50'}>
                                        <td className="px-4 py-3 text-sm text-gray-500">{index + 2}</td>
                                        <td className="px-4 py-3">
                                            {row.valido ? (
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <XCircle className="h-5 w-5 text-red-500" />
                                                    <span className="text-xs text-red-600">{row.erro}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.nome}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{row.email}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{row.telefone || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{row.bloco || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{row.unidade}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.tipo.toLowerCase() === 'proprietario'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-purple-100 text-purple-700'
                                                }`}>
                                                {row.tipo}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Instruções */}
            {dados.length === 0 && !resultado && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="font-semibold text-blue-800 mb-3">📋 Como usar</h3>
                    <ol className="space-y-2 text-sm text-blue-700">
                        <li>1. Baixe o <strong>modelo CSV</strong> clicando no botão acima</li>
                        <li>2. Preencha os dados dos moradores no Excel/Google Sheets</li>
                        <li>3. Salve como <strong>CSV (separado por vírgulas)</strong></li>
                        <li>4. Faça upload do arquivo aqui</li>
                        <li>5. Revise os dados e clique em <strong>Importar</strong></li>
                    </ol>

                    <div className="mt-4 bg-white rounded-lg p-4">
                        <p className="text-xs text-gray-500 uppercase font-bold mb-2">Campos obrigatórios:</p>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">nome</span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">email</span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">unidade</span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">tipo (proprietario/inquilino)</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
