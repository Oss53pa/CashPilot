import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ============================================================================
// PDF Export Utility for CashPilot Reports
// ============================================================================

interface PdfOptions {
  title: string;
  subtitle?: string;
  company?: string;
  date?: string;
  orientation?: 'portrait' | 'landscape';
}

interface TableData {
  headers: string[];
  rows: (string | number)[][];
}

interface SectionData {
  title: string;
  content?: string;
  table?: TableData;
}

/**
 * Generate a PDF report with header, sections (text + tables), and footer.
 */
export function generatePdf(
  options: PdfOptions,
  sections: SectionData[]
): void {
  const doc = new jsPDF({
    orientation: options.orientation || 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  // ---- HEADER ----
  doc.setFillColor(23, 23, 23); // #171717
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('CashPilot', margin, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(options.title, margin, 23);

  if (options.company) {
    doc.text(options.company, pageWidth - margin, 15, { align: 'right' });
  }
  if (options.date) {
    doc.text(options.date, pageWidth - margin, 23, { align: 'right' });
  }
  if (options.subtitle) {
    doc.text(options.subtitle, margin, 30);
  }

  y = 42;

  // ---- SECTIONS ----
  for (const section of sections) {
    // Check if we need a new page
    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      y = margin;
    }

    // Section title
    doc.setTextColor(23, 23, 23);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(section.title, margin, y);
    y += 2;

    // Underline
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    // Section content (text)
    if (section.content) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81); // #374151

      const lines = doc.splitTextToSize(section.content, pageWidth - margin * 2);
      for (const line of lines) {
        if (y > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 4.5;
      }
      y += 4;
    }

    // Section table
    if (section.table && section.table.rows.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [section.table.headers],
        body: section.table.rows.map(row => row.map(String)),
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          textColor: [55, 65, 81],
          lineColor: [229, 231, 235],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [243, 244, 246], // #f3f4f6
          textColor: [17, 24, 39],
          fontStyle: 'bold',
          lineWidth: 0.1,
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251], // #f9fafb
        },
        didDrawPage: () => {
          // Footer on each page
          addFooter(doc);
        },
      });

      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY + 10 || y + 20;
    }

    y += 4;
  }

  // Footer on last page
  addFooter(doc);

  // ---- SAVE ----
  const fileName = `${options.title.replace(/[^a-zA-Z0-9]/g, '_')}_${options.date || new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

function addFooter(doc: jsPDF) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageCount = doc.getNumberOfPages();
  const currentPage = (doc as unknown as { internal: { getCurrentPageInfo: () => { pageNumber: number } } }).internal.getCurrentPageInfo?.()?.pageNumber || 1;

  doc.setFontSize(7);
  doc.setTextColor(156, 163, 175); // #9ca3af
  doc.setFont('helvetica', 'normal');
  doc.text(
    `CashPilot — Genere le ${new Date().toLocaleDateString('fr-FR')} a ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
    15,
    pageHeight - 8
  );
  doc.text(
    `Page ${currentPage} / ${pageCount}`,
    pageWidth - 15,
    pageHeight - 8,
    { align: 'right' }
  );
}

// ============================================================================
// CONVENIENCE: Format FCFA for PDF
// ============================================================================

export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' FCFA';
}

// ============================================================================
// REPORT-SPECIFIC PDF GENERATORS
// ============================================================================

export function exportCashPositionPdf(data: Record<string, unknown>) {
  const accounts = (data.accounts as Record<string, unknown>[]) || [];
  generatePdf(
    {
      title: 'Situation de Tresorerie',
      company: data.company_name as string,
      date: new Date().toLocaleDateString('fr-FR'),
    },
    [
      {
        title: 'Position par compte',
        table: {
          headers: ['Compte', 'Banque', 'Devise', 'Solde', 'Statut'],
          rows: accounts.map((a) => [
            a.name as string,
            a.bank_name as string,
            a.currency as string,
            formatFCFA(a.current_balance as number),
            (a.is_active as boolean) ? 'Actif' : 'Inactif',
          ]),
        },
      },
      {
        title: 'Resume',
        content: `Position totale : ${formatFCFA(data.total_balance as number || 0)}\nNombre de comptes actifs : ${accounts.filter(a => a.is_active).length}\nDate de reference : ${new Date().toLocaleDateString('fr-FR')}`,
      },
    ]
  );
}

export function exportCashFlowPdf(data: Record<string, unknown>) {
  const flows = (data.flows as Record<string, unknown>[]) || [];
  generatePdf(
    {
      title: 'Rapport de Flux de Tresorerie',
      subtitle: `Periode : ${data.period_start || ''} — ${data.period_end || ''}`,
      company: data.company_name as string,
      date: new Date().toLocaleDateString('fr-FR'),
    },
    [
      {
        title: 'Resume',
        content: `Encaissements : ${formatFCFA(data.total_receipts as number || 0)}\nDecaissements : ${formatFCFA(data.total_disbursements as number || 0)}\nFlux net : ${formatFCFA(data.net_flow as number || 0)}`,
      },
      {
        title: 'Detail des flux',
        table: {
          headers: ['Date', 'Categorie', 'Contrepartie', 'Montant', 'Statut'],
          rows: flows.slice(0, 100).map((f) => [
            f.flow_date as string,
            f.category as string,
            (f.counterparty_name as string) || '-',
            formatFCFA(f.amount as number),
            f.status as string,
          ]),
        },
      },
    ]
  );
}

export function exportBudgetVariancePdf(data: Record<string, unknown>) {
  const lines = (data.lines as Record<string, unknown>[]) || [];
  generatePdf(
    {
      title: 'Ecart Budget vs Realise',
      company: data.company_name as string,
      date: new Date().toLocaleDateString('fr-FR'),
    },
    [
      {
        title: 'Comparaison par categorie',
        table: {
          headers: ['Categorie', 'Budget', 'Realise', 'Ecart', 'Ecart %'],
          rows: lines.map((l) => [
            l.category as string,
            formatFCFA(l.budget as number || 0),
            formatFCFA(l.actual as number || 0),
            formatFCFA((l.actual as number || 0) - (l.budget as number || 0)),
            `${(((l.actual as number || 0) - (l.budget as number || 0)) / Math.max(1, l.budget as number) * 100).toFixed(1)}%`,
          ]),
        },
      },
    ]
  );
}

export function exportAgingPdf(data: Record<string, unknown>) {
  const counterparties = (data.counterparties as Record<string, unknown>[]) || [];
  generatePdf(
    {
      title: 'Balance Agee des Creances',
      company: data.company_name as string,
      date: new Date().toLocaleDateString('fr-FR'),
    },
    [
      {
        title: 'Creances par anciennete',
        table: {
          headers: ['Contrepartie', '<30j', '30-60j', '60-90j', '>90j', 'Total'],
          rows: counterparties.map((c) => [
            c.name as string,
            formatFCFA(c.bucket_30 as number || 0),
            formatFCFA(c.bucket_60 as number || 0),
            formatFCFA(c.bucket_90 as number || 0),
            formatFCFA(c.bucket_over as number || 0),
            formatFCFA(c.total as number || 0),
          ]),
        },
      },
    ]
  );
}

export function exportCapexPdf(data: Record<string, unknown>) {
  const operations = (data.operations as Record<string, unknown>[]) || [];
  generatePdf(
    {
      title: 'Rapport CAPEX',
      company: data.company_name as string,
      date: new Date().toLocaleDateString('fr-FR'),
    },
    [
      {
        title: 'Suivi des operations CAPEX',
        table: {
          headers: ['Operation', 'Budget', 'Engage', 'Decaisse', 'Reste', 'Statut'],
          rows: operations.map((o) => [
            o.name as string,
            formatFCFA(o.budget_amount as number || 0),
            formatFCFA(o.committed_amount as number || 0),
            formatFCFA(o.spent_amount as number || 0),
            formatFCFA((o.budget_amount as number || 0) - (o.spent_amount as number || 0)),
            o.status as string,
          ]),
        },
      },
    ]
  );
}

export function exportGenericPdf(
  title: string,
  company: string,
  tableHeaders: string[],
  tableRows: (string | number)[][]
) {
  generatePdf(
    { title, company, date: new Date().toLocaleDateString('fr-FR') },
    [{ title: 'Donnees', table: { headers: tableHeaders, rows: tableRows } }]
  );
}
