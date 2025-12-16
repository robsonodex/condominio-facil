
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Camera, Save, ArrowLeft, Upload, Check } from 'lucide-react';

export default function NewDeliveryPage() {
    const router = useRouter();
    const supabase = createClient();

    const [loading, setLoading] = useState(false);
    const [units, setUnits] = useState<any[]>([]);
    const [residents, setResidents] = useState<any[]>([]);
    const [filteredResidents, setFilteredResidents] = useState<any[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        condo_id: '', // Will be set from user session or selection
        unit_id: '',
        resident_id: '',
        type: 'pacote',
        delivered_by: '',
        tracking_code: '',
        notes: '',
        notify_whatsapp: true,
        notify_email: true
    });

    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Fetch initial data
        async function loadData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get user profile to know condo_id
            const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
            if (profile) {
                setUser(profile);
                setFormData(prev => ({ ...prev, condo_id: profile.condo_id }));

                // Fetch Units
                if (profile.condo_id) {
                    const { data: unitsData } = await supabase
                        .from('units')
                        .select('*')
                        .eq('condo_id', profile.condo_id)
                        .order('bloco', { ascending: true })
                        .order('numero_unidade', { ascending: true });

                    if (unitsData) setUnits(unitsData);

                    // Fetch Residents
                    const { data: resData } = await supabase
                        .from('residents')
                        .select('*, user:users(nome)')
                        .eq('condo_id', profile.condo_id)
                        .eq('ativo', true);

                    if (resData) setResidents(resData);
                }
            }
        }
        loadData();
    }, []);

    // Filter residents when unit changes
    useEffect(() => {
        if (formData.unit_id) {
            const filtered = residents.filter(r => r.unit_id === formData.unit_id);
            setFilteredResidents(filtered);
            // Reset resident selection if not in new list
            if (formData.resident_id && !filtered.find(r => r.id === formData.resident_id)) {
                setFormData(prev => ({ ...prev, resident_id: '' }));
            }
        } else {
            setFilteredResidents([]);
        }
    }, [formData.unit_id, residents]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPhotoFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let photo_url = null;

            // Upload Photo if exists
            if (photoFile) {
                const fileExt = photoFile.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `deliveries/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('delivery-photos') // Using generic name, user checklist implies "Bucket Supabase configurado"
                    .upload(filePath, photoFile);

                if (uploadError) {
                    console.error('Upload error:', uploadError);
                    // Fallback or alert? Proceeding without photo for safety or handling error
                    // alert('Erro ao carregar foto, continuando sem ela.');
                } else {
                    photo_url = filePath; // Or get public URL
                    // Get Signed URL logic would be in GET /list usually, typically we store path.
                    // But requirement says "URLs de foto com signed URL".
                    // I will store the path.
                }
            }

            const response = await fetch('/api/portaria/deliveries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    ...formData,
                    photo_url
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao salvar');
            }

            alert('Entrega registrada com sucesso!');
            router.push('/portaria/deliveries/list');

        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Nova Entrega</h1>
                    <p className="text-gray-500 dark:text-gray-400">Registre o recebimento de uma nova correspondência.</p>
                </div>
                <button onClick={() => router.back()} className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* UNIDADE */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Unidade *</label>
                            <select
                                required
                                value={formData.unit_id}
                                onChange={e => setFormData({ ...formData, unit_id: e.target.value })}
                                className="w-full h-12 rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            >
                                <option value="">Selecione a Unidade</option>
                                {units.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.bloco ? `Bloco ${u.bloco} - ` : ''}Apt {u.numero_unidade}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* MORADOR */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Morador (Opcional)</label>
                            <select
                                value={formData.resident_id}
                                onChange={e => setFormData({ ...formData, resident_id: e.target.value })}
                                className="w-full h-12 rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                disabled={!formData.unit_id}
                            >
                                <option value="">Selecione o Morador</option>
                                {filteredResidents.map(r => (
                                    <option key={r.id} value={r.id}>{r.user?.nome}</option>
                                ))}
                            </select>
                        </div>

                        {/* TIPO */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Entrega</label>
                            <select
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                className="w-full h-12 rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            >
                                <option value="pacote">Pacote / Caixa</option>
                                <option value="carta">Carta / Envelope</option>
                                <option value="delivery">Ifood / Delivery</option>
                                <option value="outro">Outro</option>
                            </select>
                        </div>

                        {/* REMETENTE */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Entregue Por (Transportadora/Pessoa)</label>
                            <input
                                type="text"
                                placeholder="Ex: Correios, Mercado Livre, Entregador..."
                                value={formData.delivered_by}
                                onChange={e => setFormData({ ...formData, delivered_by: e.target.value })}
                                className="w-full h-12 rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        {/* TRACKING */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Código de Rastreio (Opcional)</label>
                            <input
                                type="text"
                                placeholder="Ex: BR123456789"
                                value={formData.tracking_code}
                                onChange={e => setFormData({ ...formData, tracking_code: e.target.value })}
                                className="w-full h-12 rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        {/* PHOTO UPLOAD */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Camera className="w-4 h-4" /> Foto do Pacote
                            </label>
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                {photoFile ? (
                                    <div className="text-sm text-green-600 font-medium flex items-center gap-2">
                                        <Check className="w-4 h-4" /> {photoFile.name}
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                        <span className="text-sm text-gray-500">Clique ou arraste para enviar foto</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* OBSERVACOES */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Observações</label>
                        <textarea
                            rows={3}
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-4 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            placeholder="Ex: Caixa amassada, deixado na portaria..."
                        />
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                        <div className="flex flex-col sm:flex-row gap-6">
                            <label className="flex items-center space-x-3 cursor-pointer group">
                                <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${formData.notify_whatsapp ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}`}>
                                    {formData.notify_whatsapp && <Check className="w-4 h-4 text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={formData.notify_whatsapp}
                                    onChange={e => setFormData({ ...formData, notify_whatsapp: e.target.checked })}
                                />
                                <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 transition-colors">Notificar via WhatsApp</span>
                            </label>

                            <label className="flex items-center space-x-3 cursor-pointer group">
                                <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${formData.notify_email ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'}`}>
                                    {formData.notify_email && <Check className="w-4 h-4 text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={formData.notify_email}
                                    onChange={e => setFormData({ ...formData, notify_email: e.target.checked })}
                                />
                                <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 transition-colors">Notificar via E-mail</span>
                            </label>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? 'Salvando...' : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Registrar Entrega
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
