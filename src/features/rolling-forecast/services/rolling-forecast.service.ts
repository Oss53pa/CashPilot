import type {
  Granularity,
  ForecastColumn,
  ForecastRow,
  ForecastCell,
  PositionBlock,
  RiskSummary,
  RollingForecast,
  SimulationParams,
} from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function formatDateShort(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatWeekLabel(start: Date, end: Date): string {
  const months = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
    'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
  ];
  return `${start.getDate()}-${end.getDate()} ${months[start.getMonth()]}`;
}

function formatMonthLabel(d: Date): string {
  const months = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
    'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
  ];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

function rand(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

function cell(forecast: number, opts?: Partial<ForecastCell>): ForecastCell {
  return {
    forecast,
    low_80: Math.round(forecast * 0.85),
    high_80: Math.round(forecast * 1.12),
    source: 'Proph3t 06h42',
    ...opts,
  };
}

// ---------------------------------------------------------------------------
// Column generators
// ---------------------------------------------------------------------------

function generateWeeklyMonthlyColumns(refDate: Date): ForecastColumn[] {
  const cols: ForecastColumn[] = [];
  const today = refDate;

  // 13 weeks (S1-S13)
  for (let i = 0; i < 13; i++) {
    const start = addDays(today, i * 7);
    const end = addDays(start, 6);
    const confidence = Math.round(98 - i * 1.5);
    cols.push({
      key: `S${i + 1}`,
      label: formatWeekLabel(start, end),
      type: 'week',
      start_date: formatDateShort(start),
      end_date: formatDateShort(end),
      is_past: i < 0,
      is_current: i === 0,
      confidence_pct: Math.max(confidence, 80),
    });
  }

  // Months M4-M12 (after the 13 weeks)
  const monthStart = addDays(today, 13 * 7);
  for (let i = 0; i < 9; i++) {
    const start = addMonths(monthStart, i);
    const end = addMonths(start, 1);
    end.setDate(end.getDate() - 1);
    const confidence = Math.round(80 - i * 1);
    cols.push({
      key: `M${i + 4}`,
      label: formatMonthLabel(start),
      type: 'month',
      start_date: formatDateShort(start),
      end_date: formatDateShort(end),
      is_past: false,
      is_current: false,
      confidence_pct: Math.max(confidence, 71),
    });
  }

  return cols;
}

function generate13WeekColumns(refDate: Date): ForecastColumn[] {
  const cols: ForecastColumn[] = [];
  for (let i = 0; i < 13; i++) {
    const start = addDays(refDate, i * 7);
    const end = addDays(start, 6);
    const confidence = Math.round(98 - i * 1.5);
    cols.push({
      key: `S${i + 1}`,
      label: formatWeekLabel(start, end),
      type: 'week',
      start_date: formatDateShort(start),
      end_date: formatDateShort(end),
      is_past: i < 0,
      is_current: i === 0,
      confidence_pct: Math.max(confidence, 80),
    });
  }
  return cols;
}

function generateMonthlyColumns(refDate: Date): ForecastColumn[] {
  const cols: ForecastColumn[] = [];
  for (let i = 0; i < 12; i++) {
    const start = addMonths(refDate, i);
    const end = addMonths(start, 1);
    end.setDate(end.getDate() - 1);
    const confidence = Math.round(98 - i * 2.25);
    cols.push({
      key: `M${i + 1}`,
      label: formatMonthLabel(start),
      type: 'month',
      start_date: formatDateShort(start),
      end_date: formatDateShort(end),
      is_past: false,
      is_current: i === 0,
      confidence_pct: Math.max(confidence, 71),
    });
  }
  return cols;
}

function generateQuarterlyColumns(refDate: Date): ForecastColumn[] {
  const cols: ForecastColumn[] = [];
  const qLabels = ['T1', 'T2', 'T3', 'T4'];
  for (let i = 0; i < 4; i++) {
    const start = addMonths(refDate, i * 3);
    const end = addMonths(start, 3);
    end.setDate(end.getDate() - 1);
    const confidence = Math.round(95 - i * 6);
    cols.push({
      key: `Q${i + 1}`,
      label: `${qLabels[i]} ${start.getFullYear()}`,
      type: 'quarter',
      start_date: formatDateShort(start),
      end_date: formatDateShort(end),
      is_past: false,
      is_current: i === 0,
      confidence_pct: Math.max(confidence, 71),
    });
  }
  return cols;
}

// ---------------------------------------------------------------------------
// Row generators
// ---------------------------------------------------------------------------

function generateCells(
  columns: ForecastColumn[],
  baseWeekly: number,
  baseMonthly: number,
  variance: number,
): Record<string, ForecastCell> {
  const cells: Record<string, ForecastCell> = {};
  for (const col of columns) {
    const base = col.type === 'week' ? baseWeekly : col.type === 'quarter' ? baseMonthly * 3 : baseMonthly;
    const value = rand(Math.round(base * (1 - variance)), Math.round(base * (1 + variance)));
    cells[col.key] = cell(value);
  }
  return cells;
}

function sumCells(rows: ForecastRow[], columns: ForecastColumn[]): Record<string, ForecastCell> {
  const result: Record<string, ForecastCell> = {};
  for (const col of columns) {
    let total = 0;
    for (const row of rows) {
      if (row.level === 0 && !row.is_total) {
        total += row.cells[col.key]?.forecast ?? 0;
      }
    }
    result[col.key] = cell(total);
  }
  return result;
}

function computeTotal(cells: Record<string, ForecastCell>): ForecastCell {
  let total = 0;
  for (const c of Object.values(cells)) {
    total += c.forecast;
  }
  return cell(total);
}

function makeRow(
  code: string,
  label: string,
  level: number,
  parentCode: string | undefined,
  isExpandable: boolean,
  isTotal: boolean,
  sign: '+' | '-',
  columns: ForecastColumn[],
  baseWeekly: number,
  baseMonthly: number,
  variance: number,
): ForecastRow {
  const cells = generateCells(columns, baseWeekly, baseMonthly, variance);
  return {
    code,
    label,
    level,
    parent_code: parentCode,
    is_expandable: isExpandable,
    is_total: isTotal,
    sign,
    cells,
    total: computeTotal(cells),
  };
}

function generateReceipts(columns: ForecastColumn[]): ForecastRow[] {
  const rows: ForecastRow[] = [];

  // Loyers & Charges locatives (parent)
  const loyersFixes = makeRow('R-LOY-FIX', 'Loyers fixes', 1, 'R-LOY', false, false, '+', columns, 8_500_000, 34_000_000, 0.05);
  const charges = makeRow('R-LOY-CHG', 'Charges locatives', 1, 'R-LOY', false, false, '+', columns, 2_200_000, 8_800_000, 0.08);
  const regularisations = makeRow('R-LOY-REG', 'Régularisations', 1, 'R-LOY', false, false, '+', columns, 400_000, 1_600_000, 0.15);

  const loyersCells: Record<string, ForecastCell> = {};
  for (const col of columns) {
    const v = (loyersFixes.cells[col.key]?.forecast ?? 0) +
              (charges.cells[col.key]?.forecast ?? 0) +
              (regularisations.cells[col.key]?.forecast ?? 0);
    loyersCells[col.key] = cell(v);
  }
  rows.push({ code: 'R-LOY', label: 'Loyers & Charges locatives', level: 0, is_expandable: true, is_total: false, sign: '+', cells: loyersCells, total: computeTotal(loyersCells) });
  rows.push(loyersFixes, charges, regularisations);

  // Loyers variables
  rows.push(makeRow('R-LOYVAR', 'Loyers variables', 0, undefined, false, false, '+', columns, 1_800_000, 7_200_000, 0.2));

  // Droits d'entree
  rows.push(makeRow('R-DRE', "Droits d'entrée", 0, undefined, false, false, '+', columns, 500_000, 2_000_000, 0.3));

  // Revenus annexes (parent)
  const parking = makeRow('R-ANN-PARK', 'Parking', 1, 'R-ANN', false, false, '+', columns, 600_000, 2_400_000, 0.1);
  const affichage = makeRow('R-ANN-AFF', 'Affichage publicitaire', 1, 'R-ANN', false, false, '+', columns, 350_000, 1_400_000, 0.12);
  const evenements = makeRow('R-ANN-EVT', 'Événements', 1, 'R-ANN', false, false, '+', columns, 250_000, 1_000_000, 0.25);
  const kiosques = makeRow('R-ANN-KIO', 'Kiosques', 1, 'R-ANN', false, false, '+', columns, 200_000, 800_000, 0.08);

  const annexesCells: Record<string, ForecastCell> = {};
  for (const col of columns) {
    const v = (parking.cells[col.key]?.forecast ?? 0) +
              (affichage.cells[col.key]?.forecast ?? 0) +
              (evenements.cells[col.key]?.forecast ?? 0) +
              (kiosques.cells[col.key]?.forecast ?? 0);
    annexesCells[col.key] = cell(v);
  }
  rows.push({ code: 'R-ANN', label: 'Revenus annexes', level: 0, is_expandable: true, is_total: false, sign: '+', cells: annexesCells, total: computeTotal(annexesCells) });
  rows.push(parking, affichage, evenements, kiosques);

  // Simple rows
  rows.push(makeRow('R-CREC', 'Créances en recouvrement', 0, undefined, false, false, '+', columns, 1_200_000, 4_800_000, 0.25));
  rows.push(makeRow('R-CONT', 'Recouvrement contentieux', 0, undefined, false, false, '+', columns, 300_000, 1_200_000, 0.35));
  rows.push(makeRow('R-PLAC', 'Placements arrivant à échéance', 0, undefined, false, false, '+', columns, 0, 5_000_000, 0.5));
  rows.push(makeRow('R-LCRED', 'Tirages ligne de crédit', 0, undefined, false, false, '+', columns, 0, 0, 0));
  rows.push(makeRow('R-REMB', 'Remboursements reçus', 0, undefined, false, false, '+', columns, 150_000, 600_000, 0.15));

  // TOTAL
  const totalCells = sumCells(rows, columns);
  rows.push({ code: 'R-TOTAL', label: 'TOTAL ENCAISSEMENTS', level: 0, is_expandable: false, is_total: true, sign: '+', cells: totalCells, total: computeTotal(totalCells) });

  return rows;
}

function generateDisbursements(columns: ForecastColumn[]): ForecastRow[] {
  const rows: ForecastRow[] = [];

  // Charges d'exploitation (parent)
  const personnel = makeRow('D-EXP-PERS', 'Personnel', 1, 'D-EXP', false, false, '-', columns, 3_500_000, 14_000_000, 0.03);
  const maintenance = makeRow('D-EXP-MAINT', 'Maintenance', 1, 'D-EXP', false, false, '-', columns, 1_200_000, 4_800_000, 0.15);
  const energie = makeRow('D-EXP-ENRG', 'Énergie', 1, 'D-EXP', false, false, '-', columns, 1_800_000, 7_200_000, 0.12);
  const securite = makeRow('D-EXP-SEC', 'Sécurité', 1, 'D-EXP', false, false, '-', columns, 800_000, 3_200_000, 0.05);
  const nettoyage = makeRow('D-EXP-NET', 'Nettoyage', 1, 'D-EXP', false, false, '-', columns, 600_000, 2_400_000, 0.05);
  const assurances = makeRow('D-EXP-ASS', 'Assurances', 1, 'D-EXP', false, false, '-', columns, 400_000, 1_600_000, 0.02);
  const honoraires = makeRow('D-EXP-HON', 'Honoraires', 1, 'D-EXP', false, false, '-', columns, 500_000, 2_000_000, 0.2);
  const marketing = makeRow('D-EXP-MKT', 'Marketing', 1, 'D-EXP', false, false, '-', columns, 700_000, 2_800_000, 0.25);
  const fraisGen = makeRow('D-EXP-FG', 'Frais généraux', 1, 'D-EXP', false, false, '-', columns, 300_000, 1_200_000, 0.1);
  const caisse = makeRow('D-EXP-CAI', 'Caisse', 1, 'D-EXP', false, false, '-', columns, 200_000, 800_000, 0.15);
  const mobileMoney = makeRow('D-EXP-MM', 'Mobile Money', 1, 'D-EXP', false, false, '-', columns, 150_000, 600_000, 0.1);

  const expChildren = [personnel, maintenance, energie, securite, nettoyage, assurances, honoraires, marketing, fraisGen, caisse, mobileMoney];
  const expCells: Record<string, ForecastCell> = {};
  for (const col of columns) {
    let v = 0;
    for (const child of expChildren) v += child.cells[col.key]?.forecast ?? 0;
    expCells[col.key] = cell(v);
  }
  rows.push({ code: 'D-EXP', label: "Charges d'exploitation", level: 0, is_expandable: true, is_total: false, sign: '-', cells: expCells, total: computeTotal(expCells) });
  rows.push(...expChildren);

  // Obligations fiscales (parent)
  const tva = makeRow('D-FISC-TVA', 'TVA', 1, 'D-FISC', false, false, '-', columns, 1_500_000, 6_000_000, 0.08);
  const is_ = makeRow('D-FISC-IS', 'IS', 1, 'D-FISC', false, false, '-', columns, 0, 3_500_000, 0.1);
  const patente = makeRow('D-FISC-PAT', 'Patente', 1, 'D-FISC', false, false, '-', columns, 0, 1_200_000, 0.05);
  const cnps = makeRow('D-FISC-CNPS', 'CNPS', 1, 'D-FISC', false, false, '-', columns, 800_000, 3_200_000, 0.03);

  const fiscChildren = [tva, is_, patente, cnps];
  const fiscCells: Record<string, ForecastCell> = {};
  for (const col of columns) {
    let v = 0;
    for (const child of fiscChildren) v += child.cells[col.key]?.forecast ?? 0;
    fiscCells[col.key] = cell(v);
  }
  rows.push({ code: 'D-FISC', label: 'Obligations fiscales', level: 0, is_expandable: true, is_total: false, sign: '-', cells: fiscCells, total: computeTotal(fiscCells) });
  rows.push(...fiscChildren);

  // Service de la dette (parent)
  const capital = makeRow('D-DEBT-CAP', 'Capital', 1, 'D-DEBT', false, false, '-', columns, 2_000_000, 8_000_000, 0.02);
  const interets = makeRow('D-DEBT-INT', 'Intérêts', 1, 'D-DEBT', false, false, '-', columns, 800_000, 3_200_000, 0.02);
  const ligneCT = makeRow('D-DEBT-LCT', 'Ligne CT', 1, 'D-DEBT', false, false, '-', columns, 0, 0, 0);

  const debtChildren = [capital, interets, ligneCT];
  const debtCells: Record<string, ForecastCell> = {};
  for (const col of columns) {
    let v = 0;
    for (const child of debtChildren) v += child.cells[col.key]?.forecast ?? 0;
    debtCells[col.key] = cell(v);
  }
  rows.push({ code: 'D-DEBT', label: 'Service de la dette', level: 0, is_expandable: true, is_total: false, sign: '-', cells: debtCells, total: computeTotal(debtCells) });
  rows.push(...debtChildren);

  // CAPEX planifie (parent)
  const capex1 = makeRow('D-CAPEX-1', 'Rénovation Aile Nord', 1, 'D-CAPEX', false, false, '-', columns, 0, 12_000_000, 0.3);
  const capex2 = makeRow('D-CAPEX-2', 'Extension Parking B', 1, 'D-CAPEX', false, false, '-', columns, 0, 8_000_000, 0.2);
  const capex3 = makeRow('D-CAPEX-3', 'Système HVAC', 1, 'D-CAPEX', false, false, '-', columns, 0, 5_000_000, 0.15);

  const capexChildren = [capex1, capex2, capex3];
  const capexCells: Record<string, ForecastCell> = {};
  for (const col of columns) {
    let v = 0;
    for (const child of capexChildren) v += child.cells[col.key]?.forecast ?? 0;
    capexCells[col.key] = cell(v);
  }
  rows.push({ code: 'D-CAPEX', label: 'CAPEX planifié', level: 0, is_expandable: true, is_total: false, sign: '-', cells: capexCells, total: computeTotal(capexCells) });
  rows.push(...capexChildren);

  // Placements effectues
  rows.push(makeRow('D-PLAC', 'Placements effectués', 0, undefined, false, false, '-', columns, 0, 3_000_000, 0.5));

  // Restitutions (parent)
  const depots = makeRow('D-REST-DEP', 'Dépôts de garantie', 1, 'D-REST', false, false, '-', columns, 200_000, 800_000, 0.2);
  const avoirs = makeRow('D-REST-AVO', 'Avoirs', 1, 'D-REST', false, false, '-', columns, 100_000, 400_000, 0.15);
  const avancesIC = makeRow('D-REST-AIC', 'Avances inter-co', 1, 'D-REST', false, false, '-', columns, 0, 500_000, 0.3);

  const restChildren = [depots, avoirs, avancesIC];
  const restCells: Record<string, ForecastCell> = {};
  for (const col of columns) {
    let v = 0;
    for (const child of restChildren) v += child.cells[col.key]?.forecast ?? 0;
    restCells[col.key] = cell(v);
  }
  rows.push({ code: 'D-REST', label: 'Restitutions', level: 0, is_expandable: true, is_total: false, sign: '-', cells: restCells, total: computeTotal(restCells) });
  rows.push(...restChildren);

  // TOTAL
  const totalCells = sumCells(rows, columns as ForecastColumn[]);
  rows.push({ code: 'D-TOTAL', label: 'TOTAL DÉCAISSEMENTS', level: 0, is_expandable: false, is_total: true, sign: '-', cells: totalCells, total: computeTotal(totalCells) });

  return rows;
}

function generatePosition(
  columns: ForecastColumn[],
  receipts: ForecastRow[],
  disbursements: ForecastRow[],
): PositionBlock {
  const receiptTotal = receipts.find((r) => r.is_total);
  const disbTotal = disbursements.find((r) => r.is_total);
  const threshold = 50_000_000;

  let opening = 130_000_000;
  const positionColumns: PositionBlock['columns'] = {};

  for (const col of columns) {
    const inflow = receiptTotal?.cells[col.key]?.forecast ?? 0;
    const outflow = disbTotal?.cells[col.key]?.forecast ?? 0;
    const netFlow = inflow - outflow;
    const closing = opening + netFlow;
    const surplusDeficit = closing - threshold;

    positionColumns[col.key] = {
      opening,
      net_flow: netFlow,
      closing,
      threshold,
      surplus_deficit: surplusDeficit,
      optimistic: closing * 1.08,
      pessimistic: closing * 0.88,
    };

    opening = closing;
  }

  return { columns: positionColumns };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

function getColumnsForGranularity(granularity: Granularity, refDate: Date): ForecastColumn[] {
  switch (granularity) {
    case 'weekly_monthly':
      return generateWeeklyMonthlyColumns(refDate);
    case 'monthly':
      return generateMonthlyColumns(refDate);
    case 'quarterly':
      return generateQuarterlyColumns(refDate);
    case 'plan_13_weeks':
      return generate13WeekColumns(refDate);
    default:
      return generateWeeklyMonthlyColumns(refDate);
  }
}

export const rollingForecastService = {
  async getRollingForecast(
    companyId: string,
    granularity: Granularity = 'weekly_monthly',
    scenario: 'base' | 'optimistic' | 'pessimistic' = 'base',
  ): Promise<RollingForecast> {
    await new Promise((r) => setTimeout(r, 400));

    const refDate = new Date('2026-03-18');
    const columns = getColumnsForGranularity(granularity, refDate);
    const receipts = generateReceipts(columns);
    const disbursements = generateDisbursements(columns);
    const position = generatePosition(columns, receipts, disbursements);

    const riskSummary: RiskSummary = {
      tenants_at_risk: { count: 3, monthly_amount: 18_400_000 },
      disputes_expected: 13_500_000,
      capex_underfunded: { count: 1, date: '2026-04-15', amount: 28_000_000 },
      covenant_watch: { name: 'DSCR', current: 1.21, minimum: 1.15 },
    };

    return {
      company_id: companyId,
      company_name: 'SCI Horizon Immo',
      reference_date: formatDateShort(refDate),
      period_start: columns[0].start_date,
      period_end: columns[columns.length - 1].end_date,
      granularity,
      scenario,
      currency: 'XOF',
      columns,
      position,
      receipts,
      disbursements,
      risk_summary: riskSummary,
      last_updated: '2026-03-21T06:42:00Z',
    };
  },

  async getPlan13Weeks(companyId: string): Promise<RollingForecast> {
    return this.getRollingForecast(companyId, 'plan_13_weeks', 'base');
  },

  async simulateWithParams(
    companyId: string,
    params: SimulationParams,
  ): Promise<RollingForecast> {
    await new Promise((r) => setTimeout(r, 600));
    const base = await this.getRollingForecast(companyId, 'weekly_monthly', 'base');

    // Apply simulation adjustments to receipts
    for (const row of base.receipts) {
      for (const key of Object.keys(row.cells)) {
        const c = row.cells[key];
        c.forecast = Math.round(c.forecast * (params.recovery_rate / 100));
        if (c.low_80) c.low_80 = Math.round(c.low_80 * (params.recovery_rate / 100));
        if (c.high_80) c.high_80 = Math.round(c.high_80 * (params.recovery_rate / 100));
      }
      row.total = computeTotal(row.cells);
    }

    // Apply unplanned charges increase to disbursements
    for (const row of base.disbursements) {
      const factor = 1 + params.unplanned_charges_pct / 100;
      for (const key of Object.keys(row.cells)) {
        const c = row.cells[key];
        c.forecast = Math.round(c.forecast * factor);
        if (c.low_80) c.low_80 = Math.round(c.low_80 * factor);
        if (c.high_80) c.high_80 = Math.round(c.high_80 * factor);
      }
      row.total = computeTotal(row.cells);
    }

    // Recalculate position
    base.position = generatePosition(base.columns, base.receipts, base.disbursements);

    return base;
  },

  async refreshForecast(companyId: string): Promise<RollingForecast> {
    return this.getRollingForecast(companyId);
  },

  async exportRollingExcel(_forecastId: string): Promise<{ url: string }> {
    await new Promise((r) => setTimeout(r, 800));
    return { url: '#export-rolling-excel' };
  },

  async exportPlan13WeeksPDF(_forecastId: string): Promise<{ url: string }> {
    await new Promise((r) => setTimeout(r, 800));
    return { url: '#export-plan-13-weeks-pdf' };
  },
};
