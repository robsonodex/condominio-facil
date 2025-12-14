'use client';

import { useUser } from './useUser';
import { useRouter } from 'next/navigation';

const DEMO_EMAIL = 'sindico.demo@condofacil.com';

export function useDemoMode() {
    const { profile } = useUser();
    const router = useRouter();

    const isDemo = profile?.email === DEMO_EMAIL;

    /**
     * Check if action is allowed. Returns false if demo and shows alert.
     */
    const checkDemoAction = (actionName?: string): boolean => {
        if (isDemo) {
            const action = actionName || 'Esta operação';
            alert(
                `⚠️ ${action} não está disponível no modo demonstração.\n\n` +
                `Adquira seu plano para desbloquear todas as funcionalidades!`
            );
            return false;
        }
        return true;
    };

    /**
     * Redirect to pricing page
     */
    const goToPricing = () => {
        router.push('/landing#pricing');
    };

    return {
        isDemo,
        checkDemoAction,
        goToPricing,
        demoEmail: DEMO_EMAIL,
    };
}
