'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, Button, Input, Badge, Select } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import {
    Users, UserPlus, LogIn, LogOut, Search, Camera, Printer, QrCode,
    Clock, Car, CreditCard, Shield, Maximize, Minimize, RefreshCw, MessageSquare, AlertCircle, Scan, Ticket
} from 'lucide-react';
import { QRCodeScanner } from '@/components/invites';
import Tesseract from 'tesseract.js';

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

export default function PortariaProfissionalPage() {
    const { session } = useAuth();
    const { condoId, profile } = useUser();
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [activeVisitors, setActiveVisitors] = useState<Visitor[]>([]);
    const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showCameraModal, setShowCameraModal] = useState(false);
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const supabase = createClient();

    // Form states
    const [nome, setNome] = useState('');
    const [documento, setDocumento] = useState('');
    const [tipo, setTipo] = useState('visitante');
    const [tipoFixo, setTipoFixo] = useState(false); // Se true, não mostra Select de tipo
    const [placa, setPlaca] = useState('');
    const [unidadeId, setUnidadeId] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [saving, setSaving] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    const [units, setUnits] = useState<any[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());

    // WhatsApp notification toggle
    const [notificarWhatsApp, setNotificarWhatsApp] = useState(false);
    const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
    const whatsAppContratado = false; // TODO: Buscar do banco se WhatsApp está contratado

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (condoId) {
            fetchVisitors();
            fetchPendingInvites();
            fetchUnits();
            const interval = setInterval(() => {
                fetchVisitors();
                fetchPendingInvites();
            }, 30000); // Refresh every 30s
            return () => clearInterval(interval);
        }
    }, [condoId]);

    const fetchVisitors = async () => {
        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase
            .from('visitors')
            .select('*, unidade:units(bloco, numero_unidade), registrado_por:users!registrado_por_user_id(nome)')
            .eq('condo_id', condoId)
            .gte('data_hora_entrada', today)
            .order('data_hora_entrada', { ascending: false });

        setVisitors(data || []);
        setActiveVisitors((data || []).filter(v => !v.data_hora_saida));
        setLoading(false);
    };

    const fetchPendingInvites = async () => {
        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase
            .from('guest_invites')
            .select('*, unit:units(bloco, numero_unidade), creator:users!created_by(nome)')
            .eq('condo_id', condoId)
            .eq('status', 'pending')
            .eq('visit_date', today)
            .order('visit_time_start', { ascending: true });

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

    const handleQuickSearch = async () => {
        if (!searchTerm) return;

        const { data } = await supabase
            .from('visitors')
            .select('*, unidade:units(bloco, numero_unidade)')
            .eq('condo_id', condoId)
            .or(`documento.ilike.%${searchTerm}%,placa_veiculo.ilike.%${searchTerm}%,nome.ilike.%${searchTerm}%`)
            .order('data_hora_entrada', { ascending: false })
            .limit(20);

        setVisitors(data || []);
    };

    const startCamera = async () => {
        setShowCameraModal(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            alert('Não foi possível acessar a câmera');
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            ctx?.drawImage(videoRef.current, 0, 0);
            setCapturedPhoto(canvasRef.current.toDataURL('image/jpeg'));

            // Stop camera
            const stream = videoRef.current.srcObject as MediaStream;
            stream?.getTracks().forEach(track => track.stop());
            setShowCameraModal(false);
        }
    };

    // Regex patterns para documentos brasileiros - MELHORADO
    const extractCPF = (text: string): string | null => {
        // CPF: XXX.XXX.XXX-XX ou variações
        const patterns = [
            /(\d{3}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?\d{2})/g,
            /CPF[:\s]*(\d{3}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?\d{2})/gi,
            /(\d{11})/g, // 11 dígitos seguidos
        ];

        for (const pattern of patterns) {
            const matches = text.match(pattern);
            if (matches) {
                for (const match of matches) {
                    const digits = match.replace(/\D/g, '');
                    if (digits.length === 11) {
                        return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                    }
                }
            }
        }
        return null;
    };

    const extractRG = (text: string): string | null => {
        // RG: XX.XXX.XXX-X ou variações
        const patterns = [
            /RG[:\s]*(\d{1,2}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?[\dXx]?)/gi,
            /(\d{1,2}[.\s]\d{3}[.\s]\d{3}[-.\s]?[\dXx])/g,
            /(\d{7,9})/g, // 7-9 dígitos seguidos
        ];

        for (const pattern of patterns) {
            const matches = text.match(pattern);
            if (matches) {
                for (const match of matches) {
                    const digits = match.replace(/\D/g, '');
                    if (digits.length >= 7 && digits.length <= 9) {
                        return match.replace(/[.\s-]/g, '').toUpperCase();
                    }
                }
            }
        }
        return null;
    };

    const extractCNH = (text: string): string | null => {
        // CNH: 9-11 dígitos
        const patterns = [
            /CNH[:\s]*(\d{9,11})/gi,
            /REGISTRO[:\s]*(\d{9,11})/gi,
            /N[°º]?\s*REGISTRO[:\s]*(\d{9,11})/gi,
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        return null;
    };

    const extractName = (text: string): string | null => {
        // Função auxiliar para validar se parece um nome real (não ruído de OCR)
        const isLikelyRealName = (candidate: string): boolean => {
            // Rejeita se tiver muitas consoantes seguidas (ex: "VWLNPTRD" = lixo)
            if (/[BCDFGHJKLMNPQRSTVWXYZ]{4,}/i.test(candidate)) return false;

            // Rejeita se tiver padrões estranhos de caracteres
            if (/[ÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÄËÏÖÜÇ]{2,}/i.test(candidate)) return false; // Acentos consecutivos = lixo

            // Verifica proporção vogais/consoantes (nomes reais têm ~40% vogais)
            const vowels = (candidate.match(/[AEIOUÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÄËÏÖÜÇ]/gi) || []).length;
            const consonants = (candidate.match(/[BCDFGHJKLMNPQRSTVWXYZ]/gi) || []).length;
            if (consonants > 0 && vowels / consonants < 0.25) return false; // Menos de 25% vogais = lixo

            // Verifica se tem pelo menos um "pedaço" que parece nome (2+ letras, vogal, consoante)
            const words = candidate.split(/\s+/);
            const validWords = words.filter(w => w.length >= 2 && /[AEIOU]/i.test(w) && /[BCDFGHJKLMNPQRSTVWXYZ]/i.test(w));
            if (validWords.length < 2) return false; // Nome precisa de 2+ palavras válidas

            return true;
        };

        // Primeiro tenta encontrar nome após labels
        const labelPatterns = [
            /NOME[:\s]+([A-ZÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÄËÏÖÜÇ][A-ZÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÄËÏÖÜÇa-záéíóúâêîôûàèìòùäëïöüç\s]+)/i,
            /NOME\s*:\s*([^\n]+)/i,
            /MOTORISTA[:\s]+([A-ZÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÄËÏÖÜÇ][A-ZÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÄËÏÖÜÇa-záéíóúâêîôûàèìòùäëïöüç\s]+)/i,
        ];

        for (const pattern of labelPatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                const name = match[1].trim().split('\n')[0].trim();
                if (name.length >= 5 && name.includes(' ') && isLikelyRealName(name)) {
                    return name.toUpperCase();
                }
            }
        }

        // Fallback: procura linhas que parecem nomes
        const lines = text.split('\n');
        const excludeWords = ['REPÚBLICA', 'FEDERATIVA', 'BRASIL', 'REGISTRO', 'IDENTIDADE',
            'CARTEIRA', 'NACIONAL', 'HABILITAÇÃO', 'MINISTÉRIO', 'SECRETARIA', 'DETRAN',
            'VÁLIDA', 'DATA', 'NASCIMENTO', 'FILIAÇÃO', 'LOCAL', 'EMISSÃO', 'ASSINATURA',
            'PERMISSÃO', 'CATEGORIA', 'OBSERVAÇÕES', 'PRIMEIRA', 'VALIDADE', 'EXPEDIÇÃO'];

        for (const line of lines) {
            const cleanLine = line.trim();
            const hasLettersOnly = /^[A-ZÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÄËÏÖÜÇa-záéíóúâêîôûàèìòùäëïöüç\s]+$/.test(cleanLine);
            const hasSpace = cleanLine.includes(' ');
            const goodLength = cleanLine.length >= 8 && cleanLine.length <= 50;
            const notExcluded = !excludeWords.some(word => cleanLine.toUpperCase().includes(word));
            const isReal = isLikelyRealName(cleanLine);

            if (hasLettersOnly && hasSpace && goodLength && notExcluded && isReal) {
                return cleanLine.toUpperCase();
            }
        }

        return null;
    };

    // OCR Híbrido: Groq Vision (primário) → Tesseract Client-Side (fallback)
    const handleScanDocument = async (imageData: string) => {
        setIsScanning(true);

        try {
            console.log('[OCR] Tentando Groq Vision (/api/ai/ocr-document)...');

            // 1. Tenta Groq Vision (API rápida)
            const response = await fetch('/api/ai/ocr-document', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageData }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Groq Error (${response.status}): ${errorText.substring(0, 100)}`);
            }

            const data = await response.json();
            console.log('[OCR] Sucesso Groq:', data);

            if (data.name) setNome(data.name);
            if (data.doc) setDocumento(data.doc);

            if (!data.name && !data.doc) {
                throw new Error('Groq não encontrou dados - tentando fallback');
            }

        } catch (error: any) {
            console.error('[OCR] Servidor falhou:', error);
            console.log('[OCR] Iniciando Fallback: Tesseract Client-Side (Navegador)...');

            try {
                // FALLBACK CLIENT-SIDE (ROBUSTEZ TOTAL)
                const result = await Tesseract.recognize(
                    imageData,
                    'por',
                    {
                        logger: m => {
                            if (m.status === 'recognizing text') {
                                console.log(`[OCR Client] ${Math.round(m.progress * 100)}%`);
                            }
                        }
                    }
                );

                const text = result.data.text;
                console.log('[OCR Client] Texto bruto:', text);

                // Reutilizando as regex functions que já existem no componente
                const name = extractName(text);
                const cpf = extractCPF(text);
                const rg = extractRG(text);
                const cnh = extractCNH(text); // Função que também já existe
                const doc = cpf || cnh || rg;

                console.log('[OCR Client] Extraído:', { name, doc });

                if (name) setNome(name);
                if (doc) setDocumento(doc);

                if (!name && !doc) {
                    alert('Falha total no OCR (Servidor e Client). Tente uma foto mais clara.');
                } else {
                    // Sucesso no fallback - silencioso ou aviso discreto
                    console.log('Dados recuperados via Fallback Client-Side');
                }

            } catch (clientError) {
                console.error('Erro Fatal OCR Client:', clientError);
                alert(`Erro ao processar documento: ${error.message}. Tente novamente.`);
            }
        } finally {
            setIsScanning(false);
        }
    };

    // Captura foto e inicia OCR automaticamente
    const captureAndScanDocument = () => {
        if (videoRef.current && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            ctx?.drawImage(videoRef.current, 0, 0);
            const photoData = canvasRef.current.toDataURL('image/jpeg');
            setCapturedPhoto(photoData);

            // Stop camera
            const stream = videoRef.current.srcObject as MediaStream;
            stream?.getTracks().forEach(track => track.stop());
            setShowCameraModal(false);

            // Inicia o OCR automaticamente
            handleScanDocument(photoData);
        }
    };

    const printVisitorBadge = (visitor: Visitor) => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head><title>Crachá Visitante</title>
                <style>
                    body { font-family: Arial; text-align: center; padding: 20px; }
                    .badge { border: 2px solid #10b981; border-radius: 10px; padding: 20px; max-width: 300px; margin: 0 auto; }
                    h1 { color: #10b981; margin: 0; }
                    .photo { width: 100px; height: 100px; border-radius: 50%; margin: 10px auto; background: #e5e7eb; }
                    .info { margin: 5px 0; }
                    .label { color: #6b7280; font-size: 12px; }
                </style>
                </head>
                <body>
                    <div class="badge">
                        <h1>VISITANTE</h1>
                        ${visitor.foto_url ? `<img src="${visitor.foto_url}" class="photo" />` : '<div class="photo"></div>'}
                        <div class="info"><strong>${visitor.nome}</strong></div>
                        <div class="info"><span class="label">Documento:</span> ${visitor.documento || 'N/A'}</div>
                        <div class="info"><span class="label">Destino:</span> ${visitor.unidade ? `${visitor.unidade.bloco} ${visitor.unidade.numero_unidade}` : 'N/A'}</div>
                        <div class="info"><span class="label">Entrada:</span> ${new Date(visitor.data_hora_entrada).toLocaleString('pt-BR')}</div>
                    </div>
                    <script>window.print(); setTimeout(() => window.close(), 500);</script>
                </body>
                </html>
            `);
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

    const filteredVisitors = visitors.filter(v => {
        if (filterType && v.tipo !== filterType) return false;
        return true;
    });

    const getTipoBadge = (tipo: string) => {
        switch (tipo) {
            case 'visitante': return <Badge variant="primary">Visitante</Badge>;
            case 'prestador_servico': return <Badge variant="warning">Prestador</Badge>;
            case 'entrega': return <Badge variant="success">Veículo</Badge>;
            default: return <Badge>{tipo}</Badge>;
        }
    };

    // Configurações de estilo por tipo
    const getTipoConfig = () => {
        switch (tipo) {
            case 'visitante':
                return {
                    title: 'Registrar Visitante',
                    buttonText: 'Registrar Visitante',
                    borderColor: 'border-blue-500',
                    bgColor: 'bg-blue-500',
                    bgLight: 'bg-blue-50',
                    textColor: 'text-blue-700',
                    tipoLabel: 'Visitante'
                };
            case 'prestador_servico':
                return {
                    title: 'Registrar Prestador',
                    buttonText: 'Registrar Prestador',
                    borderColor: 'border-orange-500',
                    bgColor: 'bg-orange-500',
                    bgLight: 'bg-orange-50',
                    textColor: 'text-orange-700',
                    tipoLabel: 'Prestador de Serviço'
                };
            case 'entrega':
                return {
                    title: 'Registrar Veículo',
                    buttonText: 'Registrar Veículo',
                    borderColor: 'border-green-500',
                    bgColor: 'bg-green-500',
                    bgLight: 'bg-green-50',
                    textColor: 'text-green-700',
                    tipoLabel: 'Entrega / Veículo'
                };
            default:
                return {
                    title: 'Registrar Entrada',
                    buttonText: 'Registrar Entrada',
                    borderColor: 'border-emerald-500',
                    bgColor: 'bg-emerald-500',
                    bgLight: 'bg-emerald-50',
                    textColor: 'text-emerald-700',
                    tipoLabel: 'Selecione o tipo'
                };
        }
    };

    const tipoConfig = getTipoConfig();

    return (
        <div className={`min-h-screen ${isFullscreen ? 'bg-gray-900 text-white p-4' : 'space-y-4'}`}>
            {/* Header */}
            <div className={`flex items-center justify-between ${isFullscreen ? 'mb-4' : ''}`}>
                <div className="flex items-center gap-4">
                    <Shield className={`h-8 w-8 ${isFullscreen ? 'text-emerald-400' : 'text-emerald-500'}`} />
                    <div>
                        <h1 className={`text-2xl font-bold ${isFullscreen ? '' : 'text-gray-900'}`}>Portaria</h1>
                        <p className={`text-lg ${isFullscreen ? 'text-emerald-400' : 'text-gray-500'}`}>
                            {currentTime.toLocaleDateString('pt-BR')} - {currentTime.toLocaleTimeString('pt-BR')}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant={isFullscreen ? 'secondary' : 'outline'} size="sm" onClick={fetchVisitors}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant={isFullscreen ? 'secondary' : 'outline'} size="sm" onClick={toggleFullscreen}>
                        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button
                    onClick={() => { setTipo('visitante'); setTipoFixo(true); setShowModal(true); }}
                    className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                            <Users className="h-8 w-8" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold mb-1">Visitante</h3>
                            <p className="text-blue-100 text-xs">Registrar morador</p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => { setTipo('prestador_servico'); setTipoFixo(true); setShowModal(true); }}
                    className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                            <Shield className="h-8 w-8" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold mb-1">Prestador</h3>
                            <p className="text-orange-100 text-xs">Manutenção</p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => { setTipo('entrega'); setTipoFixo(true); setShowModal(true); }}
                    className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                            <Car className="h-8 w-8" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold mb-1">Veículo</h3>
                            <p className="text-emerald-100 text-xs">Entregas</p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => setShowQRScanner(true)}
                    className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                            <QrCode className="h-8 w-8" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold mb-1">Ler QR Code</h3>
                            <p className="text-purple-100 text-xs">Validar convite</p>
                        </div>
                    </div>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className={isFullscreen ? 'bg-emerald-600 border-0' : 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0'}>
                    <CardContent className="py-4 text-center text-white">
                        <p className="text-3xl font-bold">{activeVisitors.length}</p>
                        <p className="text-sm opacity-80">No Condomínio</p>
                    </CardContent>
                </Card>
                <Card className={isFullscreen ? 'bg-blue-600 border-0' : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0'}>
                    <CardContent className="py-4 text-center text-white">
                        <p className="text-3xl font-bold">{visitors.length}</p>
                        <p className="text-sm opacity-80">Entradas Hoje</p>
                    </CardContent>
                </Card>
                <Card className={isFullscreen ? 'bg-purple-600 border-0' : 'bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0'}>
                    <CardContent className="py-4 text-center text-white">
                        <p className="text-3xl font-bold">{visitors.filter(v => v.tipo === 'prestador_servico').length}</p>
                        <p className="text-sm opacity-80">Prestadores</p>
                    </CardContent>
                </Card>
                <Card className={isFullscreen ? 'bg-orange-600 border-0' : 'bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0'}>
                    <CardContent className="py-4 text-center text-white">
                        <p className="text-3xl font-bold">{visitors.filter(v => v.tipo === 'entrega').length}</p>
                        <p className="text-sm opacity-80">Entregas</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleQuickSearch()}
                        placeholder="Buscar por CPF, placa ou nome..."
                        className={`pl-10 ${isFullscreen ? 'bg-gray-800 border-gray-700 text-white' : ''}`}
                    />
                </div>
                <Select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    options={[
                        { value: '', label: 'Todos' },
                        { value: 'visitante', label: 'Visitantes' },
                        { value: 'prestador_servico', label: 'Prestadores' },
                        { value: 'entrega', label: 'Entregas' },
                    ]}
                    className={`w-40 ${isFullscreen ? 'bg-gray-800 border-gray-700 text-white' : ''}`}
                />
            </div>

            {/* Convites Pendentes de Hoje */}
            {pendingInvites.length > 0 && (
                <Card className={`border-2 border-blue-200 ${isFullscreen ? 'bg-gray-800' : 'bg-blue-50'}`}>
                    <CardContent className="p-4">
                        <h3 className={`font-semibold mb-3 flex items-center gap-2 ${isFullscreen ? 'text-white' : 'text-blue-800'}`}>
                            <Ticket className="h-5 w-5 text-blue-600" />
                            Convites Pendentes Hoje ({pendingInvites.length})
                        </h3>
                        <div className="grid gap-2">
                            {pendingInvites.map(invite => (
                                <div
                                    key={invite.id}
                                    className={`flex items-center justify-between p-3 rounded-lg ${isFullscreen ? 'bg-gray-700' : 'bg-white border border-blue-100'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <QrCode className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className={`font-medium ${isFullscreen ? 'text-white' : 'text-gray-900'}`}>
                                                {invite.guest_name}
                                            </p>
                                            <p className={`text-sm ${isFullscreen ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {invite.unit ? `${invite.unit.bloco || ''} ${invite.unit.numero_unidade}` : 'Sem unidade'}
                                                {invite.visit_time_start && ` • ${invite.visit_time_start.substring(0, 5)}`}
                                                {invite.visit_time_end && ` - ${invite.visit_time_end.substring(0, 5)}`}
                                            </p>
                                            {invite.creator?.nome && (
                                                <p className={`text-xs ${isFullscreen ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    Criado por: {invite.creator.nome}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <Badge className="bg-blue-100 text-blue-800">
                                        Aguardando
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
            {activeVisitors.length > 0 && (
                <Card className={isFullscreen ? 'bg-gray-800 border-gray-700' : ''}>
                    <CardContent className="p-4">
                        <h3 className={`font-semibold mb-3 ${isFullscreen ? 'text-white' : ''}`}>
                            <LogIn className="inline h-4 w-4 mr-2 text-emerald-500" />
                            Dentro do Condomínio ({activeVisitors.length})
                        </h3>
                        <div className="grid gap-2">
                            {activeVisitors.map(v => (
                                <div key={v.id} className={`flex items-center justify-between p-3 rounded-lg ${isFullscreen ? 'bg-gray-700' : 'bg-emerald-50'}`}>
                                    <div className="flex items-center gap-3">
                                        {v.foto_url ? (
                                            <img src={v.foto_url} className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                                                <Users className="h-5 w-5 text-gray-500" />
                                            </div>
                                        )}
                                        <div>
                                            <p className={`font-medium ${isFullscreen ? 'text-white' : ''}`}>{v.nome}</p>
                                            <p className={`text-sm ${isFullscreen ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {v.unidade ? `${v.unidade.bloco} ${v.unidade.numero_unidade}` : 'Sem destino'} •
                                                Entrada: {new Date(v.data_hora_entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="ghost" onClick={() => printVisitorBadge(v)}>
                                            <Printer className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" onClick={() => handleExit(v.id)}>
                                            <LogOut className="h-4 w-4 mr-1" />
                                            Saída
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* History */}
            <Card className={isFullscreen ? 'bg-gray-800 border-gray-700' : ''}>
                <CardContent className="p-4">
                    <h3 className={`font-semibold mb-3 ${isFullscreen ? 'text-white' : ''}`}>
                        <Clock className="inline h-4 w-4 mr-2" />
                        Histórico de Hoje
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {filteredVisitors.map(v => (
                            <div key={v.id} className={`flex items-center justify-between p-2 rounded ${isFullscreen ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <div className="flex items-center gap-3">
                                    {getTipoBadge(v.tipo)}
                                    <div>
                                        <span className={isFullscreen ? 'text-white' : ''}>{v.nome}</span>
                                        {v.documento && <span className="text-sm text-gray-500 ml-2">({v.documento})</span>}
                                        {v.placa_veiculo && <span className="text-sm text-gray-500 ml-2"><Car className="inline h-3 w-3" /> {v.placa_veiculo}</span>}
                                    </div>
                                </div>
                                <div className="text-sm text-gray-500">
                                    {new Date(v.data_hora_entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    {v.data_hora_saida && (
                                        <span className="text-emerald-500"> → {new Date(v.data_hora_saida).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Entry Modal - Personalizado por Tipo */}
            <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={tipoConfig.title} size="md">
                <form onSubmit={handleEntry} className="space-y-4">
                    {/* Barra de tipo colorida */}
                    <div className={`${tipoConfig.bgLight} ${tipoConfig.borderColor} border-l-4 px-4 py-2 rounded-r-lg mb-4`}>
                        <span className={`font-semibold ${tipoConfig.textColor}`}>{tipoConfig.tipoLabel}</span>
                    </div>

                    <div className="flex gap-4 items-start">
                        <div className="flex-shrink-0">
                            {capturedPhoto ? (
                                <img src={capturedPhoto} className="w-24 h-24 rounded-lg object-cover" />
                            ) : (
                                <button type="button" onClick={startCamera} className={`w-24 h-24 rounded-lg ${tipoConfig.bgLight} flex items-center justify-center hover:opacity-80 border-2 ${tipoConfig.borderColor}`}>
                                    <Camera className={`h-8 w-8 ${tipoConfig.textColor}`} />
                                </button>
                            )}
                        </div>
                        <div className="flex-1 space-y-3">
                            <div className="relative">
                                <Input label="Nome *" value={nome} onChange={(e) => setNome(e.target.value)} required disabled={isScanning} />
                                {isScanning && (
                                    <div className="absolute right-3 top-8">
                                        <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="relative">
                                    <Input label="CPF/RG" value={documento} onChange={(e) => setDocumento(e.target.value)} disabled={isScanning} />
                                    {isScanning && (
                                        <div className="absolute right-3 top-8">
                                            <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                                        </div>
                                    )}
                                </div>
                                <Input label="Placa" value={placa} onChange={(e) => setPlaca(e.target.value.toUpperCase())} placeholder="ABC-1234" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Tipo fixo (não editável) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                            <div className={`px-3 py-2 ${tipoConfig.bgLight} rounded-lg font-medium ${tipoConfig.textColor} border-2 ${tipoConfig.borderColor}`}>
                                {tipoConfig.tipoLabel}
                            </div>
                        </div>
                        <Select
                            label="Destino (Unidade)"
                            value={unidadeId}
                            onChange={(e) => setUnidadeId(e.target.value)}
                            options={[
                                { value: '', label: 'Selecione...' },
                                ...units.map(u => ({ value: u.id, label: `${u.bloco || ''} ${u.numero_unidade}` }))
                            ]}
                        />
                    </div>

                    <Input label="Observações" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />

                    {/* Toggle Notificar via WhatsApp */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                            <MessageSquare className="h-5 w-5 text-green-600" />
                            <div>
                                <p className="font-medium text-gray-700">Notificar via WhatsApp</p>
                                <p className="text-xs text-gray-500">Enviar aviso ao morador</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                if (!whatsAppContratado) {
                                    setShowWhatsAppModal(true);
                                } else {
                                    setNotificarWhatsApp(!notificarWhatsApp);
                                }
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificarWhatsApp && whatsAppContratado ? 'bg-green-500' : 'bg-gray-300'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificarWhatsApp && whatsAppContratado ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                        <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
                        <Button type="submit" loading={saving} className={`${tipoConfig.bgColor} hover:opacity-90`}>
                            <LogIn className="h-4 w-4 mr-2" />
                            {tipoConfig.buttonText}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Camera Modal */}
            <Modal isOpen={showCameraModal} onClose={() => setShowCameraModal(false)} title="Capturar Foto" size="md">
                <div className="space-y-4">
                    <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg bg-black" />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="flex justify-center gap-3">
                        <Button variant="outline" onClick={capturePhoto}>
                            <Camera className="h-4 w-4 mr-2" />
                            Apenas Foto
                        </Button>
                        <Button onClick={captureAndScanDocument} disabled={isScanning}>
                            {isScanning ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Escaneando...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Escanear Documento
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* WhatsApp Contratação Modal */}
            <Modal isOpen={showWhatsAppModal} onClose={() => setShowWhatsAppModal(false)} title="WhatsApp não contratado" size="sm">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <AlertCircle className="h-6 w-6 text-orange-500 flex-shrink-0" />
                        <p className="text-orange-800 text-sm">
                            A integração com WhatsApp ainda não foi contratada para este condomínio.
                        </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-2">O que está incluso:</h4>
                        <ul className="space-y-1 text-sm text-gray-600">
                            <li>• Notificação automática de visitantes</li>
                            <li>• Lembretes de cobrança</li>
                            <li>• Avisos de encomendas</li>
                            <li>• Servidor dedicado + suporte</li>
                        </ul>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-500">Implantação: <strong className="text-gray-800">R$ 697</strong></p>
                            <p className="text-sm text-gray-500">Mensalidade: <strong className="text-gray-800">R$ 149/mês</strong></p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="ghost" className="flex-1" onClick={() => setShowWhatsAppModal(false)}>
                            Fechar
                        </Button>
                        <Button className="flex-1 bg-green-500 hover:bg-green-600" onClick={() => {
                            setShowWhatsAppModal(false);
                            window.open('/contato?assunto=whatsapp', '_blank');
                        }}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Contratar
                        </Button>
                    </div>
                </div>
            </Modal>
            {/* QR Scanner Modal */}
            <Modal isOpen={showQRScanner} onClose={() => setShowQRScanner(false)} title="" size="md">
                <QRCodeScanner onClose={() => { setShowQRScanner(false); fetchVisitors(); }} />
            </Modal>
        </div>
    );
}
