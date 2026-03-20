import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, FileSpreadsheet, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import type { BudgetLineInput } from '../types';

const BUDGET_FIELDS = [
  'category',
  'subcategory',
  'type',
  'month_01', 'month_02', 'month_03', 'month_04',
  'month_05', 'month_06', 'month_07', 'month_08',
  'month_09', 'month_10', 'month_11', 'month_12',
];

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface BudgetImportProps {
  onImport: (lines: BudgetLineInput[]) => void;
  isPending?: boolean;
}

export function BudgetImport({ onImport, isPending }: BudgetImportProps) {
  const { t } = useTranslation('budget');
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<'excel' | 'csv'>('excel');
  const [importedColumns] = useState<string[]>([
    'Categorie', 'Sous-categorie', 'Type', 'Janvier', 'Fevrier', 'Mars',
    'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre',
    'Octobre', 'Novembre', 'Decembre',
  ]);
  const [mapping, setMapping] = useState<Record<string, string>>({
    'Categorie': 'category',
    'Sous-categorie': 'subcategory',
    'Type': 'type',
    'Janvier': 'month_01',
    'Fevrier': 'month_02',
    'Mars': 'month_03',
    'Avril': 'month_04',
    'Mai': 'month_05',
    'Juin': 'month_06',
    'Juillet': 'month_07',
    'Aout': 'month_08',
    'Septembre': 'month_09',
    'Octobre': 'month_10',
    'Novembre': 'month_11',
    'Decembre': 'month_12',
  });

  // Mock preview data
  const previewLines: BudgetLineInput[] = [
    {
      category: 'Ventes marchandises',
      subcategory: null,
      type: 'receipt',
      month_01: 12000000, month_02: 13500000, month_03: 14000000, month_04: 11500000,
      month_05: 12800000, month_06: 13200000, month_07: 10500000, month_08: 9800000,
      month_09: 14200000, month_10: 15000000, month_11: 16500000, month_12: 18000000,
    },
    {
      category: 'Loyers',
      subcategory: null,
      type: 'disbursement',
      month_01: 2500000, month_02: 2500000, month_03: 2500000, month_04: 2500000,
      month_05: 2500000, month_06: 2500000, month_07: 2500000, month_08: 2500000,
      month_09: 2500000, month_10: 2500000, month_11: 2500000, month_12: 2500000,
    },
  ];

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f) {
      const ext = f.name.split('.').pop()?.toLowerCase();
      setFormat(ext === 'csv' ? 'csv' : 'excel');
    }
  }

  function handleConfirmImport() {
    onImport(previewLines);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          {t('import.title', 'Import Budget Data')}
        </CardTitle>
        <CardDescription>
          {t('import.description', 'Upload an Excel or CSV file to import budget lines.')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
              <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
              <p className="mb-2 text-sm text-muted-foreground">
                {t('import.drop_file', 'Drag and drop your file here, or click to browse')}
              </p>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="max-w-xs"
              />
            </div>
            {file && (
              <div className="flex items-center gap-4 rounded-md border p-3">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('import.format', 'Format')}: {format.toUpperCase()} - {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === 'mapping' && (
          <div className="space-y-4">
            <h3 className="font-medium">{t('import.map_columns', 'Map columns to budget fields')}</h3>
            <div className="space-y-3">
              {importedColumns.map((col) => (
                <div key={col} className="flex items-center gap-4">
                  <Label className="w-36 text-sm">{col}</Label>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Select
                    value={mapping[col] ?? ''}
                    onValueChange={(v) => setMapping((prev) => ({ ...prev, [col]: v }))}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder={t('import.select_field', 'Select field')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__skip">-- {t('import.skip', 'Skip')} --</SelectItem>
                      {BUDGET_FIELDS.map((field) => (
                        <SelectItem key={field} value={field}>
                          {field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && (
          <div className="space-y-4">
            <h3 className="font-medium">{t('import.preview', 'Preview imported data')}</h3>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('grid.category', 'Category')}</TableHead>
                    <TableHead>{t('grid.type', 'Type')}</TableHead>
                    {MONTH_LABELS.map((m) => (
                      <TableHead key={m} className="text-right">{m}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewLines.map((line, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{line.category}</TableCell>
                      <TableCell>{line.type}</TableCell>
                      {([
                        'month_01','month_02','month_03','month_04','month_05','month_06',
                        'month_07','month_08','month_09','month_10','month_11','month_12',
                      ] as const).map((m) => (
                        <TableCell key={m} className="text-right">
                          {formatCurrency(line[m], 'XOF')}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('import.line_count', '{{count}} lines will be imported', { count: previewLines.length })}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        {step !== 'upload' && (
          <Button
            variant="outline"
            onClick={() => setStep(step === 'preview' ? 'mapping' : 'upload')}
          >
            {t('import.back', 'Back')}
          </Button>
        )}
        <div className="ml-auto">
          {step === 'upload' && (
            <Button onClick={() => setStep('mapping')} disabled={!file}>
              {t('import.next', 'Next: Map Columns')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          {step === 'mapping' && (
            <Button onClick={() => setStep('preview')}>
              {t('import.preview_btn', 'Next: Preview')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          {step === 'preview' && (
            <Button onClick={handleConfirmImport} disabled={isPending}>
              <Check className="mr-2 h-4 w-4" />
              {isPending ? t('import.importing', 'Importing...') : t('import.confirm', 'Confirm Import')}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
