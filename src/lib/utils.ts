import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function formatDate(date: string | Date): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('pt-BR');
}

export function formatDateTime(date: string | Date): string {
  if (!date) return '';
  return new Date(date).toLocaleString('pt-BR');
}

export const formatCPF = (cpf: string) => {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const formatCNPJ = (cnpj: string) => {
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

export const parseCurrency = (value: string) => {
  return parseFloat(value.replace(/\./g, '').replace(',', '.'));
}

// UI Helpers

export function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'ativo':
    case 'paid':
    case 'pago':
    case 'approved':
    case 'aprovado':
    case 'concluido':
    case 'aberto':
      return 'success';
    case 'pending':
    case 'pendente':
    case 'em_analise':
    case 'em_andamento':
    case 'warning':
      return 'warning';
    case 'overdue':
    case 'vencido':
    case 'rejected':
    case 'rejeitado':
    case 'inactive':
    case 'inativo':
    case 'cancelled':
    case 'cancelado':
    case 'fechado':
    case 'blocked':
    case 'danger':
      return 'danger';
    default:
      return 'secondary'; // Valid badge variant
  }
}

export function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    active: 'Ativo',
    inactive: 'Inativo',
    pending: 'Pendente',
    paid: 'Pago',
    overdue: 'Vencido',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
    open: 'Aberto',
    closed: 'Fechado',
    in_progress: 'Em Andamento',
    cancelled: 'Cancelado',
    responded: 'Respondido',
    blocked: 'Bloqueado',
    trialing: 'Em Teste'
  };
  return labels[status?.toLowerCase()] || status;
}

export function getRoleLabel(role: string) {
  const roles: Record<string, string> = {
    superadmin: 'Super Admin',
    sindico: 'Síndico',
    porteiro: 'Porteiro',
    morador: 'Morador',
    inquilino: 'Inquilino',
    admin: 'Admin'
  };
  return roles[role?.toLowerCase()] || role;
}

export function getVisitorTypeLabel(type: string) {
  const types: Record<string, string> = {
    visitante: 'Visitante',
    prestador: 'Prestador de Serviço',
    familia: 'Familiar',
    delivery: 'Entregador',
    outros: 'Outros'
  };
  return types[type?.toLowerCase()] || type;
}

export function getOccurrenceTypeLabel(type: string) {
  const types: Record<string, string> = {
    barulho: 'Barulho',
    manutencao: 'Manutenção',
    seguranca: 'Segurança',
    limpeza: 'Limpeza',
    outros: 'Outros'
  };
  return types[type?.toLowerCase()] || type;
}

export function getPriorityColor(priority: string) {
  switch (priority?.toLowerCase()) {
    case 'alta':
    case 'high':
    case 'critica':
    case 'critical':
      return 'danger';
    case 'media':
    case 'medium':
      return 'warning';
    case 'baixa':
    case 'low':
      return 'success';
    default:
      return 'secondary';
  }
}

/**
 * Formata telefone no padrão brasileiro (XX) XXXXX-XXXX
 * Aceita entrada com ou sem formatação prévia
 */
export function formatPhone(value: string): string {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');

  // Limita a 11 dígitos (DDD + 9 dígitos)
  const limited = numbers.slice(0, 11);

  // Aplica a máscara progressivamente
  if (limited.length <= 2) {
    return limited.length > 0 ? `(${limited}` : '';
  }
  if (limited.length <= 7) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  }
  return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
}
