# Meu Condomínio Fácil - Documentação Completa

## Parte 2: Banco de Dados

**Versão:** 9.0 (Unified AI)  
**Última Atualização:** 01/01/2026  
**Total de Migrations:** 45+

---

## 1. Visão Geral

O sistema utiliza **Supabase PostgreSQL** com:
- Row Level Security (RLS) em todas as tabelas
- Multi-tenancy por condomínio
- Triggers automáticos para `updated_at`
- Funções `SECURITY DEFINER` para operações críticas
18: - **Soft Delete** implementado via coluna `deleted_at` em tabelas críticas (prevenindo timeouts em deletes em cascata).

---

## 2. Tabelas Principais

### 2.1 Usuários e Autenticação

#### `users`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK (mesmo do auth.users) |
| nome | VARCHAR(255) | Nome completo |
| email | VARCHAR(255) | E-mail único |
| telefone | VARCHAR(20) | Telefone |
| role | VARCHAR(20) | superadmin, sindico, morador, inquilino, porteiro |
| condo_id | UUID | FK condos |
| unit_id | UUID | FK units |
| ativo | BOOLEAN | Status ativo |
| cliente_id | INTEGER | ID sequencial (síndicos) |
| avatar_url | TEXT | URL do avatar |
| created_at | TIMESTAMPTZ | Data criação |
| updated_at | TIMESTAMPTZ | Data atualização |

---

### 2.2 Condomínios e Planos

#### `condos`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| nome | VARCHAR(255) | Nome do condomínio |
| endereco | TEXT | Endereço completo |
| cidade | VARCHAR(100) | Cidade |
| estado | VARCHAR(2) | UF |
| cep | VARCHAR(10) | CEP |
| cnpj | VARCHAR(20) | CNPJ |
| plano_id | UUID | FK plans |
| status | VARCHAR(20) | ativo, teste, suspenso, cancelado |
| condo_numero | INTEGER | ID sequencial |
| data_inicio | DATE | Data de início |
| data_fim_teste | DATE | Fim do período de teste |
| mensageria_ativo | BOOLEAN | Módulo entregas |
| chat_sindico_ativo | BOOLEAN | Chat morador↔síndico |
| ai_ativo | BOOLEAN | Assistente IA |
| whatsapp_active | BOOLEAN | Integração WhatsApp |

#### `plans`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| nome_plano | VARCHAR(100) | Nome do plano |
| valor_mensal | DECIMAL(10,2) | Valor mensal |
| max_units | INTEGER | Máximo de unidades |
| features | JSONB | Features habilitadas |
| ativo | BOOLEAN | Plano disponível |

#### `subscriptions`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| condo_id | UUID | FK condos |
| plano_id | UUID | FK plans |
| status | VARCHAR(20) | ativo, suspenso, cancelado |
| data_inicio | DATE | Início |
| data_renovacao | DATE | Próxima renovação |
| valor_mensal_cobrado | DECIMAL(10,2) | Valor atual |
| observacoes | TEXT | Notas |

---

### 2.3 Unidades e Moradores

#### `units`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| condo_id | UUID | FK condos |
| identificador | VARCHAR(50) | Ex: "Ap 302", "Casa 5" |
| bloco | VARCHAR(20) | Bloco/Torre |
| andar | INTEGER | Andar |
| area | DECIMAL(10,2) | Área em m² |
| proprietario_id | UUID | FK users |
| fracao_ideal | DECIMAL(5,4) | Fração ideal |

#### `residents`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| unit_id | UUID | FK units |
| nome | VARCHAR(255) | Nome |
| email | VARCHAR(255) | E-mail |
| telefone | VARCHAR(20) | Telefone |
| cpf | VARCHAR(14) | CPF |
| tipo | VARCHAR(20) | proprietario, inquilino, dependente |
| ativo | BOOLEAN | Status |

---

### 2.4 Financeiro

#### `financial_entries`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| condo_id | UUID | FK condos |
| tipo | VARCHAR(20) | receita, despesa |
| categoria | VARCHAR(100) | Categoria |
| subcategoria | VARCHAR(100) | Subcategoria |
| valor | DECIMAL(10,2) | Valor |
| descricao | TEXT | Descrição |
| data | DATE | Data do lançamento |
| comprovante_url | TEXT | URL comprovante |
| created_by | UUID | FK users |

#### `billings`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| condo_id | UUID | FK condos |
| unit_id | UUID | FK units |
| user_id | UUID | FK users (morador) |
| tipo | VARCHAR(50) | Taxa, multa, etc |
| valor | DECIMAL(10,2) | Valor |
| vencimento | DATE | Data vencimento |
| status | VARCHAR(20) | pendente, pago, atrasado, cancelado |
| payment_id | VARCHAR(100) | ID pagamento externo |
| pago_em | TIMESTAMPTZ | Data do pagamento |
| pix_qrcode | TEXT | QR Code PIX |
| pix_copia_cola | TEXT | Código Copia e Cola |

---

### 2.5 Comunicação

#### `notices`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| condo_id | UUID | FK condos |
| titulo | VARCHAR(200) | Título |
| conteudo | TEXT | Conteúdo |
| prioridade | VARCHAR(20) | normal, urgente, oficial |
| anexo_url | TEXT | URL do anexo |
| created_by | UUID | FK users |
| created_at | TIMESTAMPTZ | Data criação |

#### `notifications`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| user_id | UUID | FK users |
| condo_id | UUID | FK condos |
| title | VARCHAR(200) | Título |
| message | TEXT | Mensagem |
| type | VARCHAR(50) | Tipo |
| read | BOOLEAN | Lida |
| created_at | TIMESTAMPTZ | Data |

#### `chat_conversations`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| condo_id | UUID | FK condos |
| user_id | UUID | FK users (morador) |
| category | VARCHAR(50) | financeiro, manutencao, etc |
| status | VARCHAR(20) | aberta, encerrada |
| rating | INTEGER | Avaliação (1-5) |

#### `chat_messages`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| conversation_id | UUID | FK chat_conversations |
| sender_id | UUID | FK users |
| content | TEXT | Mensagem |
| attachment_url | TEXT | URL anexo |
| created_at | TIMESTAMPTZ | Data |

---

### 2.6 Ocorrências

#### `occurrences`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| condo_id | UUID | FK condos |
| user_id | UUID | FK users (autor) |
| unit_id | UUID | FK units |
| titulo | VARCHAR(200) | Título |
| descricao | TEXT | Descrição |
| tipo | VARCHAR(50) | barulho, manutencao, seguranca |
| prioridade | VARCHAR(20) | baixa, media, alta |
| status | VARCHAR(20) | aberta, em_andamento, resolvida |
| fotos | TEXT[] | URLs das fotos |
| resposta | TEXT | Resposta do síndico |

---

### 2.7 Portaria

#### `visitors`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| condo_id | UUID | FK condos |
| unit_id | UUID | FK units (destino) |
| nome | VARCHAR(200) | Nome do visitante |
| documento | VARCHAR(20) | RG/CPF |
| tipo | VARCHAR(20) | visitante, prestador, entregador |
| placa | VARCHAR(10) | Placa do veículo |
| foto_url | TEXT | Foto |
| entrada | TIMESTAMPTZ | Entrada |
| saida | TIMESTAMPTZ | Saída |
| registrado_por | UUID | FK users (porteiro) |

#### `deliveries`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| condo_id | UUID | FK condos |
| unit_id | UUID | FK units |
| descricao | VARCHAR(200) | Descrição |
| remetente | VARCHAR(200) | De quem |
| transportadora | VARCHAR(100) | Transportadora |
| codigo_rastreio | VARCHAR(50) | Código rastreio |
| foto_url | TEXT | Foto |
| status | VARCHAR(20) | recebida, retirada |
| recebido_por | UUID | FK users (porteiro) |
| retirado_em | TIMESTAMPTZ | Data retirada |

#### `qr_passes`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| condo_id | UUID | FK condos |
| unit_id | UUID | FK units |
| created_by | UUID | FK users |
| guest_name | VARCHAR(200) | Nome do convidado |
| valid_from | TIMESTAMPTZ | Válido de |
| valid_until | TIMESTAMPTZ | Válido até |
| used_at | TIMESTAMPTZ | Usado em |
| qr_code | TEXT | Código único |

---

### 2.8 Reservas

#### `common_areas`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| condo_id | UUID | FK condos |
| nome | VARCHAR(100) | Nome da área |
| descricao | TEXT | Descrição |
| capacidade | INTEGER | Capacidade |
| taxa_reserva | DECIMAL(10,2) | Taxa por reserva |
| horario_abertura | TIME | Abertura |
| horario_fechamento | TIME | Fechamento |
| ativo | BOOLEAN | Disponível |

#### `reservations`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| condo_id | UUID | FK condos |
| area_id | UUID | FK common_areas |
| user_id | UUID | FK users |
| data | DATE | Data da reserva |
| hora_inicio | TIME | Início |
| hora_fim | TIME | Fim |
| status | VARCHAR(20) | pendente, aprovada, rejeitada, cancelada |
| observacoes | TEXT | Notas |

---

### 2.9 Governança

#### `assemblies`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| condo_id | UUID | FK condos |
| titulo | VARCHAR(200) | Título |
| data | TIMESTAMPTZ | Data/hora |
| tipo | VARCHAR(20) | ordinaria, extraordinaria |
| pauta | TEXT | Pauta |
| ata | TEXT | Ata |
| link_reuniao | TEXT | Link Meet/Zoom |
| status | VARCHAR(20) | agendada, ao_vivo, concluida |

#### `polls`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| condo_id | UUID | FK condos |
| titulo | VARCHAR(200) | Pergunta |
| opcoes | JSONB | Opções de resposta |
| votos | JSONB | Votos por opção |
| data_fim | TIMESTAMPTZ | Prazo |
| ativa | BOOLEAN | Ativa |

#### `documents`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| condo_id | UUID | FK condos |
| titulo | VARCHAR(200) | Título |
| categoria | VARCHAR(50) | regimento, convenção, ata |
| arquivo_url | TEXT | URL do arquivo |
| uploaded_by | UUID | FK users |

---

### 2.10 Manutenção

#### `maintenance_orders`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| condo_id | UUID | FK condos |
| titulo | VARCHAR(200) | Título |
| descricao | TEXT | Descrição |
| tipo | VARCHAR(20) | preventiva, corretiva |
| prioridade | VARCHAR(20) | baixa, media, alta |
| status | VARCHAR(20) | agendado, em_execucao, concluido |
| fornecedor_id | UUID | FK suppliers |
| valor_estimado | DECIMAL(10,2) | Estimativa |
| valor_real | DECIMAL(10,2) | Valor real |
| data_agendada | DATE | Data prevista |
| data_conclusao | DATE | Data conclusão |

#### `suppliers`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| condo_id | UUID | FK condos |
| nome | VARCHAR(200) | Nome |
| especialidade | VARCHAR(100) | Especialidade |
| telefone | VARCHAR(20) | Telefone |
| email | VARCHAR(255) | E-mail |
| cnpj | VARCHAR(20) | CNPJ |
| rating | INTEGER | Avaliação (1-5) |

---

### 2.11 Marketplace

#### `marketplace_ads`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| condo_id | UUID | FK condos |
| user_id | UUID | FK users |
| unit_id | UUID | FK units |
| title | VARCHAR(200) | Título |
| description | TEXT | Descrição |
| price | DECIMAL(10,2) | Preço |
| type | VARCHAR(20) | venda, doacao, aluguel, servico |
| category | VARCHAR(50) | Categoria |
| photos | TEXT[] | URLs das fotos |
| contact_whatsapp | VARCHAR(20) | WhatsApp |
| status | VARCHAR(20) | ativo, pausado, vendido, expirado |
| expires_at | TIMESTAMPTZ | Expira em |

#### `service_recommendations`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| condo_id | UUID | FK condos |
| user_id | UUID | FK users |
| professional_name | VARCHAR(200) | Nome |
| category | VARCHAR(50) | Categoria |
| phone | VARCHAR(20) | Telefone |
| rating | INTEGER | Avaliação (1-5) |
| review_text | TEXT | Comentário |

---

### 2.12 E-mail e SMTP

#### `configuracoes_smtp`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| condominio_id | UUID | FK condos (null = global) |
| smtp_host | VARCHAR(255) | Host SMTP |
| smtp_port | INTEGER | Porta |
| smtp_user | VARCHAR(255) | Usuário |
| smtp_password | TEXT | Senha criptografada |
| smtp_from_email | VARCHAR(255) | E-mail remetente |
| smtp_from_name | VARCHAR(255) | Nome remetente |
| is_active | BOOLEAN | Ativa |

#### `email_logs`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| condo_id | UUID | FK condos |
| user_id | UUID | FK users |
| tipo | VARCHAR(50) | Tipo do e-mail |
| destinatario | VARCHAR(255) | Para quem |
| assunto | VARCHAR(255) | Assunto |
| status | VARCHAR(20) | enviado, falhou, pendente |
| erro | TEXT | Erro se houver |
| created_at | TIMESTAMPTZ | Data |

---

### 2.13 Compliance e Certificados

#### `condo_certificates`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| condo_id | UUID | FK condos |
| name | VARCHAR(255) | Nome do documento |
| type | certificate_type | CBMERJ, RIA_ELEVADORES, SEGURO_PREDIAL, LIMPEZA_CISTERNA, OUTROS |
| issued_at | DATE | Data de emissão |
| expires_at | DATE | Data de validade |
| document_url | TEXT | URL do PDF no Storage |
| notes | TEXT | Observações |
| created_by | UUID | FK users |
| created_at | TIMESTAMPTZ | Data criação |
| updated_at | TIMESTAMPTZ | Data atualização |

**Status Calculado (função `get_certificate_status`):**
- `valid`: Vence em > 60 dias
- `warning`: Vence em ≤ 60 dias
- `critical`: Vence em ≤ 7 dias
- `expired`: Já vencido

---

### 2.14 Integrações


#### `condo_integrations`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| condo_id | UUID | FK condos |
| provider | VARCHAR(50) | mercadopago, whatsapp, evolution |
| credentials | JSONB | Credenciais (criptografadas) |
| config | JSONB | Configurações adicionais |
| is_active | BOOLEAN | Ativa |

---

## 3. Políticas RLS

Todas as tabelas possuem RLS habilitado:

```sql
-- Exemplo: Usuários veem apenas dados do seu condomínio
CREATE POLICY "Users see own condo data"
ON users FOR SELECT
USING (
    condo_id IN (
        SELECT condo_id FROM users WHERE id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
);

-- Síndico gerencia seu condomínio
CREATE POLICY "Sindico manages condo"
ON billings FOR ALL
USING (
    condo_id IN (
        SELECT condo_id FROM users 
        WHERE id = auth.uid() AND role IN ('sindico', 'superadmin')
    )
);
```

---

## 4. Migrations Principais

| Migration | Descrição |
|-----------|-----------|
| 20241216_admin_charges | Cobranças admin |
| 20241216_chat_attachments | Anexos no chat |
| 20241216_suggestions | Sistema de sugestões |
| 20241217_condo_integrations | Integrações multi-tenant |
| 20251220_ai_module | Módulo IA |
| 20251222_impersonation_and_audit | Impersonificação |
| 20251224_chat_sindico | Chat morador↔síndico |
| 20251224_mensageria | Módulo entregas |
| 20251225_create_configuracoes_smtp | SMTP por condomínio |
| 20251226_building_inspections | Autovistoria |
| 20251226_fire_tax | Taxa de incêndio |
| 20251226_guest_invites | Convites QR |
| 20251226_marketplace | Marketplace interno |
| 20251226_smtp_global | SMTP global |

---

**Anterior:** [Parte 1 - Visão Geral](./DOCS_CONSOLIDADOS_PARTE1.md)  
**Próximo:** [Parte 3 - APIs](./DOCS_CONSOLIDADOS_PARTE3.md)
