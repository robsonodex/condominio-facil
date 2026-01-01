import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { FeatureTogglePanel } from '@/components/admin/FeatureTogglePanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Shield, Landmark, Settings, Users } from 'lucide-react';
import Link from 'next/link';

export default async function CondoAdminDashboard({ params }: { params: { id: string } }) {
    const supabase = await createClient();

    // 1. Buscar dados do condomínio
    const { data: condo } = await supabase
        .from('condos')
        .select('*, plans(*)')
        .eq('id', params.id)
        .single();

    if (!condo) return <div>Condomínio não encontrado</div>;

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{condo.nome}</h1>
                    <p className="text-gray-500">Administração Centralizada do Condomínio</p>
                </div>
                <div className="flex gap-3">
                    <Badge variant="secondary" className="text-md py-1 px-4">
                        {condo.plans?.nome_plano || 'Sem Plano'}
                    </Badge>
                    <Button variant="outline" asChild>
                        <Link href={`/admin/condominios/${params.id}/features`}>
                            <Settings className="w-4 h-4 mr-2" />
                            Features
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Unidades</CardTitle>
                        <LayoutDashboard className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">128</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Moradores</CardTitle>
                        <Users className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">342</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Integr. Bancária</CardTitle>
                        <Landmark className="h-4 w-4 text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <Badge variant="success">Ativo</Badge>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Segurança</CardTitle>
                        <Shield className="h-4 w-4 text-green-400" />
                    </CardHeader>
                    <CardContent>
                        <Badge variant="outline">Auditado</Badge>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Controle de Módulos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <FeatureTogglePanel condoId={params.id} />
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações de Cobrança</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-sm py-2 border-b">
                                <span className="text-gray-500">Valor Base:</span>
                                <span className="font-medium text-gray-900">R$ 299,00</span>
                            </div>
                            <div className="flex justify-between text-sm py-2 border-b text-blue-600">
                                <span>Features Adicionais:</span>
                                <span className="font-medium">+ R$ 45,00</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-2">
                                <span>Total Mensal:</span>
                                <span>R$ 344,00</span>
                            </div>
                            <Button className="w-full mt-4" variant="outline">
                                Gerar Fatura Manual
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Links Rápidos Administrador</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2">
                            <Button variant="ghost" className="justify-start" asChild>
                                <Link href={`/admin/condominios/${params.id}/usuarios`}>Gerenciar Usuários</Link>
                            </Button>
                            <Button variant="ghost" className="justify-start" asChild>
                                <Link href={`/admin/condominios/${params.id}/logs`}>Logs de Auditoria</Link>
                            </Button>
                            <Button variant="ghost" className="justify-start" asChild>
                                <Link href={`/admin/condominios/${params.id}/suporte`}>Histórico de Suporte</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
