// Script para criar usuário demo via Supabase Admin
// Execute: node scripts/create-demo-user.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variáveis de ambiente não encontradas!');
    console.error('Certifique-se de ter NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const DEMO_USER_ID = '00000000-0000-0000-0000-000000001001';
const DEMO_EMAIL = 'sindico.demo@jardimatlântico.com.br';
const DEMO_PASSWORD = 'demo2024';

async function createDemoUser() {
    console.log('🚀 Criando usuário demo...\n');

    try {
        // 1. Verificar se usuário já existe no auth
        const { data: existingAuthUser } = await supabaseAdmin.auth.admin.getUserById(DEMO_USER_ID);

        if (existingAuthUser?.user) {
            console.log('⚠️  Usuário já existe no auth. Atualizando senha...');

            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                DEMO_USER_ID,
                { password: DEMO_PASSWORD }
            );

            if (updateError) {
                console.error('❌ Erro ao atualizar senha:', updateError.message);
            } else {
                console.log('✅ Senha atualizada com sucesso!');
            }
        } else {
            console.log('📝 Criando novo usuário no auth...');

            // 2. Criar usuário no Supabase Auth
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                id: DEMO_USER_ID,
                email: DEMO_EMAIL,
                password: DEMO_PASSWORD,
                email_confirm: true,
                user_metadata: {
                    nome: 'Ricardo Mendes Figueiredo'
                }
            });

            if (createError) {
                console.error('❌ Erro ao criar usuário:', createError.message);
                process.exit(1);
            }

            console.log('✅ Usuário criado no auth:', newUser.user.email);
        }

        // 3. Verificar/atualizar usuário na tabela users
        const { data: appUser, error: userError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', DEMO_USER_ID)
            .single();

        if (userError && userError.code !== 'PGRST116') {
            console.error('❌ Erro ao buscar usuário app:', userError.message);
        }

        if (!appUser) {
            console.log('⚠️  Usuário não existe na tabela users. Criando...');

            const { error: insertError } = await supabaseAdmin
                .from('users')
                .insert({
                    id: DEMO_USER_ID,
                    email: DEMO_EMAIL,
                    nome: 'Ricardo Mendes Figueiredo',
                    telefone: '(21) 99876-5432',
                    role: 'sindico',
                    condo_id: '00000000-0000-0000-0000-000000000001',
                    ativo: true
                });

            if (insertError) {
                console.error('❌ Erro ao criar usuário app:', insertError.message);
            } else {
                console.log('✅ Usuário criado na tabela users');
            }
        } else {
            console.log('✅ Usuário já existe na tabela users');

            // Atualizar para garantir que está correto
            const { error: updateError } = await supabaseAdmin
                .from('users')
                .update({
                    email: DEMO_EMAIL,
                    nome: 'Ricardo Mendes Figueiredo',
                    telefone: '(21) 99876-5432',
                    role: 'sindico',
                    condo_id: '00000000-0000-0000-0000-000000000001',
                    ativo: true
                })
                .eq('id', DEMO_USER_ID);

            if (updateError) {
                console.error('⚠️  Erro ao atualizar usuário app:', updateError.message);
            } else {
                console.log('✅ Usuário atualizado na tabela users');
            }
        }

        console.log('\n✅ SUCESSO! Usuário demo criado/atualizado.\n');
        console.log('📧 Email:', DEMO_EMAIL);
        console.log('🔑 Senha:', DEMO_PASSWORD);
        console.log('\n🌐 Acesse: http://localhost:3000/login\n');

    } catch (error) {
        console.error('❌ Erro geral:', error);
        process.exit(1);
    }
}

createDemoUser();
