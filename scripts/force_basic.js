
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        let value = match[2].trim();
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
        }
        env[match[1]] = value;
    }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function forceBasic() {
    // 1. Find the target condo
    const { data: condos } = await supabase.from('condos').select('id, nome, plan:plans(nome_plano)').ilike('nome', '%Leblon%');

    if (!condos || condos.length === 0) {
        console.log('Condo Leblon not found');
        return;
    }
    const condo = condos[0];
    console.log('Target Condo:', condo.nome, 'Current Plan:', condo.plan?.nome_plano);

    // 2. Find Basic Plan
    const { data: plans } = await supabase.from('plans').select('id, nome_plano');
    const basicPlan = plans.find(p => p.nome_plano.toLowerCase().includes('básico') || p.nome_plano.toLowerCase().includes('basico'));

    if (!basicPlan) {
        console.log('Basic plan not found');
        return;
    }
    console.log('Target Plan:', basicPlan.nome_plano, basicPlan.id);

    // 3. Update
    const { error } = await supabase.from('condos').update({ plano_id: basicPlan.id }).eq('id', condo.id);

    if (error) {
        console.error('Error updating:', error);
    } else {
        console.log('SUCCESS: Condo updated to Basic Plan.');
    }
}

forceBasic();
