'use client';

import { useState } from 'react';

export default function PublicResetPage() {
    const [secretKey, setSecretKey] = useState('');
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [result, setResult] = useState<any>(null);
    const [processing, setProcessing] = useState(false);

    const handleReset = async () => {
        if (!secretKey || !email || !newPassword) {
            alert('Preencha todos os campos');
            return;
        }
        if (newPassword.length < 6) {
            alert('Senha deve ter no mínimo 6 caracteres');
            return;
        }

        setProcessing(true);
        setResult(null);

        try {
            const res = await fetch('/api/public-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secretKey, email, newPassword })
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

    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md">
                <h1 className="text-2xl font-bold text-red-500 mb-2">🔐 Reset de Emergência</h1>
                <p className="text-gray-400 text-sm mb-6">Reset de senha sem envio de email</p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Chave Secreta</label>
                        <input
                            type="password"
                            placeholder="Digite a chave secreta"
                            value={secretKey}
                            onChange={(e) => setSecretKey(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700 rounded text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Email</label>
                        <input
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700 rounded text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Nova Senha</label>
                        <input
                            type="text"
                            placeholder="Mínimo 6 caracteres"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700 rounded text-white"
                        />
                    </div>

                    <button
                        onClick={handleReset}
                        disabled={processing}
                        className="w-full py-3 bg-red-600 hover:bg-red-700 rounded font-bold disabled:opacity-50"
                    >
                        {processing ? 'Processando...' : '🔑 Resetar Senha'}
                    </button>
                </div>

                {result && (
                    <div className={`mt-4 p-4 rounded ${result.success ? 'bg-green-900' : 'bg-red-900'}`}>
                        {result.success ? (
                            <p className="text-green-300">{result.message}</p>
                        ) : (
                            <p className="text-red-300">Erro: {result.error}</p>
                        )}
                    </div>
                )}

                <p className="text-center text-gray-500 text-xs mt-6">
                    Após resetar, faça login em /login
                </p>
            </div>
        </div>
    );
}
