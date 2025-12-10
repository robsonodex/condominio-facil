import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 * Tests login flows and redirect behavior
 */

test.describe('Authentication Flow', () => {

    test('should show login page', async ({ page }) => {
        await page.goto('/login');
        await expect(page).toHaveURL(/.*login/);
        await expect(page.locator('h2')).toContainText('Condomínio Fácil');
    });

    test('should show error on invalid credentials', async ({ page }) => {
        await page.goto('/login');

        await page.fill('input[type="email"]', 'invalid@test.com');
        await page.fill('input[type="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');

        // Wait for error message
        await expect(page.locator('.bg-red-50, .text-red-600')).toBeVisible({ timeout: 10000 });
    });

    test('should redirect unauthenticated user from dashboard to login', async ({ page }) => {
        await page.goto('/dashboard');

        // Should redirect to login
        await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
    });

    test('login page should not cause redirect loops', async ({ page }) => {
        // Navigate to login multiple times
        for (let i = 0; i < 3; i++) {
            await page.goto('/login');
            await expect(page).toHaveURL(/.*login/);
            await expect(page.locator('h2')).toBeVisible({ timeout: 5000 });
        }
    });

    test('public routes should be accessible without auth', async ({ page }) => {
        const publicRoutes = ['/termos', '/privacidade', '/register'];

        for (const route of publicRoutes) {
            await page.goto(route);
            // Should not redirect to login
            await page.waitForTimeout(1000);
            await expect(page).not.toHaveURL(/.*login/);
        }
    });
});

test.describe('User Creation - No Auto-Login Bug', () => {

    test('creating user via API should not change current session', async ({ request }) => {
        // This test validates the API doesn't auto-login
        const response = await request.post('/api/usuarios/create', {
            data: {
                email: 'test-new-user@example.com',
                password: 'TestPassword123',
                nome: 'Test New User',
                role: 'morador',
                condo_id: 'test-condo-id',
            },
        });

        // Should return success or auth error (not auto-login)
        const data = await response.json();

        // If 401, that's expected (no auth header)
        // If 201, user was created without affecting caller session
        expect([201, 401, 400]).toContain(response.status());

        // Verify response doesn't contain session/cookie modification
        if (response.status() === 201) {
            expect(data.success).toBe(true);
            // Check no Set-Cookie header that would change auth
            const setCookie = response.headers()['set-cookie'] || '';
            expect(setCookie).not.toContain('sb-');
        }
    });
});

test.describe('Protected Routes', () => {

    test('financeiro page requires authentication', async ({ page }) => {
        await page.goto('/financeiro');
        await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
    });

    test('moradores page requires authentication', async ({ page }) => {
        await page.goto('/moradores');
        await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
    });

    test('portaria page requires authentication', async ({ page }) => {
        await page.goto('/portaria');
        await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
    });

    test('unidades page requires authentication', async ({ page }) => {
        await page.goto('/unidades');
        await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
    });
});

test.describe('API Endpoints', () => {

    test('financial entries API requires auth', async ({ request }) => {
        const response = await request.post('/api/financial/entries', {
            data: { condo_id: 'test', tipo: 'receita', categoria: 'test', valor: 100, data_vencimento: '2024-01-01' },
        });
        expect(response.status()).toBe(401);
    });

    test('residents API requires auth', async ({ request }) => {
        const response = await request.post('/api/residents', {
            data: { nome: 'Test', email: 'test@test.com', condo_id: 'test', unidade_id: 'test' },
        });
        expect(response.status()).toBe(401);
    });

    test('visitors API requires auth', async ({ request }) => {
        const response = await request.post('/api/visitors', {
            data: { condo_id: 'test', nome: 'Test Visitor' },
        });
        expect(response.status()).toBe(401);
    });

    test('units API requires auth', async ({ request }) => {
        const response = await request.post('/api/units', {
            data: { condo_id: 'test', numero_unidade: '101' },
        });
        expect(response.status()).toBe(401);
    });
});
