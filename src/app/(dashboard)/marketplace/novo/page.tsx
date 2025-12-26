'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui';
import {
    ArrowLeft, Store, Tag, Gift, Key, Wrench, Upload, X,
    Loader2, Camera, Phone, Mail, Check
} from 'lucide-react';
import Link from 'next/link';

type AdType = 'venda' | 'doacao' | 'aluguel' | 'servico';

const typeOptions = [
    { value: 'venda', label: 'Vendo', icon: Tag, color: 'bg-green-500 hover:bg-green-600', description: 'Itens para venda' },
    { value: 'doacao', label: 'Doação', icon: Gift, color: 'bg-purple-500 hover:bg-purple-600', description: 'Doando gratuitamente' },
    { value: 'aluguel', label: 'Alugo', icon: Key, color: 'bg-blue-500 hover:bg-blue-600', description: 'Para alugar' },
    { value: 'servico', label: 'Serviço', icon: Wrench, color: 'bg-orange-500 hover:bg-orange-600', description: 'Ofereço serviço' },
];

const categoryOptions = {
    venda: ['Móveis', 'Eletrodomésticos', 'Eletrônicos', 'Roupas', 'Livros', 'Brinquedos', 'Decoração', 'Outros'],
    doacao: ['Roupas', 'Livros', 'Brinquedos', 'Móveis', 'Utensílios', 'Outros'],
    aluguel: ['Vaga de Garagem', 'Equipamentos', 'Ferramentas', 'Outros'],
    servico: ['Aulas Particulares', 'Consertos', 'Artesanato', 'Culinária', 'Pet Care', 'Outros'],
};

export default function NovoAnuncioPage() {
    const router = useRouter();
    const { profile } = useAuth();
    const supabase = createClient();

    // Estados do formulário
    const [type, setType] = useState<AdType | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [contactPhone, setContactPhone] = useState(profile?.telefone || '');
    const [contactWhatsapp, setContactWhatsapp] = useState(profile?.telefone || '');
    const [photos, setPhotos] = useState<File[]>([]);
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    // Upload de fotos
    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const newFiles = files.slice(0, 5 - photos.length); // Máximo 5 fotos

        setPhotos(prev => [...prev, ...newFiles]);

        // Gerar previews
        newFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                setPhotoPreviews(prev => [...prev, e.target?.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    // Remover foto
    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
        setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    };

    // Upload para Supabase Storage
    const uploadPhotos = async (): Promise<string[]> => {
        const uploadedUrls: string[] = [];

        for (const file of photos) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${profile?.condo_id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

            const { data, error } = await supabase.storage
                .from('marketplace')
                .upload(fileName, file);

            if (!error && data) {
                const { data: publicUrl } = supabase.storage
                    .from('marketplace')
                    .getPublicUrl(fileName);

                uploadedUrls.push(publicUrl.publicUrl);
            }
        }

        return uploadedUrls;
    };

    // Submeter anúncio
    const handleSubmit = async () => {
        if (!type || !title || !profile?.condo_id) {
            alert('Preencha todos os campos obrigatórios');
            return;
        }

        setLoading(true);

        try {
            // Fazer upload das fotos primeiro
            let photoUrls: string[] = [];
            if (photos.length > 0) {
                photoUrls = await uploadPhotos();
            }

            // Inserir anúncio
            const { error } = await supabase.from('marketplace_ads').insert({
                condo_id: profile.condo_id,
                user_id: profile.id,
                unit_id: profile.unit_id || null,
                title,
                description,
                price: price ? parseFloat(price.replace(',', '.')) : null,
                type,
                category,
                photos: photoUrls,
                contact_phone: contactPhone,
                contact_whatsapp: contactWhatsapp,
                contact_email: profile.email,
                status: 'ativo',
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            });

            if (error) throw error;

            router.push('/marketplace');
        } catch (err: any) {
            console.error('Erro ao criar anúncio:', err);
            alert('Erro ao criar anúncio: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Formatar telefone
    const formatPhone = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 10) {
            return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    };

    return (
        <div className="container mx-auto py-6 px-4 max-w-2xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/marketplace">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Novo Anúncio</h1>
                    <p className="text-gray-500 text-sm">Anuncie para seus vizinhos</p>
                </div>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 mb-6">
                {[1, 2, 3].map(s => (
                    <div
                        key={s}
                        className={`flex-1 h-2 rounded-full ${step >= s ? 'bg-emerald-500' : 'bg-gray-200'}`}
                    />
                ))}
            </div>

            {/* Step 1: Tipo */}
            {step === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Que tipo de anúncio?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {typeOptions.map(option => (
                            <button
                                key={option.value}
                                onClick={() => { setType(option.value as AdType); setStep(2); }}
                                className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all
                                    ${type === option.value ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}
                                `}
                            >
                                <div className={`p-3 rounded-full ${option.color} text-white`}>
                                    <option.icon className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-gray-900">{option.label}</p>
                                    <p className="text-sm text-gray-500">{option.description}</p>
                                </div>
                            </button>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Detalhes */}
            {step === 2 && type && (
                <Card>
                    <CardHeader>
                        <CardTitle>Detalhes do anúncio</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Título */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Título *
                            </label>
                            <Input
                                placeholder="Ex: Sofá 3 lugares em ótimo estado"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                maxLength={100}
                            />
                        </div>

                        {/* Descrição */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Descrição
                            </label>
                            <textarea
                                placeholder="Descreva o item ou serviço..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>

                        {/* Preço (não mostra para doação) */}
                        {type !== 'doacao' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Preço (R$)
                                </label>
                                <Input
                                    type="text"
                                    placeholder="0,00 (deixe vazio para 'A combinar')"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value.replace(/[^\d,]/g, ''))}
                                />
                            </div>
                        )}

                        {/* Categoria */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Categoria
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="">Selecione...</option>
                                {categoryOptions[type]?.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Fotos */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fotos (máximo 5)
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {photoPreviews.map((preview, idx) => (
                                    <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden">
                                        <img src={preview} alt="" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => removePhoto(idx)}
                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                                {photos.length < 5 && (
                                    <label className="w-20 h-20 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-colors">
                                        <Camera className="h-6 w-6 text-gray-400" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handlePhotoUpload}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Navegação */}
                        <div className="flex gap-3 pt-4">
                            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                                Voltar
                            </Button>
                            <Button
                                onClick={() => setStep(3)}
                                disabled={!title}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                Continuar
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Contato */}
            {step === 3 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Informações de contato</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* WhatsApp */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                WhatsApp para contato *
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    type="tel"
                                    placeholder="(11) 99999-9999"
                                    value={contactWhatsapp}
                                    onChange={(e) => setContactWhatsapp(formatPhone(e.target.value))}
                                    className="pl-10"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Os interessados entrarão em contato por este número
                            </p>
                        </div>

                        {/* Telefone alternativo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Telefone alternativo
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    type="tel"
                                    placeholder="(11) 3333-3333"
                                    value={contactPhone}
                                    onChange={(e) => setContactPhone(formatPhone(e.target.value))}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* Resumo */}
                        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                            <h4 className="font-medium text-gray-900">Resumo do anúncio</h4>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p><strong>Tipo:</strong> {typeOptions.find(t => t.value === type)?.label}</p>
                                <p><strong>Título:</strong> {title}</p>
                                {price && <p><strong>Preço:</strong> R$ {price}</p>}
                                {category && <p><strong>Categoria:</strong> {category}</p>}
                                <p><strong>Fotos:</strong> {photos.length} foto(s)</p>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                ⏱️ Seu anúncio ficará ativo por 30 dias
                            </p>
                        </div>

                        {/* Navegação */}
                        <div className="flex gap-3 pt-4">
                            <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                                Voltar
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={loading || !contactWhatsapp}
                                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Publicando...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Publicar Anúncio
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
