'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, ArrowRight, CheckCircle } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const { signUp } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('As senhas não coincidem');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            setLoading(false);
            return;
        }

        const { error } = await signUp(email, password, nome);

        if (error) {
            setError(error.message || 'Erro ao criar conta');
            setLoading(false);
        } else {
            setSuccess(true);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex flex-col justify-center py-12 px-4">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 rounded-2xl sm:px-10 border border-gray-100 text-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Conta criada com sucesso!
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Verifique seu email para confirmar sua conta.
                        </p>
                        <Button onClick={() => router.push('/login')} className="w-full">
                            Ir para o login
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                {/* Logo */}
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                        <Building2 className="h-9 w-9 text-white" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                    Criar conta
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Comece a gerenciar seu condomínio hoje
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 rounded-2xl sm:px-10 border border-gray-100">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <Input
                            label="Nome completo"
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            placeholder="Seu nome"
                            required
                        />

                        <Input
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            required
                        />

                        <Input
                            label="Senha"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            required
                        />

                        <Input
                            label="Confirmar senha"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Digite a senha novamente"
                            required
                        />

                        <Button type="submit" className="w-full" loading={loading}>
                            Criar conta
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-500">
                        Já tem uma conta?{' '}
                        <Link
                            href="/login"
                            className="font-medium text-emerald-600 hover:text-emerald-700"
                        >
                            Faça login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
