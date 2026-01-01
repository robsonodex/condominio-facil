'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Landmark, Check, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { FeatureGuard } from '@/components/shared/FeatureGuard';

export default function PaymentIntegrationPage() {
    const { condoId } = useUser();
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [credentials, setCredentials] = useState({
        access_token: '',
        public_key: ''
    });

    const handleSave = async () => {
        if (!credentials.access_token) {
            toast.error('Token de acesso é obrigatório');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/admin/payment-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    condoId,
                    provider: 'mercadopago',
                    credentials
                })
            });

            if (res.ok) {
                toast.success('Configurações salvas com sucesso!');
            } else {
                const data = await res.json();
                throw new Error(data.error);
            }
        } catch (error: any) {
            toast.error(`Erro ao salvar: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleTest = async () => {
        setTesting(true);
        try {
            const res = await fetch('/api/admin/payment-config/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    condoId,
                    provider: 'mercadopago',
                    credentials
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
            } else {
                toast.error(data.error);
            }
        } catch (error: any) {
            toast.error('Falha de conexão com o provedor');
        } finally {
            setTesting(false);
        }
    };

    return (
        <FeatureGuard featureKey="module_banking">
            <div className="max-w-4xl mx-auto p-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-blue-100 p-3 rounded-full">
                        <Landmark className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Configuração de Pagamentos</h1>
                        <p className="text-gray-600">Conecte sua conta bancária via Mercado Pago ou Asaas</p>
                    </div>
                </div>

                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Mercado Pago</CardTitle>
                                    <CardDescription>Recomendado para Boletos e PIX com taxas competitivas</CardDescription>
                                </div>
                                <img src="https://logodownload.org/wp-content/uploads/2019/06/mercado-pago-logo.png" className="h-8 grayscale opacity-50" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="access_token">Access Token (Production)</Label>
                                <Input
                                    id="access_token"
                                    type="password"
                                    placeholder="APP_USR-..."
                                    value={credentials.access_token}
                                    onChange={(e) => setCredentials({ ...credentials, access_token: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="public_key">Public Key</Label>
                                <Input
                                    id="public_key"
                                    placeholder="APP_USR-..."
                                    value={credentials.public_key}
                                    onChange={(e) => setCredentials({ ...credentials, public_key: e.target.value })}
                                />
                            </div>

                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                                <p className="text-sm text-amber-800">
                                    Suas credenciais são armazenadas de forma segura e criptografada.
                                    Nunca compartilhe seu Access Token com terceiros.
                                </p>
                            </div>

                            <div className="flex gap-4 pt-4 border-t">
                                <Button onClick={handleTest} variant="outline" disabled={testing || loading}>
                                    {testing ? 'Testando...' : 'Testar Conexão'}
                                </Button>
                                <Button onClick={handleSave} disabled={loading || testing}>
                                    {loading ? 'Salvando...' : 'Salvar Configurações'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="opacity-75 grayscale bg-gray-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Asaas <Badge variant="outline">Em breve</Badge>
                            </CardTitle>
                            <CardDescription>Integração completa com gateway Asaas</CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </div>
        </FeatureGuard>
    );
}
