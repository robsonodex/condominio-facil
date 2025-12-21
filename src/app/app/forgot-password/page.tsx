'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

/**
 * Tela de Recuperar Senha - Mobile
 */
export default function AppForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/app/reset-password`,
        });

        if (error) {
            setError('Erro ao enviar email. Verifique o endereço.');
        } else {
            setSent(true);
        }
        setLoading(false);
    };

    return (
        <div className="app-layout" style={{ justifyContent: 'center', padding: 24 }}>
            {/* Header */}
            <div className="app-text-center" style={{ marginBottom: 32 }}>
                <div
                    style={{
                        width: 64,
                        height: 64,
                        background: '#10b981',
                        borderRadius: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px'
                    }}
                >
                    <Mail size={32} color="white" />
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
                    Recuperar Senha
                </h1>
                <p style={{ color: '#6b7280', fontSize: 14 }}>
                    Enviaremos um link para seu email
                </p>
            </div>

            {/* Conteúdo */}
            {sent ? (
                <div style={{ textAlign: 'center' }}>
                    <div
                        style={{
                            width: 80,
                            height: 80,
                            background: '#d1fae5',
                            borderRadius: 40,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px'
                        }}
                    >
                        <CheckCircle size={40} color="#10b981" />
                    </div>
                    <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
                        Email Enviado!
                    </h2>
                    <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
                        Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                    </p>
                    <a
                        href="/app/login"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            width: '100%',
                            padding: '14px 24px',
                            background: '#10b981',
                            color: 'white',
                            borderRadius: 12,
                            fontWeight: 600,
                            textDecoration: 'none'
                        }}
                    >
                        <ArrowLeft size={18} />
                        Voltar ao Login
                    </a>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="app-flex app-flex-col app-gap-4">
                    {error && (
                        <div style={{
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: 12,
                            padding: 12,
                            color: '#dc2626',
                            fontSize: 14,
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    <div>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#374151' }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            className="app-input"
                            required
                            autoComplete="email"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '14px 24px',
                            background: loading ? '#9ca3af' : '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: 12,
                            fontWeight: 600,
                            fontSize: 16,
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                    </button>

                    <a
                        href="/app/login"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            padding: '12px',
                            color: '#6b7280',
                            textDecoration: 'none',
                            fontSize: 14
                        }}
                    >
                        <ArrowLeft size={16} />
                        Voltar ao Login
                    </a>
                </form>
            )}
        </div>
    );
}
