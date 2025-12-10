import { createClient } from '@supabase/supabase-js';

/**
 * SUPABASE ADMIN CLIENT
 * Uses SERVICE_ROLE_KEY for elevated privileges
 * IMPORTANT: Only use in server-side code (API routes, server components)
 * NEVER import this in client-side code
 */

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[SUPABASE_ADMIN] SUPABASE_SERVICE_ROLE_KEY is not configured!');
}

export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

/**
 * Create a user using admin privileges
 * DOES NOT auto-login - preserves current session
 */
export async function createUserAdmin(
    email: string,
    password: string,
    role: string,
    meta: {
        nome: string;
        telefone?: string;
        condo_id?: string;
        unidade_id?: string;
    }
) {
    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nome: meta.nome },
    });

    if (authError) {
        throw new Error(`Auth error: ${authError.message}`);
    }

    if (!authData.user) {
        throw new Error('Failed to create auth user');
    }

    // Create user profile
    const { error: profileError } = await supabaseAdmin.from('users').insert({
        id: authData.user.id,
        email,
        nome: meta.nome,
        telefone: meta.telefone || null,
        role,
        condo_id: meta.condo_id || null,
        unidade_id: meta.unidade_id || null,
        ativo: true,
    });

    if (profileError) {
        // Rollback: delete auth user if profile creation fails
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw new Error(`Profile error: ${profileError.message}`);
    }

    return authData.user;
}

/**
 * Send password reset/set email
 */
export async function sendSetPasswordEmail(email: string) {
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
    });

    if (error) {
        console.error('[SUPABASE_ADMIN] Password reset email error:', error);
        throw error;
    }

    return { success: true };
}

/**
 * Get user session from request (for API routes)
 */
export async function getSessionFromReq(req: Request): Promise<{
    userId: string;
    email: string;
    role: string;
    condoId: string | null;
    isSindico: boolean;
    isSuperadmin: boolean;
} | null> {
    try {
        // Get authorization header or cookie
        const authHeader = req.headers.get('authorization');
        const cookies = req.headers.get('cookie') || '';

        // Extract token from cookie (Supabase SSR format)
        const tokenMatch = cookies.match(/sb-[^-]+-auth-token=([^;]+)/);
        const tokenFromCookie = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;

        let accessToken = authHeader?.replace('Bearer ', '') || '';

        // If no auth header, try to parse from cookie JSON
        if (!accessToken && tokenFromCookie) {
            try {
                const parsed = JSON.parse(tokenFromCookie);
                accessToken = parsed.access_token || parsed[0]?.access_token || '';
            } catch {
                accessToken = tokenFromCookie;
            }
        }

        if (!accessToken) {
            return null;
        }

        // Verify token and get user
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);

        if (error || !user) {
            return null;
        }

        // Get user profile
        const { data: profile } = await supabaseAdmin
            .from('users')
            .select('id, email, role, condo_id')
            .eq('email', user.email)
            .eq('ativo', true)
            .single();

        if (!profile) {
            return null;
        }

        return {
            userId: profile.id,
            email: profile.email,
            role: profile.role,
            condoId: profile.condo_id,
            isSindico: profile.role === 'sindico',
            isSuperadmin: profile.role === 'superadmin',
        };
    } catch (error) {
        console.error('[GET_SESSION] Error:', error);
        return null;
    }
}

/**
 * Log event to system_logs table
 */
export async function logEvent(
    event: string,
    level: 'info' | 'warn' | 'error' = 'info',
    meta: Record<string, any> = {}
) {
    try {
        await supabaseAdmin.from('system_logs').insert({
            event,
            level,
            meta,
            created_at: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[LOG_EVENT] Failed to log:', error);
    }
}
