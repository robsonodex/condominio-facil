'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { FileText, AlertTriangle, CheckCircle, XCircle, ExternalLink, Loader2, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useCondo } from '@/hooks/useUser';

interface Certificate {
    id: string;
    name: string;
    type: 'CBMERJ' | 'RIA_ELEVADORES' | 'SEGURO_PREDIAL' | 'LIMPEZA_CISTERNA' | 'OUTROS';
    issued_at: string;
    expires_at: string;
    document_url: string;
}

type CertificateStatus = 'valid' | 'warning' | 'critical' | 'expired';

const TYPE_LABELS: Record<string, string> = {
    'CBMERJ': 'CBMERJ',
    'RIA_ELEVADORES': 'RIA Elevadores',
    'SEGURO_PREDIAL': 'Seguro Predial',
    'LIMPEZA_CISTERNA': 'Limpeza Cisterna',
    'OUTROS': 'Outros',
};

function getStatus(expiresAt: string): CertificateStatus {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiresAt);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'expired';
    if (diffDays <= 7) return 'critical';
    if (diffDays <= 60) return 'warning';
    return 'valid';
}

function getDaysUntilExpiry(expiresAt: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiresAt);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function StatusIcon({ status }: { status: CertificateStatus }) {
    switch (status) {
        case 'valid':
            return <CheckCircle className="h-4 w-4 text-emerald-500" />;
        case 'warning':
            return <AlertTriangle className="h-4 w-4 text-amber-500" />;
        case 'critical':
            return <XCircle className="h-4 w-4 text-red-500 animate-pulse" />;
        case 'expired':
            return <XCircle className="h-4 w-4 text-red-600" />;
    }
}

function StatusBadge({ status, daysLeft }: { status: CertificateStatus; daysLeft: number }) {
    const config: Record<CertificateStatus, { variant: 'success' | 'warning' | 'danger'; label: string }> = {
        valid: { variant: 'success', label: `${daysLeft} dias` },
        warning: { variant: 'warning', label: `${daysLeft} dias` },
        critical: { variant: 'danger', label: daysLeft === 0 ? 'Vence Hoje!' : `${daysLeft} dias!` },
        expired: { variant: 'danger', label: 'Vencido' },
    };

    const { variant, label } = config[status];

    return (
        <Badge
            variant={variant}
            className={status === 'critical' ? 'animate-pulse' : ''}
        >
            {label}
        </Badge>
    );
}

export function CertificatesWidget() {
    const { condo } = useCondo();
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (!condo?.id) return;

        const fetchCertificates = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('condo_certificates')
                    .select('*')
                    .eq('condo_id', condo.id)
                    .order('expires_at', { ascending: true });

                if (error) throw error;
                setCertificates(data || []);
            } catch (error) {
                console.error('Erro ao carregar certificados:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCertificates();
    }, [condo?.id]);

    const handleOpenDocument = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    // Summary counts
    const expiredCount = certificates.filter(c => getStatus(c.expires_at) === 'expired').length;
    const criticalCount = certificates.filter(c => getStatus(c.expires_at) === 'critical').length;
    const warningCount = certificates.filter(c => getStatus(c.expires_at) === 'warning').length;

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-emerald-600" />
                        <CardTitle className="text-base">Certificados e Compliance</CardTitle>
                    </div>
                    {(expiredCount > 0 || criticalCount > 0) && (
                        <Badge variant="danger" className="animate-pulse">
                            {expiredCount + criticalCount} pendente(s)
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                ) : certificates.length === 0 ? (
                    <div className="text-center py-6">
                        <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Nenhum certificado cadastrado</p>
                        <a
                            href="/configuracoes/certificados"
                            className="text-sm text-emerald-600 hover:underline mt-2 inline-flex items-center gap-1"
                        >
                            <Plus className="h-3 w-3" />
                            Adicionar certificado
                        </a>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {/* Summary bar */}
                        {certificates.length > 0 && (
                            <div className="flex items-center gap-3 text-xs text-gray-500 pb-2 border-b">
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    {certificates.filter(c => getStatus(c.expires_at) === 'valid').length} OK
                                </span>
                                {warningCount > 0 && (
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                        {warningCount} Atenção
                                    </span>
                                )}
                                {(expiredCount + criticalCount) > 0 && (
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                        {expiredCount + criticalCount} Urgente
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Certificates list */}
                        {certificates.map((cert) => {
                            const status = getStatus(cert.expires_at);
                            const daysLeft = getDaysUntilExpiry(cert.expires_at);

                            return (
                                <button
                                    key={cert.id}
                                    onClick={() => handleOpenDocument(cert.document_url)}
                                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all hover:shadow-md ${status === 'expired' || status === 'critical'
                                        ? 'bg-red-50 border border-red-200 hover:bg-red-100'
                                        : status === 'warning'
                                            ? 'bg-amber-50 border border-amber-200 hover:bg-amber-100'
                                            : 'bg-gray-50 border border-gray-100 hover:bg-gray-100'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <StatusIcon status={status} />
                                        <div>
                                            <p className="font-medium text-sm text-gray-900">
                                                {cert.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {TYPE_LABELS[cert.type] || cert.type}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <StatusBadge status={status} daysLeft={daysLeft} />
                                        <ExternalLink className="h-4 w-4 text-gray-400" />
                                    </div>
                                </button>
                            );
                        })}

                        {/* Link to management */}
                        <a
                            href="/configuracoes/certificados"
                            className="block text-center text-sm text-emerald-600 hover:underline pt-2"
                        >
                            Gerenciar Certificados →
                        </a>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
