'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatPhone } from '@/lib/utils';
import { User, Lock, Phone, Save } from 'lucide-react';

export default function PerfilPage() {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        nome: profile?.nome || '',
        telefone: profile?.telefone || '',
    });

    const [passwordData, setPasswordData] = useState({
        senhaAtual: '',
        novaSenha: '',
        confirmarSenha: '',
    });

    const supabase = createClient();

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const { error } = await supabase
                .from('users')
                .update({
                    nome: formData.nome,
                    telefone: formData.telefone || null,
                })
                .eq('id', user?.id);

            if (error) throw error;
            setSuccess('Perfil atualizado com sucesso!');
        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar perfil');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (passwordData.novaSenha !== passwordData.confirmarSenha) {
            setError('As senhas não coincidem');
            setLoading(false);
            return;
        }

        if (passwordData.novaSenha.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: passwordData.novaSenha
            });

            if (error) throw error;

            setSuccess('Senha alterada com sucesso!');
            setPasswordData({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
        } catch (err: any) {
            setError(err.message || 'Erro ao alterar senha');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
                <p className="text-gray-500">Gerencie suas informações pessoais</p>
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

            {/* Profile Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Informações Pessoais
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <Input
                            label="Email"
                            value={user?.email || ''}
                            disabled
                            className="bg-gray-50"
                        />

                        <Input
                            label="Nome completo"
                            value={formData.nome}
                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                            required
                        />

                        <Input
                            label="Telefone"
                            value={formData.telefone}
                            onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                            placeholder="(00) 00000-0000"
                        />

                        <Button type="submit" disabled={loading}>
                            <Save className="h-4 w-4 mr-2" />
                            Salvar Alterações
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Change Password */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Alterar Senha
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <Input
                            label="Nova senha"
                            type="password"
                            value={passwordData.novaSenha}
                            onChange={(e) => setPasswordData({ ...passwordData, novaSenha: e.target.value })}
                            required
                            minLength={6}
                        />

                        <Input
                            label="Confirmar nova senha"
                            type="password"
                            value={passwordData.confirmarSenha}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmarSenha: e.target.value })}
                            required
                            minLength={6}
                        />

                        <Button type="submit" disabled={loading}>
                            <Lock className="h-4 w-4 mr-2" />
                            Alterar Senha
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
