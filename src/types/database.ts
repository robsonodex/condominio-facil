// Database Types for Condomínio Fácil

export type UserRole = 'superadmin' | 'sindico' | 'porteiro' | 'morador';
export type CondoStatus = 'ativo' | 'suspenso' | 'teste';
export type ResidentType = 'proprietario' | 'inquilino';
export type FinancialType = 'receita' | 'despesa';
export type FinancialStatus = 'previsto' | 'em_aberto' | 'pago' | 'atrasado';
export type OccurrenceType = 'reclamacao' | 'incidente' | 'manutencao' | 'outro';
export type OccurrenceStatus = 'aberta' | 'em_andamento' | 'resolvida' | 'cancelada';
export type Priority = 'baixa' | 'media' | 'alta';
export type VisitorType = 'visitante' | 'prestador_servico' | 'entrega';
export type SubscriptionStatus = 'ativo' | 'pendente_pagamento' | 'cancelado';
export type NoticeAudience = 'todos' | 'somente_moradores' | 'somente_sindico_porteiro';

export interface Plan {
    id: string;
    nome_plano: string;
    limite_unidades: number;
    valor_mensal: number;
    descricao: string | null;
    ativo: boolean;
    created_at: string;
    updated_at: string;
}

export interface Condo {
    id: string;
    nome: string;
    cnpj: string | null;
    endereco: string | null;
    cidade: string | null;
    estado: string | null;
    cep: string | null;
    telefone: string | null;
    email_contato: string | null;
    plano_id: string | null;
    status: CondoStatus;
    data_inicio: string;
    data_fim_teste: string | null;
    condo_numero: number | null;
    // Campos PIX
    pix_chave: string | null;
    pix_tipo: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria' | null;
    pix_nome_recebedor: string | null;
    pix_cidade: string | null;
    created_at: string;
    updated_at: string;
    // Relations
    plan?: Plan;
}

export interface Unit {
    id: string;
    condo_id: string;
    bloco: string | null;
    numero_unidade: string;
    metragem: number | null;
    vaga: string | null;
    observacoes: string | null;
    created_at: string;
    updated_at: string;
    // Relations
    condo?: Condo;
    residents?: Resident[];
}

export interface User {
    id: string;
    nome: string;
    email: string;
    telefone: string | null;
    role: UserRole;
    condo_id: string | null;
    unidade_id: string | null;
    cliente_id: number | null;
    ativo: boolean;
    created_at: string;
    updated_at: string;
    // Relations
    condo?: Condo;
    unit?: Unit;
}

export interface Resident {
    id: string;
    user_id: string | null;
    condo_id: string;
    unidade_id: string;
    tipo: ResidentType;
    ativo: boolean;
    created_at: string;
    updated_at: string;
    // Relations
    user?: User;
    condo?: Condo;
    unit?: Unit;
}

export interface FinancialEntry {
    id: string;
    condo_id: string;
    tipo: FinancialType;
    categoria: string;
    descricao: string | null;
    valor: number;
    data_vencimento: string;
    data_pagamento: string | null;
    unidade_id: string | null;
    status: FinancialStatus;
    forma_pagamento: string | null;
    anexo_url: string | null;
    created_at: string;
    updated_at: string;
    // Relations
    condo?: Condo;
    unit?: Unit;
}

export interface Notice {
    id: string;
    condo_id: string;
    titulo: string;
    mensagem: string;
    publico_alvo: NoticeAudience;
    data_publicacao: string;
    data_expiracao: string | null;
    created_at: string;
    updated_at: string;
    // Relations
    condo?: Condo;
    is_read?: boolean;
}

export interface NoticeRead {
    id: string;
    notice_id: string;
    user_id: string;
    read_at: string;
}

export interface Occurrence {
    id: string;
    condo_id: string;
    unidade_id: string | null;
    criado_por_user_id: string;
    tipo: OccurrenceType;
    titulo: string;
    descricao: string | null;
    status: OccurrenceStatus;
    prioridade: Priority;
    fotos_urls: string[] | null;
    responsavel_user_id: string | null;
    data_abertura: string;
    data_fechamento: string | null;
    created_at: string;
    updated_at: string;
    // Relations
    condo?: Condo;
    unit?: Unit;
    criado_por?: User;
    responsavel?: User;
}

export interface Visitor {
    id: string;
    condo_id: string;
    unidade_id: string | null;
    nome: string;
    documento: string | null;
    tipo: VisitorType;
    placa_veiculo: string | null;
    data_hora_entrada: string;
    data_hora_saida: string | null;
    registrado_por_user_id: string;
    observacoes: string | null;
    created_at: string;
    updated_at: string;
    // Relations
    condo?: Condo;
    unit?: Unit;
    registrado_por?: User;
}

export interface Subscription {
    id: string;
    condo_id: string;
    plano_id: string;
    status: SubscriptionStatus;
    data_inicio: string;
    data_renovacao: string | null;
    data_cancelamento: string | null;
    valor_mensal_cobrado: number | null;
    observacoes: string | null;
    created_at: string;
    updated_at: string;
    // Relations
    condo?: Condo;
    plan?: Plan;
}

export interface FinancialReport {
    id: string;
    condo_id: string;
    periodo_inicio: string;
    periodo_fim: string;
    arquivo_url: string;
    gerado_por_user_id: string | null;
    created_at: string;
    // Relations
    condo?: Condo;
    gerado_por?: User;
}

// Dashboard Stats Types
export interface DashboardStats {
    totalUnidades: number;
    inadimplenciaPercentual: number;
    inadimplenciaValor: number;
    proximosVencimentos: FinancialEntry[];
    ocorrenciasAbertas: number;
    receitasMes: number;
    despesasMes: number;
}

export interface ChartData {
    mes: string;
    receitas: number;
    despesas: number;
}
