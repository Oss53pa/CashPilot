'use client';

import { useTranslation } from 'react-i18next';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ============================================================================
// TFT — Tableau de Flux de Tresorerie (Methode Directe SYSCOHADA)
// ============================================================================

interface TFTLine {
  code: string;
  label: string;
  level: 0 | 1 | 2;
  amount: number;
  isTotal?: boolean;
  isGrandTotal?: boolean;
}

function generateMockTFT(): { current: TFTLine[]; previous: TFTLine[] } {
  const current: TFTLine[] = [
    // FLUX DE TRESORERIE LIES A L'ACTIVITE
    { code: 'FA', label: 'FLUX DE TRESORERIE LIES A L\'ACTIVITE', level: 0, amount: 0, isTotal: true },
    { code: 'FA1', label: 'Encaissements recus des locataires', level: 1, amount: 485_200_000 },
    { code: 'FA2', label: 'Encaissements recus - charges locatives', level: 1, amount: 98_400_000 },
    { code: 'FA3', label: 'Autres encaissements lies a l\'activite', level: 1, amount: 32_800_000 },
    { code: 'FA4', label: 'Decaissements fournisseurs et charges', level: 1, amount: -287_500_000 },
    { code: 'FA5', label: 'Decaissements personnel', level: 1, amount: -147_600_000 },
    { code: 'FA6', label: 'Interets et charges financieres payes', level: 1, amount: -67_260_000 },
    { code: 'FA7', label: 'Impots et taxes payes', level: 1, amount: -45_200_000 },
    { code: 'FA-T', label: 'FLUX NET DE TRESORERIE — ACTIVITE (A)', level: 0, amount: 68_840_000, isTotal: true },

    // FLUX DE TRESORERIE LIES AUX INVESTISSEMENTS
    { code: 'FI', label: 'FLUX DE TRESORERIE LIES AUX INVESTISSEMENTS', level: 0, amount: 0, isTotal: true },
    { code: 'FI1', label: 'Acquisitions d\'immobilisations corporelles', level: 1, amount: -134_500_000 },
    { code: 'FI2', label: 'Cessions d\'immobilisations corporelles', level: 1, amount: 0 },
    { code: 'FI3', label: 'Acquisitions d\'immobilisations financieres', level: 1, amount: -35_000_000 },
    { code: 'FI4', label: 'Cessions d\'immobilisations financieres', level: 1, amount: 20_000_000 },
    { code: 'FI5', label: 'Interets et dividendes recus sur placements', level: 1, amount: 1_115_000 },
    { code: 'FI-T', label: 'FLUX NET DE TRESORERIE — INVESTISSEMENT (B)', level: 0, amount: -148_385_000, isTotal: true },

    // FLUX DE TRESORERIE LIES AU FINANCEMENT
    { code: 'FF', label: 'FLUX DE TRESORERIE LIES AU FINANCEMENT', level: 0, amount: 0, isTotal: true },
    { code: 'FF1', label: 'Emprunts contractes', level: 1, amount: 0 },
    { code: 'FF2', label: 'Remboursements d\'emprunts', level: 1, amount: -50_940_000 },
    { code: 'FF3', label: 'Tirages sur lignes de credit', level: 1, amount: 10_000_000 },
    { code: 'FF4', label: 'Remboursements lignes de credit', level: 1, amount: -10_000_000 },
    { code: 'FF5', label: 'Augmentation de capital', level: 1, amount: 0 },
    { code: 'FF6', label: 'Dividendes verses', level: 1, amount: 0 },
    { code: 'FF-T', label: 'FLUX NET DE TRESORERIE — FINANCEMENT (C)', level: 0, amount: -50_940_000, isTotal: true },

    // VARIATION NETTE
    { code: 'VAR', label: 'VARIATION NETTE DE TRESORERIE (A+B+C)', level: 0, amount: -130_485_000, isGrandTotal: true },
    { code: 'OUV', label: 'Tresorerie d\'ouverture', level: 0, amount: 261_308_700, isTotal: true },
    { code: 'CLO', label: 'TRESORERIE DE CLOTURE', level: 0, amount: 130_823_700, isGrandTotal: true },
  ];

  // Previous year (slightly different)
  const previous = current.map(line => ({
    ...line,
    amount: Math.round(line.amount * (0.85 + Math.random() * 0.3)),
  }));

  // Recalculate totals for current
  const faFlux = current.filter(l => l.code.startsWith('FA') && !l.isTotal);
  const faTotal = current.find(l => l.code === 'FA-T')!;
  faTotal.amount = faFlux.reduce((s, l) => s + l.amount, 0);

  const fiFlux = current.filter(l => l.code.startsWith('FI') && !l.isTotal);
  const fiTotal = current.find(l => l.code === 'FI-T')!;
  fiTotal.amount = fiFlux.reduce((s, l) => s + l.amount, 0);

  const ffFlux = current.filter(l => l.code.startsWith('FF') && !l.isTotal);
  const ffTotal = current.find(l => l.code === 'FF-T')!;
  ffTotal.amount = ffFlux.reduce((s, l) => s + l.amount, 0);

  const varLine = current.find(l => l.code === 'VAR')!;
  varLine.amount = faTotal.amount + fiTotal.amount + ffTotal.amount;

  const cloLine = current.find(l => l.code === 'CLO')!;
  const ouvLine = current.find(l => l.code === 'OUV')!;
  cloLine.amount = ouvLine.amount + varLine.amount;

  return { current, previous };
}

export function TFTReport() {
  const { t } = useTranslation();
  const { current, previous } = generateMockTFT();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Badge variant="outline">Methode directe</Badge>
        <Badge variant="outline">SYSCOHADA revise 2017</Badge>
        <Badge variant="outline">Exercice 2026</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tableau de Flux de Tresorerie</CardTitle>
          <CardDescription>Methode directe — conforme au plan comptable SYSCOHADA</CardDescription>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Code</TableHead>
                <TableHead className="min-w-[300px]">Libelle</TableHead>
                <TableHead className="text-right min-w-[150px]">Exercice N</TableHead>
                <TableHead className="text-right min-w-[150px]">Exercice N-1</TableHead>
                <TableHead className="text-right min-w-[100px]">Variation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {current.map((line, idx) => {
                const prev = previous[idx];
                const varPct = prev.amount !== 0
                  ? ((line.amount - prev.amount) / Math.abs(prev.amount) * 100)
                  : null;

                return (
                  <TableRow
                    key={line.code}
                    className={cn(
                      line.isTotal && !line.isGrandTotal && 'font-semibold bg-muted/30',
                      line.isGrandTotal && 'font-bold bg-muted/50 border-t-2',
                      line.code.endsWith('-T') && 'border-t',
                    )}
                  >
                    <TableCell className="text-xs text-muted-foreground">{line.code}</TableCell>
                    <TableCell className={cn(
                      line.level === 1 && 'pl-6',
                      line.level === 2 && 'pl-10',
                      (line.isTotal || line.isGrandTotal) && 'font-semibold',
                    )}>
                      {line.label}
                    </TableCell>
                    <TableCell className={cn('text-right', line.amount < 0 && 'text-red-600')}>
                      <CurrencyDisplay amount={line.amount} currency="XOF" />
                    </TableCell>
                    <TableCell className={cn('text-right text-muted-foreground', prev.amount < 0 && 'text-red-400')}>
                      <CurrencyDisplay amount={prev.amount} currency="XOF" />
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {varPct !== null && (
                        <span className={varPct > 0 ? 'text-green-600' : varPct < 0 ? 'text-red-600' : ''}>
                          {varPct > 0 ? '+' : ''}{varPct.toFixed(1)}%
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
