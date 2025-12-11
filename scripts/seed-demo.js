const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
    console.log('Seeding Demo Data...');

    // 1. Create Demo Condo
    const { data: condo } = await supabase.from('condos').insert([{
        name: 'Condomínio Rio 2025',
        address: 'Av. Atlântica, 2025',
        active: true
    }]).select().single();

    console.log('Condo created:', condo.id);

    // 2. Create Users
    const { data: admin } = await supabase.auth.admin.createUser({
        email: 'admin@rio2025.com',
        password: 'password123',
        email_confirm: true,
        user_metadata: { nome: 'Admin Rio' }
    });

    await supabase.from('users').insert({
        id: admin.user.id,
        email: 'admin@rio2025.com',
        role: 'sindico',
        condo_id: condo.id,
        nome: 'Admin Rio',
        ativo: true
    });

    console.log('Admin created');

    // 3. Create Equipments
    await supabase.from('manutencao_equipments').insert([
        { condo_id: condo.id, name: 'Elevador Social', type: 'Elevador', location: 'Bloco A' },
        { condo_id: condo.id, name: 'Bomba Piscina', type: 'Bomba', location: 'Área Lazer' }
    ]);

    // 4. Create Enquete
    await supabase.from('governanca_enquetes').insert([{
        condo_id: condo.id,
        title: 'Reforma do Hall',
        description: 'Devemos reformar o hall de entrada?',
        options: [{ id: '1', label: 'Sim' }, { id: '2', label: 'Não' }],
        start_at: new Date(),
        end_at: new Date(Date.now() + 86400000)
    }]);

    console.log('Seed Complete!');
}

seed().catch(console.error);
