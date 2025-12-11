'use client';

import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import Link from 'next/link';
import {
    Camera, Video, Image, Info, AlertTriangle, CheckCircle,
    Wifi, Shield, Settings, Clock, FileText, ArrowLeft
} from 'lucide-react';

export default function CamerasInfoPage() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/portaria/cameras">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Como Funciona o Módulo de Câmeras</h1>
                    <p className="text-gray-500">Informações importantes sobre visualização e requisitos</p>
                </div>
            </div>

            {/* Importante */}
            <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <Info className="h-8 w-8 text-blue-600 flex-shrink-0" />
                        <div>
                            <h2 className="text-lg font-semibold text-blue-900 mb-2">
                                Apenas Visualização ao Vivo
                            </h2>
                            <p className="text-blue-800">
                                O módulo de câmeras do Condomínio Fácil permite <strong>somente visualização ao vivo</strong>
                                via WebRTC/HLS e <strong>snapshots temporários</strong> (24 horas).
                            </p>
                            <p className="text-blue-700 mt-2 text-sm">
                                <strong>NÃO há gravação de vídeos.</strong> Este sistema é para monitoramento em tempo real apenas.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Requisitos de Rede */}
            <Card className="border-amber-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wifi className="h-5 w-5 text-amber-600" />
                        Requisito de Rede Local
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-amber-50 p-4 rounded-lg">
                        <p className="font-medium text-amber-900">
                            ⚠️ As câmeras DEVEM estar na mesma rede local (LAN/VLAN) do gateway configurado.
                        </p>
                        <p className="text-amber-800 text-sm mt-2">
                            Isso permite capturar o stream RTSP sem abrir portas externas e garante estabilidade.
                        </p>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-2">
                        <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                            Gateway e câmeras na faixa 192.168.1.x (exemplo)
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                            Validação automática de sub-rede ao cadastrar
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                            Erro bloqueante se câmera estiver em rede diferente
                        </li>
                    </ul>
                </CardContent>
            </Card>

            {/* Requisitos das Câmeras */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5" />
                        Requisitos Mínimos Obrigatórios das Câmeras
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Câmeras Compatíveis
                            </h3>
                            <ul className="space-y-2 text-sm text-gray-700">
                                <li>✅ RTSP habilitado</li>
                                <li>✅ ONVIF Perfil S</li>
                                <li>✅ Codec H.264</li>
                                <li>✅ IP fixo configurado</li>
                                <li>✅ Conexão cabeada (Ethernet)</li>
                                <li>✅ Resolução mínima 720p</li>
                                <li>✅ Autenticação por usuário/senha</li>
                                <li>✅ Streaming constante (sem sleep mode)</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                Câmeras NÃO Compatíveis
                            </h3>
                            <ul className="space-y-2 text-sm text-gray-700">
                                <li>❌ Tuya, IMOU, Positivo, iCSee</li>
                                <li>❌ Câmeras Wi-Fi domésticas</li>
                                <li>❌ Câmeras que só funcionam via app próprio</li>
                                <li>❌ Câmeras sem RTSP</li>
                                <li>❌ Câmeras com bateria/solar</li>
                                <li>❌ Babás eletrônicas</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Funcionalidades */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Video className="h-5 w-5" />
                        Funcionalidades Disponíveis
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <Video className="h-8 w-8 text-emerald-600 mb-2" />
                            <h4 className="font-semibold">Visualização ao Vivo</h4>
                            <p className="text-sm text-gray-600 mt-1">
                                Stream em tempo real via WebRTC ou HLS
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <Image className="h-8 w-8 text-blue-600 mb-2" />
                            <h4 className="font-semibold">Snapshots</h4>
                            <p className="text-sm text-gray-600 mt-1">
                                Captura de fotos (expira em 24 horas)
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <Clock className="h-8 w-8 text-purple-600 mb-2" />
                            <h4 className="font-semibold">Tokens Temporários</h4>
                            <p className="text-sm text-gray-600 mt-1">
                                Acesso seguro com tokens de 1 hora
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* LGPD */}
            <Card className="border-purple-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-purple-600" />
                        LGPD e Privacidade
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-700">
                    <p>
                        O módulo de câmeras segue as diretrizes da Lei Geral de Proteção de Dados (LGPD):
                    </p>
                    <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-purple-500 mt-0.5" />
                            <span>Avisos visíveis informando a existência de monitoramento por câmeras</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-purple-500 mt-0.5" />
                            <span>Acesso restrito a porteiros e síndicos autorizados</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-purple-500 mt-0.5" />
                            <span>Snapshots com expiração automática em 24 horas</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-purple-500 mt-0.5" />
                            <span>Registro de todos os acessos às câmeras</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-purple-500 mt-0.5" />
                            <span>Câmeras apenas em áreas comuns (nunca em áreas privadas)</span>
                        </li>
                    </ul>
                </CardContent>
            </Card>

            {/* Ações */}
            <div className="flex gap-4">
                <Link href="/portaria/cameras" className="flex-1">
                    <Button className="w-full">
                        <Camera className="h-4 w-4 mr-2" />
                        Ir para Câmeras
                    </Button>
                </Link>
                <Link href="/admin/camera-integrations" className="flex-1">
                    <Button variant="outline" className="w-full">
                        <Settings className="h-4 w-4 mr-2" />
                        Configurar Gateway
                    </Button>
                </Link>
            </div>
        </div>
    );
}
