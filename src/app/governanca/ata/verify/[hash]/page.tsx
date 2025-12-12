'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertTriangle, QrCode, Building } from 'lucide-react';

interface VerifyResult {
    valid: boolean;
    assembly_id?: string;
    assembly_title?: string;
    assembly_date?: string;
    condo_name?: string;
    generated_at?: string;
    message?: string;
}

export default function VerifyAtaPage() {
    const params = useParams();
    const hash = params.hash as string;

    const [result, setResult] = useState<VerifyResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function verify() {
            try {
                const res = await fetch(`/api/governanca/ata/verify/${hash}`);
                const json = await res.json();
                setResult(json);
            } catch (e) {
                setResult({ valid: false, message: 'Erro ao verificar documento' });
            } finally {
                setLoading(false);
            }
        }
        verify();
    }, [hash]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Verificando documento...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="max-w-lg w-full">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4">
                        {result?.valid ? (
                            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle className="w-12 h-12 text-green-600" />
                            </div>
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                                <XCircle className="w-12 h-12 text-red-600" />
                            </div>
                        )}
                    </div>
                    <CardTitle className={result?.valid ? 'text-green-700' : 'text-red-700'}>
                        {result?.valid ? 'Documento Válido' : 'Documento Inválido'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {result?.valid ? (
                        <>
                            <p className="text-center text-gray-600 mb-6">
                                Este documento foi gerado oficialmente pelo sistema Condomínio Fácil e não foi adulterado.
                            </p>

                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500">Condomínio</p>
                                        <p className="font-semibold">{result.condo_name}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <QrCode className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500">Assembleia</p>
                                        <p className="font-semibold">{result.assembly_title}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500">Ata gerada em</p>
                                        <p className="font-semibold">
                                            {result.generated_at && new Date(result.generated_at).toLocaleString('pt-BR')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-xs text-green-700 font-mono break-all">
                                    SHA256: {hash}
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="text-center">
                            <p className="text-gray-600 mb-4">
                                {result?.message || 'Este documento não foi encontrado ou pode ter sido adulterado.'}
                            </p>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-sm text-red-700">
                                    ⚠️ Não confie neste documento. Solicite uma cópia oficial ao síndico do condomínio.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="text-center pt-4">
                        <p className="text-xs text-gray-400">
                            Verificado por Condomínio Fácil
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
