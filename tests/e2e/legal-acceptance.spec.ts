import { test, expect } from '@playwright/test';

/**
 * Testes E2E Críticos - Legal Acceptance Flow
 * Objetivo: Garantir ZERO infinite loading em navegação/refresh/back/forward
 */

test.describe('Legal Acceptance Flow - No Infinite Loading', () => {

    test('novo usuário: login → aceite → dashboard → refresh → back/forward', async ({ page }) => {
        // 1. Login
        await page.goto('/login');
        await page.fill('[name=email]', 'novo.usuario@test.com');
        await page.fill('[name=password]', 'senha123');
        await page.click('button[type=submit]');

        // 2. Deve redirecionar para /onboarding/aceite
        await expect(page).toHaveURL(/.*onboarding\/aceite/, { timeout: 10000 });

        // 3. Aceitar documentos
        await page.check('#aceitar-termos');
        await page.check('#aceitar-privacidade');
        await page.check('#aceitar-contrato');
        await page.click('button:has-text("Aceitar e Continuar")');

        // 4. Deve redirecionar para /dashboard
        await page.waitForURL(/.*dashboard/, { timeout: 10000 });

        // 5. Refresh - NÃO deve redirecionar ou loading infinito
        console.log('[TEST] Testando refresh...');
        await page.reload();
        await expect(page).toHaveURL(/.*dashboard/);
        await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });

        // 6. Navegar para outra rota
        console.log('[TEST] Navegando para /financeiro...');
        await page.goto('/financeiro');
        await expect(page).toHaveURL(/.*financeiro/);
        await expect(page.locator('h1, h2')).toBeVisible({ timeout: 5000 });

        // 7. Voltar (back)
        console.log('[TEST] Testando back...');
        await page.goBack();
        await expect(page).toHaveURL(/.*dashboard/);
        await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });

        // 8. Avançar (forward)
        console.log('[TEST] Testando forward...');
        await page.goForward();
        await expect(page).toHaveURL(/.*financeiro/);
        await expect(page.locator('h1, h2')).toBeVisible({ timeout: 5000 });

        console.log('[TEST] ✅ SUCESSO: Nenhum infinite loading detectado!');
    });

    test('usuário existente: navegação sem redirects extras', async ({ page }) => {
        // Login usuário que já aceitou (tem cookie legal_accepted=true)
        await page.goto('/login');
        await page.fill('[name=email]', 'sindico@test.com');
        await page.fill('[name=password]', 'senha123');

        // Setar cookie manualmente (simular usuário com aceite prévio)
        await page.context().addCookies([{
            name: 'legal_accepted',
            value: 'true',
            domain: 'localhost',
            path: '/',
            httpOnly: true,
            secure: false,
            sameSite: 'Lax'
        }]);

        await page.click('button[type=submit]');

        // Deve ir direto para dashboard (SEM passar por /onboarding/aceite)
        await page.waitForURL(/.*dashboard/, { timeout: 10000 });
        await expect(page).not.toHaveURL(/.*onboarding\/aceite/);

        // Navegar entre rotas - nenhum redirect para /onboarding/aceite
        const routes = ['/financeiro', '/moradores', '/avisos', '/dashboard'];
        for (const route of routes) {
            console.log(`[TEST] Navegando para ${route}...`);
            await page.goto(route);
            await expect(page).toHaveURL(route);
            await expect(page).not.toHaveURL(/.*onboarding\/aceite/);

            // Refresh para garantir que NÃO redireciona
            await page.reload();
            await expect(page).toHaveURL(route);
        }

        console.log('[TEST] ✅ SUCESSO: Nenhum redirect inesperado!');
    });

    test('performance: middleware latency < 200ms', async ({ page }) => {
        // Interceptar requisições para medir latência
        const middlewareTimings: number[] = [];

        page.on('response', response => {
            const url = response.url();
            if (url.includes('/dashboard') || url.includes('/financeiro')) {
                const timing = response.timing();
                if (timing) {
                    middlewareTimings.push(timing.responseEnd - timing.requestStart);
                }
            }
        });

        // Login e navegar
        await page.goto('/login');
        await page.fill('[name=email]', 'sindico@test.com');
        await page.fill('[name=password]', 'senha123');
        await page.click('button[type=submit]');
        await page.waitForURL(/.*dashboard/);

        // Navegar múltiplas rotas
        const routes = ['/financeiro', '/moradores', '/dashboard', '/avisos'];
        for (const route of routes) {
            await page.goto(route);
            await page.waitForLoadState('domcontentloaded');
        }

        // Calcular p95
        if (middlewareTimings.length > 0) {
            middlewareTimings.sort((a, b) => a - b);
            const p95Index = Math.floor(middlewareTimings.length * 0.95);
            const p95 = middlewareTimings[p95Index];

            console.log(`[PERF] Middleware timings: ${middlewareTimings.join(', ')}ms`);
            console.log(`[PERF] p95: ${p95}ms`);

            // Critério de sucesso: p95 < 200ms
            expect(p95).toBeLessThan(200);
        }
    });

    test('stress: 10 refreshes consecutivos sem erro', async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.fill('[name=email]', 'sindico@test.com');
        await page.fill('[name=password]', 'senha123');
        await page.click('button[type=submit]');
        await page.waitForURL(/.*dashboard/);

        // 10 refreshes consecutivos
        for (let i = 1; i <= 10; i++) {
            console.log(`[STRESS] Refresh ${i}/10...`);
            await page.reload();
            await expect(page).toHaveURL(/.*dashboard/);
            await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });

            // Aguardar 500ms entre refreshes
            await page.waitForTimeout(500);
        }

        console.log('[STRESS] ✅ SUCESSO: 10 refreshes sem infinite loading!');
    });
});
