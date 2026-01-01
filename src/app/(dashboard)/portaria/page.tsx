'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import {
    Shield, User, RefreshCw, Maximize2, Minimize2, Search, QrCode,
    Camera, Car, Package, Users, Clock, Calendar, ChevronRight,
    MapPin, LogOut
} from 'lucide-react';
import Tesseract from 'tesseract.js';
import { QRCodeScanner } from '@/components/invites';

interface Visitor {
    id: string;
    nome: string;
    documento: string;
    tipo: string;
    placa_veiculo: string;
    data_hora_entrada: string;
    data_hora_saida: string | null;
    unidade: { bloco: string; numero_unidade: string } | null;
    registrado_por: { nome: string } | null;
    observacoes: string;
    foto_url: string | null;
}

interface PendingInvite {
    id: string;
    guest_name: string;
    visit_date: string;
    visit_time_start: string;
    visit_time_end: string;
    status: string;
    unit: { bloco: string; numero_unidade: string } | null;
    creator: { nome: string } | null;
}

export default function PortariaPage() {
    const { session } = useAuth();
    const { condoId, profile } = useUser();
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [activeVisitors, setActiveVisitors] = useState<Visitor[]>([]);
    const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Search & Filter
    const [searchTerm, setSearchTerm] = useState('');
    const [timeFilter, setTimeFilter] = useState('Hoje');

    // Modals
    const [showModal, setShowModal] = useState(false);
    const [showCameraModal, setShowCameraModal] = useState(false);
    const [scanMode, setScanMode] = useState<'doc' | 'qr'>('doc');
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const supabase = createClient();

    // Form states
    const [nome, setNome] = useState('');
    const [documento, setDocumento] = useState('');
    const [tipo, setTipo] = useState('visitante');
    const [tipoFixo, setTipoFixo] = useState(false);
    const [placa, setPlaca] = useState('');
    const [unidadeId, setUnidadeId] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [saving, setSaving] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [units, setUnits] = useState<any[]>([]);

    // Time
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (condoId) {
            fetchVisitors();
            fetchUnits();
            const interval = setInterval(() => {
                fetchVisitors();
            }, 30000);
            return () => clearInterval(interval);
        }
    }, [condoId]);

    useEffect(() => {
        if (condoId) {
            fetchPendingInvites();
        }
    }, [condoId, timeFilter]);

    const fetchVisitors = async () => {
        // const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase
            .from('visitors')
            .select('*, unidade:units(bloco, numero_unidade), registrado_por:users!registrado_por_user_id(nome)')
            .eq('condo_id', condoId)
            .order('data_hora_entrada', { ascending: false })
            .limit(100);

        if (data) {
            setVisitors(data);
            setActiveVisitors(data.filter(v => !v.data_hora_saida));
        }
        setLoading(false);
    };

    const fetchPendingInvites = async () => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        let startDate = todayStr;
        let endDate = todayStr;

        if (timeFilter === 'Semana') {
            const weekEnd = new Date(today);
            weekEnd.setDate(today.getDate() + 7);
            endDate = weekEnd.toISOString().split('T')[0];
        } else if (timeFilter === 'Mês') {
            const monthEnd = new Date(today);
            monthEnd.setMonth(today.getMonth() + 1);
            endDate = monthEnd.toISOString().split('T')[0];
        } else if (timeFilter === 'Todos') {
            startDate = '2000-01-01';
            endDate = '2100-01-01';
        }

        let query = supabase
            .from('guest_invites')
            .select('*, unit:units(bloco, numero_unidade), creator:users!created_by(nome)')
            .eq('condo_id', condoId)
            .in('status', ['pending', 'used'])
            .gte('visit_date', startDate)
            .lte('visit_date', endDate)
            .order('status', { ascending: false })
            .order('visit_date', { ascending: true })
            .order('visit_time_start', { ascending: true });

        const { data } = await query;
        setPendingInvites(data || []);
    };

    const fetchUnits = async () => {
        const { data } = await supabase
            .from('units')
            .select('id, bloco, numero_unidade')
            .eq('condo_id', condoId)
            .order('bloco')
            .order('numero_unidade');
        setUnits(data || []);
    };

    const handleEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nome) return;

        setSaving(true);
        const { error } = await supabase.from('visitors').insert({
            condo_id: condoId,
            nome,
            documento,
            tipo,
            placa_veiculo: placa,
            unidade_id: unidadeId || null,
            observacoes,
            registrado_por_user_id: profile?.id,
        });

        if (error) {
            alert('Erro ao registrar: ' + error.message);
        } else {
            resetForm();
            setShowModal(false);
            fetchVisitors();
        }
        setSaving(false);
    };

    const handleExit = async (id: string) => {
        await supabase
            .from('visitors')
            .update({ data_hora_saida: new Date().toISOString() })
            .eq('id', id);
        fetchVisitors();
    };

    const filteredVisitors = visitors.filter(v => {
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const matchName = v.nome?.toLowerCase().includes(term);
            const matchDoc = v.documento?.toLowerCase().includes(term);
            const matchPlaca = v.placa_veiculo?.toLowerCase().includes(term);
            return matchName || matchDoc || matchPlaca;
        }
        return true;
    });

    const startCamera = async (mode: 'doc' | 'qr' = 'doc') => {
        setScanMode(mode);
        if (mode === 'doc') {
            setShowCameraModal(true);
            try {
                setTimeout(async () => {
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
                        if (videoRef.current) {
                            videoRef.current.srcObject = stream;
                        }
                    } catch (e) {
                        // Camera error or permission
                    }
                }, 100);
            } catch (err) {
                alert('Não foi possível acessar a câmera');
            }
        } else {
            setShowCameraModal(true);
            // QRCodeScanner handles its own camera start
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    };

    const captureAndScanDocument = () => {
        if (videoRef.current && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            ctx?.drawImage(videoRef.current, 0, 0);
            const photoData = canvasRef.current.toDataURL('image/jpeg');
            setCapturedPhoto(photoData);

            stopCamera();
            setShowCameraModal(false);
            handleScanDocument(photoData);

            setTipo('visitante');
            setShowModal(true);
        }
    };

    const isLikelyRealName = (candidate: string): boolean => {
        if (/[BCDFGHJKLMNPQRSTVWXYZ]{4,}/i.test(candidate)) return false;
        if (/[ÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÄËÏÖÜÇ]{2,}/i.test(candidate)) return false;
        const vowels = (candidate.match(/[AEIOUÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÄËÏÖÜÇ]/gi) || []).length;
        const consonants = (candidate.match(/[BCDFGHJKLMNPQRSTVWXYZ]/gi) || []).length;
        if (consonants > 0 && vowels / consonants < 0.25) return false;
        return true;
    };

    const extractName = (text: string): string | null => {
        const labelPatterns = [
            /NOME[:\s]+([A-ZÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÄËÏÖÜÇ][A-ZÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÄËÏÖÜÇa-záéíóúâêîôûàèìòùäëïöüç\s]+)/i,
            /NOME\s*:\s*([^\n]+)/i,
        ];
        for (const pattern of labelPatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                const name = match[1].trim().split('\n')[0].trim();
                if (name.length >= 5 && isLikelyRealName(name)) return name.toUpperCase();
            }
        }
        const lines = text.split('\n');
        for (const line of lines) {
            const clean = line.trim();
            if (/^[A-Z\s]+$/.test(clean) && clean.length > 8 && isLikelyRealName(clean)) {
                return clean.toUpperCase();
            }
        }
        return null;
    };

    const extractCPF = (text: string): string | null => {
        const match = text.match(/(\d{3}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?\d{2})/);
        return match ? match[0] : null;
    };

    const handleScanDocument = async (imageData: string) => {
        setIsScanning(true);
        try {
            const response = await fetch('/api/ai/ocr-document', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageData }),
            });

            let data = null;
            if (response.ok) {
                data = await response.json();
            }

            if (data?.name || data?.doc) {
                if (data.name) setNome(data.name);
                if (data.doc) setDocumento(data.doc);
            } else {
                throw new Error('Groq no result');
            }

        } catch (error) {
            console.log('Falling back to Tesseract...');
            try {
                const result = await Tesseract.recognize(imageData, 'por');
                const text = result.data.text;
                const name = extractName(text);
                const doc = extractCPF(text);
                if (name) setNome(name);
                if (doc) setDocumento(doc);
                if (!name && !doc) alert('OCR não identificou dados claros. Preencha manualmente.');
            } catch (err) {
                console.error(err);
                alert('Erro no OCR.');
            }
        } finally {
            setIsScanning(false);
        }
    };

    const resetForm = () => {
        setNome('');
        setDocumento('');
        setTipo('visitante');
        setTipoFixo(false);
        setPlaca('');
        setUnidadeId('');
        setObservacoes('');
        setCapturedPhoto(null);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    return (
        <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 ${isFullscreen ? 'p-4' : ''}`}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                        <Shield className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Portaria</h2>
                        <p className="text-sm text-slate-500">
                            {currentTime.toLocaleDateString('pt-BR')} - {currentTime.toLocaleTimeString('pt-BR')}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchVisitors} className="p-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors" title="Atualizar">
                        <RefreshCw className="w-5 h-5 text-slate-600" />
                    </button>
                    <button onClick={toggleFullscreen} className="p-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors" title="Tela Cheia">
                        {isFullscreen ? <Minimize2 className="w-5 h-5 text-slate-600" /> : <Maximize2 className="w-5 h-5 text-slate-600" />}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button
                    onClick={() => { setTipo('visitante'); setTipoFixo(false); setShowModal(true); }}
                    className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] text-left"
                >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                            <Users className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Novo Registro</h3>
                        <p className="text-blue-100 text-sm">Visitante, Prestador ou Veículo</p>
                    </div>
                    <ChevronRight className="absolute bottom-6 right-6 w-6 h-6 opacity-60" />
                </button>

                <button
                    onClick={() => startCamera('doc')}
                    className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] text-left"
                >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                            <QrCode className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Scan Inteligente</h3>
                        <p className="text-purple-100 text-sm">QR Code, Placa ou Face ID</p>
                        <div className="flex gap-2 mt-3">
                            <span className="px-2 py-1 bg-white/20 rounded text-xs font-medium">OCR</span>
                            <span className="px-2 py-1 bg-white/20 rounded text-xs font-medium">AI</span>
                        </div>
                    </div>
                    <ChevronRight className="absolute bottom-6 right-6 w-6 h-6 opacity-60" />
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <Shield className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Agora</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-1">{activeVisitors.length}</p>
                    <p className="text-sm text-slate-500">No Condomínio</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <Clock className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-1">{visitors.length}</p>
                    <p className="text-sm text-slate-500">Entradas Hoje</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-orange-600" />
                        </div>
                        <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded">Novo</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-1">{visitors.filter(v => v.tipo === 'entrega').length}</p>
                    <p className="text-sm text-slate-500">Entregas</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                            <Car className="w-5 h-5 text-violet-600" />
                        </div>
                        <Calendar className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-1">
                        {visitors.filter(v => !!v.placa_veiculo).length}
                    </p>
                    <p className="text-sm text-slate-500">Veículos Registrados</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
                <div className="p-4 border-b border-slate-200">
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por CPF, placa ou nome..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={timeFilter}
                            onChange={(e) => setTimeFilter(e.target.value)}
                            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-700 font-medium"
                        >
                            <option>Hoje</option>
                            <option>Semana</option>
                            <option>Mês</option>
                            <option>Todos</option>
                        </select>
                    </div>
                </div>

                <div className="p-0">
                    {filteredVisitors.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {filteredVisitors.map(visitor => (
                                <div key={visitor.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden">
                                            {visitor.foto_url ? (
                                                <img src={visitor.foto_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-5 h-5 text-slate-400" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{visitor.nome}</p>
                                            <p className="text-xs text-slate-500">
                                                {visitor.documento} • {visitor.placa_veiculo ? `${visitor.placa_veiculo} • ` : ''}
                                                {visitor.tipo.toUpperCase()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                                                <Clock className="w-3 h-3" />
                                                {new Date(visitor.data_hora_entrada).toLocaleTimeString('pt-BR').substring(0, 5)}
                                            </div>
                                            {visitor.unidade && (
                                                <div className="flex items-center gap-1 text-slate-400 text-xs">
                                                    <MapPin className="w-3 h-3" />
                                                    {visitor.unidade.bloco}-{visitor.unidade.numero_unidade}
                                                </div>
                                            )}
                                        </div>
                                        {!visitor.data_hora_saida ? (
                                            <button
                                                onClick={() => handleExit(visitor.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Registrar Saída"
                                            >
                                                <LogOut className="w-5 h-5" />
                                            </button>
                                        ) : (
                                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Saiu</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            Nenhum registro encontrado.
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <QrCode className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-slate-900">
                        Convites ({pendingInvites.filter(i => i.status === 'pending').length} pendentes / {pendingInvites.filter(i => i.status === 'used').length} liberados)
                    </h3>
                </div>

                {pendingInvites.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <QrCode className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500">Nenhum convite pendente para o período selecionado</p>
                        <p className="text-sm text-slate-400 mt-1">Use o botão "Scan Inteligente" para validar QR Codes</p>
                    </div>
                ) : (
                    <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {pendingInvites.map(invite => (
                            <div key={invite.id} className="border border-slate-200 rounded-lg p-4 flex items-start gap-3 hover:border-purple-300 transition-colors">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${invite.status === 'pending' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>
                                    <QrCode className="w-5 h-5" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-bold text-slate-900 truncate">{invite.guest_name}</p>
                                    <p className="text-xs text-slate-500">
                                        {new Date(invite.visit_date).toLocaleDateString()} • {invite.visit_time_start.substring(0, 5)}
                                    </p>
                                    {invite.unit && (
                                        <p className="text-xs text-slate-400">
                                            Apto: {invite.unit.bloco}-{invite.unit.numero_unidade}
                                        </p>
                                    )}
                                    <div className={`mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${invite.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                        {invite.status === 'pending' ? 'Aguardando' : 'Liberado'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Camera className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 mb-1">Portaria 4.0 com IA</h4>
                        <p className="text-sm text-slate-600">
                            Use o <span className="font-semibold">Scan Inteligente</span> para reconhecimento facial automático (AWS Rekognition / Groq),
                            leitura de placas (OCR) ou validação de QR Codes de convites.
                        </p>
                    </div>
                </div>
            </div>


            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Novo Registro">
                <form onSubmit={handleEntry} className="space-y-4">
                    {capturedPhoto && (
                        <div className="mb-4 text-center">
                            <img src={capturedPhoto} alt="Captura" className="h-32 mx-auto rounded-lg border border-slate-200" />
                        </div>
                    )}

                    {!tipoFixo && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tipo de Entrada</label>
                            <select
                                value={tipo}
                                onChange={(e) => setTipo(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                            >
                                <option value="visitante">Visitante</option>
                                <option value="prestador_servico">Prestador de Serviço</option>
                                <option value="entrega">Entrega / Veículo</option>
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                        <input
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Documento (CPF/RG)</label>
                            <input
                                type="text"
                                value={documento}
                                onChange={(e) => setDocumento(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Placa Veículo</label>
                            <input
                                type="text"
                                value={placa}
                                onChange={(e) => setPlaca(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Unidade de Destino</label>
                        <select
                            value={unidadeId}
                            onChange={(e) => setUnidadeId(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                        >
                            <option value="">Selecione...</option>
                            {units.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.bloco} - {u.numero_unidade}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Observações</label>
                        <textarea
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                            rows={2}
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 from-slate-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                        >
                            {saving ? 'Salvando...' : 'Registrar Entrada'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={showCameraModal} onClose={() => { setShowCameraModal(false); stopCamera(); }} title="Scan Inteligente">
                <div className="space-y-4">
                    <div className="flex p-1 bg-slate-100 rounded-lg">
                        <button
                            onClick={() => startCamera('doc')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${scanMode === 'doc' ? 'bg-white shadow text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Facial / Documento
                        </button>
                        <button
                            onClick={() => setScanMode('qr')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${scanMode === 'qr' ? 'bg-white shadow text-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            QR Code
                        </button>
                    </div>

                    {scanMode === 'doc' ? (
                        <>
                            <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                <canvas ref={canvasRef} className="hidden" />

                                <div className="absolute inset-0 border-2 border-emerald-500/50 pointer-events-none">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-40 border-2 border-emerald-400 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={captureAndScanDocument}
                                    disabled={isScanning}
                                    className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    {isScanning ? (
                                        <>Processing...</>
                                    ) : (
                                        <>
                                            <Camera className="w-5 h-5" />
                                            Capturar e Analisar
                                        </>
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-center text-slate-500">
                                O sistema irá extrair automaticamente Nome e CPF do documento usando IA (Groq/NVIDIA).
                            </p>
                        </>
                    ) : (
                        <div className="py-4">
                            <QRCodeScanner />
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
