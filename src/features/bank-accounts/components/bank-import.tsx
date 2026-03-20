import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, FileText, CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileUpload } from '@/components/shared/file-upload';
import { CurrencyDisplay } from '@/components/shared/currency-display';

import { bankAccountsService } from '../services/bank-accounts.service';
import { useImportStatement } from '../hooks/use-bank-accounts';
import type { ImportFormat, BankStatement, BankTransaction } from '../types';

interface BankImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  bankName?: string;
  currency?: string;
}

const FORMAT_LABELS: Record<ImportFormat, string> = {
  mt940: 'MT940 (SWIFT)',
  camt053: 'CAMT.053 (ISO 20022)',
  csv: 'CSV',
  excel: 'Excel (.xlsx)',
};

const FORMAT_ACCEPT: Record<ImportFormat, string> = {
  mt940: '.sta,.mt940,.txt',
  camt053: '.xml',
  csv: '.csv',
  excel: '.xlsx,.xls',
};

export function BankImport({
  open,
  onOpenChange,
  accountId,
  bankName,
  currency = 'XOF',
}: BankImportProps) {
  const { t } = useTranslation();
  const importMutation = useImportStatement();

  const [selectedFormat, setSelectedFormat] = useState<ImportFormat>('mt940');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewTransactions, setPreviewTransactions] = useState<BankTransaction[]>([]);
  const [importResult, setImportResult] = useState<BankStatement | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');

  // Auto-detect format based on bank
  const bankFormats = bankAccountsService.getBankFormats();
  const bankConfig = bankFormats.find(
    (b) => bankName?.toLowerCase().includes(b.bank_name.toLowerCase()),
  );

  const handleFileUpload = useCallback(
    async (file: File) => {
      setSelectedFile(file);

      // Auto-detect format from extension
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'csv') setSelectedFormat('csv');
      else if (ext === 'xlsx' || ext === 'xls') setSelectedFormat('excel');
      else if (ext === 'xml') setSelectedFormat('camt053');
      else if (ext === 'sta' || ext === 'mt940') setSelectedFormat('mt940');

      // Generate preview (mock)
      const mockTransactions = await bankAccountsService.getTransactions('preview');
      setPreviewTransactions(mockTransactions.slice(0, 10));
      setStep('preview');
    },
    [],
  );

  const handleImport = async () => {
    if (!selectedFile) return;

    const result = await importMutation.mutateAsync({
      accountId,
      file: selectedFile,
      format: selectedFormat,
    });

    setImportResult(result);
    setStep('result');
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewTransactions([]);
    setImportResult(null);
    setStep('upload');
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t('bankAccounts.importStatement', 'Import Bank Statement')}
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            {/* Format selector */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t('bankAccounts.importFormat', 'Format')}
                </label>
                <Select
                  value={selectedFormat}
                  onValueChange={(v) => setSelectedFormat(v as ImportFormat)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(bankConfig?.supported_formats ?? (['mt940', 'camt053', 'csv', 'excel'] as ImportFormat[])).map(
                      (fmt) => (
                        <SelectItem key={fmt} value={fmt}>
                          {FORMAT_LABELS[fmt]}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              {bankConfig && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t('bankAccounts.detectedBank', 'Detected Bank')}
                  </label>
                  <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted/50">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{bankConfig.bank_name}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {FORMAT_LABELS[bankConfig.default_format]}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {/* File upload */}
            <FileUpload
              accept={FORMAT_ACCEPT[selectedFormat]}
              maxSize={10 * 1024 * 1024}
              onUpload={handleFileUpload}
              label={t('bankAccounts.uploadStatement', 'Upload bank statement file')}
            />
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{selectedFile?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {FORMAT_LABELS[selectedFormat]} - {previewTransactions.length} transactions (preview)
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleReset}>
                {t('common.change', 'Change File')}
              </Button>
            </div>

            <div className="rounded-md border max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.date', 'Date')}</TableHead>
                    <TableHead>{t('common.description', 'Description')}</TableHead>
                    <TableHead>{t('bankAccounts.counterparty', 'Counterparty')}</TableHead>
                    <TableHead className="text-right">{t('common.amount', 'Amount')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewTransactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="text-sm">
                        {new Date(txn.date).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">
                        {txn.description}
                      </TableCell>
                      <TableCell className="text-sm">{txn.counterparty_name}</TableCell>
                      <TableCell className="text-right">
                        <CurrencyDisplay amount={txn.amount} currency={currency} colorize />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {step === 'result' && importResult && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  {t('bankAccounts.importComplete', 'Import Complete')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                    <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-green-600">{importResult.matched_count}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('bankAccounts.matched', 'Matched')}
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                    <AlertTriangle className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-yellow-600">
                      {importResult.transaction_count - importResult.matched_count - importResult.unmatched_count}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('bankAccounts.probable', 'Probable')}
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                    <XCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-red-600">{importResult.unmatched_count}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('bankAccounts.unmatched', 'Unmatched')}
                    </p>
                  </div>
                </div>

                <div className="mt-4 text-sm text-muted-foreground space-y-1">
                  <p>
                    {t('bankAccounts.importFile', 'File')}: {importResult.file_name}
                  </p>
                  <p>
                    {t('bankAccounts.importPeriod', 'Period')}:{' '}
                    {new Date(importResult.period_start).toLocaleDateString('fr-FR')} -{' '}
                    {new Date(importResult.period_end).toLocaleDateString('fr-FR')}
                  </p>
                  <p>
                    {t('bankAccounts.totalTransactions', 'Total transactions')}:{' '}
                    {importResult.transaction_count}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              {t('common.cancel', 'Cancel')}
            </Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={handleReset}>
                {t('common.back', 'Back')}
              </Button>
              <Button onClick={handleImport} disabled={importMutation.isPending}>
                {importMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('bankAccounts.runImport', 'Import & Match')}
              </Button>
            </>
          )}
          {step === 'result' && (
            <Button onClick={handleClose}>
              {t('common.close', 'Close')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
