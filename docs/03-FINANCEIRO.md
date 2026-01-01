# 03 - Módulo Financeiro e Banking

O módulo financeiro do **Meu Condomínio Fácil** é focado em automação total, eliminando a necessidade de processos manuais de remessa e retorno bancário.

## 🏦 Integração por API (Multi-Tenant)
Diferente de sistemas legados, cada condomínio pode configurar sua própria conta diretamente no painel de configurações.

### Gateways Suportados (V10.0)
- **Mercado Pago**: Ideal para PIX e Boletos com liquidação rápida.
- **Asaas**: Robusta gestão de cobranças e régua de cobrança automática.

## 📄 Cobranças e Boletos
O sistema permite gerar cobranças em lote ou individuais.

- **PIX Dinâmico**: QR Code gerado na hora com identificação imediata.
- **Boleto Bancário**: Gerado via API com código de barras e linha digitável.
- **Segunda Via**: O morador pode emitir sua própria segunda via pelo app sem intermédio do síndico.

## 🤖 Automação de Baixa
- **Webhooks**: Quando um pagamento é feito no banco, o gateway avisa o sistema e a fatura é marcada como "Paga" instantaneamente.
- **Conciliação Noturna**: Um job automático (`/api/cron/reconcile-payments`) varre cobranças pendentes para garantir que nenhum status foi perdido.

## 📊 Relatórios e Dashboard
- **Dashboard de Inadimplência**: Visão clara de quem deve e há quanto tempo.
- **Histórico de Pagamentos**: Registro auditável de todas as transações de cada unidade.
