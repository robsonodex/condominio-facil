import { AuthProvider } from '@/hooks/useAuth';
import { ToastProvider } from '@/components/ui';
import { QueryProvider } from '@/components/providers/QueryProvider';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <QueryProvider>
            <AuthProvider>
                <ToastProvider>
                    {children}
                </ToastProvider>
            </AuthProvider>
        </QueryProvider>
    );
}

