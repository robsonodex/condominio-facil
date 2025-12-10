import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Validate SERVICE_ROLE_KEY exists  
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[CREATE_USER] SUPABASE_SERVICE_ROLE_KEY não configurado!');
}

// Create Supabase Admin client (service role)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, nome, telefone, role, condo_id } = body;

        // Validate required fields
        if (!email || !password || !nome || !role || !condo_id) {
            return NextResponse.json(
                { error: 'Campos obrigatórios faltando' },
                { status: 400 }
            );
        }

        // Create user in Supabase Auth using Admin API
        // CRITICAL: Using service role prevents logging out current user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
            user_metadata: { nome }
        });

        if (authError) {
            console.error('[CREATE_USER] Auth error:', authError);
            return NextResponse.json(
                { error: authError.message },
                { status: 400 }
            );
        }

        if (!authData.user) {
            return NextResponse.json(
                { error: 'Falha ao criar usuário' },
                { status: 500 }
            );
        }

        // Create user profile in users table
        const { error: profileError } = await supabaseAdmin
            .from('users')
            .insert({
                id: authData.user.id,
                email,
                nome,
                telefone: telefone || null,
                role,
                condo_id,
                ativo: true,
            });

        if (profileError) {
            console.error('[CREATE_USER] Profile error:', profileError);
            // Attempt to delete auth user if profile creation fails
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            return NextResponse.json(
                { error: 'Erro ao criar perfil do usuário' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            user: {
                id: authData.user.id,
                email,
                nome,
                role
            },
            credentials: {
                email,
                password
            }
        });

    } catch (error: any) {
        console.error('[CREATE_USER] Unexpected error:', error);
        return NextResponse.json(
            { error: error.message || 'Erro interno' },
            { status: 500 }
        );
    }
}
