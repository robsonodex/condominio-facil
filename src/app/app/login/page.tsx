'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, LogIn } from 'lucide-react';

/**
 * Tela de Login Mobile
 * Design mobile-first com inputs grandes e touch-friendly
 */
export default function AppLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError('Email ou senha incorretos');
                return;
            }

            // Seta cookie de app mode
            document.cookie = 'cf_app_mode=true; path=/; max-age=2592000; samesite=lax';

            router.push('/app/dashboard');
        } catch (err) {
            setError('Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-layout" style={{ justifyContent: 'center', padding: 24 }}>
            {/* Logo */}
            <div className="app-text-center app-mb-4" style={{ marginBottom: 48 }}>
                <div style={{
                    width: 80,
                    height: 80,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)'
                }}>
                    <span style={{ fontSize: 36, color: 'white', fontWeight: 'bold' }}>CF</span>
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                    Meu Condomínio Fácil
                </h1>
                <p style={{ color: '#6b7280', fontSize: 14 }}>
                    Faça login para continuar
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="app-flex app-flex-col app-gap-4">
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

                <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#374151' }}>
                        Senha
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="app-input"
                            required
                            autoComplete="current-password"
                            style={{ paddingRight: 48 }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: 12,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: '#6b7280',
                                padding: 8,
                                cursor: 'pointer'
                            }}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    className="app-button app-button-primary app-mt-4"
                    disabled={loading}
                    style={{ marginTop: 16 }}
                >
                    {loading ? (
                        <div className="app-spinner" style={{ width: 20, height: 20 }} />
                    ) : (
                        <>
                            <LogIn size={20} style={{ marginRight: 8 }} />
                            Entrar
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
