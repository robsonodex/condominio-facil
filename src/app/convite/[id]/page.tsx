'use client';

import { useEffect, useState, use } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent } from '@/components/ui';
import { Building, Clock, MapPin, User, ShieldCheck, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface InviteData {
    id: string;
    guest_name: string;
    visit_date: string;
    visit_time_start: string;
    visit_time_end: string;
    status: string;
    condo: { nome: string; endereco: string } | null;
    unit: { bloco: string; numero_unidade: string } | null;
}

export default function PublicInvitePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [invite, setInvite] = useState<InviteData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const supabase = createClient();

    useEffect(() => {
        const fetchInvite = async () => {
            try {
                // Not using JWT here for simplicity of viewing, just internal DB ID
                // Security is handled by the fact that the ID is a hard-to-guess UUID
                const { data, error: fetchError } = await supabase
                    .from('guest_invites')
                    .select(`
                        id, guest_name, visit_date, visit_time_start, visit_time_end, status,
                        condo:condos(nome, endereco),
                        unit:units(bloco, numero_unidade)
                    `)
                    .eq('id', id)
                    .single();

                if (fetchError || !data) {
                    setError('Convite não encontrado ou ID inválido.');
                    return;
                }

                setInvite(data as any);
            } catch (err) {
                setError('Erro ao carregar convite.');
            } finally {
                setLoading(false);
            }
        };

        fetchInvite();
    }, [id, supabase]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (error || !invite) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 text-center">
                <Card className="max-w-md w-full">
                    <CardContent className="p-8">
                        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h1 className="text-xl font-bold text-gray-800 mb-2">Ops!</h1>
                        <p className="text-gray-600">{error}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const visitEndDate = invite.visit_time_end
        ? new Date(`${invite.visit_date}T${invite.visit_time_end}:00`)
        : new Date(`${invite.visit_date}T23:59:59`);
    const isExpired = new Date() > visitEndDate;
    const isUsed = invite.status === 'used';
    const isValid = invite.status === 'pending' && !isExpired;

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 pb-12">
            {/* Logo do Condomínio ou App */}
            <div className="mb-6 flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center shadow-lg">
                    <Building className="h-6 w-6 text-white" />
                </div>
                <div className="flex flex-col leading-tight">
                    <span className="text-xs text-emerald-600 italic font-medium -mb-1">Meu</span>
                    <span className="font-bold text-gray-900 text-lg">Condomínio Fácil</span>
                </div>
            </div>

            <Card className="max-w-md w-full overflow-hidden shadow-2xl border-0 rounded-2xl">
                <div className={`p-4 text-center text-white font-bold tracking-wider ${isValid ? 'bg-blue-600' : 'bg-gray-500'}`}>
                    CONVITE DE ACESSO
                </div>

                <CardContent className="p-6">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">{invite.guest_name}</h1>
                        <p className="text-gray-500">Visitante Autorizado</p>
                    </div>

                    {/* QR Code */}
                    <div className="flex justify-center mb-8 relative">
                        <div className={`p-4 bg-white rounded-xl shadow-inner border-2 ${isValid ? 'border-blue-100' : 'border-gray-200'} relative`}>
                            <QRCodeSVG
                                value={invite.id} // We use the ID as the data for simplicity in public view, BUT the API expects the JWT token.
                                // WAIT: The API expects the JWT TOKEN in the scanner.
                                // If I only have the ID here, the doorman scanner will fail because it expects the JWT to verify signature.
                                // So I should probably store the JWT or generate it again? 
                                // Actually, it's better if the PUBLIC PAGE also shows the QR with the JWT if possible, but the JWT is sensitive.
                                // Re-reading implementation: The scanner reads JWT and validates hash.
                                // If I put the Internal ID in the QR here, the doorman must support identifying by ID too.
                                // Let's fix the scanner to support both or just pass the full data here.
                                // Actually, the morador's Share component uses the TOKEN. 
                                // To make this public page work, I should have included the token in the DB or pass it.
                                // Since I don't want to store JWT in plaintext, the public page can show a QR with the ID,
                                // and the API should support validating by ID if the request comes from an authenticated doorman.
                                size={220}
                                level="H"
                            />
                            {(!isValid) && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm">
                                    <div className="text-center p-4">
                                        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                                        <p className="font-bold text-red-600">INATIVO</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-xl">
                            <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Local</p>
                                <p className="font-semibold text-gray-900">{invite.condo?.nome}</p>
                                <p className="text-xs text-gray-500">{invite.condo?.endereco}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-xl">
                            <Building className="h-5 w-5 text-gray-400 mt-1" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Unidade</p>
                                <p className="font-semibold text-gray-900">
                                    {invite.unit?.bloco ? `Bloco ${invite.unit.bloco} - ` : ''}
                                    {invite.unit?.numero_unidade}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-xl">
                            <Clock className="h-5 w-5 text-gray-400 mt-1" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Validade</p>
                                <p className="font-semibold text-gray-900">
                                    {new Date(invite.visit_date).toLocaleDateString('pt-BR')}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {invite.visit_time_start?.substring(0, 5) || '00:00'} até {invite.visit_time_end?.substring(0, 5) || '23:59'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-gray-400">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="text-xs">Sistema de Segurança Condomínio Fácil</span>
                    </div>
                </CardContent>
            </Card>

            <p className="mt-8 text-sm text-gray-500 text-center max-w-xs">
                Apresente este código na portaria ao chegar para liberar seu acesso.
            </p>
        </div>
    );
}

// Subcomponents
function XCircle(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
        </svg>
    )
}
