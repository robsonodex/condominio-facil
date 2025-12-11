'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge } from '@/components/ui';
import { useUser, useCondo } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import {
    Wifi, Server, CheckCircle, AlertTriangle, RefreshCw, Save, Info
} from 'lucide-react';

interface Gateway {
    id: string;
    nome: string;
    ip_address: string;
    subnet_mask: string;
    port: number;
    status: string;
    last_heartbeat: string;
}

export default function CameraIntegrationsPage() {
    const { condoId, isSindico, isSuperAdmin } = useUser();
    const { condo } = useCondo();
    const [gateway, setGateway] = useState<Gateway | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form
    const [ip, setIp] = useState('');
    const [subnet, setSubnet] = useState('255.255.255.0');
    const [port, setPort] = useState('8554');
    const [nome, setNome] = useState('Gateway Principal');

    useEffect(() => {
        if (condoId) {
            fetchGateway();
        }
    }, [condoId]);

    const fetchGateway = async () => {
        try {
            const res = await fetch(`/api/cameras/gateways?condo_id=${condoId}`);
            const data = await res.json();
            if (data.gateways?.length > 0) {
                const gw = data.gateways[0];
                setGateway(gw);
                setIp(gw.ip_address);
                setSubnet(gw.subnet_mask);
                setPort(String(gw.port));
                setNome(gw.nome);
            }
        } catch (error) {
            console.error('Error fetching gateway:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ip) return;

        setSaving(true);
        try {
            const res = await fetch('/api/cameras/gateways', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    condo_id: condoId,
                    nome,
                    ip_address: ip,
                    subnet_mask: subnet,
                    port: parseInt(port)
                })
            });
            const data = await res.json();

            if (data.gateway) {
                alert('Gateway salvo com sucesso!');
                setGateway(data.gateway);
            } else {
                alert('Erro: ' + data.error);
            }
        } catch (error: any) {
            alert('Erro ao salvar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (!isSindico && !isSuperAdmin) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Acesso restrito a síndicos.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Configuração de Gateway</h1>
                <p className="text-gray-500">Configure o gateway para integração com câmeras IP</p>
            </div>

            {/* Info */}
            <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">O que é o Gateway?</p>
                            <p>
                                O gateway é um servidor local (Docker) que converte streams RTSP das câmeras
                                para WebRTC/HLS, permitindo visualização no navegador. Deve ser instalado
                                na mesma rede das câmeras.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Gateway Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Server className="h-5 w-5" />
                        Gateway Local
                        {gateway && (
                            <Badge variant={gateway.status === 'ativo' ? 'success' : 'warning'}>
                                {gateway.status}
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="space-y-4">
                        <Input
                            label="Nome do Gateway"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            placeholder="Gateway Principal"
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Endereço IP do Gateway *"
                                value={ip}
                                onChange={(e) => setIp(e.target.value)}
                                placeholder="192.168.1.10"
                                required
                            />
                            <Input
                                label="Porta"
                                type="number"
                                value={port}
                                onChange={(e) => setPort(e.target.value)}
                                placeholder="8554"
                            />
                        </div>

                        <Input
                            label="Máscara de Sub-rede"
                            value={subnet}
                            onChange={(e) => setSubnet(e.target.value)}
                            placeholder="255.255.255.0"
                        />

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                            <p className="text-amber-800">
                                <strong>⚠️ Importante:</strong> Todas as câmeras devem estar na mesma
                                faixa de IP do gateway. Por exemplo, se o gateway é <code>192.168.1.10</code>,
                                as câmeras devem ser <code>192.168.1.x</code>.
                            </p>
                        </div>

                        <Button type="submit" className="w-full" loading={saving}>
                            <Save className="h-4 w-4 mr-2" />
                            {gateway ? 'Atualizar Gateway' : 'Cadastrar Gateway'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Docker Instructions */}
            <Card>
                <CardHeader>
                    <CardTitle>Instalação do Gateway (Docker)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Execute o seguinte comando no servidor local para iniciar o gateway:
                    </p>
                    <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                        <pre>{`docker run -d \\
  --name camera-gateway \\
  --network host \\
  -e PORT=${port} \\
  -e CONDO_ID=${condoId} \\
  ghcr.io/condofacil/camera-gateway:latest`}</pre>
                    </div>
                    <p className="text-xs text-gray-500">
                        * O gateway deve ter acesso à rede local onde estão as câmeras.
                    </p>
                </CardContent>
            </Card>

            {/* Checklist */}
            <Card>
                <CardHeader>
                    <CardTitle>Checklist de Instalação</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                            {gateway ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
                            Gateway configurado no sistema
                        </li>
                        <li className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            Docker instalado no servidor local
                        </li>
                        <li className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            Container do gateway em execução
                        </li>
                        <li className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            Câmeras com IP fixo na mesma rede
                        </li>
                        <li className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            RTSP/ONVIF habilitado nas câmeras
                        </li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
