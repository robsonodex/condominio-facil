'use client';

import * as React from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

// ============================================
// TIPOS
// ============================================

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
}

// ============================================
// CONTEXTO
// ============================================

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

// ============================================
// PROVIDER
// ============================================

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast = { ...toast, id };

        setToasts((prev) => [...prev, newToast]);

        // Auto remove after duration
        const duration = toast.duration || 5000;
        setTimeout(() => {
            removeToast(id);
        }, duration);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const success = useCallback((title: string, message?: string) => {
        addToast({ type: 'success', title, message });
    }, [addToast]);

    const error = useCallback((title: string, message?: string) => {
        addToast({ type: 'error', title, message, duration: 8000 });
    }, [addToast]);

    const warning = useCallback((title: string, message?: string) => {
        addToast({ type: 'warning', title, message });
    }, [addToast]);

    const info = useCallback((title: string, message?: string) => {
        addToast({ type: 'info', title, message });
    }, [addToast]);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
}

// ============================================
// COMPONENTE DE TOAST
// ============================================

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
    const icons = {
        success: <CheckCircle className="h-5 w-5 text-green-500" />,
        error: <AlertCircle className="h-5 w-5 text-red-500" />,
        warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
        info: <Info className="h-5 w-5 text-blue-500" />,
    };

    const bgColors = {
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        warning: 'bg-yellow-50 border-yellow-200',
        info: 'bg-blue-50 border-blue-200',
    };

    return (
        <div
            className={cn(
                'pointer-events-auto flex items-start gap-3 p-4 rounded-lg border shadow-lg',
                'animate-in slide-in-from-right-full duration-300',
                bgColors[toast.type]
            )}
        >
            {icons[toast.type]}
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{toast.title}</p>
                {toast.message && (
                    <p className="text-sm text-gray-600 mt-1">{toast.message}</p>
                )}
            </div>
            <button
                onClick={() => onRemove(toast.id)}
                className="p-1 rounded hover:bg-black/5 transition-colors"
            >
                <X className="h-4 w-4 text-gray-400" />
            </button>
        </div>
    );
}

// ============================================
// ALERT MODAL (substitui alert() nativo)
// ============================================

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    buttonText?: string;
}

export function AlertModal({
    isOpen,
    onClose,
    title,
    message,
    type = 'info',
    buttonText = 'OK'
}: AlertModalProps) {
    if (!isOpen) return null;

    const icons = {
        success: <CheckCircle className="h-12 w-12 text-green-500" />,
        error: <AlertCircle className="h-12 w-12 text-red-500" />,
        warning: <AlertTriangle className="h-12 w-12 text-yellow-500" />,
        info: <Info className="h-12 w-12 text-blue-500" />,
    };

    const buttonColors = {
        success: 'bg-green-600 hover:bg-green-700',
        error: 'bg-red-600 hover:bg-red-700',
        warning: 'bg-yellow-600 hover:bg-yellow-700',
        info: 'bg-blue-600 hover:bg-blue-700',
    };

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="min-h-screen px-4 flex items-center justify-center">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black/50 transition-opacity"
                    onClick={onClose}
                />

                {/* Modal */}
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center transform transition-all animate-in zoom-in-95 duration-200">
                    <div className="flex justify-center mb-4">
                        {icons[type]}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
                    <p className="text-gray-600 mb-6">{message}</p>
                    <button
                        onClick={onClose}
                        className={cn(
                            'w-full py-3 px-4 rounded-xl text-white font-semibold transition-colors',
                            buttonColors[type]
                        )}
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================
// HOOK PARA USAR ALERT MODAL
// ============================================

interface AlertState {
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
}

export function useAlert() {
    const [alertState, setAlertState] = useState<AlertState>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    const showAlert = useCallback((
        title: string,
        message: string,
        type: 'success' | 'error' | 'warning' | 'info' = 'info'
    ) => {
        setAlertState({ isOpen: true, title, message, type });
    }, []);

    const closeAlert = useCallback(() => {
        setAlertState(prev => ({ ...prev, isOpen: false }));
    }, []);

    const AlertComponent = () => (
        <AlertModal
            isOpen={alertState.isOpen}
            onClose={closeAlert}
            title={alertState.title}
            message={alertState.message}
            type={alertState.type}
        />
    );

    return { showAlert, closeAlert, AlertComponent, alertState };
}
