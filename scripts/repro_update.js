
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

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function repro() {
    // 1. Get Plans
    const { data: plans } = await supabase.from('plans').select('id, nome_plano');
    const basic = plans.find(p => p.nome_plano.toLowerCase().includes('basico') || p.nome_plano.toLowerCase().includes('básico'));
    const premium = plans.find(p => p.nome_plano.toLowerCase().includes('premium'));

    console.log('Plans:', { basic: basic?.id, premium: premium?.id });

    // 2. Get Condo Leblon
    const { data: condos } = await supabase.from('condos').select('id, nome, plano_id').ilike('nome', '%Leblon%').limit(1);
    const condo = condos[0];

    console.log('Current Condo:', condo);

    if (!condo || !basic) {
        console.error('Missing data');
        return;
    }

    // 3. Update to Basic
    console.log(`Updating to Basic (${basic.id})...`);
    const { error: err1 } = await supabase.from('condos').update({ plano_id: basic.id }).eq('id', condo.id);
    if (err1) console.error('Update 1 Error:', err1);

    // 4. Verify
    const { data: condoAfter } = await supabase.from('condos').select('plano_id, plan:plans(nome_plano)').eq('id', condo.id).single();
    console.log('After Update 1:', condoAfter?.plan?.nome_plano);

    // 5. Revert to Premium
    if (premium) {
        console.log(`Reverting to Premium (${premium.id})...`);
        const { error: err2 } = await supabase.from('condos').update({ plano_id: premium.id }).eq('id', condo.id);
        if (err2) console.error('Update 2 Error:', err2);

        const { data: condoFinal } = await supabase.from('condos').select('plano_id, plan:plans(nome_plano)').eq('id', condo.id).single();
        console.log('Final State:', condoFinal?.plan?.nome_plano);
    }
}

repro();
