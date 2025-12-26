'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui';
import {
    Store, Tag, Gift, Key, Wrench, Plus, Search, Filter,
    Heart, MessageCircle, Eye, Clock, Phone, Star, MapPin,
    ChevronDown, X, Loader2, Image as ImageIcon, User
} from 'lucide-react';
import Link from 'next/link';

// Tipos
type AdType = 'venda' | 'doacao' | 'aluguel' | 'servico' | 'all';

interface MarketplaceAd {
    id: string;
    title: string;
    description: string;
    price: number | null;
    type: AdType;
    category: string;
    photos: string[];
    contact_phone: string;
    contact_whatsapp: string;
    status: string;
    views_count: number;
    interested_count: number;
    expires_at: string;
    created_at: string;
    user_id: string;
    users: {
        nome: string;
        units?: { identificador: string } | null;
    };
}

interface ServiceRecommendation {
    id: string;
    professional_name: string;
    category: string;
    phone: string;
    whatsapp: string;
    rating: number;
    review_text: string;
    photos: string[];
    helpful_count: number;
    created_at: string;
    users: {
        nome: string;
        units?: { identificador: string } | null;
    };
}

// Mapeamento de ícones e cores por tipo
const typeConfig = {
    venda: { icon: Tag, color: 'bg-green-500', label: 'Vendo', textColor: 'text-green-600' },
    doacao: { icon: Gift, color: 'bg-purple-500', label: 'Doação', textColor: 'text-purple-600' },
    aluguel: { icon: Key, color: 'bg-blue-500', label: 'Alugo', textColor: 'text-blue-600' },
    servico: { icon: Wrench, color: 'bg-orange-500', label: 'Serviço', textColor: 'text-orange-600' },
};

// Categorias de profissionais
const professionalCategories = [
    'pintor', 'eletricista', 'encanador', 'pedreiro', 'marceneiro',
    'faxineira', 'babá', 'cuidador', 'personal', 'pet_sitter',
    'tecnico_ar', 'tecnico_tv', 'jardineiro', 'dedetizador', 'serralheiro'
];

export default function MarketplacePage() {
    const { profile } = useAuth();
    const supabase = createClient();

    // Estados
    const [activeTab, setActiveTab] = useState<'marketplace' | 'indicacoes'>('marketplace');
    const [typeFilter, setTypeFilter] = useState<AdType>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [ads, setAds] = useState<MarketplaceAd[]>([]);
    const [recommendations, setRecommendations] = useState<ServiceRecommendation[]>([]);
    const [loading, setLoading] = useState(true);

    // Carregar dados
    useEffect(() => {
        if (profile?.condo_id) {
            loadData();
        }
    }, [profile?.condo_id, activeTab, typeFilter]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'marketplace') {
                let query = supabase
                    .from('marketplace_ads')
                    .select(`
                        *,
                        users!marketplace_ads_user_id_fkey (
                            nome,
                            units:unit_id (identificador)
                        )
                    `)
                    .eq('condo_id', profile?.condo_id)
                    .eq('status', 'ativo')
                    .gt('expires_at', new Date().toISOString())
                    .order('created_at', { ascending: false });

                if (typeFilter !== 'all') {
                    query = query.eq('type', typeFilter);
                }

                const { data, error } = await query;
                if (!error && data) {
                    setAds(data as MarketplaceAd[]);
                }
            } else {
                const { data, error } = await supabase
                    .from('service_recommendations')
                    .select(`
                        *,
                        users!service_recommendations_user_id_fkey (
                            nome,
                            units:unit_id (identificador)
                        )
                    `)
                    .eq('condo_id', profile?.condo_id)
                    .order('rating', { ascending: false });

                if (!error && data) {
                    setRecommendations(data as ServiceRecommendation[]);
                }
            }
        } catch (err) {
            console.error('Erro ao carregar dados:', err);
        } finally {
            setLoading(false);
        }
    };

    // Filtrar por busca
    const filteredAds = ads.filter(ad =>
        ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ad.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredRecommendations = recommendations.filter(rec =>
        rec.professional_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Abrir WhatsApp
    const openWhatsApp = (phone: string, message: string) => {
        const cleanPhone = phone.replace(/\D/g, '');
        const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    // Formatar preço
    const formatPrice = (price: number | null) => {
        if (!price) return 'A combinar';
        return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // Calcular tempo desde criação
    const getTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoje';
        if (diffDays === 1) return 'Ontem';
        if (diffDays < 7) return `${diffDays} dias`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas`;
        return `${Math.floor(diffDays / 30)} meses`;
    };

    // Renderizar estrelas
    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(star => (
                    <Star
                        key={star}
                        className={`h-4 w-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="container mx-auto py-6 px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl shadow-lg">
                        <Store className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
                        <p className="text-gray-500 text-sm">Compre, venda e indique profissionais</p>
                    </div>
                </div>

                <Link href="/marketplace/novo">
                    <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg">
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Anúncio
                    </Button>
                </Link>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <Button
                    variant={activeTab === 'marketplace' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('marketplace')}
                    className={activeTab === 'marketplace' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                >
                    <Tag className="h-4 w-4 mr-2" />
                    Anúncios
                </Button>
                <Button
                    variant={activeTab === 'indicacoes' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('indicacoes')}
                    className={activeTab === 'indicacoes' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                >
                    <Star className="h-4 w-4 mr-2" />
                    Indicações
                </Button>
            </div>

            {/* Filtros e Busca */}
            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Busca */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder={activeTab === 'marketplace' ? 'Buscar anúncios...' : 'Buscar profissionais...'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Filtros de tipo (apenas marketplace) */}
                        {activeTab === 'marketplace' && (
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    size="sm"
                                    variant={typeFilter === 'all' ? 'default' : 'outline'}
                                    onClick={() => setTypeFilter('all')}
                                    className={typeFilter === 'all' ? 'bg-gray-800' : ''}
                                >
                                    Todos
                                </Button>
                                {Object.entries(typeConfig).map(([key, config]) => (
                                    <Button
                                        key={key}
                                        size="sm"
                                        variant={typeFilter === key ? 'default' : 'outline'}
                                        onClick={() => setTypeFilter(key as AdType)}
                                        className={typeFilter === key ? config.color : ''}
                                    >
                                        <config.icon className="h-3 w-3 mr-1" />
                                        {config.label}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                </div>
            )}

            {/* Grid de Anúncios */}
            {!loading && activeTab === 'marketplace' && (
                <>
                    {filteredAds.length === 0 ? (
                        <Card className="p-12 text-center">
                            <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">Nenhum anúncio encontrado</p>
                            <p className="text-gray-400 text-sm mt-2">Seja o primeiro a anunciar!</p>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredAds.map(ad => {
                                const config = typeConfig[ad.type as keyof typeof typeConfig];
                                const Icon = config?.icon || Tag;

                                return (
                                    <Card key={ad.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                                        {/* Imagem */}
                                        <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                                            {ad.photos && ad.photos.length > 0 ? (
                                                <img
                                                    src={ad.photos[0]}
                                                    alt={ad.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ImageIcon className="h-12 w-12 text-gray-300" />
                                                </div>
                                            )}

                                            {/* Badge de tipo */}
                                            <div className={`absolute top-3 left-3 ${config.color} text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg`}>
                                                <Icon className="h-3 w-3" />
                                                {config.label}
                                            </div>

                                            {/* Contador de fotos */}
                                            {ad.photos && ad.photos.length > 1 && (
                                                <div className="absolute top-3 right-3 bg-black/60 text-white px-2 py-1 rounded-full text-xs">
                                                    📷 {ad.photos.length}
                                                </div>
                                            )}
                                        </div>

                                        <CardContent className="p-4">
                                            {/* Título e Preço */}
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-semibold text-gray-900 line-clamp-1 flex-1">
                                                    {ad.title}
                                                </h3>
                                            </div>

                                            {/* Preço */}
                                            <p className={`text-lg font-bold ${config.textColor} mb-2`}>
                                                {ad.type === 'doacao' ? 'Grátis' : formatPrice(ad.price)}
                                            </p>

                                            {/* Descrição */}
                                            <p className="text-gray-500 text-sm line-clamp-2 mb-3">
                                                {ad.description || 'Sem descrição'}
                                            </p>

                                            {/* Info do anunciante */}
                                            <div className="flex items-center gap-2 text-xs text-gray-400 mb-3 border-t pt-3">
                                                <User className="h-3 w-3" />
                                                <span>{ad.users?.nome || 'Morador'}</span>
                                                {ad.users?.units?.identificador && (
                                                    <>
                                                        <span>•</span>
                                                        <MapPin className="h-3 w-3" />
                                                        <span>{ad.users.units.identificador}</span>
                                                    </>
                                                )}
                                            </div>

                                            {/* Stats e tempo */}
                                            <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="h-3 w-3" /> {ad.views_count}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Heart className="h-3 w-3" /> {ad.interested_count}
                                                    </span>
                                                </div>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> {getTimeAgo(ad.created_at)}
                                                </span>
                                            </div>

                                            {/* Botão de interesse */}
                                            <Button
                                                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                                                onClick={() => openWhatsApp(
                                                    ad.contact_whatsapp || ad.contact_phone || '',
                                                    `Olá! Vi seu anúncio "${ad.title}" no Marketplace do condomínio e tenho interesse!`
                                                )}
                                            >
                                                <MessageCircle className="h-4 w-4 mr-2" />
                                                Tenho Interesse
                                            </Button>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* Grid de Indicações */}
            {!loading && activeTab === 'indicacoes' && (
                <>
                    <div className="flex justify-end mb-4">
                        <Link href="/marketplace/indicar">
                            <Button variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50">
                                <Star className="h-4 w-4 mr-2" />
                                Indicar Profissional
                            </Button>
                        </Link>
                    </div>

                    {filteredRecommendations.length === 0 ? (
                        <Card className="p-12 text-center">
                            <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">Nenhuma indicação encontrada</p>
                            <p className="text-gray-400 text-sm mt-2">Indique um profissional de confiança!</p>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredRecommendations.map(rec => (
                                <Card key={rec.id} className="hover:shadow-lg transition-shadow">
                                    <CardContent className="p-5">
                                        {/* Header */}
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="p-3 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full">
                                                <Wrench className="h-5 w-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900">{rec.professional_name}</h3>
                                                <p className="text-orange-600 text-sm font-medium capitalize">{rec.category}</p>
                                            </div>
                                        </div>

                                        {/* Rating */}
                                        <div className="flex items-center gap-2 mb-3">
                                            {renderStars(rec.rating)}
                                            <span className="text-sm text-gray-500">({rec.rating}/5)</span>
                                        </div>

                                        {/* Review */}
                                        {rec.review_text && (
                                            <p className="text-gray-600 text-sm italic mb-3 line-clamp-3">
                                                "{rec.review_text}"
                                            </p>
                                        )}

                                        {/* Indicado por */}
                                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-4 border-t pt-3">
                                            <User className="h-3 w-3" />
                                            <span>Indicado por {rec.users?.nome || 'Morador'}</span>
                                            {rec.users?.units?.identificador && (
                                                <>
                                                    <span>•</span>
                                                    <span>{rec.users.units.identificador}</span>
                                                </>
                                            )}
                                        </div>

                                        {/* Botão de contato */}
                                        <Button
                                            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                                            onClick={() => openWhatsApp(
                                                rec.whatsapp || rec.phone || '',
                                                `Olá! Peguei seu contato através de uma indicação no condomínio. Gostaria de um orçamento.`
                                            )}
                                        >
                                            <Phone className="h-4 w-4 mr-2" />
                                            Entrar em Contato
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
