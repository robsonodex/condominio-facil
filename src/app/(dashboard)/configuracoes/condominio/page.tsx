'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui';
import { useUser, useCondo } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { Building2, Upload, Save, Image, Trash2 } from 'lucide-react';

export default function ConfiguracoesCondoPage() {
    const { condoId, isSindico, isSuperAdmin } = useUser();
    const { condo } = useCondo();
    const { session } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        nome: '',
        cidade: '',
        estado: '',
        endereco: '',
        telefone: '',
        email_contato: '',
    });

    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        if (condo) {
            setFormData({
                nome: condo.nome || '',
                cidade: condo.cidade || '',
                estado: condo.estado || '',
                endereco: condo.endereco || '',
                telefone: condo.telefone || '',
                email_contato: condo.email_contato || '',
            });
            setLogoUrl((condo as any).logo_url || null);
        }
    }, [condo]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            setError('Por favor, selecione uma imagem válida');
            return;
        }

        if (file.size > 2 * 1024 * 1024) { // 2MB
            setError('A imagem deve ter no máximo 2MB');
            return;
        }

        // Preview
        const reader = new FileReader();
        reader.onload = (e) => setLogoPreview(e.target?.result as string);
        reader.readAsDataURL(file);

        // Upload
        setUploading(true);
        setError('');

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${condoId}/logo.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('condo-logos')
                .upload(fileName, file, { upsert: true });

            if (uploadError) {
                // If bucket doesn't exist, just save as base64 for now
                console.warn('Storage upload failed, using preview URL:', uploadError);
                setLogoUrl(logoPreview);
            } else {
                const { data: { publicUrl } } = supabase.storage
                    .from('condo-logos')
                    .getPublicUrl(fileName);

                setLogoUrl(publicUrl);
            }

            setSuccess('Logo carregado! Salve para aplicar.');
        } catch (err: any) {
            setError(err.message || 'Erro ao fazer upload');
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveLogo = () => {
        setLogoUrl(null);
        setLogoPreview(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const { error } = await supabase
                .from('condos')
                .update({
                    nome: formData.nome,
                    cidade: formData.cidade || null,
                    estado: formData.estado || null,
                    endereco: formData.endereco || null,
                    telefone: formData.telefone || null,
                    email_contato: formData.email_contato || null,
                    logo_url: logoUrl,
                })
                .eq('id', condoId);

            if (error) throw error;

            setSuccess('Configurações salvas com sucesso! Recarregue a página para ver as alterações.');
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar');
        } finally {
            setLoading(false);
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
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Configurações do Condomínio</h1>
                <p className="text-gray-500">Personalize as informações do seu condomínio</p>
            </div>

            {success && (
                <div className="p-4 bg-green-50 text-green-600 rounded-lg">
                    {success}
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                    {error}
                </div>
            )}

            {/* Logo Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Image className="h-5 w-5" />
                        Logo do Condomínio
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center gap-4">
                        {/* Logo Preview */}
                        <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
                            {logoPreview || logoUrl ? (
                                <img
                                    src={logoPreview || logoUrl || ''}
                                    alt="Logo"
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <Building2 className="h-12 w-12 text-gray-400" />
                            )}
                        </div>

                        <div className="flex gap-2">
                            <label className="cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <div className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                                    <Upload className="h-4 w-4 mr-2" />
                                    {uploading ? 'Enviando...' : 'Carregar Logo'}
                                </div>
                            </label>

                            {(logoUrl || logoPreview) && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleRemoveLogo}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remover
                                </Button>
                            )}
                        </div>

                        <p className="text-xs text-gray-500 text-center">
                            Formatos aceitos: PNG, JPG, SVG. Máximo 2MB.<br />
                            Recomendado: 200x200 pixels ou maior, fundo transparente.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Info Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Informações do Condomínio
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="space-y-4">
                        <Input
                            label="Nome do Condomínio"
                            value={formData.nome}
                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                            required
                            placeholder="Ex: Residencial Jardim das Flores"
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Cidade"
                                value={formData.cidade}
                                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                                placeholder="Ex: São Paulo"
                            />
                            <Input
                                label="Estado"
                                value={formData.estado}
                                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                                placeholder="Ex: SP"
                                maxLength={2}
                            />
                        </div>

                        <Input
                            label="Endereço"
                            value={formData.endereco}
                            onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                            placeholder="Ex: Rua das Palmeiras, 123"
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Telefone"
                                value={formData.telefone}
                                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                placeholder="(00) 0000-0000"
                            />
                            <Input
                                label="Email de Contato"
                                type="email"
                                value={formData.email_contato}
                                onChange={(e) => setFormData({ ...formData, email_contato: e.target.value })}
                                placeholder="contato@condominio.com"
                            />
                        </div>

                        <Button type="submit" disabled={loading} className="w-full">
                            <Save className="h-4 w-4 mr-2" />
                            {loading ? 'Salvando...' : 'Salvar Configurações'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
