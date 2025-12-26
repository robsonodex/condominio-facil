'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function EmergencyRepairPage() {
    const { profile, loading } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [result, setResult] = useState<any>(null);
    const [processing, setProcessing] = useState(false);
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        if (!loading && profile?.role !== 'superadmin') {
            router.replace('/dashboard');
        }
    }, [loading, profile, router]);

    const handleCheck = async () => {
        if (!email) return alert('Digite um email');
        setProcessing(true);
        setResult(null);
        try {
            const res = await fetch('/api/emergency-repair', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'check', email })
            });
            const data = await res.json();
            setResult(data);
        } catch (err: any) {
            setResult({ error: err.message });
        }
        setProcessing(false);
    };

    const handleReset = async () => {
        if (!email || !newPassword) return alert('Digite email e nova senha');
        if (newPassword.length < 6) return alert('Senha deve ter no mínimo 6 caracteres');
        setProcessing(true);
        try {
            const res = await fetch('/api/emergency-repair', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reset_password', email, newPassword })
            });
            const data = await res.json();
            setResult(data);
            if (data.success) {
                alert(data.message);
            }
        } catch (err: any) {
            setResult({ error: err.message });
        }
        setProcessing(false);
    };

    const handleListUsers = async () => {
        setProcessing(true);
        try {
            const res = await fetch('/api/emergency-repair', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'list_users' })
            });
            const data = await res.json();
            setUsers(data.users || []);
            setResult({ authCount: data.authCount, profileCount: data.profileCount });
        } catch (err: any) {
            setResult({ error: err.message });
        }
        setProcessing(false);
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
    }

    if (profile?.role !== 'superadmin') {
        return <div className="min-h-screen flex items-center justify-center text-red-500">
            ⛔ Acesso negado - apenas Superadmin
        </div>;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-red-500 mb-2">🔧 Emergency Repair</h1>
                <p className="text-gray-400 mb-8">Ferramentas de emergência - APENAS SUPERADMIN</p>

                <div className="bg-gray-800 rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Verificar / Resetar Usuário</h2>
                    <div className="flex flex-wrap gap-3 mb-4">
                        <input
                            type="email"
                            placeholder="Email do usuário"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="flex-1 min-w-[200px] px-4 py-2 bg-gray-700 rounded text-white"
                        />
                        <input
                            type="text"
                            placeholder="Nova senha (min 6 chars)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="flex-1 min-w-[200px] px-4 py-2 bg-gray-700 rounded text-white"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleCheck}
                            disabled={processing}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium disabled:opacity-50"
                        >
                            🔍 Verificar Status
                        </button>
                        <button
                            onClick={handleReset}
                            disabled={processing}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-medium disabled:opacity-50"
                        >
                            🔑 Resetar Senha
                        </button>
                        <button
                            onClick={handleListUsers}
                            disabled={processing}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded font-medium disabled:opacity-50"
                        >
                            📋 Listar Usuários
                        </button>
                    </div>
                </div>

                {result && (
                    <div className="bg-gray-800 rounded-lg p-6 mb-6">
                        <h3 className="font-semibold mb-3">Resultado:</h3>
                        <pre className="bg-gray-900 p-4 rounded overflow-auto text-sm">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                )}

                {users.length > 0 && (
                    <div className="bg-gray-800 rounded-lg p-6">
                        <h3 className="font-semibold mb-3">Usuários ({users.length}):</h3>
                        <div className="space-y-2 max-h-[400px] overflow-auto">
                            {users.map((u, i) => (
                                <div key={i} className="bg-gray-700 p-3 rounded text-sm flex gap-4">
                                    <span className="font-mono">{u.email}</span>
                                    <span className={u.confirmed ? 'text-green-400' : 'text-red-400'}>
                                        {u.confirmed ? '✅ Confirmado' : '❌ Pendente'}
                                    </span>
                                    <span className="text-gray-400">{u.profile?.role || 'sem perfil'}</span>
                                    <button
                                        onClick={() => setEmail(u.email)}
                                        className="ml-auto text-blue-400 hover:text-blue-300"
                                    >
                                        Selecionar
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
