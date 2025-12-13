/**
 * Script para criar usuário demo via Supabase Admin API
 * Execute: node create-demo-user-simple.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Faltam variáveis de ambiente!');
    console.error('Adicione no .env.local:');
    console.error('NEXT_PUBLIC_SUPABASE_URL=sua_url');
    console.error('SUPABASE_SERVICE_ROLE_KEY=sua_chave');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    const email = 'demo@condofacil.com';
    const password = 'demo2024';
    const condoId = '00000000-0000-0000-0000-000000000001';

    console.log('🚀 Criando usuário demo...\n');

    // 1. Criar no auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nome: 'Ricardo Mendes Figueiredo' }
    });

    if (authError) {
        if (authError.message.includes('already registered')) {
            console.log('⚠️  Usuário já existe no auth, buscando...');
            const { data: users } = await supabase.auth.admin.listUsers();
            const existing = users.users.find(u => u.email === email);
            if (existing) {
                console.log('✅ Usuário encontrado:', existing.id);
                await updateUserInApp(existing.id, email, condoId);
            }
        } else {
            console.error('❌ Erro ao criar usuário:', authError.message);
            process.exit(1);
        }
    } else {
        console.log('✅ Usuário criado no auth:', authUser.user.id);
        await updateUserInApp(authUser.user.id, email, condoId);
    }
}

async function updateUserInApp(userId, email, condoId) {
    // 2. Inserir/atualizar na tabela users
    const { error: upsertError } = await supabase
        .from('users')
        .upsert({
            id: userId,
            email,
            nome: 'Ricardo Mendes Figueiredo',
            telefone: '(21) 99876-5432',
            role: 'sindico',
            condo_id: condoId,
            ativo: true
        }, { onConflict: 'id' });

    if (upsertError) {
        console.error('❌ Erro ao criar usuário app:', upsertError.message);
    } else {
        console.log('✅ Usuário criado/atualizado na tabela users');
    }

    // 3. Verificar
    const { data: user } = await supabase
        .from('users')
        .select('id, email, nome, role, condo_id')
        .eq('email', email)
        .single();

    if (user) {
        console.log('\n✅ SUCESSO!\n');
        console.log('Credenciais:');
        console.log('Email:', email);
        console.log('Senha: demo2024');
        console.log('\nID:', user.id);
        console.log('Condomínio:', user.condo_id);
    }
}

main().catch(console.error);
