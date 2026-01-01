'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useFeature(featureKey: string) {
    const [isEnabled, setIsEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [config, setConfig] = useState<any>(null);

    useEffect(() => {
        checkFeature();
    }, [featureKey]);

    const checkFeature = async () => {
        const supabase = createClient();

        // 1. Pegar condo_id do usuário
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setIsLoading(false);
            return;
        }

        const { data: profile } = await supabase
            .from('users')
            .select('condo_id')
            .eq('id', user.id)
            .single();

        if (!profile?.condo_id) {
            setIsLoading(false);
            return;
        }

        // 2. Verificar feature via função SQL
        const { data, error } = await supabase.rpc('has_feature', {
            p_condo_id: profile.condo_id,
            p_feature_key: featureKey
        });

        if (!error && data) {
            setIsEnabled(true);

            // 3. Buscar config se habilitado
            const { data: featureData } = await supabase
                .from('condo_features')
                .select('config')
                .eq('condo_id', profile.condo_id)
                .eq('feature_key', featureKey)
                .single();

            if (featureData) {
                setConfig(featureData.config);
            }
        }

        setIsLoading(false);
    };

    return { isEnabled, isLoading, config };
}
