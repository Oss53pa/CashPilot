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

// Helper: build a parent row from children cells
function parentFromChildren(code: string, label: string, level: number, parentCode: string | undefined, sign: '+' | '-', children: ForecastRow[], columns: ForecastColumn[]): ForecastRow {
  const cells: Record<string, ForecastCell> = {};
  for (const col of columns) {
    let v = 0;
    for (const child of children) v += child.cells[col.key]?.forecast ?? 0;
    cells[col.key] = cell(v);
  }
  return { code, label, level, parent_code: parentCode, is_expandable: true, is_total: false, sign, cells, total: computeTotal(cells) };
}

function generateReceipts(columns: ForecastColumn[]): ForecastRow[] {
  const rows: ForecastRow[] = [];

  // ── Loyers fixes — par locataire (level 2) ────────────────────
  const locatairesFixes = [
    makeRow('R-LOY-FIX-ZARA', 'ZARA CI — Boutique A12', 2, 'R-LOY-FIX', false, false, '+', columns, 2_100_000, 8_400_000, 0.03),
    makeRow('R-LOY-FIX-CARREF', 'CARREFOUR Market — Ancre RDC', 2, 'R-LOY-FIX', false, false, '+', columns, 1_800_000, 7_200_000, 0.04),
    makeRow('R-LOY-FIX-MTN', 'MTN Boutique — B07', 2, 'R-LOY-FIX', false, false, '+', columns, 950_000, 3_800_000, 0.05),
    makeRow('R-LOY-FIX-ORANGE', 'Orange CI — B15', 2, 'R-LOY-FIX', false, false, '+', columns, 1_200_000, 4_800_000, 0.04),
    makeRow('R-LOY-FIX-BAQ', 'Banque Atlantique — C01', 2, 'R-LOY-FIX', false, false, '+', columns, 850_000, 3_400_000, 0.03),
    makeRow('R-LOY-FIX-CFAO', 'CFAO Motors — Kiosque K3', 2, 'R-LOY-FIX', false, false, '+', columns, 600_000, 2_400_000, 0.06),
    makeRow('R-LOY-FIX-TOTAL', 'Total Energies — Station', 2, 'R-LOY-FIX', false, false, '+', columns, 500_000, 2_000_000, 0.03),
    makeRow('R-LOY-FIX-JUMIA', 'Jumia CI — D02', 2, 'R-LOY-FIX', false, false, '+', columns, 500_000, 2_000_000, 0.08),
  ];
  const loyersFixes = parentFromChildren('R-LOY-FIX', 'Loyers fixes', 1, 'R-LOY', '+', locatairesFixes, columns);

  // ── Charges locatives — par locataire (level 2) ───────────────
  const locatairesCharges = [
    makeRow('R-LOY-CHG-ZARA', 'ZARA CI', 2, 'R-LOY-CHG', false, false, '+', columns, 380_000, 1_520_000, 0.05),
    makeRow('R-LOY-CHG-CARREF', 'CARREFOUR Market', 2, 'R-LOY-CHG', false, false, '+', columns, 420_000, 1_680_000, 0.06),
    makeRow('R-LOY-CHG-MTN', 'MTN Boutique', 2, 'R-LOY-CHG', false, false, '+', columns, 250_000, 1_000_000, 0.07),
    makeRow('R-LOY-CHG-ORANGE', 'Orange CI', 2, 'R-LOY-CHG', false, false, '+', columns, 300_000, 1_200_000, 0.06),
    makeRow('R-LOY-CHG-AUTRES', 'Autres locataires (34)', 2, 'R-LOY-CHG', false, false, '+', columns, 850_000, 3_400_000, 0.08),
  ];
  const charges = parentFromChildren('R-LOY-CHG', 'Charges locatives', 1, 'R-LOY', '+', locatairesCharges, columns);

  const regularisations = makeRow('R-LOY-REG', 'Régularisations', 1, 'R-LOY', false, false, '+', columns, 400_000, 1_600_000, 0.15);

  const loyersChildren = [loyersFixes, ...locatairesFixes, charges, ...locatairesCharges, regularisations];
  const loyers = parentFromChildren('R-LOY', 'Loyers & Charges locatives', 0, undefined, '+', [loyersFixes, charges, regularisations], columns);
  rows.push(loyers, loyersFixes, ...locatairesFixes, charges, ...locatairesCharges, regularisations);

  // ── Loyers variables — par locataire ──────────────────────────
  const loyVarLocataires = [
    makeRow('R-LOYVAR-CARREF', 'CARREFOUR Market (2.5% CA)', 2, 'R-LOYVAR', false, false, '+', columns, 800_000, 3_200_000, 0.18),
    makeRow('R-LOYVAR-ZARA', 'ZARA CI (3% CA)', 2, 'R-LOYVAR', false, false, '+', columns, 650_000, 2_600_000, 0.22),
    makeRow('R-LOYVAR-AUTRES', 'Autres (5 locataires)', 2, 'R-LOYVAR', false, false, '+', columns, 350_000, 1_400_000, 0.2),
  ];
  const loyVar = parentFromChildren('R-LOYVAR', 'Loyers variables', 0, undefined, '+', loyVarLocataires, columns);
  rows.push(loyVar, ...loyVarLocataires);

  // Droits d'entrée
  rows.push(makeRow('R-DRE', "Droits d'entrée", 0, undefined, false, false, '+', columns, 500_000, 2_000_000, 0.3));

  // ── Revenus annexes ───────────────────────────────────────────
  const parking = makeRow('R-ANN-PARK', 'Parking', 1, 'R-ANN', false, false, '+', columns, 600_000, 2_400_000, 0.1);
  const affichage = makeRow('R-ANN-AFF', 'Affichage publicitaire', 1, 'R-ANN', false, false, '+', columns, 350_000, 1_400_000, 0.12);
  const evenements = makeRow('R-ANN-EVT', 'Événements', 1, 'R-ANN', false, false, '+', columns, 250_000, 1_000_000, 0.25);
  const kiosques = makeRow('R-ANN-KIO', 'Kiosques', 1, 'R-ANN', false, false, '+', columns, 200_000, 800_000, 0.08);
  const annexes = parentFromChildren('R-ANN', 'Revenus annexes', 0, undefined, '+', [parking, affichage, evenements, kiosques], columns);
  rows.push(annexes, parking, affichage, evenements, kiosques);

  // ── Créances en recouvrement — par débiteur ───────────────────
  const creanceDebiteurs = [
    makeRow('R-CREC-MYPLACE', 'MY PLACE SARL — Loyers Fév-Mar', 2, 'R-CREC', false, false, '+', columns, 600_000, 2_400_000, 0.3),
    makeRow('R-CREC-LOCB', 'Boutique Elegance — Charges Q4', 2, 'R-CREC', false, false, '+', columns, 350_000, 1_400_000, 0.2),
    makeRow('R-CREC-LOCC', 'Boulangerie Prestige — Loyer Mar', 2, 'R-CREC', false, false, '+', columns, 250_000, 1_000_000, 0.15),
  ];
  const creances = parentFromChildren('R-CREC', 'Créances en recouvrement', 0, undefined, '+', creanceDebiteurs, columns);
  rows.push(creances, ...creanceDebiteurs);

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

  // ══════════════════════════════════════════════════════════════
  // CHARGES D'EXPLOITATION — avec drill-down par fournisseur
  // ══════════════════════════════════════════════════════════════

  // ── Personnel (level 1 expandable → fournisseurs level 2) ────
  const persDetails = [
    makeRow('D-EXP-PERS-SAL', 'Salaires bruts (42 ETP)', 2, 'D-EXP-PERS', false, false, '-', columns, 2_400_000, 9_600_000, 0.02),
    makeRow('D-EXP-PERS-CNPS', 'Charges CNPS patronales', 2, 'D-EXP-PERS', false, false, '-', columns, 720_000, 2_880_000, 0.02),
    makeRow('D-EXP-PERS-PRIM', 'Primes et gratifications', 2, 'D-EXP-PERS', false, false, '-', columns, 280_000, 1_120_000, 0.1),
    makeRow('D-EXP-PERS-AVN', 'Avantages en nature', 2, 'D-EXP-PERS', false, false, '-', columns, 100_000, 400_000, 0.05),
  ];
  const personnel = parentFromChildren('D-EXP-PERS', 'Personnel', 1, 'D-EXP', '-', persDetails, columns);

  // ── Maintenance (level 1 → fournisseurs level 2) ─────────────
  const maintDetails = [
    makeRow('D-EXP-MAINT-SOGECI', 'SOGECI BTP — Contrat annuel', 2, 'D-EXP-MAINT', false, false, '-', columns, 450_000, 1_800_000, 0.05),
    makeRow('D-EXP-MAINT-KONE', 'KONE CI — Ascenseurs', 2, 'D-EXP-MAINT', false, false, '-', columns, 280_000, 1_120_000, 0.03),
    makeRow('D-EXP-MAINT-OTIS', 'OTIS Afrique — Escalators', 2, 'D-EXP-MAINT', false, false, '-', columns, 220_000, 880_000, 0.04),
    makeRow('D-EXP-MAINT-CURA', 'Maintenance curative (divers)', 2, 'D-EXP-MAINT', false, false, '-', columns, 250_000, 1_000_000, 0.25),
  ];
  const maintenance = parentFromChildren('D-EXP-MAINT', 'Maintenance', 1, 'D-EXP', '-', maintDetails, columns);

  // ── Énergie (level 1 → fournisseurs level 2) ─────────────────
  const energieDetails = [
    makeRow('D-EXP-ENRG-CIE', 'CIE — Électricité', 2, 'D-EXP-ENRG', false, false, '-', columns, 1_100_000, 4_400_000, 0.1),
    makeRow('D-EXP-ENRG-SODECI', 'SODECI — Eau', 2, 'D-EXP-ENRG', false, false, '-', columns, 350_000, 1_400_000, 0.08),
    makeRow('D-EXP-ENRG-CARB', 'TOTAL Energies — Carburant GE', 2, 'D-EXP-ENRG', false, false, '-', columns, 350_000, 1_400_000, 0.15),
  ];
  const energie = parentFromChildren('D-EXP-ENRG', 'Énergie', 1, 'D-EXP', '-', energieDetails, columns);

  // ── Sécurité (level 1 → fournisseurs level 2) ────────────────
  const secuDetails = [
    makeRow('D-EXP-SEC-GS4', 'G4S Sécurité CI — Gardiennage', 2, 'D-EXP-SEC', false, false, '-', columns, 550_000, 2_200_000, 0.03),
    makeRow('D-EXP-SEC-VIGI', 'Vigile Plus — Vidéosurveillance', 2, 'D-EXP-SEC', false, false, '-', columns, 250_000, 1_000_000, 0.05),
  ];
  const securite = parentFromChildren('D-EXP-SEC', 'Sécurité', 1, 'D-EXP', '-', secuDetails, columns);

  // ── Nettoyage (level 1 → fournisseurs level 2) ───────────────
  const nettDetails = [
    makeRow('D-EXP-NET-OZONE', 'Ozone Services — Nettoyage', 2, 'D-EXP-NET', false, false, '-', columns, 380_000, 1_520_000, 0.04),
    makeRow('D-EXP-NET-HYGCI', 'Hygiène CI — Dératisation', 2, 'D-EXP-NET', false, false, '-', columns, 120_000, 480_000, 0.05),
    makeRow('D-EXP-NET-DECH', 'SIPRA — Collecte déchets', 2, 'D-EXP-NET', false, false, '-', columns, 100_000, 400_000, 0.03),
  ];
  const nettoyage = parentFromChildren('D-EXP-NET', 'Nettoyage', 1, 'D-EXP', '-', nettDetails, columns);

  // ── Assurances (level 1 → fournisseurs level 2) ──────────────
  const assDetails = [
    makeRow('D-EXP-ASS-NSIA', 'NSIA Assurances — Multirisque', 2, 'D-EXP-ASS', false, false, '-', columns, 250_000, 1_000_000, 0.02),
    makeRow('D-EXP-ASS-SAHAM', 'Saham Assurance — RC Pro', 2, 'D-EXP-ASS', false, false, '-', columns, 150_000, 600_000, 0.02),
  ];
  const assurances = parentFromChildren('D-EXP-ASS', 'Assurances', 1, 'D-EXP', '-', assDetails, columns);

  // ── Honoraires (level 1 → fournisseurs level 2) ──────────────
  const honDetails = [
    makeRow('D-EXP-HON-KPMG', 'KPMG CI — Audit et conseil', 2, 'D-EXP-HON', false, false, '-', columns, 200_000, 800_000, 0.15),
    makeRow('D-EXP-HON-EDJO', 'Cabinet Edjou & Associés — Juridique', 2, 'D-EXP-HON', false, false, '-', columns, 150_000, 600_000, 0.2),
    makeRow('D-EXP-HON-FIDAL', 'FIDAL Afrique — Conseil fiscal', 2, 'D-EXP-HON', false, false, '-', columns, 150_000, 600_000, 0.25),
  ];
  const honoraires = parentFromChildren('D-EXP-HON', 'Honoraires', 1, 'D-EXP', '-', honDetails, columns);

  // ── Marketing (level 1 → fournisseurs level 2) ───────────────
  const mktDetails = [
    makeRow('D-EXP-MKT-VOODOO', 'Voodoo Communication — Digital', 2, 'D-EXP-MKT', false, false, '-', columns, 300_000, 1_200_000, 0.2),
    makeRow('D-EXP-MKT-EVENTS', 'Events Corp CI — Animations', 2, 'D-EXP-MKT', false, false, '-', columns, 250_000, 1_000_000, 0.3),
    makeRow('D-EXP-MKT-SIGN', 'SignaPrint — Signalétique', 2, 'D-EXP-MKT', false, false, '-', columns, 150_000, 600_000, 0.15),
  ];
  const marketing = parentFromChildren('D-EXP-MKT', 'Marketing', 1, 'D-EXP', '-', mktDetails, columns);

  // ── Frais généraux (level 1 → détail level 2) ────────────────
  const fgDetails = [
    makeRow('D-EXP-FG-FOUR', 'Fournitures de bureau', 2, 'D-EXP-FG', false, false, '-', columns, 80_000, 320_000, 0.1),
    makeRow('D-EXP-FG-ORANGE', 'Orange Business — Télécoms', 2, 'D-EXP-FG', false, false, '-', columns, 120_000, 480_000, 0.05),
    makeRow('D-EXP-FG-DEPL', 'Frais de déplacement', 2, 'D-EXP-FG', false, false, '-', columns, 50_000, 200_000, 0.15),
    makeRow('D-EXP-FG-LIC', 'Licences et abonnements', 2, 'D-EXP-FG', false, false, '-', columns, 50_000, 200_000, 0.05),
  ];
  const fraisGen = parentFromChildren('D-EXP-FG', 'Frais généraux', 1, 'D-EXP', '-', fgDetails, columns);

  const caisse = makeRow('D-EXP-CAI', 'Caisse', 1, 'D-EXP', false, false, '-', columns, 200_000, 800_000, 0.15);
  const mobileMoney = makeRow('D-EXP-MM', 'Mobile Money', 1, 'D-EXP', false, false, '-', columns, 150_000, 600_000, 0.1);

  // Build all exploitation level-1 parents for the total
  const expLevel1 = [personnel, maintenance, energie, securite, nettoyage, assurances, honoraires, marketing, fraisGen, caisse, mobileMoney];
  const expTotal = parentFromChildren('D-EXP', "Charges d'exploitation", 0, undefined, '-', expLevel1, columns);
  rows.push(expTotal);
  rows.push(personnel, ...persDetails);
  rows.push(maintenance, ...maintDetails);
  rows.push(energie, ...energieDetails);
  rows.push(securite, ...secuDetails);
  rows.push(nettoyage, ...nettDetails);
  rows.push(assurances, ...assDetails);
  rows.push(honoraires, ...honDetails);
  rows.push(marketing, ...mktDetails);
  rows.push(fraisGen, ...fgDetails);
  rows.push(caisse, mobileMoney);

  // ══════════════════════════════════════════════════════════════
  // OBLIGATIONS FISCALES — par administration
  // ══════════════════════════════════════════════════════════════
  const tva = makeRow('D-FISC-TVA', 'TVA nette — DGI', 1, 'D-FISC', false, false, '-', columns, 1_500_000, 6_000_000, 0.08);
  const is_ = makeRow('D-FISC-IS', 'IS / Acomptes — DGI', 1, 'D-FISC', false, false, '-', columns, 0, 3_500_000, 0.1);
  const patente = makeRow('D-FISC-PAT', 'Patente — Mairie Yopougon', 1, 'D-FISC', false, false, '-', columns, 0, 1_200_000, 0.05);
  const cnps = makeRow('D-FISC-CNPS', 'CNPS — Charges sociales', 1, 'D-FISC', false, false, '-', columns, 800_000, 3_200_000, 0.03);
  const fiscLevel1 = [tva, is_, patente, cnps];
  const fisc = parentFromChildren('D-FISC', 'Obligations fiscales', 0, undefined, '-', fiscLevel1, columns);
  rows.push(fisc, ...fiscLevel1);

  // ══════════════════════════════════════════════════════════════
  // SERVICE DE LA DETTE — par banque / contrat
  // ══════════════════════════════════════════════════════════════
  const debtCapDetails = [
    makeRow('D-DEBT-CAP-SGBCI', 'SGBCI — Prêt immobilier #2024-001', 2, 'D-DEBT-CAP', false, false, '-', columns, 1_200_000, 4_800_000, 0.01),
    makeRow('D-DEBT-CAP-BIAO', 'BIAO CI — Crédit équipement #2025-003', 2, 'D-DEBT-CAP', false, false, '-', columns, 800_000, 3_200_000, 0.01),
  ];
  const capital = parentFromChildren('D-DEBT-CAP', 'Remboursements capital', 1, 'D-DEBT', '-', debtCapDetails, columns);

  const debtIntDetails = [
    makeRow('D-DEBT-INT-SGBCI', 'SGBCI — Intérêts 7.5%', 2, 'D-DEBT-INT', false, false, '-', columns, 500_000, 2_000_000, 0.01),
    makeRow('D-DEBT-INT-BIAO', 'BIAO CI — Intérêts 8.2%', 2, 'D-DEBT-INT', false, false, '-', columns, 300_000, 1_200_000, 0.01),
  ];
  const interets = parentFromChildren('D-DEBT-INT', 'Intérêts d\'emprunt', 1, 'D-DEBT', '-', debtIntDetails, columns);

  const ligneCT = makeRow('D-DEBT-LCT', 'Remboursements lignes CT', 1, 'D-DEBT', false, false, '-', columns, 0, 0, 0);
  const debtLevel1 = [capital, interets, ligneCT];
  const debt = parentFromChildren('D-DEBT', 'Service de la dette', 0, undefined, '-', debtLevel1, columns);
  rows.push(debt);
  rows.push(capital, ...debtCapDetails);
  rows.push(interets, ...debtIntDetails);
  rows.push(ligneCT);

  // ══════════════════════════════════════════════════════════════
  // CAPEX — par opération et prestataire
  // ══════════════════════════════════════════════════════════════
  const capexDetails1 = [
    makeRow('D-CAPEX-1-SOGECI', 'SOGECI BTP — Situation 2', 2, 'D-CAPEX-1', false, false, '-', columns, 0, 6_000_000, 0.25),
    makeRow('D-CAPEX-1-ELEC', 'SNEDAI Electricité — Lot électrique', 2, 'D-CAPEX-1', false, false, '-', columns, 0, 3_500_000, 0.2),
    makeRow('D-CAPEX-1-PLOMB', 'Plomberie Nationale — Lot fluides', 2, 'D-CAPEX-1', false, false, '-', columns, 0, 2_500_000, 0.2),
  ];
  const capex1 = parentFromChildren('D-CAPEX-1', 'Rénovation Aile Nord', 1, 'D-CAPEX', '-', capexDetails1, columns);

  const capexDetails2 = [
    makeRow('D-CAPEX-2-EGC', 'EGC Construction — Terrassement', 2, 'D-CAPEX-2', false, false, '-', columns, 0, 5_000_000, 0.15),
    makeRow('D-CAPEX-2-BETON', 'Société Ivoirienne de Béton — Dalles', 2, 'D-CAPEX-2', false, false, '-', columns, 0, 3_000_000, 0.2),
  ];
  const capex2 = parentFromChildren('D-CAPEX-2', 'Extension Parking B', 1, 'D-CAPEX', '-', capexDetails2, columns);

  const capexDetails3 = [
    makeRow('D-CAPEX-3-CLIM', 'Clim Afrique SARL — Équipements CVC', 2, 'D-CAPEX-3', false, false, '-', columns, 0, 3_500_000, 0.12),
    makeRow('D-CAPEX-3-GAI', 'Gaines & Conduits CI — Installation', 2, 'D-CAPEX-3', false, false, '-', columns, 0, 1_500_000, 0.15),
  ];
  const capex3 = parentFromChildren('D-CAPEX-3', 'Système HVAC', 1, 'D-CAPEX', '-', capexDetails3, columns);

  const capexLevel1 = [capex1, capex2, capex3];
  const capex = parentFromChildren('D-CAPEX', 'CAPEX planifié', 0, undefined, '-', capexLevel1, columns);
  rows.push(capex);
  rows.push(capex1, ...capexDetails1);
  rows.push(capex2, ...capexDetails2);
  rows.push(capex3, ...capexDetails3);

  // Placements effectués
  rows.push(makeRow('D-PLAC', 'Placements effectués', 0, undefined, false, false, '-', columns, 0, 3_000_000, 0.5));

  // ══════════════════════════════════════════════════════════════
  // RESTITUTIONS — par bénéficiaire
  // ══════════════════════════════════════════════════════════════
  const restDepDetails = [
    makeRow('D-REST-DEP-MYPL', 'MY PLACE SARL — Fin bail Juin', 2, 'D-REST-DEP', false, false, '-', columns, 100_000, 400_000, 0.2),
    makeRow('D-REST-DEP-PHARM', 'Pharmacie du Centre — Fin bail Août', 2, 'D-REST-DEP', false, false, '-', columns, 100_000, 400_000, 0.15),
  ];
  const depots = parentFromChildren('D-REST-DEP', 'Dépôts de garantie', 1, 'D-REST', '-', restDepDetails, columns);
  const avoirs = makeRow('D-REST-AVO', 'Avoirs à rembourser', 1, 'D-REST', false, false, '-', columns, 100_000, 400_000, 0.15);
  const avancesIC = makeRow('D-REST-AIC', 'Remboursement avance Cosmos Angré', 1, 'D-REST', false, false, '-', columns, 0, 500_000, 0.3);
  const restLevel1 = [depots, avoirs, avancesIC];
  const restitutions = parentFromChildren('D-REST', 'Restitutions', 0, undefined, '-', restLevel1, columns);
  rows.push(restitutions);
  rows.push(depots, ...restDepDetails);
  rows.push(avoirs, avancesIC);

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
