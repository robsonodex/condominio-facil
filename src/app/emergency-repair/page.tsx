'use client';

import { useState } from 'react';

export default function EmergencyRepairPage() {
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const checkUser = async () => {
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch('/api/emergency-repair', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'check', email })
            });
            setResult(await res.json());
        } catch (err: any) {
            setResult({ error: err.message });
        }
        setLoading(false);
    };

    const fixUser = async () => {
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch('/api/emergency-repair', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'fix', email })
            });
            setResult(await res.json());
        } catch (err: any) {
            setResult({ error: err.message });
        }
        setLoading(false);
    };

    const resetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            setResult({ error: 'Senha deve ter pelo menos 6 caracteres' });
            return;
        }
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch('/api/emergency-repair', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reset_password', email, newPassword })
            });
            setResult(await res.json());
        } catch (err: any) {
            setResult({ error: err.message });
        }
        setLoading(false);
    };

    return (
        <div style={{
            padding: 30,
            fontFamily: 'system-ui',
            maxWidth: 600,
            margin: '0 auto',
            background: '#fff1f2',
            minHeight: '100vh'
        }}>
            <div style={{
                background: '#dc2626',
                color: 'white',
                padding: 15,
                borderRadius: 8,
                marginBottom: 20,
                textAlign: 'center'
            }}>
                <h1 style={{ margin: 0 }}>🚨 REPARO DE EMERGÊNCIA</h1>
                <p style={{ margin: '10px 0 0 0', fontSize: 14 }}>
                    Use esta página para diagnosticar e corrigir problemas de login
                </p>
            </div>

            <div style={{ background: 'white', padding: 20, borderRadius: 8, marginBottom: 20 }}>
                <h2 style={{ marginTop: 0 }}>1. Email do Usuário</h2>
                <input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                        width: '100%',
                        padding: 12,
                        borderRadius: 6,
                        border: '2px solid #e5e7eb',
                        fontSize: 16,
                        boxSizing: 'border-box'
                    }}
                />
            </div>

            <div style={{ background: 'white', padding: 20, borderRadius: 8, marginBottom: 20 }}>
                <h2 style={{ marginTop: 0 }}>2. Ações</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button
                        onClick={checkUser}
                        disabled={!email || loading}
                        style={{
                            padding: 15,
                            borderRadius: 6,
                            background: '#2563eb',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 16,
                            fontWeight: 'bold'
                        }}
                    >
                        🔍 VERIFICAR USUÁRIO
                    </button>

                    <button
                        onClick={fixUser}
                        disabled={!email || loading}
                        style={{
                            padding: 15,
                            borderRadius: 6,
                            background: '#16a34a',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 16,
                            fontWeight: 'bold'
                        }}
                    >
                        🔧 CORRIGIR PROFILE
                    </button>

                    <div style={{
                        marginTop: 10,
                        padding: 15,
                        background: '#fef3c7',
                        borderRadius: 6,
                        border: '2px solid #f59e0b'
                    }}>
                        <h3 style={{ margin: '0 0 10px 0' }}>🔑 Resetar Senha</h3>
                        <input
                            type="password"
                            placeholder="Nova senha (mínimo 6 caracteres)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: 10,
                                borderRadius: 4,
                                border: '1px solid #ccc',
                                marginBottom: 10,
                                boxSizing: 'border-box'
                            }}
                        />
                        <button
                            onClick={resetPassword}
                            disabled={!email || !newPassword || loading}
                            style={{
                                width: '100%',
                                padding: 12,
                                borderRadius: 6,
                                background: '#dc2626',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 14,
                                fontWeight: 'bold'
                            }}
                        >
                            ⚠️ RESETAR SENHA
                        </button>
                    </div>
                </div>
            </div>

            {loading && (
                <div style={{ textAlign: 'center', padding: 20 }}>
                    <div style={{ fontSize: 24 }}>⏳</div>
                    <p>Processando...</p>
                </div>
            )}

            {result && (
                <div style={{
                    background: result.success || result.found ? '#dcfce7' : (result.error ? '#fee2e2' : '#f0f9ff'),
                    padding: 20,
                    borderRadius: 8,
                    border: `2px solid ${result.success || result.found ? '#16a34a' : (result.error ? '#dc2626' : '#2563eb')}`
                }}>
                    <h3 style={{ marginTop: 0 }}>Resultado:</h3>
                    <pre style={{
                        overflow: 'auto',
                        fontSize: 12,
                        background: 'rgba(0,0,0,0.05)',
                        padding: 10,
                        borderRadius: 4
                    }}>
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}

            <div style={{
                marginTop: 30,
                padding: 15,
                background: '#f8fafc',
                borderRadius: 8,
                fontSize: 13,
                color: '#64748b'
            }}>
                <strong>Instruções:</strong>
                <ol>
                    <li>Digite o email do usuário com problema</li>
                    <li>Clique em "VERIFICAR" para ver o status</li>
                    <li>Se o profile estiver faltando, clique em "CORRIGIR"</li>
                    <li>Para resetar a senha, digite a nova senha e clique em "RESETAR"</li>
                </ol>
                <p style={{ marginBottom: 0, color: '#dc2626' }}>
                    ⚠️ IMPORTANTE: Remova esta página após resolver o problema!
                </p>
            </div>
        </div>
    );
}
