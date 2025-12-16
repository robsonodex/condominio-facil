import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ReportConfig {
    title: string;
    subtitle?: string;
    columns: { header: string; key: string; width?: number }[];
    data: any[];
    footer?: string;
    orientation?: 'portrait' | 'landscape';
}

// Helper para formatar data
const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
};

// Helper para formatar moeda
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

// Gerar PDF
export function generatePDF(config: ReportConfig): void {
    const { title, subtitle, columns, data, footer, orientation = 'portrait' } = config;

    const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Header com logo
    doc.setFillColor(16, 185, 129); // Emerald-500
    doc.rect(0, 0, pageWidth, 25, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Condomínio Fácil', 14, 12);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${formatDate(new Date())}`, pageWidth - 14, 12, { align: 'right' });

    // Título do relatório
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 38);

    if (subtitle) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        doc.text(subtitle, 14, 45);
    }

    // Tabela
    const tableData = data.map(row =>
        columns.map(col => {
            const value = row[col.key];
            if (typeof value === 'number' && col.key.includes('valor')) {
                return formatCurrency(value);
            }
            if (value instanceof Date || (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/))) {
                return formatDate(value);
            }
            return value || '';
        })
    );

    autoTable(doc, {
        head: [columns.map(c => c.header)],
        body: tableData,
        startY: subtitle ? 52 : 45,
        theme: 'striped',
        headStyles: {
            fillColor: [16, 185, 129],
            textColor: 255,
            fontStyle: 'bold',
        },
        alternateRowStyles: {
            fillColor: [243, 244, 246],
        },
        styles: {
            fontSize: 9,
            cellPadding: 3,
        },
        margin: { left: 14, right: 14 },
    });

    // Footer
    const finalY = (doc as any).lastAutoTable?.finalY || pageHeight - 30;

    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(footer || 'Relatório gerado pelo sistema Condomínio Fácil', 14, Math.min(finalY + 10, pageHeight - 10));
    doc.text(`Página 1`, pageWidth - 14, pageHeight - 10, { align: 'right' });

    // Download
    doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.pdf`);
}

// Gerar Excel
export function generateExcel(config: ReportConfig): void {
    const { title, columns, data } = config;

    // Preparar dados
    const worksheetData = [
        columns.map(c => c.header),
        ...data.map(row => columns.map(col => {
            const value = row[col.key];
            if (typeof value === 'number' && col.key.includes('valor')) {
                return value;
            }
            return value || '';
        }))
    ];

    // Criar workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // Definir largura das colunas
    ws['!cols'] = columns.map(c => ({ wch: c.width || 15 }));

    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');

    // Download
    XLSX.writeFile(wb, `${title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.xlsx`);
}

// Relatórios pré-configurados
export const ReportTemplates = {
    financeiro: (entries: any[], condoName: string) => ({
        title: 'Relatório Financeiro',
        subtitle: `${condoName} - ${formatDate(new Date())}`,
        columns: [
            { header: 'Data', key: 'data', width: 12 },
            { header: 'Descrição', key: 'descricao', width: 30 },
            { header: 'Categoria', key: 'categoria', width: 15 },
            { header: 'Tipo', key: 'tipo', width: 10 },
            { header: 'Valor', key: 'valor', width: 15 },
            { header: 'Status', key: 'status', width: 12 },
        ],
        data: entries,
        orientation: 'landscape' as const,
    }),

    cobrancas: (invoices: any[], condoName: string) => ({
        title: 'Relatório de Cobranças',
        subtitle: `${condoName} - ${formatDate(new Date())}`,
        columns: [
            { header: 'Morador', key: 'morador_nome', width: 25 },
            { header: 'Unidade', key: 'unidade', width: 12 },
            { header: 'Descrição', key: 'descricao', width: 25 },
            { header: 'Valor', key: 'valor', width: 12 },
            { header: 'Vencimento', key: 'data_vencimento', width: 12 },
            { header: 'Status', key: 'status', width: 12 },
        ],
        data: invoices,
    }),

    ocorrencias: (occurrences: any[], condoName: string) => ({
        title: 'Relatório de Ocorrências',
        subtitle: `${condoName} - ${formatDate(new Date())}`,
        columns: [
            { header: 'Data', key: 'created_at', width: 12 },
            { header: 'Tipo', key: 'tipo', width: 15 },
            { header: 'Descrição', key: 'descricao', width: 35 },
            { header: 'Reportado por', key: 'usuario_nome', width: 20 },
            { header: 'Status', key: 'status', width: 12 },
        ],
        data: occurrences,
    }),

    moradores: (users: any[], condoName: string) => ({
        title: 'Relatório de Moradores',
        subtitle: `${condoName} - ${formatDate(new Date())}`,
        columns: [
            { header: 'Nome', key: 'nome', width: 25 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Telefone', key: 'telefone', width: 15 },
            { header: 'Unidade', key: 'unidade', width: 12 },
            { header: 'Tipo', key: 'role', width: 12 },
            { header: 'Status', key: 'status', width: 10 },
        ],
        data: users,
    }),

    unidades: (units: any[], condoName: string) => ({
        title: 'Relatório de Unidades',
        subtitle: `${condoName} - ${formatDate(new Date())}`,
        columns: [
            { header: 'Bloco', key: 'bloco', width: 10 },
            { header: 'Número', key: 'numero_unidade', width: 10 },
            { header: 'Tipo', key: 'tipo_unidade', width: 15 },
            { header: 'Área (m²)', key: 'area_m2', width: 12 },
            { header: 'Proprietário', key: 'proprietario_nome', width: 25 },
        ],
        data: units,
    }),
};
