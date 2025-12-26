import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// API de DIAGNÓSTICO para verificar usuários no Supabase Auth
// REMOVER EM PRODUÇÃO após resolver o problema

export async function GET(request: NextRequest) {
    try {
        // 1. Listar todos os usuários no Supabase Auth
        const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

        if (authError) {
            return NextResponse.json({
                error: 'Erro ao listar usuários do Auth: ' + authError.message,
                serviceRoleKeyPresent: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            }, { status: 500 });
        }

        // 2. Listar todos os profiles na tabela users
        const { data: profiles, error: profilesError } = await supabaseAdmin
            .from('users')
            .select('id, email, role, ativo, nome, condo_id')
            .order('email');

        // 3. Comparar e identificar discrepâncias
        const authEmails = new Set(authUsers?.users?.map(u => u.email) || []);
        const profileEmails = new Set(profiles?.map(p => p.email) || []);

        // Usuários no Auth mas não tem profile
        const missingProfiles = authUsers?.users?.filter(u =>
            !profiles?.find(p => p.id === u.id)
        ) || [];

        // Profiles sem usuário no Auth
        const orphanedProfiles = profiles?.filter(p =>
            !authUsers?.users?.find(u => u.id === p.id)
        ) || [];

        // Usuários com email não confirmado
        const unconfirmedUsers = authUsers?.users?.filter(u => !u.email_confirmed_at) || [];

        // Usuários desabilitados (banned)
        const bannedUsers = authUsers?.users?.filter(u => u.banned_until) || [];

        return NextResponse.json({
            timestamp: new Date().toISOString(),
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 50) + '...',
            serviceRoleKeyPresent: !!process.env.SUPABASE_SERVICE_ROLE_KEY,

            summary: {
                totalAuthUsers: authUsers?.users?.length || 0,
                totalProfiles: profiles?.length || 0,
                missingProfiles: missingProfiles.length,
                orphanedProfiles: orphanedProfiles.length,
                unconfirmedUsers: unconfirmedUsers.length,
                bannedUsers: bannedUsers.length,
            },

            // Lista de usuários com status
            users: authUsers?.users?.map(u => ({
                id: u.id,
                email: u.email,
                emailConfirmed: !!u.email_confirmed_at,
                createdAt: u.created_at,
                lastSignIn: u.last_sign_in_at,
                banned: !!u.banned_until,
                hasProfile: !!profiles?.find(p => p.id === u.id),
                profileRole: profiles?.find(p => p.id === u.id)?.role || 'N/A',
                profileAtivo: profiles?.find(p => p.id === u.id)?.ativo ?? 'N/A',
            })) || [],

            // Problemas identificados
            issues: {
                missingProfiles: missingProfiles.map(u => ({ id: u.id, email: u.email })),
                orphanedProfiles: orphanedProfiles.map(p => ({ id: p.id, email: p.email })),
                unconfirmedUsers: unconfirmedUsers.map(u => ({ id: u.id, email: u.email })),
                bannedUsers: bannedUsers.map(u => ({ id: u.id, email: u.email })),
            }
        });

    } catch (error: any) {
        console.error('[DIAGNOSE] Error:', error);
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
