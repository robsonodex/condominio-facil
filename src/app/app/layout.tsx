import './app.css';
import { AppModeProvider } from '@/contexts/AppModeContext';

/**
 * Layout EXCLUSIVO para rotas /app/*
 * 
 * ⚠️ Este layout NÃO afeta o site web!
 * Usado APENAS para a experiência mobile do WebView
 */
export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AppModeProvider>
            <div className="app-layout">
                {children}
            </div>
        </AppModeProvider>
    );
}
