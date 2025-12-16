'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, Button, Input, Select } from '@/components/ui';
import { useUser, useCondo } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import { gerarPixPayload, gerarPixQRCodeUrl, validarChavePix, formatarChavePix } from '@/lib/pix-qrcode';
import { Settings, QrCode, Save, CheckCircle, AlertCircle, Copy } from 'lucide-react';

export default function ConfiguracoesPixPage() {
    const { condoId, isSindico, isSuperAdmin } = useUser();
    const { condo } = useCondo();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [copied, setCopied] = useState(false);
    const supabase = createClient();

    // Form state
    const [pixTipo, setPixTipo] = useState<string>('');
    const [pixChave, setPixChave] = useState('');
    const [pixNome, setPixNome] = useState('');
    const [pixCidade, setPixCidade] = useState('');
    const [erro, setErro] = useState('');

    // QR Code preview
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [pixPayload, setPixPayload] = useState('');

    useEffect(() => {
        if (condo) {
            setPixTipo(condo.pix_tipo || '');
            setPixChave(condo.pix_chave || '');
            setPixNome(condo.pix_nome_recebedor || condo.nome || '');
            setPixCidade(condo.pix_cidade || condo.cidade?.toUpperCase().replace(/[^A-Z ]/g, '') || 'SAO PAULO');
        }
    }, [condo]);

    // Gera preview do QR Code quando dados mudam
    useEffect(() => {
        if (pixChave && pixNome && pixCidade && pixTipo) {
            const validation = validarChavePix(pixTipo, pixChave);
            if (validation.valido) {
                const payload = gerarPixPayload({
                    chave: pixChave,
                    nome: pixNome,
                    cidade: pixCidade,
                    descricao: 'CONDO',
                });
                setPixPayload(payload);
                setQrCodeUrl(gerarPixQRCodeUrl(payload, 200));
                setErro('');
            } else {
                setErro(validation.erro || 'Chave inválida');
                setQrCodeUrl('');
                setPixPayload('');
            }
        }
    }, [pixChave, pixNome, pixCidade, pixTipo]);

    const handleSave = async () => {
        if (!condoId) return;

        // Validar
        if (!pixTipo || !pixChave || !pixNome) {
            setErro('Preencha todos os campos obrigatórios');
            return;
        }

        const validation = validarChavePix(pixTipo, pixChave);
        if (!validation.valido) {
            setErro(validation.erro || 'Chave PIX inválida');
            return;
        }

        setSaving(true);
        setErro('');

        try {
            const { error } = await supabase
                .from('condos')
                .update({
                    pix_tipo: pixTipo,
                    pix_chave: pixChave,
                    pix_nome_recebedor: pixNome.toUpperCase(),
                    pix_cidade: pixCidade.toUpperCase().replace(/[^A-Z ]/g, ''),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', condoId);

            if (error) throw error;

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e: any) {
            setErro(e.message || 'Erro ao salvar');
        } finally {
            setSaving(false);
        }
    };

    const copyToClipboard = async () => {
        if (pixPayload) {
            await navigator.clipboard.writeText(pixPayload);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!isSindico && !isSuperAdmin) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Acesso restrito a síndicos</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <QrCode className="h-6 w-6 text-emerald-500" />
                    Configurar PIX do Condomínio
                </h1>
                <p className="text-gray-500">
                    Configure a chave PIX para receber pagamentos diretamente na conta do condomínio
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Formulário */}
                <Card>
                    <CardContent className="p-6 space-y-6">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Dados do PIX
                        </h3>

                        <div className="space-y-4">
                            <Select
                                label="Tipo da Chave PIX *"
                                value={pixTipo}
                                onChange={(e) => { setPixTipo(e.target.value); setPixChave(''); }}
                                options={[
                                    { value: '', label: 'Selecione...' },
                                    { value: 'cpf', label: 'CPF' },
                                    { value: 'cnpj', label: 'CNPJ' },
                                    { value: 'email', label: 'E-mail' },
                                    { value: 'telefone', label: 'Telefone (+55...)' },
                                    { value: 'aleatoria', label: 'Chave Aleatória' },
                                ]}
                            />

                            <Input
                                label="Chave PIX *"
                                value={pixChave}
                                onChange={(e) => setPixChave(e.target.value)}
                                placeholder={
                                    pixTipo === 'cpf' ? '00000000000' :
                                        pixTipo === 'cnpj' ? '00000000000000' :
                                            pixTipo === 'email' ? 'email@exemplo.com' :
                                                pixTipo === 'telefone' ? '+5511999999999' :
                                                    'Sua chave aleatória'
                                }
                            />

                            <Input
                                label="Nome do Recebedor *"
                                value={pixNome}
                                onChange={(e) => setPixNome(e.target.value)}
                                placeholder="Nome que aparece no PIX"
                                helperText="Nome que aparece no comprovante (máx. 25 caracteres)"
                            />

                            <Input
                                label="Cidade"
                                value={pixCidade}
                                onChange={(e) => setPixCidade(e.target.value)}
                                placeholder="SAO PAULO"
                                helperText="Cidade sem acentos, em maiúsculas"
                            />
                        </div>

                        {erro && (
                            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded">
                                <AlertCircle className="h-4 w-4" />
                                {erro}
                            </div>
                        )}

                        {saved && (
                            <div className="flex items-center gap-2 text-emerald-600 text-sm bg-emerald-50 p-3 rounded">
                                <CheckCircle className="h-4 w-4" />
                                Dados PIX salvos com sucesso!
                            </div>
                        )}

                        <Button onClick={handleSave} loading={saving} className="w-full">
                            <Save className="h-4 w-4 mr-2" />
                            Salvar Configurações PIX
                        </Button>

                        <p className="text-xs text-gray-500 text-center">
                            Ao configurar o PIX, as cobranças geradas para moradores incluirão
                            o QR Code para pagamento direto na conta do condomínio.
                        </p>
                    </CardContent>
                </Card>

                {/* Preview QR Code */}
                <Card>
                    <CardContent className="p-6 space-y-6">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <QrCode className="h-5 w-5" />
                            Preview do QR Code
                        </h3>

                        {qrCodeUrl ? (
                            <div className="text-center space-y-4">
                                <div className="bg-white p-4 rounded-lg border inline-block">
                                    <img
                                        src={qrCodeUrl}
                                        alt="QR Code PIX"
                                        className="mx-auto"
                                        width={200}
                                        height={200}
                                    />
                                </div>

                                <div className="text-sm text-gray-600 space-y-1">
                                    <p><strong>Recebedor:</strong> {pixNome.toUpperCase()}</p>
                                    <p><strong>Chave:</strong> {formatarChavePix(pixTipo, pixChave)}</p>
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={copyToClipboard}
                                    className="w-full"
                                >
                                    <Copy className="h-4 w-4 mr-2" />
                                    {copied ? 'Copiado!' : 'Copiar PIX Copia e Cola'}
                                </Button>

                                <p className="text-xs text-gray-400">
                                    Este é um preview. O QR Code real incluirá o valor da cobrança.
                                </p>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <QrCode className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">
                                    Preencha os dados do PIX para ver o preview do QR Code
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Info */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                    <h4 className="font-medium text-blue-800 mb-2">💡 Como funciona?</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Configure a chave PIX do condomínio acima</li>
                        <li>• Ao criar cobranças para moradores, o QR Code será gerado automaticamente</li>
                        <li>• O morador paga direto para a conta do condomínio</li>
                        <li>• Você marca o pagamento como recebido no sistema</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
