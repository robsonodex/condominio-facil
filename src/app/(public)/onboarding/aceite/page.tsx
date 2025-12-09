'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, Button } from '@/components/ui';
import { CheckCircle, XCircle, FileText, Shield, DollarSign, ScrollText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface LegalDocument {
    type: string;
    version: string;
    hash: string;
    content: string;
}

export default function AceitePage() {
    const router = useRouter();
    const supabase = createClient();

    const [documents, setDocuments] = useState<LegalDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [accepted, setAccepted] = useState(false);
    const [scrolledToEnd, setScrolledToEnd] = useState(false);
    const [plan, setPlan] = useState('Básico');

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const res = await fetch('/api/legal/documents');
            const data = await res.json();

            if (res.ok) {
                setDocuments(data.documents);
                setPlan(data.plan);
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const element = e.currentTarget;
        const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;

        if (isAtBottom && !scrolledToEnd) {
            setScrolledToEnd(true);
        }
    };

    const handleAccept = async () => {
        if (!accepted) {
            alert('Por favor, marque a caixa de confirmação para continuar.');
            return;
        }

        setAccepting(true);

        try {
            const documentsToAccept = documents.map(doc => ({
                document_type: doc.type,
                document_version: doc.version,
                document_hash: doc.hash
            }));

            const res = await fetch('/api/legal/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documents: documentsToAccept })
            });

            const data = await res.json();

            if (res.ok) {
                alert('✅ Aceite registrado com sucesso! Você será redirecionado para o sistema.');
                router.push('/dashboard');
            } else {
                // Erro 401 = não autenticado
                if (res.status === 401) {
                    alert('❌ Sessão expirada. Você será redirecionado para fazer login novamente.');
                    router.push('/login?message=Sessão expirada. Faça login para aceitar os termos.');
                } else {
                    alert(`❌ Erro: ${data.error || 'Erro ao registrar aceite'}`);
                }
            }
        } catch (error) {
            alert('Erro ao registrar aceite. Tente novamente.');
        } finally {
            setAccepting(false);
        }
    };

    const handleReject = async () => {
        const confirm = window.confirm(
            'Ao recusar os termos, você será desconectado. Deseja continuar?'
        );

        if (confirm) {
            await supabase.auth.signOut();
            router.push('/');
        }
    };

    const getDocumentIcon = (type: string) => {
        switch (type) {
            case 'termos_uso':
                return <FileText className="h-5 w-5" />;
            case 'politica_privacidade':
                return <Shield className="h-5 w-5" />;
            case 'contrato_plano':
                return <ScrollText className="h-5 w-5" />;
            case 'politica_cobranca':
                return <DollarSign className="h-5 w-5" />;
            default:
                return <FileText className="h-5 w-5" />;
        }
    };

    const getDocumentTitle = (type: string) => {
        switch (type) {
            case 'termos_uso':
                return 'Termos de Uso';
            case 'politica_privacidade':
                return 'Política de Privacidade';
            case 'contrato_plano':
                return `Contrato do Plano ${plan}`;
            case 'politica_cobranca':
                return 'Política de Cobrança';
            default:
                return 'Documento Legal';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Bem-vindo ao Condomínio Fácil
                    </h1>
                    <p className="text-gray-600">
                        Para continuar, você precisa aceitar nossos termos e políticas
                    </p>
                </div>

                {/* Alert */}
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                            <p className="font-medium text-yellow-900">Aceite Obrigatório</p>
                            <p className="text-sm text-yellow-700 mt-1">
                                Seu aceite é necessário para acessar o sistema. Leia todos os documentos com atenção.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Documents */}
                <Card className="mb-6">
                    <CardContent className="p-6">
                        <div
                            className="space-y-8 max-h-[500px] overflow-y-auto pr-4"
                            onScroll={handleScroll}
                        >
                            {documents.map((doc, index) => (
                                <div key={index} className="border-b pb-6 last:border-b-0">
                                    <div className="flex items-center gap-2 mb-4">
                                        {getDocumentIcon(doc.type)}
                                        <h2 className="text-xl font-bold text-gray-900">
                                            {getDocumentTitle(doc.type)}
                                        </h2>
                                        <span className="text-xs text-gray-500">v{doc.version}</span>
                                    </div>
                                    <div className="prose prose-sm max-w-none">
                                        <ReactMarkdown>{doc.content}</ReactMarkdown>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {!scrolledToEnd && (
                            <div className="mt-4 text-center text-sm text-gray-500">
                                ⬇️ Role até o final para habilitar o aceite
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Acceptance Checkbox */}
                <Card className="mb-6">
                    <CardContent className="p-6">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={accepted}
                                onChange={(e) => setAccepted(e.target.checked)}
                                disabled={!scrolledToEnd}
                                className="mt-1 h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                            />
                            <span className={`text-gray-700 ${!scrolledToEnd ? 'opacity-50' : ''}`}>
                                <strong>Confirmo que li e aceito</strong> todos os termos de uso,
                                política de privacidade, contrato do plano {plan} e política de cobrança
                                do sistema Condomínio Fácil.
                            </span>
                        </label>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-4 justify-center">
                    <Button
                        variant="ghost"
                        onClick={handleReject}
                        disabled={accepting}
                        className="min-w-[150px]"
                    >
                        <XCircle className="h-4 w-4 mr-2" />
                        Recusar e Sair
                    </Button>
                    <Button
                        onClick={handleAccept}
                        disabled={!accepted || accepting}
                        loading={accepting}
                        className="min-w-[150px]"
                    >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aceitar e Continuar
                    </Button>
                </div>

                {/* Footer Info */}
                <div className="mt-8 text-center text-xs text-gray-500">
                    <p>Seu aceite será registrado com data/hora, endereço IP e hash dos documentos</p>
                    <p className="mt-1">para fins de auditoria e conformidade com a LGPD.</p>
                </div>
            </div>
        </div>
    );
}
