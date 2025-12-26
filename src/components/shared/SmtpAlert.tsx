'use client';

import Link from 'next/link';
import { AlertTriangle, Mail, Settings } from 'lucide-react';

interface SmtpAlertProps {
    configUrl?: string;
    variant?: 'warning' | 'info' | 'inline';
    className?: string;
}

export function SmtpAlert({
    configUrl = '/configuracoes/email',
    variant = 'warning',
    className = ''
}: SmtpAlertProps) {
    if (variant === 'inline') {
        return (
            <span className={`text-amber-600 text-sm flex items-center gap-1 ${className}`}>
                <AlertTriangle className="h-4 w-4" />
                E-mail não configurado
            </span>
        );
    }

    if (variant === 'info') {
        return (
            <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${className}`}>
                <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm text-blue-800">
                            Configure o servidor de e-mail para habilitar envios automáticos.
                        </p>
                        <Link
                            href={configUrl}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-1 inline-flex items-center gap-1"
                        >
                            <Settings className="h-3 w-3" /> Configurar agora
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // variant === 'warning'
    return (
        <div className={`bg-amber-50 border border-amber-200 rounded-lg p-4 ${className}`}>
            <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div className="flex-1">
                    <h4 className="font-medium text-amber-800">Configuração de E-mail Necessária</h4>
                    <p className="text-sm text-amber-700 mt-1">
                        Para enviar e-mails (cobranças, avisos, credenciais), você precisa configurar o servidor SMTP do seu condomínio.
                    </p>
                    <Link
                        href={configUrl}
                        className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
                    >
                        <Settings className="h-4 w-4" /> Configurar E-mail
                    </Link>
                </div>
            </div>
        </div>
    );
}

// Componente para desabilitar checkbox quando SMTP não está configurado
interface SmtpCheckboxProps {
    id: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    smtpConfigured: boolean;
    configUrl?: string;
    className?: string;
}

export function SmtpCheckbox({
    id,
    checked,
    onChange,
    label,
    smtpConfigured,
    configUrl = '/configuracoes/email',
    className = ''
}: SmtpCheckboxProps) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <input
                type="checkbox"
                id={id}
                checked={smtpConfigured ? checked : false}
                onChange={(e) => onChange(e.target.checked)}
                disabled={!smtpConfigured}
                className={`rounded h-5 w-5 ${smtpConfigured ? 'text-emerald-600' : 'text-gray-300 cursor-not-allowed'}`}
            />
            <label
                htmlFor={id}
                className={`text-sm ${smtpConfigured ? 'text-gray-700' : 'text-gray-400'}`}
            >
                {label}
            </label>
            {!smtpConfigured && (
                <Link
                    href={configUrl}
                    className="text-xs text-amber-600 hover:text-amber-700 underline"
                >
                    (configurar)
                </Link>
            )}
        </div>
    );
}
