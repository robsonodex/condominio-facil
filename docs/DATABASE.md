# Banco de Dados - Documentação Completa

**Versão:** 8.2  
**Última Atualização:** 26/12/2024  
**Total de Migrations:** 38+

---

## Visão Geral

O sistema utiliza **Supabase PostgreSQL** como banco de dados principal, com:
- Row Level Security (RLS) em todas as tabelas
- Multi-tenancy por condomínio
- Triggers automáticos para updated_at
- Funções SECURITY DEFINER para operações críticas

---

## Tabelas Principais

### Usuários e Autenticação

#### `users`
Perfis de usuários do sistema.

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

### Condomínios e Planos

#### `condos`
Condomínios cadastrados.

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
| mensageria_ativo | BOOLEAN | Módulo entregas ativo |
| chat_sindico_ativo | BOOLEAN | Chat morador↔síndico ativo |
| ai_ativo | BOOLEAN | Assistente IA ativo |

#### `plans`
Planos de assinatura disponíveis.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| nome_plano | VARCHAR(100) | Nome do plano |
| valor_mensal | DECIMAL(10,2) | Valor mensal |
| max_units | INTEGER | Máximo de unidades |
| features | JSONB | Features habilitadas |
| ativo | BOOLEAN | Plano disponível |

#### `subscriptions`
Assinaturas dos condomínios.

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

### Unidades e Moradores

#### `units`
Unidades (apartamentos, casas).

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
Moradores adicionais (inquilinos, dependentes).

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

### Financeiro

#### `financial_entries`
Lançamentos financeiros.

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
Cobranças para moradores.

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
| payment_id | VARCHAR(100) | ID do pagamento externo |
| pago_em | TIMESTAMPTZ | Data do pagamento |

---

### Comunicação

#### `notices`
Avisos e comunicados.

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
Notificações do sistema.

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
Conversas do chat morador↔síndico.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| condo_id | UUID | FK condos |
| user_id | UUID | FK users (morador) |
| category | VARCHAR(50) | financeiro, manutencao, etc |
| status | VARCHAR(20) | aberta, encerrada |
| rating | INTEGER | Avaliação (1-5) |

#### `chat_messages`
Mensagens das conversas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| conversation_id | UUID | FK chat_conversations |
| sender_id | UUID | FK users |
| content | TEXT | Mensagem |
| attachment_url | TEXT | URL anexo |
| created_at | TIMESTAMPTZ | Data |

---

### Ocorrências

#### `occurrences`
Ocorrências e chamados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| condo_id | UUID | FK condos |
| user_id | UUID | FK users (autor) |
| unit_id | UUID | FK units |
| titulo | VARCHAR(200) | Título |
| descricao | TEXT | Descrição |
| tipo | VARCHAR(50) | barulho, manutencao, seguranca, etc |
| prioridade | VARCHAR(20) | baixa, media, alta |
| status | VARCHAR(20) | aberta, em_andamento, resolvida |
| fotos | TEXT[] | URLs das fotos |
| resposta | TEXT | Resposta do síndico |

#### `occurrence_comments`
Comentários nas ocorrências.

---

### Portaria

#### `visitors`
Registro de visitantes.

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
Controle de encomendas.

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
Convites QR Code.

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

### Reservas

#### `common_areas`
Áreas comuns disponíveis.

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
Reservas de áreas.

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

### Governança

#### `assemblies`
Assembleias.

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
Enquetes.

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
Documentos oficiais.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| condo_id | UUID | FK condos |
| titulo | VARCHAR(200) | Título |
| categoria | VARCHAR(50) | regimento, convenção, ata, etc |
| arquivo_url | TEXT | URL do arquivo |
| uploaded_by | UUID | FK users |

---

### Manutenção

#### `maintenance_orders`
Ordens de manutenção.

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
Fornecedores.

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

### Marketplace

#### `marketplace_ads`
Anúncios do marketplace.

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
Indicações de profissionais.

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

### E-mail e SMTP

#### `configuracoes_smtp`
Configurações SMTP.

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
Logs de e-mail.

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

### Suporte

#### `support_tickets`
Tickets de suporte.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| condo_id | UUID | FK condos |
| user_id | UUID | FK users |
| assunto | VARCHAR(200) | Assunto |
| categoria | VARCHAR(50) | Categoria |
| status | VARCHAR(20) | aberto, em_andamento, resolvido |
| prioridade | VARCHAR(20) | baixa, media, alta |

#### `support_messages`
Mensagens do suporte.

---

### Integrações

#### `condo_integrations`
Credenciais de integração por condomínio.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| condo_id | UUID | FK condos |
| provider | VARCHAR(50) | mercadopago, whatsapp |
| credentials | JSONB | Credenciais (criptografadas) |
| is_active | BOOLEAN | Ativa |

---

## Migrations Disponíveis

| Migration | Descrição |
|-----------|-----------|
| 20241216_admin_charges | Cobranças admin |
| 20241216_chat_attachments | Anexos no chat |
| 20241216_suggestions | Sistema de sugestões |
| 20241216_whatsapp_active | Toggle WhatsApp |
| 20241217_condo_integrations | Integrações multi-tenant |
| 20251220_ai_module | Módulo IA |
| 20251222_impersonation_and_audit | Impersonificação |
| 20251223_occurrence_comments | Comentários ocorrências |
| 20251224_chat_sindico | Chat morador↔síndico |
| 20251224_mensageria | Módulo entregas |
| 20251225_create_configuracoes_smtp | SMTP por condomínio |
| 20251226_building_inspections | Autovistoria |
| 20251226_fire_tax | Taxa de incêndio |
| 20251226_guest_invites | Convites QR |
| 20251226_marketplace | Marketplace interno |
| 20251226_quote_auditor | Auditor de orçamentos |
| 20251226_smtp_global | SMTP global |
| 20251226_unit_reforms | Obras e reformas |

---

## Políticas RLS

Todas as tabelas possuem RLS habilitado com políticas que:

1. **Isolam por condomínio** - Usuários só veem dados do seu condomínio
2. **Verificam role** - Operações restritas por perfil
3. **Protegem dados pessoais** - Usuários só editam seus próprios dados
4. **Permitem superadmin** - Superadmin tem acesso total

---

**Atualizado em:** 26/12/2024
