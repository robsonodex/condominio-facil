'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui';
import {
    ArrowLeft, Star, Wrench, Phone, Mail, Check, Loader2,
    User, MessageSquare, ThumbsUp
} from 'lucide-react';
import Link from 'next/link';

const professionalCategories = [
    { value: 'pintor', label: '🎨 Pintor' },
    { value: 'eletricista', label: '⚡ Eletricista' },
    { value: 'encanador', label: '🔧 Encanador' },
    { value: 'pedreiro', label: '🧱 Pedreiro' },
    { value: 'marceneiro', label: '🪚 Marceneiro' },
    { value: 'faxineira', label: '🧹 Faxineira/Diarista' },
    { value: 'baba', label: '👶 Babá' },
    { value: 'cuidador', label: '🧓 Cuidador de Idosos' },
    { value: 'personal', label: '💪 Personal Trainer' },
    { value: 'pet_sitter', label: '🐕 Pet Sitter' },
    { value: 'tecnico_ar', label: '❄️ Técnico Ar Condicionado' },
    { value: 'tecnico_tv', label: '📺 Técnico TV/Eletrônicos' },
    { value: 'jardineiro', label: '🌱 Jardineiro' },
    { value: 'dedetizador', label: '🐜 Dedetizador' },
    { value: 'serralheiro', label: '🔩 Serralheiro' },
    { value: 'vidraceiro', label: '🪟 Vidraceiro' },
    { value: 'chaveiro', label: '🔑 Chaveiro' },
    { value: 'outro', label: '📋 Outro' },
];

export default function IndicarProfissionalPage() {
    const router = useRouter();
    const { profile } = useAuth();
    const supabase = createClient();

    // Estados
    const [professionalName, setProfessionalName] = useState('');
    const [category, setCategory] = useState('');
    const [phone, setPhone] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [email, setEmail] = useState('');
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [wouldRecommend, setWouldRecommend] = useState(true);
    const [loading, setLoading] = useState(false);

    // Formatar telefone
    const formatPhone = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 10) {
            return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    };

    // Submeter indicação
    const handleSubmit = async () => {
        if (!professionalName || !category || !rating || !phone) {
            alert('Preencha os campos obrigatórios: Nome, Categoria, Telefone e Avaliação');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.from('service_recommendations').insert({
                condo_id: profile?.condo_id,
                user_id: profile?.id,
                unit_id: profile?.unit_id || null,
                professional_name: professionalName,
                category,
                phone: phone.replace(/\D/g, ''),
                whatsapp: whatsapp.replace(/\D/g, '') || phone.replace(/\D/g, ''),
                email,
                rating,
                review_text: reviewText,
                would_recommend: wouldRecommend,
            });

            if (error) throw error;

            router.push('/marketplace?tab=indicacoes');
        } catch (err: any) {
            console.error('Erro ao criar indicação:', err);
            alert('Erro ao criar indicação: ' + err.message);
        } finally {
            setLoading(false);
        }
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
                    <h1 className="text-2xl font-bold text-gray-900">Indicar Profissional</h1>
                    <p className="text-gray-500 text-sm">Ajude seus vizinhos indicando bons profissionais</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-orange-500" />
                        Dados do Profissional
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                    {/* Nome do Profissional */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome do Profissional *
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Ex: João da Silva"
                                value={professionalName}
                                onChange={(e) => setProfessionalName(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Categoria */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Categoria *
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        >
                            <option value="">Selecione a categoria...</option>
                            {professionalCategories.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Telefone/WhatsApp */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Telefone/WhatsApp *
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    type="tel"
                                    placeholder="(11) 99999-9999"
                                    value={phone}
                                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                E-mail (opcional)
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    type="email"
                                    placeholder="profissional@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Avaliação */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sua Avaliação *
                        </label>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="p-1 transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={`h-8 w-8 transition-colors ${star <= (hoverRating || rating)
                                                ? 'text-yellow-400 fill-yellow-400'
                                                : 'text-gray-300'
                                            }`}
                                    />
                                </button>
                            ))}
                            <span className="ml-2 text-sm text-gray-500">
                                {rating === 1 && 'Ruim'}
                                {rating === 2 && 'Regular'}
                                {rating === 3 && 'Bom'}
                                {rating === 4 && 'Muito Bom'}
                                {rating === 5 && 'Excelente'}
                            </span>
                        </div>
                    </div>

                    {/* Comentário */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Conte sua experiência
                        </label>
                        <div className="relative">
                            <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <textarea
                                placeholder="Descreva o serviço realizado, qualidade, pontualidade, preço..."
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                    </div>

                    {/* Recomendaria */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={wouldRecommend}
                                onChange={(e) => setWouldRecommend(e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                            />
                            <div className="flex items-center gap-2">
                                <ThumbsUp className={`h-5 w-5 ${wouldRecommend ? 'text-orange-500' : 'text-gray-400'}`} />
                                <span className="font-medium text-gray-700">Eu recomendo este profissional</span>
                            </div>
                        </label>
                    </div>

                    {/* Info */}
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-800">
                        <p className="font-medium mb-1">💡 Dica</p>
                        <p>Sua indicação ajudará outros moradores a encontrar profissionais de confiança. Seja honesto na sua avaliação!</p>
                    </div>

                    {/* Botão de submit */}
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || !professionalName || !category || !rating || !phone}
                        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-6 text-lg"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                Publicando...
                            </>
                        ) : (
                            <>
                                <Star className="h-5 w-5 mr-2" />
                                Publicar Indicação
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
