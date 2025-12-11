# EVOLUÇÃO RJ 2025 — DOCUMENTAÇÃO TÉCNICA

## Visão Geral
Esta evolução abrange:
1. **Portaria Turbo**: Entrada rápida com OCR/QR.
2. **Governança**: Enquetes, Assembleias, Documentos.
3. **Manutenção**: Gestão de equipamentos e agenda.
4. **Mobile**: App nativo via Expo wrapper.

## Passos para Rodar

### 1. Migração de Banco
Execute o SQL em `supabase/migrations/20251212_rj_evolution.sql` usando o Supabase Dashboard ou CLI.

### 2. Instalação
`npm install` na raiz.
`cd mobile && npm install` na pasta mobile.

### 3. Rodar Mobile
`cd mobile && npx expo start`

### 4. Rodar Web
`npm run dev`

### 5. Worker
`node workers/notifications-worker.js`

### 6. Scripts
`node scripts/seed-demo.js` para popular dados de teste.

## Mobile Build
Para Android: `npm run mobile:android`
Para iOS: `npm run mobile:ios`
Necessário configurar credenciais no Expo EAS.

## Testes
`npm run test:unit` para unitários.
`npm run test:e2e` para Cypress (requer servidor rodando).

## Monitoramento
Acesse `/admin/metrics` (implementação futura) ou verifique a tabela `admin_metrics`.
Falhas são logadas em `system_errors`.
