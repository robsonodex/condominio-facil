'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function CheckAuthPage() {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [testResult, setTestResult] = useState<any>(null);
    const [testEmail, setTestEmail] = useState('');
    const [testPassword, setTestPassword] = useState('');

    useEffect(() => {
        const check = async () => {
            try {
                const supabase = createClient();
                const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING';
                const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

                const { data, error } = await supabase.auth.getSession();

                // Test if we can reach Supabase API
                let apiReachable = false;
                try {
                    const testFetch = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
                        headers: {
                            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                        }
                    });
                    apiReachable = testFetch.status !== 0;
                } catch {
                    apiReachable = false;
                }

                setStatus({
                    url: url,
                    hasAnonKey: hasKey,
                    sessionError: error?.message || 'None',
                    hasSession: !!data.session,
                    userEmail: data.session?.user?.email || 'N/A',
                    apiReachable,
                    time: new Date().toISOString(),
                });
            } catch (err: any) {
                setStatus({ error: err.message });
            } finally {
                setLoading(false);
            }
        };
        check();
    }, []);

    const testLogin = async () => {
        if (!testEmail || !testPassword) {
            setTestResult({ error: 'Preencha email e senha' });
            return;
        }

        setTestResult({ loading: true });

        try {
            const supabase = createClient();

            // Clear any existing session first
            await supabase.auth.signOut();

            // Try to sign in
            const { data, error } = await supabase.auth.signInWithPassword({
                email: testEmail,
                password: testPassword,
            });

            if (error) {
                setTestResult({
                    success: false,
                    error: error.message,
                    code: error.status,
                    details: JSON.stringify(error, null, 2)
                });
            } else {
                setTestResult({
                    success: true,
                    user: {
                        id: data?.user?.id,
                        email: data?.user?.email,
                        emailConfirmedAt: data?.user?.email_confirmed_at,
                        createdAt: data?.user?.created_at,
                    }
                });
                // Sign out after test
                await supabase.auth.signOut();
            }
        } catch (err: any) {
            setTestResult({
                success: false,
                exception: err.message
            });
        }
    };

    if (loading) return <div style={{ padding: 20 }}>Checking...</div>;

    return (
        <div style={{ padding: 20, fontFamily: 'monospace', maxWidth: 800, margin: '0 auto' }}>
            <h1 style={{ color: '#dc2626' }}>🔧 Diagnóstico de Autenticação</h1>

            <h2>1. Status do Ambiente</h2>
            <pre style={{ background: '#f1f5f9', padding: 15, borderRadius: 8, overflow: 'auto' }}>
                {JSON.stringify(status, null, 2)}
            </pre>

            <h2>2. Teste de Login Manual</h2>
            <div style={{ background: '#fef3c7', padding: 15, borderRadius: 8, marginBottom: 15 }}>
                <p style={{ margin: 0, color: '#92400e' }}>
                    ⚠️ Use este formulário para testar se as credenciais estão funcionando diretamente no Supabase
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 400 }}>
                <input
                    type="email"
                    placeholder="Email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    style={{ padding: 10, borderRadius: 4, border: '1px solid #ccc' }}
                />
                <input
                    type="password"
                    placeholder="Senha"
                    value={testPassword}
                    onChange={(e) => setTestPassword(e.target.value)}
                    style={{ padding: 10, borderRadius: 4, border: '1px solid #ccc' }}
                />
                <button
                    onClick={testLogin}
                    style={{
                        padding: 10,
                        borderRadius: 4,
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    Testar Login
                </button>
            </div>

            {testResult && (
                <div style={{ marginTop: 15 }}>
                    <h3>Resultado do Teste:</h3>
                    <pre style={{
                        background: testResult.success ? '#dcfce7' : '#fee2e2',
                        padding: 15,
                        borderRadius: 8,
                        overflow: 'auto'
                    }}>
                        {JSON.stringify(testResult, null, 2)}
                    </pre>
                </div>
            )}

            <hr style={{ margin: '30px 0' }} />

            <h2>3. Possíveis Causas do Erro "Invalid login credentials"</h2>
            <ul style={{ lineHeight: 1.8 }}>
                <li><strong>Credenciais incorretas:</strong> O usuário pode ter digitado a senha errada</li>
                <li><strong>Usuário não existe:</strong> O usuário pode não ter sido criado no Supabase Auth</li>
                <li><strong>Ambiente errado:</strong> As variáveis de ambiente podem estar apontando para um projeto Supabase diferente</li>
                <li><strong>Email não confirmado:</strong> Se a configuração do Supabase exige confirmação de email</li>
            </ul>

            <h2>4. Ações Recomendadas</h2>
            <ol style={{ lineHeight: 1.8 }}>
                <li>Verifique se a URL do Supabase acima corresponde ao seu projeto</li>
                <li>No painel do Supabase, vá em Authentication → Users e verifique se o usuário existe</li>
                <li>Tente fazer reset de senha diretamente no Supabase</li>
                <li>Verifique as variáveis de ambiente no Vercel/deploy</li>
            </ol>

            <button
                onClick={() => window.location.reload()}
                style={{ marginTop: 20, padding: '10px 20px' }}
            >
                Recarregar Página
            </button>
        </div>
    );
}
