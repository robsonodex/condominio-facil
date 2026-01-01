# 02 - Guia de Administração

Este documento detalha as funcionalidades administrativas divididas por níveis de acesso.

## 👑 Nível 01: SuperAdmin (SaaS Owner)
O SuperAdmin gerencia a plataforma como um todo através do painel `/admin`.

### Gestão de Condomínios
- **Cadastro de Clientes**: Criação de novos condomínios e definição do plano inicial.
- **Painel de Ativação (V10.0)**: Dashboard específico por condomínio onde é possível:
    - Ativar/Desativar módulos individuais (Ex: Chat, Portaria, Financeiro).
    - Alterar o plano do cliente em tempo real.
    - Monitorar o status do trial e data de expiração.

### Gestão de Planos
- Configuração global de quais recursos pertencem a quais planos (Básico, Profissional, Premium).

---

## 🏢 Nível 02: Admin/Síndico
O Síndico ou administrador do condomínio gerencia a operação diária através do dashboard principal.

### Gestão de Unidades
- Cadastro de Blocos e Unidades (Apartamentos/Casas).
- Vínculo de moradores e proprietários a cada unidade.

### Gestão de Usuários
- Controle de acessos para funcionários (Porteiros, Zeladores).
- Convite e ativação de novos moradores via e-mail.

### Configurações de Integração (V10.0)
- Configuração direta das credenciais de pagamento (Mercado Pago / Asaas).
- Configuração de Webhooks para recebimento de status de pagamento.

---

## 💂 Nível 03: Portaria
Acesso focado na operação de segurança e recebimentos.

- Registro de entradas e saídas.
- Gestão de encomendas (Mensageria).
- Visualização de convites ativos enviados pelos moradores.
