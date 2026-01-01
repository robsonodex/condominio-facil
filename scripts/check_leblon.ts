
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from the parent directory
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLeblon() {
    console.log('Searching for "Leblon 1"...');

    const { data: condos, error } = await supabase
        .from('condos')
        .select(`
            id, 
            nome, 
            status, 
            plan:plans (
                id, 
                nome_plano
            )
        `)
        .ilike('nome', '%Leblon%');

    if (error) {
        console.error('Error fetching condo:', error);
        return;
    }

    if (!condos || condos.length === 0) {
        console.log('No condo found matching "Leblon"');
        return;
    }

    condos.forEach(condo => {
        console.log('------------------------------------------------');
        console.log(`Condo ID: ${condo.id}`);
        console.log(`Nome: ${condo.nome}`);
        console.log(`Status: ${condo.status}`);
        // @ts-ignore
        console.log(`Plan Name (DB): ${condo.plan?.nome_plano}`);

        // Simulate Logic
        // @ts-ignore
        const planName = condo.plan?.nome_plano?.toLowerCase() || '';
        const isPlanQualified = planName.includes('avançado') || planName.includes('avancado') || planName.includes('premium') || planName.includes('demo');

        console.log(`Logic Input (lower): "${planName}"`);
        console.log(`isPlanQualified Result: ${isPlanQualified}`);
        console.log('------------------------------------------------');
    });
}

checkLeblon();
