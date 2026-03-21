import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, FileText, CheckCircle2, AlertTriangle, XCircle, Loader2, Download, Settings2 } from 'lucide-react';

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { FileUpload } from '@/components/shared/file-upload';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { Separator } from '@/components/ui/separator';

import { bankAccountsService } from '../services/bank-accounts.service';
import { useImportStatement } from '../hooks/use-bank-accounts';
import { downloadBankStatementTemplate } from '@/lib/import-templates';
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
  pdf: 'PDF (releve scanne)',
  image: 'Image / Photo (JPG, PNG)',
};

const FORMAT_ACCEPT: Record<ImportFormat, string> = {
  mt940: '.sta,.mt940,.txt',
  camt053: '.xml',
  csv: '.csv',
  excel: '.xlsx,.xls',
  pdf: '.pdf',
  image: '.jpg,.jpeg,.png,.tiff,.bmp,.webp',
};

const FORMAT_DESCRIPTIONS: Record<ImportFormat, string> = {
  mt940: 'Format SWIFT standard — supporte par SGBCI, ECOBANK, UBA, BNI, SIB. Importez directement le fichier .sta ou .mt940 fourni par votre banque.',
  camt053: 'Format ISO 20022 XML — utilise par les banques internationales. Importez le fichier .xml du releve de compte.',
  csv: 'Format texte avec separateur — exportez votre releve depuis le portail bancaire au format CSV. Configurez le mapping des colonnes ci-dessous.',
  excel: 'Copiez votre releve dans le template CashPilot ou importez directement un export Excel de votre banque. Configurez le mapping des colonnes ci-dessous.',
  pdf: 'Releve bancaire au format PDF — CashPilot extrait le texte automatiquement. Pour les PDF scannes (images), un OCR est applique. Precision variable selon la qualite du document.',
  image: 'Photo ou scan d\'un releve bancaire (JPG, PNG). CashPilot utilise l\'OCR pour extraire les transactions. Assurez-vous que l\'image est nette et lisible.',
};

// CSV/Excel column mapping fields
const MAPPING_FIELDS = [
  { key: 'date', label: 'Date operation', required: true },
  { key: 'value_date', label: 'Date valeur', required: false },
  { key: 'description', label: 'Libelle / Description', required: true },
  { key: 'reference', label: 'Reference', required: false },
  { key: 'counterparty', label: 'Contrepartie', required: false },
  { key: 'amount', label: 'Montant', required: true },
  { key: 'balance', label: 'Solde apres', required: false },
];

const needsMapping = (fmt: ImportFormat) => fmt === 'csv' || fmt === 'excel';

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
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'result'>('upload');

  // CSV/Excel mapping config
  const [csvDelimiter, setCsvDelimiter] = useState(';');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [decimalSep, setDecimalSep] = useState(',');
  const [skipHeader, setSkipHeader] = useState(true);
  const [columnMapping, setColumnMapping] = useState<Record<string, number>>({
    date: 0, value_date: 1, description: 2, reference: 3, counterparty: 4, amount: 5, balance: 6,
  });

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
      else if (ext === 'pdf') setSelectedFormat('pdf');
      else if (['jpg', 'jpeg', 'png', 'tiff', 'bmp', 'webp'].includes(ext || '')) setSelectedFormat('image');

      const detectedFormat = (() => {
        if (ext === 'csv') return 'csv';
        if (ext === 'xlsx' || ext === 'xls') return 'excel';
        if (ext === 'pdf') return 'pdf';
        if (['jpg', 'jpeg', 'png', 'tiff', 'bmp', 'webp'].includes(ext || '')) return 'image';
        return selectedFormat;
      })() as ImportFormat;

      // If CSV/Excel → go to mapping step, else go to preview
      if (needsMapping(detectedFormat)) {
        setStep('mapping');
      } else {
        const mockTransactions = await bankAccountsService.getTransactions('preview');
        setPreviewTransactions(mockTransactions.slice(0, 10));
        setStep('preview');
      }
    },
    [selectedFormat],
  );

  const handleMappingDone = async () => {
    const mockTransactions = await bankAccountsService.getTransactions('preview');
    setPreviewTransactions(mockTransactions.slice(0, 10));
    setStep('preview');
  };

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
      <DialogContent className="sm:max-w-[850px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import releve bancaire
          </DialogTitle>
        </DialogHeader>

        {/* ============ STEP 1: UPLOAD ============ */}
        {step === 'upload' && (
          <div className="space-y-4">
            {/* Format selector */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Format du releve</Label>
                <Select value={selectedFormat} onValueChange={(v) => setSelectedFormat(v as ImportFormat)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(bankConfig?.supported_formats ?? (['mt940', 'camt053', 'csv', 'excel'] as ImportFormat[])).map(
                      (fmt) => (
                        <SelectItem key={fmt} value={fmt}>{FORMAT_LABELS[fmt]}</SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              {bankConfig && (
                <div className="space-y-2">
                  <Label>Banque detectee</Label>
                  <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted/50">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{bankConfig.bank_name}</span>
                    <Badge variant="secondary" className="ml-auto">{FORMAT_LABELS[bankConfig.default_format]}</Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Format description */}
            <div className="text-xs text-muted-foreground bg-muted/30 rounded p-3">
              {FORMAT_DESCRIPTIONS[selectedFormat]}
            </div>

            {/* File upload */}
            <FileUpload
              accept={FORMAT_ACCEPT[selectedFormat]}
              maxSize={10 * 1024 * 1024}
              onUpload={handleFileUpload}
              label="Deposez votre fichier de releve ici ou cliquez pour parcourir"
            />

            {/* Template download */}
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Besoin d'un modele ?</p>
                <p className="text-xs text-muted-foreground">
                  Telechargez le template CashPilot pour formater votre releve
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={downloadBankStatementTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Telecharger le template
              </Button>
            </div>

            {/* Supported formats info */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Tous les formats supportes :</p>
              <div className="grid grid-cols-2 gap-1">
                <span>MT940 (.sta, .mt940, .txt) — SGBCI, ECOBANK, UBA, BNI</span>
                <span>CAMT.053 (.xml) — Banques internationales</span>
                <span>CSV (.csv) — Toutes banques (mapping configurable)</span>
                <span>Excel (.xlsx, .xls) — Export banque ou template CashPilot</span>
                <span>PDF (.pdf) — Releves PDF texte ou scannes (OCR)</span>
                <span>Image (.jpg, .png) — Photo de releve (OCR)</span>
              </div>
            </div>
          </div>
        )}

        {/* ============ STEP 2: COLUMN MAPPING (CSV/Excel only) ============ */}
        {step === 'mapping' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Configuration du mapping — {selectedFile?.name}</p>
                <p className="text-xs text-muted-foreground">
                  Indiquez quelle colonne de votre fichier correspond a chaque champ CashPilot
                </p>
              </div>
            </div>

            {/* CSV-specific settings */}
            {selectedFormat === 'csv' && (
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Separateur</Label>
                  <Select value={csvDelimiter} onValueChange={setCsvDelimiter}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value=";">Point-virgule (;)</SelectItem>
                      <SelectItem value=",">Virgule (,)</SelectItem>
                      <SelectItem value="\t">Tabulation</SelectItem>
                      <SelectItem value="|">Pipe (|)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Format date</Label>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">JJ/MM/AAAA</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/JJ/AAAA</SelectItem>
                      <SelectItem value="YYYY-MM-DD">AAAA-MM-JJ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Separateur decimal</Label>
                  <Select value={decimalSep} onValueChange={setDecimalSep}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value=",">Virgule (1 234,56)</SelectItem>
                      <SelectItem value=".">Point (1,234.56)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Ligne d'en-tete</Label>
                  <Select value={skipHeader ? 'yes' : 'no'} onValueChange={(v) => setSkipHeader(v === 'yes')}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Oui (ignorer ligne 1)</SelectItem>
                      <SelectItem value="no">Non</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Column mapping table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Correspondance des colonnes</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Champ CashPilot</TableHead>
                      <TableHead className="w-[100px]">Obligatoire</TableHead>
                      <TableHead>Numero de colonne dans le fichier</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MAPPING_FIELDS.map((field) => (
                      <TableRow key={field.key}>
                        <TableCell className="text-sm font-medium">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </TableCell>
                        <TableCell>
                          {field.required ? (
                            <Badge variant="default" className="text-[10px]">Obligatoire</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">Optionnel</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Colonne</span>
                            <Input
                              type="number"
                              min={0}
                              max={20}
                              value={columnMapping[field.key] ?? ''}
                              onChange={(e) => setColumnMapping(prev => ({
                                ...prev,
                                [field.key]: parseInt(e.target.value) || 0,
                              }))}
                              className="w-16 h-7 text-xs text-center"
                            />
                            <span className="text-[10px] text-muted-foreground">(0 = premiere colonne)</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="text-xs text-muted-foreground bg-blue-50 rounded p-3">
              <p className="font-medium mb-1">Aide :</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>La premiere colonne du fichier = colonne 0</li>
                <li>Montants positifs = entrees (credits), negatifs = sorties (debits)</li>
                <li>Si votre fichier a des colonnes Debit et Credit separees, indiquez la colonne Montant puis selectionnez le format correspondant</li>
              </ul>
            </div>
          </div>
        )}

        {/* ============ STEP 3: PREVIEW ============ */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{selectedFile?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {FORMAT_LABELS[selectedFormat]} — {previewTransactions.length} transactions (apercu)
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleReset}>Changer de fichier</Button>
            </div>

            <div className="rounded-md border max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Contrepartie</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewTransactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="text-sm">{new Date(txn.date).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{txn.description}</TableCell>
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

        {/* ============ STEP 4: RESULT ============ */}
        {step === 'result' && importResult && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Import termine
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-green-50">
                    <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-green-600">{importResult.matched_count}</p>
                    <p className="text-xs text-muted-foreground">Matches</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-yellow-50">
                    <AlertTriangle className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-yellow-600">
                      {importResult.transaction_count - importResult.matched_count - importResult.unmatched_count}
                    </p>
                    <p className="text-xs text-muted-foreground">Probables</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-red-50">
                    <XCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-red-600">{importResult.unmatched_count}</p>
                    <p className="text-xs text-muted-foreground">Non identifies</p>
                  </div>
                </div>
                <div className="mt-4 text-sm text-muted-foreground space-y-1">
                  <p>Fichier : {importResult.file_name}</p>
                  <p>Periode : {new Date(importResult.period_start).toLocaleDateString('fr-FR')} — {new Date(importResult.period_end).toLocaleDateString('fr-FR')}</p>
                  <p>Total transactions : {importResult.transaction_count}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>Annuler</Button>
          )}
          {step === 'mapping' && (
            <>
              <Button variant="outline" onClick={handleReset}>Retour</Button>
              <Button onClick={handleMappingDone}>
                Valider le mapping et continuer
              </Button>
            </>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => needsMapping(selectedFormat) ? setStep('mapping') : handleReset()}>
                Retour
              </Button>
              <Button onClick={handleImport} disabled={importMutation.isPending}>
                {importMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Importer et rapprocher
              </Button>
            </>
          )}
          {step === 'result' && (
            <Button onClick={handleClose}>Fermer</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
