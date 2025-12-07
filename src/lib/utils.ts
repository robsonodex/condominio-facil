import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

export function formatDate(dateString: string): string {
    return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR });
}

export function formatDateTime(dateString: string): string {
    return format(parseISO(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function formatMonth(dateString: string): string {
    return format(parseISO(dateString), 'MMM/yy', { locale: ptBR });
}

export function isOverdue(dateString: string): boolean {
    return isBefore(parseISO(dateString), new Date());
}

export function isDueSoon(dateString: string, days: number = 3): boolean {
    const date = parseISO(dateString);
    const futureDate = addDays(new Date(), days);
    return isAfter(date, new Date()) && isBefore(date, futureDate);
}

export function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
        // Financial status
        previsto: 'bg-gray-100 text-gray-800',
        em_aberto: 'bg-yellow-100 text-yellow-800',
        pago: 'bg-green-100 text-green-800',
        atrasado: 'bg-red-100 text-red-800',
        // Occurrence status
        aberta: 'bg-blue-100 text-blue-800',
        em_andamento: 'bg-orange-100 text-orange-800',
        resolvida: 'bg-green-100 text-green-800',
        cancelada: 'bg-gray-100 text-gray-800',
        // Condo status
        ativo: 'bg-green-100 text-green-800',
        suspenso: 'bg-red-100 text-red-800',
        teste: 'bg-purple-100 text-purple-800',
        // Subscription status
        pendente_pagamento: 'bg-orange-100 text-orange-800',
        cancelado: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
        baixa: 'bg-green-100 text-green-800',
        media: 'bg-yellow-100 text-yellow-800',
        alta: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
}

export function getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
        superadmin: 'Super Admin',
        sindico: 'Síndico',
        porteiro: 'Porteiro',
        morador: 'Morador',
    };
    return labels[role] || role;
}

export function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        previsto: 'Previsto',
        em_aberto: 'Em Aberto',
        pago: 'Pago',
        atrasado: 'Atrasado',
        aberta: 'Aberta',
        em_andamento: 'Em Andamento',
        resolvida: 'Resolvida',
        cancelada: 'Cancelada',
        ativo: 'Ativo',
        suspenso: 'Suspenso',
        teste: 'Período de Teste',
        pendente_pagamento: 'Pendente Pagamento',
        cancelado: 'Cancelado',
    };
    return labels[status] || status;
}

export function getOccurrenceTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        reclamacao: 'Reclamação',
        incidente: 'Incidente',
        manutencao: 'Manutenção',
        outro: 'Outro',
    };
    return labels[type] || type;
}

export function getVisitorTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        visitante: 'Visitante',
        prestador_servico: 'Prestador de Serviço',
        entrega: 'Entrega',
    };
    return labels[type] || type;
}

export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}
