-- ============================================
-- FEATURE FLAGS SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    feature_key VARCHAR(100) UNIQUE NOT NULL, -- Ex: 'module_whatsapp', 'module_ai_assistant'
    feature_name VARCHAR(200) NOT NULL, -- Nome amigável
    feature_description TEXT,
    feature_category VARCHAR(50), -- 'module', 'integration', 'addon'
    
    -- Controle Global (Superadmin)
    is_available BOOLEAN DEFAULT TRUE, -- Se está disponível para venda
    requires_setup BOOLEAN DEFAULT FALSE, -- Se requer implantação
    setup_fee DECIMAL(10,2) DEFAULT 0, -- Taxa de implantação
    monthly_fee DECIMAL(10,2) DEFAULT 0, -- Mensalidade adicional
    
    -- Planos que incluem por padrão
    included_in_plans JSONB DEFAULT '[]', -- Ex: ["premium"]
    
    -- Metadados
    icon VARCHAR(50), -- Ícone Lucide
    sidebar_order INTEGER, -- Ordem no menu
    sidebar_label VARCHAR(100), -- Label no menu
    sidebar_href VARCHAR(200), -- Rota
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(feature_key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_available ON feature_flags(is_available);

CREATE TABLE IF NOT EXISTS condo_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamentos
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    feature_key VARCHAR(100) NOT NULL REFERENCES feature_flags(feature_key),
    
    -- Status
    is_enabled BOOLEAN DEFAULT FALSE,
    enabled_at TIMESTAMPTZ,
    enabled_by UUID REFERENCES users(id), -- Superadmin que ativou
    
    -- Configuração Específica do Condomínio
    config JSONB DEFAULT '{}', -- Ex: credenciais banco, chave API
    
    -- Auditoria
    activation_log JSONB DEFAULT '[]', -- Histórico de ativações/desativações
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(condo_id, feature_key)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_condo_features_condo ON condo_features(condo_id);
CREATE INDEX IF NOT EXISTS idx_condo_features_enabled ON condo_features(condo_id, is_enabled);

-- Função: Verificar Feature
CREATE OR REPLACE FUNCTION has_feature(
    p_condo_id UUID,
    p_feature_key VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
    v_enabled BOOLEAN;
    v_plan_name VARCHAR;
    v_included_plans JSONB;
BEGIN
    -- 1. Verifica se está explicitamente ativado
    SELECT is_enabled INTO v_enabled
    FROM condo_features
    WHERE condo_id = p_condo_id AND feature_key = p_feature_key;
    
    IF v_enabled IS TRUE THEN
        RETURN TRUE;
    END IF;
    
    -- 2. Verifica se está incluído no plano
    SELECT p.nome_plano, ff.included_in_plans
    INTO v_plan_name, v_included_plans
    FROM condos c
    JOIN plans p ON c.plano_id = p.id
    JOIN feature_flags ff ON ff.feature_key = p_feature_key
    WHERE c.id = p_condo_id;
    
    IF v_included_plans ? LOWER(v_plan_name) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- SIDEBAR DINÂMICA
-- ============================================

CREATE TABLE IF NOT EXISTS condo_sidebar_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    
    -- Configuração do Menu
    menu_items JSONB NOT NULL DEFAULT '[]',
    
    -- Customização Visual
    theme JSONB DEFAULT '{"primaryColor": "#3b82f6", "sidebarBg": "#1e293b"}',
    
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES users(id),
    
    UNIQUE(condo_id)
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_sidebar_config_condo ON condo_sidebar_config(condo_id);


-- ============================================
-- SISTEMA BANCÁRIO
-- ============================================

-- TABELA: bank_accounts (Contas Bancárias do Condomínio)
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    
    -- Identificação do Banco
    bank_code VARCHAR(3) NOT NULL, -- Ex: '001' (BB), '341' (Itaú)
    bank_name VARCHAR(100) NOT NULL,
    
    -- Dados da Conta
    agency VARCHAR(10) NOT NULL,
    agency_digit VARCHAR(2),
    account_number VARCHAR(20) NOT NULL,
    account_digit VARCHAR(2),
    account_type VARCHAR(20) DEFAULT 'corrente', -- corrente, poupanca
    
    -- Dados do Beneficiário (Condomínio)
    beneficiary_name VARCHAR(200) NOT NULL,
    beneficiary_document VARCHAR(20) NOT NULL, -- CNPJ do condomínio
    beneficiary_address TEXT,
    
    -- Credenciais API (Criptografadas)
    api_credentials JSONB, -- Criptografado com AES-256-GCM
    
    -- Configurações de Cobrança
    wallet_code VARCHAR(10), -- Código da carteira
    wallet_variation VARCHAR(10), -- Variação da carteira
    agreement_number VARCHAR(20), -- Número do convênio
    
    -- Configurações de Boleto
    default_instructions TEXT[], -- Instruções padrão
    default_fine_percentage DECIMAL(5,2) DEFAULT 2.00, -- Multa %
    default_interest_percentage DECIMAL(5,2) DEFAULT 1.00, -- Juros % ao mês
    default_discount_percentage DECIMAL(5,2) DEFAULT 0, -- Desconto antecipação
    default_discount_days INTEGER DEFAULT 0, -- Dias para desconto
    
    -- PIX
    pix_key VARCHAR(100), -- Chave PIX do condomínio
    pix_key_type VARCHAR(20), -- cpf, cnpj, email, telefone, evp
    
    -- Status
    is_active BOOLEAN DEFAULT FALSE,
    is_validated BOOLEAN DEFAULT FALSE, -- Se passou na validação do banco
    validation_date TIMESTAMPTZ,
    
    -- Ambiente
    environment VARCHAR(20) DEFAULT 'sandbox', -- sandbox, production
    
    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES users(id),
    
    UNIQUE(condo_id, bank_code, account_number)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_bank_accounts_condo ON bank_accounts(condo_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_active ON bank_accounts(condo_id, is_active);

-- RLS
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own condo bank accounts" ON bank_accounts;
CREATE POLICY "Users see own condo bank accounts"
ON bank_accounts FOR SELECT
USING (condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins manage bank accounts" ON bank_accounts;
CREATE POLICY "Admins manage bank accounts"
ON bank_accounts FOR ALL
USING (
    condo_id IN (
        SELECT condo_id FROM users 
        WHERE id = auth.uid() AND role IN ('admin', 'sindico')
    )
);

-- TABELA: billing_batches (Lotes de Cobrança)
CREATE TABLE IF NOT EXISTS billing_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    bank_account_id UUID NOT NULL REFERENCES bank_accounts(id),
    
    -- Identificação
    batch_number SERIAL,
    reference_month DATE NOT NULL, -- Ex: 2025-01-01 (Janeiro/2025)
    description VARCHAR(200),
    
    -- Valores Totais
    total_amount DECIMAL(15,2) DEFAULT 0,
    total_billings INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(30) DEFAULT 'draft', 
    -- draft, generating, generated, sent_to_bank, registered, partially_paid, paid, cancelled
    
    -- Datas
    due_date DATE NOT NULL,
    generation_date TIMESTAMPTZ,
    sent_to_bank_date TIMESTAMPTZ,
    
    -- Arquivo CNAB (se aplicável)
    cnab_file_url TEXT,
    cnab_file_name VARCHAR(200),
    
    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES users(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_billing_batches_condo ON billing_batches(condo_id);
CREATE INDEX IF NOT EXISTS idx_billing_batches_month ON billing_batches(condo_id, reference_month);
CREATE INDEX IF NOT EXISTS idx_billing_batches_status ON billing_batches(status);

-- TABELA: billings (Cobranças Individuais)
CREATE TABLE IF NOT EXISTS billings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES billing_batches(id),
    unit_id UUID NOT NULL REFERENCES units(id),
    resident_id UUID REFERENCES users(id),
    bank_account_id UUID REFERENCES bank_accounts(id),
    
    -- Identificação
    billing_number SERIAL,
    our_number VARCHAR(20), -- Nosso número (gerado pelo sistema)
    your_number VARCHAR(20), -- Seu número (referência interna)
    
    -- Valores
    original_amount DECIMAL(15,2) NOT NULL, -- Valor original
    discount_amount DECIMAL(15,2) DEFAULT 0, -- Desconto
    fine_amount DECIMAL(15,2) DEFAULT 0, -- Multa
    interest_amount DECIMAL(15,2) DEFAULT 0, -- Juros
    other_charges DECIMAL(15,2) DEFAULT 0, -- Outras taxas
    final_amount DECIMAL(15,2) NOT NULL, -- Valor final
    paid_amount DECIMAL(15,2) DEFAULT 0,
    
    -- Datas
    reference_date DATE NOT NULL, -- Competência
    due_date DATE NOT NULL, -- Vencimento
    discount_due_date DATE, -- Data limite desconto
    payment_date TIMESTAMPTZ, -- Data do pagamento
    
    -- Descrição/Itens
    description TEXT,
    line_items JSONB DEFAULT '[]',
    
    -- Dados do Pagador
    payer_name VARCHAR(200) NOT NULL,
    payer_document VARCHAR(20) NOT NULL, -- CPF/CNPJ
    payer_email VARCHAR(200),
    payer_phone VARCHAR(20),
    payer_address JSONB,
    
    -- Boleto
    barcode VARCHAR(50), -- Código de barras
    digitable_line VARCHAR(60), -- Linha digitável
    boleto_url TEXT, -- URL do PDF
    boleto_html TEXT, -- HTML do boleto
    
    -- PIX
    pix_qrcode TEXT, -- QR Code PIX (base64 ou URL)
    pix_copy_paste TEXT, -- Código copia e cola
    pix_txid VARCHAR(50), -- ID da transação PIX
    
    -- Status
    status VARCHAR(30) DEFAULT 'pending',
    -- pending, registered, sent, viewed, paid, overdue, cancelled, protested, written_off
    
    -- Registro no Banco
    bank_registration_date TIMESTAMPTZ,
    bank_registration_response JSONB,
    bank_return_code VARCHAR(10),
    bank_return_message TEXT,
    
    -- Notificações
    email_sent_at TIMESTAMPTZ,
    whatsapp_sent_at TIMESTAMPTZ,
    sms_sent_at TIMESTAMPTZ,
    reminder_sent_at TIMESTAMPTZ,
    
    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES users(id),
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES users(id),
    cancellation_reason TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_billings_condo ON billings(condo_id);
CREATE INDEX IF NOT EXISTS idx_billings_unit ON billings(unit_id);
CREATE INDEX IF NOT EXISTS idx_billings_resident ON billings(resident_id);
CREATE INDEX IF NOT EXISTS idx_billings_batch ON billings(batch_id);
CREATE INDEX IF NOT EXISTS idx_billings_status ON billings(status);
CREATE INDEX IF NOT EXISTS idx_billings_due_date ON billings(due_date);
CREATE INDEX IF NOT EXISTS idx_billings_barcode ON billings(barcode);
CREATE INDEX IF NOT EXISTS idx_billings_our_number ON billings(our_number);

-- RLS
ALTER TABLE billings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own billings" ON billings;
CREATE POLICY "Users see own billings"
ON billings FOR SELECT
USING (
    condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid())
    OR resident_id = auth.uid()
);

DROP POLICY IF EXISTS "Admins manage billings" ON billings;
CREATE POLICY "Admins manage billings"
ON billings FOR ALL
USING (
    condo_id IN (
        SELECT condo_id FROM users 
        WHERE id = auth.uid() AND role IN ('admin', 'sindico')
    )
);

-- TABELA: billing_payments (Pagamentos/Baixas)
CREATE TABLE IF NOT EXISTS billing_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    billing_id UUID NOT NULL REFERENCES billings(id) ON DELETE CASCADE,
    condo_id UUID NOT NULL REFERENCES condos(id),
    
    -- Valores
    amount_paid DECIMAL(15,2) NOT NULL,
    discount_applied DECIMAL(15,2) DEFAULT 0,
    fine_applied DECIMAL(15,2) DEFAULT 0,
    interest_applied DECIMAL(15,2) DEFAULT 0,
    
    -- Dados do Pagamento
    payment_date DATE NOT NULL,
    credit_date DATE, -- Data do crédito na conta
    payment_method VARCHAR(30), -- boleto, pix, manual, transfer
    
    -- Origem
    source VARCHAR(30), -- bank_return, webhook, manual
    bank_return_file VARCHAR(200), -- Nome do arquivo CNAB
    bank_return_line INTEGER, -- Linha no arquivo
    
    -- Dados Bancários
    authentication_code VARCHAR(50),
    bank_channel VARCHAR(50), -- internet_banking, caixa, lotérica, pix
    
    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES users(id),
    notes TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_billing_payments_billing ON billing_payments(billing_id);
CREATE INDEX IF NOT EXISTS idx_billing_payments_condo ON billing_payments(condo_id);
CREATE INDEX IF NOT EXISTS idx_billing_payments_date ON billing_payments(payment_date);

-- TABELA: cnab_files (Arquivos CNAB)
CREATE TABLE IF NOT EXISTS cnab_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condo_id UUID NOT NULL REFERENCES condos(id),
    bank_account_id UUID NOT NULL REFERENCES bank_accounts(id),
    
    -- Tipo
    file_type VARCHAR(20) NOT NULL, -- remessa, retorno
    cnab_layout VARCHAR(10) NOT NULL, -- 240, 400
    
    -- Arquivo
    file_name VARCHAR(200) NOT NULL,
    file_url TEXT,
    file_content TEXT, -- Conteúdo do arquivo (para retorno)
    file_size INTEGER,
    
    -- Estatísticas
    total_records INTEGER DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    processed_records INTEGER DEFAULT 0,
    error_records INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(30) DEFAULT 'pending',
    -- pending, processing, processed, error
    
    -- Processamento
    processed_at TIMESTAMPTZ,
    processing_log JSONB DEFAULT '[]',
    
    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT now(),
    uploaded_by UUID REFERENCES users(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cnab_files_condo ON cnab_files(condo_id);
CREATE INDEX IF NOT EXISTS idx_cnab_files_type ON cnab_files(file_type);
CREATE INDEX IF NOT EXISTS idx_cnab_files_status ON cnab_files(status);

-- TABELA: bank_webhooks (Webhooks Bancários)
CREATE TABLE IF NOT EXISTS bank_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    bank_code VARCHAR(3) NOT NULL,
    webhook_type VARCHAR(50), -- payment, registration, cancellation
    
    -- Payload
    raw_payload JSONB NOT NULL,
    headers JSONB,
    
    -- Processamento
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    billing_id UUID REFERENCES billings(id),
    
    -- Resultado
    processing_result JSONB,
    error_message TEXT,
    
    -- Auditoria
    received_at TIMESTAMPTZ DEFAULT now(),
    ip_address VARCHAR(50)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_bank_webhooks_processed ON bank_webhooks(processed);
CREATE INDEX IF NOT EXISTS idx_bank_webhooks_bank ON bank_webhooks(bank_code);
CREATE INDEX IF NOT EXISTS idx_bank_webhooks_received ON bank_webhooks(received_at);

-- Função para gerar nosso número sequencial por condomínio/banco
CREATE OR REPLACE FUNCTION generate_our_number(
    p_condo_id UUID,
    p_bank_code VARCHAR
) RETURNS VARCHAR AS $$
DECLARE
    v_sequence INTEGER;
    v_year VARCHAR(2);
    v_our_number VARCHAR(20);
BEGIN
    -- Obter próximo número da sequência
    UPDATE bank_accounts
    SET updated_at = now()
    WHERE condo_id = p_condo_id AND bank_code = p_bank_code
    RETURNING COALESCE(
        (SELECT MAX(CAST(SUBSTRING(our_number FROM 3) AS INTEGER)) + 1 
         FROM billings 
         WHERE condo_id = p_condo_id 
         AND bank_account_id = (SELECT id FROM bank_accounts WHERE condo_id = p_condo_id AND bank_code = p_bank_code LIMIT 1)),
        1
    ) INTO v_sequence;
    
    -- Formato: AA + SEQUENCIAL (8 dígitos)
    v_year := TO_CHAR(CURRENT_DATE, 'YY');
    v_our_number := v_year || LPAD(v_sequence::TEXT, 8, '0');
    
    RETURN v_our_number;
END;
$$ LANGUAGE plpgsql;
