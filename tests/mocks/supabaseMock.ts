/**
 * Mock Supabase client for testing
 */

import { vi } from 'vitest';

// Mock data
export const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'sindico',
    condo_id: 'test-condo-id',
    nome: 'Test User',
    ativo: true,
};

export const mockSession = {
    userId: mockUser.id,
    email: mockUser.email,
    role: mockUser.role,
    condoId: mockUser.condo_id,
    isSindico: true,
    isSuperadmin: false,
};

export const mockSupabaseAdmin = {
    auth: {
        admin: {
            createUser: vi.fn().mockResolvedValue({
                data: { user: { id: 'new-user-id', email: 'new@test.com' } },
                error: null,
            }),
            deleteUser: vi.fn().mockResolvedValue({ error: null }),
        },
        getUser: vi.fn().mockResolvedValue({
            data: { user: { id: mockUser.id, email: mockUser.email } },
            error: null,
        }),
        resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn((table: string) => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
    })),
};

// Mock the admin module
vi.mock('@/lib/supabase/admin', () => ({
    supabaseAdmin: mockSupabaseAdmin,
    getSessionFromReq: vi.fn().mockResolvedValue(mockSession),
    logEvent: vi.fn(),
    createUserAdmin: vi.fn().mockResolvedValue({ id: 'new-user-id', email: 'new@test.com' }),
    sendSetPasswordEmail: vi.fn().mockResolvedValue({ success: true }),
}));

export { mockSupabaseAdmin as supabaseAdmin };
