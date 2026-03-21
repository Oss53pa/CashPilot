import { useState, useCallback, useMemo } from 'react';
import {
  Building2, FileCheck, FileText, TrendingUp, Landmark, Star, History,
  AlertTriangle, Plus, Trash2, Check, X, Upload, Shield, Eye, EyeOff,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

import type {
  SupplierIdentity,
  SupplierReferencing,
  SupplierContract,
  SupplierBankAccount,
  SupplierScorecard,
  SupplierScorecardCriteria,
  SupplierTransaction,
  PaymentProfile,
  SupplierCategory,
  SupplierStatus,
  SupplierCriticality,
  ReferencingStatus,
  RelationshipType,
  PaymentBase,
  TenderResult,
  RotationFrequency,
} from '../types';

// ─── Constants ───────────────────────────────────────────────────────────────

const SUPPLIER_CATEGORIES: { value: SupplierCategory; label: string }[] = [
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'energy', label: 'Énergie' },
  { value: 'security', label: 'Sécurité' },
  { value: 'cleaning', label: 'Nettoyage' },
  { value: 'personnel', label: 'Personnel' },
  { value: 'consulting', label: 'Conseil' },
  { value: 'equipment', label: 'Équipement' },
  { value: 'utilities', label: 'Services publics' },
  { value: 'works', label: 'Travaux' },
  { value: 'other', label: 'Autre' },
];

const SUPPLIER_STATUSES: { value: SupplierStatus; label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }[] = [
  { value: 'active', label: 'Actif', variant: 'default' },
  { value: 'inactive', label: 'Inactif', variant: 'secondary' },
  { value: 'suspended', label: 'Suspendu', variant: 'destructive' },
  { value: 'in_dispute', label: 'En litige', variant: 'destructive' },
  { value: 'being_referenced', label: 'En cours de référencement', variant: 'outline' },
];

const CRITICALITY_LEVELS: { value: SupplierCriticality; label: string; color: string }[] = [
  { value: 'critical', label: 'Critique', color: 'text-red-600' },
  { value: 'important', label: 'Important', color: 'text-orange-500' },
  { value: 'standard', label: 'Standard', color: 'text-gray-600' },
];

const REFERENCING_STATUSES: { value: ReferencingStatus; label: string }[] = [
  { value: 'in_progress', label: 'En cours' },
  { value: 'approved', label: 'Approuvé' },
  { value: 'refused', label: 'Refusé' },
  { value: 'suspended', label: 'Suspendu' },
];

const REQUIRED_DOCUMENTS = [
  'Extrait RCCM',
  'Attestation fiscale',
  'Attestation CNPS',
  'RIB bancaire',
  'Certificat d\'assurance',
  'Références clients',
  'Certificat de qualité',
  'Attestation de régularité',
];

const RELATIONSHIP_TYPES: { value: RelationshipType; label: string }[] = [
  { value: 'annual', label: 'Annuel' },
  { value: 'multi_year', label: 'Pluriannuel' },
  { value: 'spot', label: 'Ponctuel' },
  { value: 'framework', label: 'Accord-cadre' },
];

const PAYMENT_BASES: { value: PaymentBase; label: string }[] = [
  { value: 'invoice_receipt', label: 'Réception facture' },
  { value: 'month_end', label: 'Fin de mois' },
  { value: 'service_date', label: 'Date de prestation' },
];

const PAYMENT_METHOD_OPTIONS = [
  'Virement bancaire',
  'Chèque',
  'Espèces',
  'Mobile Money',
  'Traite',
  'Lettre de change',
];

const SCORECARD_CRITERIA = [
  'Qualité de service',
  'Respect des délais',
  'Réactivité',
  'Rapport qualité/prix',
  'Conformité documentaire',
  'Communication',
];

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);

// ─── Mock data ───────────────────────────────────────────────────────────────

function getDefaultIdentity(): SupplierIdentity {
  return {
    legal_name: 'SOGECI MAINTENANCE SARL',
    trade_name: 'SOGECI',
    legal_form: 'SARL',
    rc_number: 'CI-ABJ-2018-B-12456',
    tax_number: '1824567A',
    vat_number: 'CI0018245670',
    category: 'maintenance',
    sub_category: 'Climatisation & Plomberie',
    commercial_contact: 'M. Koné Ibrahim',
    phone: '+225 07 08 09 10 11',
    email: 'contact@sogeci.ci',
    billing_contact: 'Mme Touré Aminata',
    billing_email: 'facturation@sogeci.ci',
    address: 'Zone Industrielle Vridi, Abidjan',
    country: 'Côte d\'Ivoire',
    billing_currency: 'XOF',
    status: 'active',
    criticality: 'important',
    backup_supplier_id: undefined,
    annual_cap: 120_000_000,
    conflict_of_interest: false,
    conflict_detail: undefined,
    notes: 'Fournisseur référencé depuis 2018. Bonne performance globale.',
  };
}

function getDefaultReferencing(): SupplierReferencing {
  return {
    referencing_status: 'approved',
    request_date: '2018-03-15',
    approval_date: '2018-04-20',
    approved_by: 'Direction Achats',
    documents: REQUIRED_DOCUMENTS.map((type, i) => ({
      type,
      file: i < 6 ? `doc_${i + 1}.pdf` : undefined,
      provided: i < 6,
    })),
    tender_ref: 'AO-2024-MAINT-003',
    tender_date: '2024-01-15',
    tender_result: 'selected',
    tender_justification: 'Meilleur rapport qualité/prix sur 5 soumissionnaires',
    subject_to_rotation: true,
    rotation_frequency: 'triennial',
    next_tender_date: '2027-01-15',
  };
}

function getDefaultContract(): SupplierContract {
  return {
    relationship_type: 'annual',
    contract_ref: 'CTR-2024-MAINT-001',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    tacit_renewal: true,
    notice_days: 90,
    contract_alert_days: 60,
    contract_file: 'contrat_sogeci_2024.pdf',
    annual_amount: 96_000_000,
    monthly_amount: 8_000_000,
    billing_frequency: 'Mensuelle',
    vat_applicable: true,
    vat_rate: 18,
    payment_delay_days: 30,
    payment_base: 'invoice_receipt',
    early_payment_discount: true,
    discount_rate: 2,
    discount_delay: 10,
    late_penalty_rate: 1.5,
    payment_methods: ['Virement bancaire'],
    default_account_id: 'acc-001',
    has_retention: true,
    retention_rate: 5,
    retention_duration_months: 12,
    retention_release_conditions: 'Levée des réserves et PV de réception définitive',
  };
}

function getDefaultBankAccounts(): SupplierBankAccount[] {
  return [
    {
      id: 'ba-001',
      bank_name: 'Société Générale CI',
      bank_country: 'Côte d\'Ivoire',
      iban: 'CI93 CI05 0001 0000 1234 5678 9012',
      bic_swift: 'SGCICIAB',
      account_holder: 'SOGECI MAINTENANCE SARL',
      currency: 'XOF',
      is_primary: true,
      verification_date: '2024-01-10',
      verified_by: 'DAF - M. Diallo',
      verification_method: 'Confirmation bancaire',
      verification_document: 'verif_rib_sogeci.pdf',
    },
    {
      id: 'ba-002',
      bank_name: 'BICICI',
      bank_country: 'Côte d\'Ivoire',
      iban: 'CI93 CI02 0001 0000 9876 5432 1098',
      bic_swift: 'BICICIAB',
      account_holder: 'SOGECI MAINTENANCE SARL',
      currency: 'XOF',
      is_primary: false,
      verification_date: undefined,
      verified_by: undefined,
      verification_method: undefined,
      verification_document: undefined,
    },
  ];
}

function getDefaultPaymentProfile(): PaymentProfile {
  return {
    counterparty_id: 'sup-001',
    avg_delay_days: -3.2,
    delay_std_dev: 2.1,
    full_payment_rate: 0.95,
    partial_payment_rate: 0.04,
    avg_partial_amount_pct: 0.88,
    history_months: 24,
    trend: 'stable',
    vigilance_status: 'normal',
    risk_score: 2,
    forced_delay: null,
  };
}

function getDefaultScorecards(): SupplierScorecard[] {
  return [
    {
      id: 'sc-001',
      criteria: [
        { name: 'Qualité de service', score: 4, comment: 'Bon niveau de prestation' },
        { name: 'Respect des délais', score: 3, comment: 'Quelques retards ponctuels' },
        { name: 'Réactivité', score: 4 },
        { name: 'Rapport qualité/prix', score: 4, comment: 'Compétitif' },
        { name: 'Conformité documentaire', score: 5, comment: 'Toujours à jour' },
        { name: 'Communication', score: 4 },
      ],
      overall_score: 4.0,
      evaluator_id: 'user-001',
      evaluation_date: '2025-12-15',
      period: '2025',
      recommendation: 'renew',
    },
    {
      id: 'sc-002',
      criteria: [
        { name: 'Qualité de service', score: 3 },
        { name: 'Respect des délais', score: 3 },
        { name: 'Réactivité', score: 3 },
        { name: 'Rapport qualité/prix', score: 4 },
        { name: 'Conformité documentaire', score: 4 },
        { name: 'Communication', score: 3 },
      ],
      overall_score: 3.3,
      evaluator_id: 'user-002',
      evaluation_date: '2024-12-10',
      period: '2024',
      recommendation: 'renew',
    },
  ];
}

function getDefaultTransactions(): SupplierTransaction[] {
  return [
    { id: 'tx-001', date: '2026-03-05', type: 'invoice', reference: 'FAC-2026-0301', description: 'Maintenance climatisation Mars 2026', amount: 8_000_000, status: 'pending' },
    { id: 'tx-002', date: '2026-02-28', type: 'payment', reference: 'VIR-2026-0215', description: 'Règlement facture Février 2026', amount: 8_000_000, status: 'paid' },
    { id: 'tx-003', date: '2026-02-05', type: 'invoice', reference: 'FAC-2026-0201', description: 'Maintenance climatisation Février 2026', amount: 8_000_000, status: 'paid' },
    { id: 'tx-004', date: '2026-01-30', type: 'payment', reference: 'VIR-2026-0125', description: 'Règlement facture Janvier 2026', amount: 8_000_000, status: 'paid' },
    { id: 'tx-005', date: '2026-01-05', type: 'invoice', reference: 'FAC-2026-0101', description: 'Maintenance climatisation Janvier 2026', amount: 8_000_000, status: 'paid' },
    { id: 'tx-006', date: '2025-12-20', type: 'credit_note', reference: 'AV-2025-012', description: 'Avoir - intervention non réalisée', amount: 1_200_000, status: 'paid' },
    { id: 'tx-007', date: '2025-12-05', type: 'invoice', reference: 'FAC-2025-1201', description: 'Maintenance climatisation Décembre 2025', amount: 8_000_000, status: 'paid' },
    { id: 'tx-008', date: '2025-11-28', type: 'payment', reference: 'VIR-2025-1115', description: 'Règlement facture Novembre 2025', amount: 8_000_000, status: 'paid' },
    { id: 'tx-009', date: '2025-06-15', type: 'advance', reference: 'AV-2025-006', description: 'Acompte travaux climatisation bât. B', amount: 15_000_000, status: 'paid' },
    { id: 'tx-010', date: '2025-03-10', type: 'invoice', reference: 'FAC-2025-0301', description: 'Remplacement compresseur central', amount: 22_000_000, status: 'overdue' },
  ];
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface SupplierFormFullProps {
  supplierId?: string;
  onSave?: (data: unknown) => void;
  onSaveAndNext?: (data: unknown) => void;
  onGeneratePO?: () => void;
  onEvaluate?: () => void;
  onArchive?: () => void;
  onCancel?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SupplierFormFull({
  supplierId: _supplierId,
  onSave,
  onSaveAndNext,
  onGeneratePO,
  onEvaluate,
  onArchive,
  onCancel,
}: SupplierFormFullProps) {
  const [activeTab, setActiveTab] = useState('identity');
  const [saving, setSaving] = useState(false);

  // State for all sections
  const [identity, setIdentity] = useState<SupplierIdentity>(getDefaultIdentity);
  const [referencing, setReferencing] = useState<SupplierReferencing>(getDefaultReferencing);
  const [contract, setContract] = useState<SupplierContract>(getDefaultContract);
  const [paymentProfile] = useState<PaymentProfile>(getDefaultPaymentProfile);
  const [bankAccounts, setBankAccounts] = useState<SupplierBankAccount[]>(getDefaultBankAccounts);
  const [scorecards, setScorecards] = useState<SupplierScorecard[]>(getDefaultScorecards);
  const [transactions] = useState<SupplierTransaction[]>(getDefaultTransactions);

  // New scorecard draft
  const [newScorecard, setNewScorecard] = useState<SupplierScorecardCriteria[]>(
    SCORECARD_CRITERIA.map((name) => ({ name, score: 3 }))
  );
  const [newRecommendation, setNewRecommendation] = useState<'renew' | 'tender' | 'terminate'>('renew');

  // Bank account visibility
  const [showIban, setShowIban] = useState<Record<string, boolean>>({});

  const handleSave = useCallback(() => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      onSave?.({ identity, referencing, contract, bankAccounts, scorecards });
    }, 600);
  }, [identity, referencing, contract, bankAccounts, scorecards, onSave]);

  const handleSaveAndNext = useCallback(() => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      onSaveAndNext?.({ identity, referencing, contract, bankAccounts, scorecards });
    }, 600);
  }, [identity, referencing, contract, bankAccounts, scorecards, onSaveAndNext]);

  // ─── Identity Tab ──────────────────────────────────────────────────────────

  const renderIdentity = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identification légale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Raison sociale *</Label>
              <Input
                value={identity.legal_name}
                onChange={(e) => setIdentity({ ...identity, legal_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Nom commercial</Label>
              <Input
                value={identity.trade_name ?? ''}
                onChange={(e) => setIdentity({ ...identity, trade_name: e.target.value || undefined })}
              />
            </div>
            <div className="space-y-2">
              <Label>Forme juridique *</Label>
              <Select value={identity.legal_form} onValueChange={(v) => setIdentity({ ...identity, legal_form: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['SARL', 'SA', 'SAS', 'SARLU', 'EI', 'GIE', 'Association', 'Autre'].map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>N° RCCM</Label>
              <Input
                value={identity.rc_number ?? ''}
                onChange={(e) => setIdentity({ ...identity, rc_number: e.target.value || undefined })}
              />
            </div>
            <div className="space-y-2">
              <Label>N° Contribuable *</Label>
              <Input
                value={identity.tax_number}
                onChange={(e) => setIdentity({ ...identity, tax_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>N° TVA</Label>
              <Input
                value={identity.vat_number ?? ''}
                onChange={(e) => setIdentity({ ...identity, vat_number: e.target.value || undefined })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Classification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Catégorie *</Label>
              <Select value={identity.category} onValueChange={(v) => setIdentity({ ...identity, category: v as SupplierCategory })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUPPLIER_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sous-catégorie</Label>
              <Input
                value={identity.sub_category ?? ''}
                onChange={(e) => setIdentity({ ...identity, sub_category: e.target.value || undefined })}
              />
            </div>
            <div className="space-y-2">
              <Label>Statut *</Label>
              <Select value={identity.status} onValueChange={(v) => setIdentity({ ...identity, status: v as SupplierStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUPPLIER_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Criticité *</Label>
              <Select value={identity.criticality} onValueChange={(v) => setIdentity({ ...identity, criticality: v as SupplierCriticality })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CRITICALITY_LEVELS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className={c.color}>{c.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Plafond annuel (FCFA)</Label>
              <Input
                type="number"
                value={identity.annual_cap ?? ''}
                onChange={(e) => setIdentity({ ...identity, annual_cap: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div className="space-y-2">
              <Label>Devise facturation</Label>
              <Select value={identity.billing_currency} onValueChange={(v) => setIdentity({ ...identity, billing_currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="XOF">XOF - FCFA BCEAO</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="USD">USD - Dollar US</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contacts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Contact commercial *</Label>
              <Input
                value={identity.commercial_contact}
                onChange={(e) => setIdentity({ ...identity, commercial_contact: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Téléphone *</Label>
              <Input
                value={identity.phone}
                onChange={(e) => setIdentity({ ...identity, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={identity.email}
                onChange={(e) => setIdentity({ ...identity, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Contact facturation</Label>
              <Input
                value={identity.billing_contact ?? ''}
                onChange={(e) => setIdentity({ ...identity, billing_contact: e.target.value || undefined })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email facturation</Label>
              <Input
                type="email"
                value={identity.billing_email ?? ''}
                onChange={(e) => setIdentity({ ...identity, billing_email: e.target.value || undefined })}
              />
            </div>
            <div className="space-y-2">
              <Label>Pays *</Label>
              <Select value={identity.country} onValueChange={(v) => setIdentity({ ...identity, country: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Côte d'Ivoire">Côte d'Ivoire</SelectItem>
                  <SelectItem value="Sénégal">Sénégal</SelectItem>
                  <SelectItem value="Mali">Mali</SelectItem>
                  <SelectItem value="Burkina Faso">Burkina Faso</SelectItem>
                  <SelectItem value="France">France</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Adresse</Label>
            <Textarea
              value={identity.address ?? ''}
              onChange={(e) => setIdentity({ ...identity, address: e.target.value || undefined })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conformité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Conflit d'intérêt déclaré</Label>
              <p className="text-sm text-muted-foreground">Signaler tout conflit d'intérêt potentiel</p>
            </div>
            <Switch
              checked={identity.conflict_of_interest}
              onCheckedChange={(v) => setIdentity({ ...identity, conflict_of_interest: v })}
            />
          </div>
          {identity.conflict_of_interest && (
            <div className="space-y-2">
              <Label>Détails du conflit d'intérêt</Label>
              <Textarea
                value={identity.conflict_detail ?? ''}
                onChange={(e) => setIdentity({ ...identity, conflict_detail: e.target.value || undefined })}
                placeholder="Décrivez la nature du conflit d'intérêt..."
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>Notes internes</Label>
            <Textarea
              value={identity.notes ?? ''}
              onChange={(e) => setIdentity({ ...identity, notes: e.target.value || undefined })}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ─── Referencing Tab ───────────────────────────────────────────────────────

  const renderReferencing = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Statut du référencement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Statut *</Label>
              <Select
                value={referencing.referencing_status}
                onValueChange={(v) => setReferencing({ ...referencing, referencing_status: v as ReferencingStatus })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REFERENCING_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date de demande</Label>
              <Input
                type="date"
                value={referencing.request_date}
                onChange={(e) => setReferencing({ ...referencing, request_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Date d'approbation</Label>
              <Input
                type="date"
                value={referencing.approval_date ?? ''}
                onChange={(e) => setReferencing({ ...referencing, approval_date: e.target.value || undefined })}
              />
            </div>
            <div className="space-y-2">
              <Label>Approuvé par</Label>
              <Input
                value={referencing.approved_by ?? ''}
                onChange={(e) => setReferencing({ ...referencing, approved_by: e.target.value || undefined })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documents requis</CardTitle>
          <CardDescription>
            {referencing.documents.filter((d) => d.provided).length}/{referencing.documents.length} documents fournis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {referencing.documents.map((doc, idx) => (
              <div
                key={doc.type}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={doc.provided}
                    onCheckedChange={(checked) => {
                      const newDocs = [...referencing.documents];
                      newDocs[idx] = { ...doc, provided: !!checked };
                      setReferencing({ ...referencing, documents: newDocs });
                    }}
                  />
                  <div>
                    <p className="text-sm font-medium">{doc.type}</p>
                    {doc.file && (
                      <p className="text-xs text-muted-foreground">{doc.file}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {doc.provided ? (
                    <Badge variant="default"><Check className="h-3 w-3 mr-1" />Fourni</Badge>
                  ) : (
                    <Badge variant="secondary"><X className="h-3 w-3 mr-1" />Manquant</Badge>
                  )}
                  <Button variant="outline" size="sm">
                    <Upload className="h-3 w-3 mr-1" />
                    {doc.file ? 'Remplacer' : 'Joindre'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appel d'offres</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Référence AO</Label>
              <Input
                value={referencing.tender_ref ?? ''}
                onChange={(e) => setReferencing({ ...referencing, tender_ref: e.target.value || undefined })}
              />
            </div>
            <div className="space-y-2">
              <Label>Date AO</Label>
              <Input
                type="date"
                value={referencing.tender_date ?? ''}
                onChange={(e) => setReferencing({ ...referencing, tender_date: e.target.value || undefined })}
              />
            </div>
            <div className="space-y-2">
              <Label>Résultat</Label>
              <Select
                value={referencing.tender_result ?? ''}
                onValueChange={(v) => setReferencing({ ...referencing, tender_result: (v || undefined) as TenderResult | undefined })}
              >
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="selected">Retenu</SelectItem>
                  <SelectItem value="not_selected">Non retenu</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Justification</Label>
            <Textarea
              value={referencing.tender_justification ?? ''}
              onChange={(e) => setReferencing({ ...referencing, tender_justification: e.target.value || undefined })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rotation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Soumis à rotation</Label>
              <p className="text-sm text-muted-foreground">Remise en concurrence périodique obligatoire</p>
            </div>
            <Switch
              checked={referencing.subject_to_rotation}
              onCheckedChange={(v) => setReferencing({ ...referencing, subject_to_rotation: v })}
            />
          </div>
          {referencing.subject_to_rotation && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Fréquence de rotation</Label>
                <Select
                  value={referencing.rotation_frequency ?? ''}
                  onValueChange={(v) => setReferencing({ ...referencing, rotation_frequency: (v || undefined) as RotationFrequency | undefined })}
                >
                  <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annuelle</SelectItem>
                    <SelectItem value="biennial">Biennale</SelectItem>
                    <SelectItem value="triennial">Triennale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prochain AO prévu</Label>
                <Input
                  type="date"
                  value={referencing.next_tender_date ?? ''}
                  onChange={(e) => setReferencing({ ...referencing, next_tender_date: e.target.value || undefined })}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // ─── Contract Tab ──────────────────────────────────────────────────────────

  const renderContract = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations contractuelles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Type de relation *</Label>
              <Select
                value={contract.relationship_type}
                onValueChange={(v) => setContract({ ...contract, relationship_type: v as RelationshipType })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_TYPES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Référence contrat</Label>
              <Input
                value={contract.contract_ref ?? ''}
                onChange={(e) => setContract({ ...contract, contract_ref: e.target.value || undefined })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fichier contrat</Label>
              <div className="flex gap-2">
                <Input value={contract.contract_file ?? ''} readOnly className="flex-1" />
                <Button variant="outline" size="sm"><Upload className="h-3 w-3" /></Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date de début</Label>
              <Input
                type="date"
                value={contract.start_date ?? ''}
                onChange={(e) => setContract({ ...contract, start_date: e.target.value || undefined })}
              />
            </div>
            <div className="space-y-2">
              <Label>Date de fin</Label>
              <Input
                type="date"
                value={contract.end_date ?? ''}
                onChange={(e) => setContract({ ...contract, end_date: e.target.value || undefined })}
              />
            </div>
            <div className="space-y-2">
              <Label>Préavis (jours)</Label>
              <Input
                type="number"
                value={contract.notice_days ?? ''}
                onChange={(e) => setContract({ ...contract, notice_days: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Reconduction tacite</Label>
                <p className="text-sm text-muted-foreground">Renouvellement automatique à échéance</p>
              </div>
              <Switch
                checked={contract.tacit_renewal}
                onCheckedChange={(v) => setContract({ ...contract, tacit_renewal: v })}
              />
            </div>
            <div className="space-y-2">
              <Label>Alerte contrat (jours avant fin)</Label>
              <Input
                type="number"
                value={contract.contract_alert_days ?? ''}
                onChange={(e) => setContract({ ...contract, contract_alert_days: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Montants & Facturation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Montant annuel HT (FCFA)</Label>
              <Input
                type="number"
                value={contract.annual_amount ?? ''}
                onChange={(e) => setContract({ ...contract, annual_amount: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div className="space-y-2">
              <Label>Montant mensuel HT (FCFA)</Label>
              <Input
                type="number"
                value={contract.monthly_amount ?? ''}
                onChange={(e) => setContract({ ...contract, monthly_amount: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fréquence de facturation</Label>
              <Select
                value={contract.billing_frequency ?? ''}
                onValueChange={(v) => setContract({ ...contract, billing_frequency: v || undefined })}
              >
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mensuelle">Mensuelle</SelectItem>
                  <SelectItem value="Trimestrielle">Trimestrielle</SelectItem>
                  <SelectItem value="Semestrielle">Semestrielle</SelectItem>
                  <SelectItem value="Annuelle">Annuelle</SelectItem>
                  <SelectItem value="À la commande">À la commande</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>TVA applicable</Label>
              </div>
              <Switch
                checked={contract.vat_applicable}
                onCheckedChange={(v) => setContract({ ...contract, vat_applicable: v })}
              />
            </div>
            {contract.vat_applicable && (
              <div className="space-y-2">
                <Label>Taux TVA (%)</Label>
                <Input
                  type="number"
                  value={contract.vat_rate ?? ''}
                  onChange={(e) => setContract({ ...contract, vat_rate: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conditions de paiement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Délai de paiement (jours) *</Label>
              <Input
                type="number"
                value={contract.payment_delay_days}
                onChange={(e) => setContract({ ...contract, payment_delay_days: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Base de calcul *</Label>
              <Select
                value={contract.payment_base}
                onValueChange={(v) => setContract({ ...contract, payment_base: v as PaymentBase })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_BASES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Taux pénalité de retard (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={contract.late_penalty_rate ?? ''}
                onChange={(e) => setContract({ ...contract, late_penalty_rate: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Modes de paiement acceptés</Label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHOD_OPTIONS.map((method) => (
                <Badge
                  key={method}
                  variant={contract.payment_methods.includes(method) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    const methods = contract.payment_methods.includes(method)
                      ? contract.payment_methods.filter((m) => m !== method)
                      : [...contract.payment_methods, method];
                    setContract({ ...contract, payment_methods: methods });
                  }}
                >
                  {method}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Escompte pour paiement anticipé</Label>
              <p className="text-sm text-muted-foreground">Remise pour paiement avant échéance</p>
            </div>
            <Switch
              checked={contract.early_payment_discount}
              onCheckedChange={(v) => setContract({ ...contract, early_payment_discount: v })}
            />
          </div>
          {contract.early_payment_discount && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Taux d'escompte (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={contract.discount_rate ?? ''}
                  onChange={(e) => setContract({ ...contract, discount_rate: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
              <div className="space-y-2">
                <Label>Délai escompte (jours)</Label>
                <Input
                  type="number"
                  value={contract.discount_delay ?? ''}
                  onChange={(e) => setContract({ ...contract, discount_delay: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Retenue de garantie</Label>
              <p className="text-sm text-muted-foreground">Applicable aux contrats de travaux</p>
            </div>
            <Switch
              checked={contract.has_retention}
              onCheckedChange={(v) => setContract({ ...contract, has_retention: v })}
            />
          </div>
          {contract.has_retention && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Taux retenue (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={contract.retention_rate ?? ''}
                  onChange={(e) => setContract({ ...contract, retention_rate: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
              <div className="space-y-2">
                <Label>Durée retenue (mois)</Label>
                <Input
                  type="number"
                  value={contract.retention_duration_months ?? ''}
                  onChange={(e) => setContract({ ...contract, retention_duration_months: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
              <div className="space-y-2">
                <Label>Conditions de libération</Label>
                <Input
                  value={contract.retention_release_conditions ?? ''}
                  onChange={(e) => setContract({ ...contract, retention_release_conditions: e.target.value || undefined })}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // ─── Payment Behavior Tab ─────────────────────────────────────────────────

  const renderBehavior = () => {
    const trendLabel = { improving: 'En amélioration', stable: 'Stable', degrading: 'En dégradation' };
    const vigilanceLabel = { normal: 'Normal', surveillance: 'Surveillance', alert: 'Alerte' };
    const vigilanceVariant = {
      normal: 'default' as const,
      surveillance: 'secondary' as const,
      alert: 'destructive' as const,
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comportement de paiement (sortant)</CardTitle>
            <CardDescription>
              Analyse basée sur {paymentProfile.history_months} mois d'historique
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Délai moyen de paiement</p>
                <p className="text-2xl font-bold">
                  {paymentProfile.avg_delay_days > 0 ? '+' : ''}{paymentProfile.avg_delay_days} jours
                </p>
                <p className="text-xs text-muted-foreground">
                  {paymentProfile.avg_delay_days < 0 ? 'En avance sur échéance' : 'Après échéance'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Écart-type</p>
                <p className="text-2xl font-bold">{paymentProfile.delay_std_dev} jours</p>
                <p className="text-xs text-muted-foreground">Régularité des paiements</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Taux paiement intégral</p>
                <p className="text-2xl font-bold">{(paymentProfile.full_payment_rate * 100).toFixed(0)}%</p>
                <Progress value={paymentProfile.full_payment_rate * 100} className="h-2 mt-1" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Taux paiement partiel</p>
                <p className="text-2xl font-bold">{(paymentProfile.partial_payment_rate * 100).toFixed(0)}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tendance</p>
                <Badge variant={paymentProfile.trend === 'degrading' ? 'destructive' : 'default'}>
                  {trendLabel[paymentProfile.trend]}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Vigilance</p>
                <Badge variant={vigilanceVariant[paymentProfile.vigilance_status]}>
                  {vigilanceLabel[paymentProfile.vigilance_status]}
                </Badge>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Score de risque</p>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div
                    key={s}
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      s <= paymentProfile.risk_score
                        ? s <= 2 ? 'bg-green-100 text-green-700' : s <= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {s}
                  </div>
                ))}
                <span className="ml-2 text-sm text-muted-foreground">
                  ({paymentProfile.risk_score}/5)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Surcharges manuelles</CardTitle>
            <CardDescription>Ajuster les paramètres de prévision pour ce fournisseur</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Délai forcé (jours)</Label>
                <Input
                  type="number"
                  value={paymentProfile.forced_delay ?? ''}
                  placeholder="Automatique"
                  readOnly
                />
                <p className="text-xs text-muted-foreground">Remplace le délai calculé dans les prévisions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ─── Bank Accounts Tab ─────────────────────────────────────────────────────

  const renderBankAccounts = () => (
    <div className="space-y-6">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>ALERTE FRAUDE - Vérification obligatoire</AlertTitle>
        <AlertDescription>
          Toute modification de coordonnées bancaires doit être vérifiée par double validation
          (confirmation téléphonique + document officiel). Ne jamais modifier un RIB sur simple
          demande par email.
        </AlertDescription>
      </Alert>

      {bankAccounts.map((account, idx) => (
        <Card key={account.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Landmark className="h-4 w-4" />
                {account.bank_name}
                {account.is_primary && <Badge>Principal</Badge>}
              </CardTitle>
              <div className="flex gap-2">
                {!account.is_primary && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBankAccounts(bankAccounts.map((a) => ({
                        ...a,
                        is_primary: a.id === account.id,
                      })));
                    }}
                  >
                    Définir principal
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBankAccounts(bankAccounts.filter((a) => a.id !== account.id))}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Banque</Label>
                <Input
                  value={account.bank_name}
                  onChange={(e) => {
                    const updated = [...bankAccounts];
                    updated[idx] = { ...account, bank_name: e.target.value };
                    setBankAccounts(updated);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Pays</Label>
                <Input
                  value={account.bank_country}
                  onChange={(e) => {
                    const updated = [...bankAccounts];
                    updated[idx] = { ...account, bank_country: e.target.value };
                    setBankAccounts(updated);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Devise</Label>
                <Input value={account.currency} readOnly />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>IBAN</Label>
                <div className="flex gap-2">
                  <Input
                    value={showIban[account.id] ? account.iban : account.iban.replace(/(.{4}).+(.{4})$/, '$1 **** **** **** $2')}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowIban({ ...showIban, [account.id]: !showIban[account.id] })}
                  >
                    {showIban[account.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>BIC / SWIFT</Label>
                <Input value={account.bic_swift ?? ''} readOnly className="font-mono" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Titulaire</Label>
                <Input value={account.account_holder} readOnly />
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Vérification
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Date de vérification</p>
                  <p className="text-sm font-medium">{account.verification_date ?? 'Non vérifié'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Vérifié par</p>
                  <p className="text-sm font-medium">{account.verified_by ?? '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Méthode</p>
                  <p className="text-sm font-medium">{account.verification_method ?? '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Document</p>
                  <p className="text-sm font-medium">{account.verification_document ?? '-'}</p>
                </div>
              </div>
              {!account.verification_date && (
                <Badge variant="destructive" className="mt-2">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Compte non vérifié
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setBankAccounts([
            ...bankAccounts,
            {
              id: `ba-${Date.now()}`,
              bank_name: '',
              bank_country: 'Côte d\'Ivoire',
              iban: '',
              bic_swift: '',
              account_holder: identity.legal_name,
              currency: 'XOF',
              is_primary: bankAccounts.length === 0,
            },
          ]);
        }}
      >
        <Plus className="h-4 w-4 mr-2" />
        Ajouter un compte bancaire
      </Button>
    </div>
  );

  // ─── Scorecard Tab ─────────────────────────────────────────────────────────

  const avgScore = useMemo(() => {
    const total = newScorecard.reduce((sum, c) => sum + c.score, 0);
    return (total / newScorecard.length).toFixed(1);
  }, [newScorecard]);

  const renderScorecard = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nouvelle évaluation</CardTitle>
          <CardDescription>Évaluez le fournisseur sur 6 critères (note de 1 à 5)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {newScorecard.map((criterion, idx) => (
            <div key={criterion.name} className="flex items-center gap-4">
              <div className="w-48 text-sm font-medium">{criterion.name}</div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((score) => (
                  <Button
                    key={score}
                    variant={criterion.score >= score ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      const updated = [...newScorecard];
                      updated[idx] = { ...criterion, score };
                      setNewScorecard(updated);
                    }}
                  >
                    {score}
                  </Button>
                ))}
              </div>
              <Input
                placeholder="Commentaire..."
                className="flex-1"
                value={criterion.comment ?? ''}
                onChange={(e) => {
                  const updated = [...newScorecard];
                  updated[idx] = { ...criterion, comment: e.target.value || undefined };
                  setNewScorecard(updated);
                }}
              />
            </div>
          ))}

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Score global</p>
              <p className="text-3xl font-bold">{avgScore} / 5</p>
            </div>
            <div className="space-y-2 w-48">
              <Label>Recommandation</Label>
              <Select
                value={newRecommendation}
                onValueChange={(v) => setNewRecommendation(v as 'renew' | 'tender' | 'terminate')}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="renew">Renouveler</SelectItem>
                  <SelectItem value="tender">Remettre en concurrence</SelectItem>
                  <SelectItem value="terminate">Résilier</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={() => {
              const sc: SupplierScorecard = {
                id: `sc-${Date.now()}`,
                criteria: [...newScorecard],
                overall_score: Number(avgScore),
                evaluator_id: 'current-user',
                evaluation_date: new Date().toISOString().split('T')[0],
                period: new Date().getFullYear().toString(),
                recommendation: newRecommendation,
              };
              setScorecards([sc, ...scorecards]);
              setNewScorecard(SCORECARD_CRITERIA.map((name) => ({ name, score: 3 })));
            }}
          >
            Enregistrer l'évaluation
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique des évaluations</CardTitle>
        </CardHeader>
        <CardContent>
          {scorecards.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune évaluation enregistrée</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Période</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Recommandation</TableHead>
                  <TableHead>Détails</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scorecards.map((sc) => (
                  <TableRow key={sc.id}>
                    <TableCell className="font-medium">{sc.period}</TableCell>
                    <TableCell>{sc.evaluation_date}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-bold">{sc.overall_score.toFixed(1)}</span>
                        <span className="text-muted-foreground">/ 5</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        sc.recommendation === 'renew' ? 'default' :
                        sc.recommendation === 'tender' ? 'secondary' : 'destructive'
                      }>
                        {sc.recommendation === 'renew' ? 'Renouveler' :
                         sc.recommendation === 'tender' ? 'Remettre en concurrence' : 'Résilier'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {sc.criteria.map((c) => (
                          <div
                            key={c.name}
                            className={`h-5 w-5 rounded text-[10px] flex items-center justify-center font-bold ${
                              c.score >= 4 ? 'bg-green-100 text-green-700' :
                              c.score >= 3 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}
                            title={`${c.name}: ${c.score}/5`}
                          >
                            {c.score}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // ─── History Tab ───────────────────────────────────────────────────────────

  const renderHistory = () => {
    const typeLabel = { invoice: 'Facture', payment: 'Paiement', credit_note: 'Avoir', advance: 'Acompte' };
    const statusLabel = { paid: 'Payé', pending: 'En attente', overdue: 'En retard', cancelled: 'Annulé' };
    const statusVariant = {
      paid: 'default' as const,
      pending: 'secondary' as const,
      overdue: 'destructive' as const,
      cancelled: 'outline' as const,
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique des transactions</CardTitle>
          <CardDescription>
            {transactions.length} transactions - Montant total: {fmt(transactions.reduce((s, t) => s + t.amount, 0))}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Référence</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-mono text-sm">{tx.date}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{typeLabel[tx.type]}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{tx.reference}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{tx.description}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(tx.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[tx.status]}>{statusLabel[tx.status]}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  // ─── Main Render ───────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{identity.legal_name}</h2>
          <div className="flex items-center gap-2 mt-1">
            {identity.trade_name && (
              <span className="text-muted-foreground">{identity.trade_name}</span>
            )}
            <Badge variant={SUPPLIER_STATUSES.find((s) => s.value === identity.status)?.variant ?? 'default'}>
              {SUPPLIER_STATUSES.find((s) => s.value === identity.status)?.label}
            </Badge>
            <Badge variant="outline" className={CRITICALITY_LEVELS.find((c) => c.value === identity.criticality)?.color}>
              {CRITICALITY_LEVELS.find((c) => c.value === identity.criticality)?.label}
            </Badge>
            <Badge variant="outline">
              {SUPPLIER_CATEGORIES.find((c) => c.value === identity.category)?.label}
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="identity" className="gap-1">
            <Building2 className="h-3 w-3" />Identité
          </TabsTrigger>
          <TabsTrigger value="referencing" className="gap-1">
            <FileCheck className="h-3 w-3" />Référencement
          </TabsTrigger>
          <TabsTrigger value="contract" className="gap-1">
            <FileText className="h-3 w-3" />Contrat & Conditions
          </TabsTrigger>
          <TabsTrigger value="behavior" className="gap-1">
            <TrendingUp className="h-3 w-3" />Comportement
          </TabsTrigger>
          <TabsTrigger value="bank" className="gap-1">
            <Landmark className="h-3 w-3" />Coordonnées bancaires
          </TabsTrigger>
          <TabsTrigger value="scorecard" className="gap-1">
            <Star className="h-3 w-3" />Scorecard
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1">
            <History className="h-3 w-3" />Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="identity" className="mt-4">{renderIdentity()}</TabsContent>
        <TabsContent value="referencing" className="mt-4">{renderReferencing()}</TabsContent>
        <TabsContent value="contract" className="mt-4">{renderContract()}</TabsContent>
        <TabsContent value="behavior" className="mt-4">{renderBehavior()}</TabsContent>
        <TabsContent value="bank" className="mt-4">{renderBankAccounts()}</TabsContent>
        <TabsContent value="scorecard" className="mt-4">{renderScorecard()}</TabsContent>
        <TabsContent value="history" className="mt-4">{renderHistory()}</TabsContent>
      </Tabs>

      {/* Footer */}
      <Separator />
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
          <Button variant="outline" onClick={handleSaveAndNext} disabled={saving}>
            Enregistrer et créer suivant
          </Button>
          <Button variant="outline" onClick={onGeneratePO}>
            Générer BC
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEvaluate}>
            Évaluer
          </Button>
          <Button variant="destructive" onClick={onArchive}>
            Archiver
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
}
