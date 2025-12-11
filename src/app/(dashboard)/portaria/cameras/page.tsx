'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { useUser, useCondo } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
    Camera, Video, Image, AlertTriangle, CheckCircle,
    Wifi, WifiOff, RefreshCw, Plus, Settings, Info,
    Play, Pause, Eye, Download, Clock
} from 'lucide-react';

interface CameraItem {
    id: string;
    nome: string;
    localizacao: string;
    ip_address: string;
    status: string;
    streaming: boolean;
    reachable: boolean;
    last_probe: string;
    gateway?: {
        ip_address: string;
        status: string;
    };
}

interface Gateway {
    id: string;
    nome: string;
    ip_address: string;
    status: string;
}

export default function CamerasPage() {
    const { condoId, isSindico, isPorteiro, isSuperAdmin } = useUser();
    const { condo } = useCondo();
    const { session } = useAuth();
    const [cameras, setCameras] = useState<CameraItem[]>([]);
    const [gateway, setGateway] = useState<Gateway | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedCamera, setSelectedCamera] = useState<CameraItem | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showPlayerModal, setShowPlayerModal] = useState(false);
    const supabase = createClient();

    // Form state
    const [formNome, setFormNome] = useState('');
    const [formLocalizacao, setFormLocalizacao] = useState('');
    const [formIp, setFormIp] = useState('');
    const [formPort, setFormPort] = useState('554');
    const [formRtspPath, setFormRtspPath] = useState('/stream1');
    const [formUsername, setFormUsername] = useState('');
    const [formPassword, setFormPassword] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (condoId) {
            fetchData();
        }
    }, [condoId]);

    const fetchData = async () => {
        try {
            // Buscar gateway
            const gwRes = await fetch(`/api/cameras/gateways?condo_id=${condoId}`);
            const gwData = await gwRes.json();
            if (gwData.gateways?.length > 0) {
                setGateway(gwData.gateways[0]);
            }

            // Buscar câmeras
            const camRes = await fetch(`/api/cameras?condo_id=${condoId}`);
            const camData = await camRes.json();
            setCameras(camData.cameras || []);
        } catch (error) {
            console.error('Error fetching cameras:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProbe = async (cameraId: string) => {
        try {
            const res = await fetch(`/api/cameras/${cameraId}/probe`, { method: 'POST' });
            const data = await res.json();

            if (data.success) {
                alert(`Probe concluído: ${data.camera_status}`);
                fetchData();
            } else {
                alert(`Erro: ${data.error}`);
            }
        } catch (error) {
            console.error('Error probing camera:', error);
        }
    };

    const handleSnapshot = async (camera: CameraItem) => {
        try {
            const res = await fetch(`/api/cameras/${camera.id}/snapshot`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ motivo: 'manual' })
            });
            const data = await res.json();

            if (data.success) {
                alert(`Snapshot capturado! Expira em 24h.`);
            } else {
                alert(`Erro: ${data.error}`);
            }
        } catch (error) {
            console.error('Error capturing snapshot:', error);
        }
    };

    const handleAddCamera = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formNome || !formIp) return;

        setSaving(true);
        try {
            const res = await fetch('/api/cameras', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    condo_id: condoId,
                    nome: formNome,
                    localizacao: formLocalizacao,
                    ip_address: formIp,
                    port: parseInt(formPort),
                    rtsp_path: formRtspPath,
                    rtsp_username: formUsername,
                    rtsp_password: formPassword
                })
            });
            const data = await res.json();

            if (data.camera) {
                alert('Câmera cadastrada! Execute o Probe para validar.');
                setShowAddModal(false);
                resetForm();
                fetchData();
            } else {
                alert(`Erro: ${data.error}`);
            }
        } catch (error: any) {
            alert('Erro ao cadastrar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setFormNome('');
        setFormLocalizacao('');
        setFormIp('');
        setFormPort('554');
        setFormRtspPath('/stream1');
        setFormUsername('');
        setFormPassword('');
    };

    const openPlayer = async (camera: CameraItem) => {
        setSelectedCamera(camera);
        setShowPlayerModal(true);
    };

    const getStatusBadge = (status: string, reachable: boolean) => {
        if (status === 'ativo' && reachable) {
            return <Badge variant="success">🟢 Online</Badge>;
        } else if (status === 'erro') {
            return <Badge variant="destructive">🔴 Erro</Badge>;
        } else {
            return <Badge variant="warning">🟡 Pendente</Badge>;
        }
    };

    if (!isSindico && !isPorteiro && !isSuperAdmin) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Acesso restrito.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Câmeras</h1>
                    <p className="text-gray-500">Visualização ao vivo (sem gravação)</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/portaria/cameras/info">
                        <Button variant="outline">
                            <Info className="h-4 w-4 mr-2" />
                            Como funciona
                        </Button>
                    </Link>
                    {isSindico && (
                        <Button onClick={() => setShowAddModal(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar
                        </Button>
                    )}
                </div>
            </div>

            {/* Gateway Status */}
            <Card className={gateway ? 'border-emerald-200' : 'border-amber-200 bg-amber-50'}>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Wifi className={`h-5 w-5 ${gateway ? 'text-emerald-500' : 'text-amber-500'}`} />
                            <div>
                                <p className="font-medium">
                                    {gateway ? `Gateway: ${gateway.ip_address}` : 'Gateway não configurado'}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {gateway
                                        ? 'Câmeras devem estar na mesma rede local'
                                        : 'Configure o gateway antes de adicionar câmeras'}
                                </p>
                            </div>
                        </div>
                        {isSindico && (
                            <Link href="/admin/camera-integrations">
                                <Button variant="outline" size="sm">
                                    <Settings className="h-4 w-4 mr-1" />
                                    Configurar
                                </Button>
                            </Link>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Cameras Grid */}
            {loading ? (
                <div className="text-center py-12 text-gray-500">Carregando câmeras...</div>
            ) : cameras.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Camera className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500 mb-4">Nenhuma câmera cadastrada</p>
                        {isSindico && gateway && (
                            <Button onClick={() => setShowAddModal(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar Primeira Câmera
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cameras.map(camera => (
                        <Card key={camera.id} className="overflow-hidden">
                            {/* Preview placeholder */}
                            <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
                                {camera.status === 'ativo' ? (
                                    <>
                                        <Video className="h-12 w-12 text-gray-600" />
                                        <button
                                            onClick={() => openPlayer(camera)}
                                            className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
                                        >
                                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                                <Play className="h-8 w-8 text-white" />
                                            </div>
                                        </button>
                                    </>
                                ) : (
                                    <WifiOff className="h-12 w-12 text-gray-600" />
                                )}
                            </div>

                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h3 className="font-semibold">{camera.nome}</h3>
                                        <p className="text-sm text-gray-500">{camera.localizacao}</p>
                                    </div>
                                    {getStatusBadge(camera.status, camera.reachable)}
                                </div>

                                <p className="text-xs text-gray-400 mb-3">
                                    IP: {camera.ip_address}
                                </p>

                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleProbe(camera.id)}
                                        className="flex-1"
                                    >
                                        <RefreshCw className="h-3 w-3 mr-1" />
                                        Probe
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleSnapshot(camera)}
                                        disabled={camera.status !== 'ativo'}
                                        className="flex-1"
                                    >
                                        <Image className="h-3 w-3 mr-1" />
                                        Foto
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => openPlayer(camera)}
                                        disabled={camera.status !== 'ativo'}
                                        className="flex-1"
                                    >
                                        <Eye className="h-3 w-3 mr-1" />
                                        Ver
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add Camera Modal */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Adicionar Câmera">
                <form onSubmit={handleAddCamera} className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                        <p className="font-medium text-amber-800">⚠️ Requisitos Obrigatórios:</p>
                        <ul className="text-amber-700 text-xs mt-1 list-disc list-inside">
                            <li>RTSP habilitado</li>
                            <li>ONVIF Perfil S</li>
                            <li>Codec H.264</li>
                            <li>IP fixo na mesma rede do gateway</li>
                            <li>Conexão cabeada (Ethernet)</li>
                        </ul>
                    </div>

                    <Input
                        label="Nome da Câmera *"
                        value={formNome}
                        onChange={(e) => setFormNome(e.target.value)}
                        placeholder="Ex: Entrada Principal"
                        required
                    />

                    <Input
                        label="Localização"
                        value={formLocalizacao}
                        onChange={(e) => setFormLocalizacao(e.target.value)}
                        placeholder="Ex: Portaria, Garagem B1"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Endereço IP *"
                            value={formIp}
                            onChange={(e) => setFormIp(e.target.value)}
                            placeholder="192.168.1.100"
                            required
                        />
                        <Input
                            label="Porta RTSP"
                            type="number"
                            value={formPort}
                            onChange={(e) => setFormPort(e.target.value)}
                            placeholder="554"
                        />
                    </div>

                    <Input
                        label="Path RTSP"
                        value={formRtspPath}
                        onChange={(e) => setFormRtspPath(e.target.value)}
                        placeholder="/stream1"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Usuário RTSP"
                            value={formUsername}
                            onChange={(e) => setFormUsername(e.target.value)}
                            placeholder="admin"
                        />
                        <Input
                            label="Senha RTSP"
                            type="password"
                            value={formPassword}
                            onChange={(e) => setFormPassword(e.target.value)}
                            placeholder="********"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                            Cancelar
                        </Button>
                        <Button type="submit" className="flex-1" loading={saving}>
                            Cadastrar
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Player Modal */}
            <Modal
                isOpen={showPlayerModal}
                onClose={() => setShowPlayerModal(false)}
                title={selectedCamera?.nome || 'Visualização'}
            >
                <div className="space-y-4">
                    <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                        <div className="text-center text-white">
                            <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                            <p className="text-sm opacity-75">
                                Conectando ao stream...
                            </p>
                            <p className="text-xs opacity-50 mt-2">
                                WebRTC/HLS via Gateway Local
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-between text-sm text-gray-500">
                        <span>{selectedCamera?.localizacao}</span>
                        <span>{selectedCamera?.ip_address}</span>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                        <Info className="h-4 w-4 inline mr-2" />
                        Este módulo exibe apenas visualização ao vivo. Não há gravação de vídeos.
                    </div>
                </div>
            </Modal>
        </div>
    );
}
