import { useState, useCallback } from 'react';
import {
  Building2,
  FileText,
  FilePlus2,
  BarChart3,
  UserCheck,
  Shield,
  Umbrella,
  Hammer,
  History,
  Scale,
  Save,
  Printer,
  Archive,
  X,
  Plus,
  AlertTriangle,
  Check,
  ChevronRight,
  Banknote,
} from 'lucide-react';
import type { Counterparty } from '@/types/database';
import type {
  TenantFullProfile,
  TenantIdentity,
  LeaseDetails,
  LeaseAmendment,
  DeclaredRevenue,
  InstallmentPlan,
  DepositGuarantee,
  TenantInsurance,
  TenantWork,
  TransactionHistoryEntry,
  TenantDispute,
  TenantLegalForm,
  TenantStatus,
  EmployeeCount,
  LeaseType,
  Periodicity,
  FullIndexationType,
  DeclaredRevenueStatus,
  TenantWorkStatus,
  TenantDisputeStatus,
  InstallmentPlanStatus,
} from '../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PaymentProfileCard } from './payment-profile-card';
import {
  useTenantFullProfile,
  useSaveTenantFullProfile,
  usePaymentProfile,
  useUpdatePaymentProfile,
  useLeaseContracts,
  useColdStartProfile,
} from '../hooks/use-counterparties';

// =============================================================================
// Helpers
// =============================================================================

function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal' }).format(amount) + ' FCFA';
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// =============================================================================
// Field Component - reusable inline field (no <form>)
// =============================================================================

function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="text-xs text-muted-foreground mb-1 block">{label}</Label>
      {children}
    </div>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value ?? '-'}</p>
    </div>
  );
}

// =============================================================================
// Label maps
// =============================================================================

const LEGAL_FORM_LABELS: Record<TenantLegalForm, string> = {
  sarl: 'SARL',
  sa: 'SA',
  sas: 'SAS',
  ei: 'Entreprise Individuelle',
  association: 'Association',
  other: 'Autre',
};

const STATUS_LABELS: Record<TenantStatus, string> = {
  active: 'Actif',
  inactive: 'Inactif',
  negotiating: 'En negociation',
  pre_lease: 'Pre-bail',
  suspended: 'Suspendu',
};

const STATUS_VARIANTS: Record<TenantStatus, 'success' | 'destructive' | 'warning' | 'secondary' | 'default'> = {
  active: 'success',
  inactive: 'destructive',
  negotiating: 'warning',
  pre_lease: 'secondary',
  suspended: 'destructive',
};

const EMPLOYEE_COUNT_LABELS: Record<EmployeeCount, string> = {
  '1-5': '1 - 5',
  '6-20': '6 - 20',
  '21-50': '21 - 50',
  '51-200': '51 - 200',
  '200+': '200+',
};

const LEASE_TYPE_LABELS: Record<LeaseType, string> = {
  befa: 'BEFA (Bail en Etat Futur)',
  commercial: 'Commercial',
  precarious: 'Precaire',
  temporary: 'Temporaire',
};

const PERIODICITY_LABELS: Record<Periodicity, string> = {
  monthly: 'Mensuel',
  quarterly: 'Trimestriel',
  semi_annual: 'Semestriel',
};

const INDEXATION_TYPE_LABELS: Record<FullIndexationType, string> = {
  none: 'Aucune',
  fixed_rate: 'Taux fixe',
  external_index: 'Indice externe (IRL/ICC)',
  contractual_step: 'Palier contractuel',
};

const DECLARED_STATUS_LABELS: Record<DeclaredRevenueStatus, string> = {
  declared: 'Declare',
  verified: 'Verifie',
  disputed: 'Conteste',
  audited: 'Audite',
};

const WORK_STATUS_LABELS: Record<TenantWorkStatus, string> = {
  pending: 'En attente',
  authorized: 'Autorise',
  refused: 'Refuse',
  in_progress: 'En cours',
  completed: 'Termine',
};

const WORK_STATUS_VARIANTS: Record<TenantWorkStatus, 'success' | 'destructive' | 'warning' | 'secondary' | 'default'> = {
  pending: 'warning',
  authorized: 'success',
  refused: 'destructive',
  in_progress: 'default',
  completed: 'secondary',
};

const DISPUTE_STATUS_LABELS: Record<TenantDisputeStatus, string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  settled: 'Regle',
  closed: 'Clos',
  written_off: 'Passe en perte',
};

const INSTALLMENT_STATUS_LABELS: Record<InstallmentPlanStatus, string> = {
  active: 'Actif',
  completed: 'Termine',
  defaulted: 'Defaut',
};

const AVAILABLE_TAGS = [
  'Ancre', 'Premium', 'International', 'Grande Surface', 'Telecom',
  'Banque', 'Restauration', 'Mode', 'Automobile', 'Contentieux',
  'VIP', 'PME', 'Franchise',
];

// =============================================================================
// Tab Icons
// =============================================================================

const TAB_CONFIG = [
  { id: 'identity', label: 'Identite', icon: Building2 },
  { id: 'lease', label: 'Bail & Loyers', icon: FileText },
  { id: 'amendments', label: 'Avenants', icon: FilePlus2 },
  { id: 'revenue', label: 'CA Declare', icon: BarChart3 },
  { id: 'behavior', label: 'Comportement', icon: UserCheck },
  { id: 'deposits', label: 'Depots & Garanties', icon: Shield },
  { id: 'insurance', label: 'Assurances', icon: Umbrella },
  { id: 'works', label: 'Travaux', icon: Hammer },
  { id: 'history', label: 'Historique', icon: History },
  { id: 'disputes', label: 'Contentieux', icon: Scale },
] as const;

// =============================================================================
// Main Component
// =============================================================================

interface TenantFormFullProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  counterparty: Counterparty;
}

export function TenantFormFull({ open, onOpenChange, counterparty }: TenantFormFullProps) {
  const [activeTab, setActiveTab] = useState<string>('identity');

  // Fetch full profile
  const { data: profile, isLoading } = useTenantFullProfile(counterparty.id, counterparty.name);

  // Save mutation
  const saveMutation = useSaveTenantFullProfile(counterparty.id);

  // Payment profile (reuse existing)
  const { data: paymentProfile, isLoading: ppLoading } = usePaymentProfile(counterparty.id, counterparty.name);
  const updatePaymentProfile = useUpdatePaymentProfile(counterparty.id);
  const { data: leaseContracts = [] } = useLeaseContracts(counterparty.id);
  const { data: coldStart } = useColdStartProfile(counterparty.id, counterparty.name);

  // Local state for edits
  const [identity, setIdentity] = useState<TenantIdentity | null>(null);
  const [lease, setLease] = useState<LeaseDetails | null>(null);
  const [deposit, setDeposit] = useState<DepositGuarantee | null>(null);
  const [insurance, setInsurance] = useState<TenantInsurance | null>(null);

  // Initialize local state from fetched profile
  const initializeState = useCallback(() => {
    if (profile) {
      if (!identity) setIdentity({ ...profile.identity });
      if (!lease) setLease({ ...profile.lease });
      if (!deposit) setDeposit({ ...profile.deposit_guarantee });
      if (!insurance) setInsurance({ ...profile.insurance });
    }
  }, [profile, identity, lease, deposit, insurance]);

  // Initialize when profile loads
  if (profile && !identity) {
    initializeState();
  }

  const currentIdentity = identity ?? profile?.identity;
  const currentLease = lease ?? profile?.lease;
  const currentDeposit = deposit ?? profile?.deposit_guarantee;
  const currentInsurance = insurance ?? profile?.insurance;

  // Handlers
  function handleSave() {
    if (!profile) return;
    saveMutation.mutate({
      ...profile,
      identity: identity ?? profile.identity,
      lease: lease ?? profile.lease,
      deposit_guarantee: deposit ?? profile.deposit_guarantee,
      insurance: insurance ?? profile.insurance,
    });
  }

  function handleSaveAndNext() {
    handleSave();
    onOpenChange(false);
  }

  function updateIdentityField<K extends keyof TenantIdentity>(key: K, value: TenantIdentity[K]) {
    setIdentity((prev) => prev ? { ...prev, [key]: value } : null);
  }

  function updateLeaseField<K extends keyof LeaseDetails>(key: K, value: LeaseDetails[K]) {
    setLease((prev) => prev ? { ...prev, [key]: value } : null);
  }

  function updateDepositField<K extends keyof DepositGuarantee>(key: K, value: DepositGuarantee[K]) {
    setDeposit((prev) => prev ? { ...prev, [key]: value } : null);
  }

  function updateInsuranceField<K extends keyof TenantInsurance>(key: K, value: TenantInsurance[K]) {
    setInsurance((prev) => prev ? { ...prev, [key]: value } : null);
  }

  function toggleTag(tag: string) {
    if (!identity) return;
    const tags = identity.tags.includes(tag)
      ? identity.tags.filter((t) => t !== tag)
      : [...identity.tags, tag];
    setIdentity({ ...identity, tags });
  }

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1200px] h-[92vh] p-0 gap-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">
                Profil Locataire : {counterparty.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {currentIdentity?.activity_sector ?? 'Chargement...'}
                {currentIdentity?.status && (
                  <Badge
                    variant={STATUS_VARIANTS[currentIdentity.status]}
                    className="ml-2"
                  >
                    {STATUS_LABELS[currentIdentity.status]}
                  </Badge>
                )}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body: Tabs */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Chargement du profil...</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b px-6 pt-2">
              <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
                {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
                  <TabsTrigger
                    key={id}
                    value={id}
                    className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-t-md rounded-b-none px-3 py-2"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6">
                {/* Tab 1 - Identite */}
                <TabsContent value="identity" className="mt-0">
                  <TabIdentity
                    data={currentIdentity}
                    onUpdate={updateIdentityField}
                    onToggleTag={toggleTag}
                  />
                </TabsContent>

                {/* Tab 2 - Bail & Loyers */}
                <TabsContent value="lease" className="mt-0">
                  <TabLease data={currentLease} onUpdate={updateLeaseField} />
                </TabsContent>

                {/* Tab 3 - Avenants */}
                <TabsContent value="amendments" className="mt-0">
                  <TabAmendments amendments={profile?.amendments ?? []} />
                </TabsContent>

                {/* Tab 4 - CA Declare */}
                <TabsContent value="revenue" className="mt-0">
                  <TabDeclaredRevenue
                    revenues={profile?.declared_revenues ?? []}
                    hasVariableRent={currentLease?.has_variable_rent ?? false}
                  />
                </TabsContent>

                {/* Tab 5 - Comportement */}
                <TabsContent value="behavior" className="mt-0">
                  <TabBehavior
                    counterparty={counterparty}
                    paymentProfile={paymentProfile}
                    lease={leaseContracts[0]}
                    coldStart={coldStart}
                    isLoading={ppLoading}
                    onUpdateOverrides={(o) => updatePaymentProfile.mutate(o)}
                    installmentPlans={profile?.installment_plans ?? []}
                  />
                </TabsContent>

                {/* Tab 6 - Depots & Garanties */}
                <TabsContent value="deposits" className="mt-0">
                  <TabDeposits data={currentDeposit} onUpdate={updateDepositField} />
                </TabsContent>

                {/* Tab 7 - Assurances */}
                <TabsContent value="insurance" className="mt-0">
                  <TabInsurance data={currentInsurance} onUpdate={updateInsuranceField} />
                </TabsContent>

                {/* Tab 8 - Travaux */}
                <TabsContent value="works" className="mt-0">
                  <TabWorks works={profile?.works ?? []} />
                </TabsContent>

                {/* Tab 9 - Historique */}
                <TabsContent value="history" className="mt-0">
                  <TabHistory entries={profile?.transaction_history ?? []} />
                </TabsContent>

                {/* Tab 10 - Contentieux */}
                <TabsContent value="disputes" className="mt-0">
                  <TabDisputes disputes={profile?.disputes ?? []} />
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        )}

        {/* Footer */}
        <div className="border-t px-6 py-3 flex items-center justify-between bg-muted/30">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              <X className="mr-1.5 h-3.5 w-3.5" />
              Annuler
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-3.5 w-3.5" />
              Imprimer
            </Button>
            <Button variant="outline" size="sm">
              <Archive className="mr-1.5 h-3.5 w-3.5" />
              Archiver
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Banknote className="mr-1.5 h-3.5 w-3.5" />
              Generer relance
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleSaveAndNext}
              disabled={saveMutation.isPending}
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              Enregistrer et creer suivant
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// TAB 1 - IDENTITE
// =============================================================================

function TabIdentity({
  data,
  onUpdate,
  onToggleTag,
}: {
  data: TenantIdentity | undefined;
  onUpdate: <K extends keyof TenantIdentity>(key: K, value: TenantIdentity[K]) => void;
  onToggleTag: (tag: string) => void;
}) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Raison sociale & Identite juridique */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Identite juridique</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Raison sociale *">
              <Input
                value={data.legal_name}
                onChange={(e) => onUpdate('legal_name', e.target.value)}
              />
            </Field>
            <Field label="Nom commercial *">
              <Input
                value={data.trade_name}
                onChange={(e) => onUpdate('trade_name', e.target.value)}
              />
            </Field>
            <Field label="Groupe / Enseigne">
              <Input
                value={data.brand_group ?? ''}
                onChange={(e) => onUpdate('brand_group', e.target.value || undefined)}
              />
            </Field>
            <Field label="Nationalite enseigne">
              <Input
                value={data.brand_nationality ?? ''}
                onChange={(e) => onUpdate('brand_nationality', e.target.value || undefined)}
              />
            </Field>
            <Field label="Forme juridique *">
              <Select
                value={data.legal_form}
                onValueChange={(v) => onUpdate('legal_form', v as TenantLegalForm)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(LEGAL_FORM_LABELS) as [TenantLegalForm, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="N RCCM">
              <Input
                value={data.rc_number ?? ''}
                onChange={(e) => onUpdate('rc_number', e.target.value || undefined)}
              />
            </Field>
            <Field label="N Contribuable">
              <Input
                value={data.tax_number ?? ''}
                onChange={(e) => onUpdate('tax_number', e.target.value || undefined)}
              />
            </Field>
            <Field label="Secteur d'activite *">
              <Input
                value={data.activity_sector}
                onChange={(e) => onUpdate('activity_sector', e.target.value)}
              />
            </Field>
            <Field label="Sous-secteur">
              <Input
                value={data.sub_sector ?? ''}
                onChange={(e) => onUpdate('sub_sector', e.target.value || undefined)}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Contacts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Contact principal *">
              <Input
                value={data.primary_contact_name}
                onChange={(e) => onUpdate('primary_contact_name', e.target.value)}
              />
            </Field>
            <Field label="Fonction">
              <Input
                value={data.primary_contact_role ?? ''}
                onChange={(e) => onUpdate('primary_contact_role', e.target.value || undefined)}
              />
            </Field>
            <Field label="Telephone principal *">
              <Input
                value={data.phone_primary}
                onChange={(e) => onUpdate('phone_primary', e.target.value)}
              />
            </Field>
            <Field label="Email principal *">
              <Input
                type="email"
                value={data.email_primary}
                onChange={(e) => onUpdate('email_primary', e.target.value)}
              />
            </Field>
            <Field label="Telephone secondaire">
              <Input
                value={data.phone_secondary ?? ''}
                onChange={(e) => onUpdate('phone_secondary', e.target.value || undefined)}
              />
            </Field>
            <Field label="Email secondaire">
              <Input
                type="email"
                value={data.email_secondary ?? ''}
                onChange={(e) => onUpdate('email_secondary', e.target.value || undefined)}
              />
            </Field>
            <Field label="Adresse siege" className="sm:col-span-2 lg:col-span-3">
              <Textarea
                value={data.hq_address ?? ''}
                onChange={(e) => onUpdate('hq_address', e.target.value || undefined)}
                rows={2}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Info complementaire */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Informations complementaires</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Effectif">
              <Select
                value={data.employee_count ?? ''}
                onValueChange={(v) => onUpdate('employee_count', v as EmployeeCount)}
              >
                <SelectTrigger><SelectValue placeholder="Selectionner" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(EMPLOYEE_COUNT_LABELS) as [EmployeeCount, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="CA annuel (FCFA)">
              <Input
                type="number"
                value={data.annual_revenue ?? ''}
                onChange={(e) => onUpdate('annual_revenue', e.target.value ? Number(e.target.value) : undefined)}
              />
            </Field>
            <Field label="Statut *">
              <Select
                value={data.status}
                onValueChange={(v) => onUpdate('status', v as TenantStatus)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(STATUS_LABELS) as [TenantStatus, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Separator className="my-4" />

          {/* Tags */}
          <div>
            <Label className="text-xs text-muted-foreground">Tags</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {AVAILABLE_TAGS.map((tag) => (
                <Badge
                  key={tag}
                  variant={data.tags.includes(tag) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => onToggleTag(tag)}
                >
                  {data.tags.includes(tag) && <Check className="mr-1 h-3 w-3" />}
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <Separator className="my-4" />

          {/* Toggles */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Unites multiples</p>
                <p className="text-xs text-muted-foreground">Ce locataire occupe plusieurs lots</p>
              </div>
              <Switch
                checked={data.has_multiple_units}
                onCheckedChange={(v) => onUpdate('has_multiple_units', v)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Conflit d'interet</p>
                <p className="text-xs text-muted-foreground">Lien avec un administrateur</p>
              </div>
              <Switch
                checked={data.conflict_of_interest}
                onCheckedChange={(v) => onUpdate('conflict_of_interest', v)}
              />
            </div>
          </div>

          {data.conflict_of_interest && (
            <Field label="Detail du conflit" className="mt-4">
              <Textarea
                value={data.conflict_detail ?? ''}
                onChange={(e) => onUpdate('conflict_detail', e.target.value || undefined)}
                rows={2}
              />
            </Field>
          )}

          <Field label="Notes internes" className="mt-4">
            <Textarea
              value={data.notes ?? ''}
              onChange={(e) => onUpdate('notes', e.target.value || undefined)}
              rows={3}
              placeholder="Observations internes sur le locataire..."
            />
          </Field>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// TAB 2 - BAIL & LOYERS
// =============================================================================

function TabLease({
  data,
  onUpdate,
}: {
  data: LeaseDetails | undefined;
  onUpdate: <K extends keyof LeaseDetails>(key: K, value: LeaseDetails[K]) => void;
}) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Bail */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Informations du bail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Type de bail *">
              <Select
                value={data.lease_type}
                onValueChange={(v) => onUpdate('lease_type', v as LeaseType)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(LEASE_TYPE_LABELS) as [LeaseType, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Reference bail *">
              <Input value={data.lease_ref} onChange={(e) => onUpdate('lease_ref', e.target.value)} />
            </Field>
            <Field label="Zone">
              <Input value={data.zone} onChange={(e) => onUpdate('zone', e.target.value)} />
            </Field>
            <Field label="N du lot *">
              <Input value={data.unit_number} onChange={(e) => onUpdate('unit_number', e.target.value)} />
            </Field>
            <Field label="Etage">
              <Input value={data.floor ?? ''} onChange={(e) => onUpdate('floor', e.target.value || undefined)} />
            </Field>
            <Field label="Surface totale (m2) *">
              <Input type="number" value={data.total_area} onChange={(e) => onUpdate('total_area', Number(e.target.value))} />
            </Field>
            <Field label="Surface de vente (m2)">
              <Input type="number" value={data.sales_area ?? ''} onChange={(e) => onUpdate('sales_area', e.target.value ? Number(e.target.value) : undefined)} />
            </Field>
            <Field label="Date de signature">
              <Input type="date" value={data.signature_date} onChange={(e) => onUpdate('signature_date', e.target.value)} />
            </Field>
            <Field label="Date d'effet *">
              <Input type="date" value={data.effective_date} onChange={(e) => onUpdate('effective_date', e.target.value)} />
            </Field>
            <Field label="Date d'expiration *">
              <Input type="date" value={data.expiry_date} onChange={(e) => onUpdate('expiry_date', e.target.value)} />
            </Field>
            <Field label="Duree ferme (mois)">
              <Input type="number" value={data.firm_duration} readOnly className="bg-muted" />
            </Field>
          </div>

          <Separator className="my-4" />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <p className="text-sm font-medium">Option de renouvellement</p>
              <Switch checked={data.renewal_option} onCheckedChange={(v) => onUpdate('renewal_option', v)} />
            </div>
            {data.renewal_option && (
              <>
                <Field label="Preavis (mois)">
                  <Input type="number" value={data.notice_period_months ?? ''} onChange={(e) => onUpdate('notice_period_months', e.target.value ? Number(e.target.value) : undefined)} />
                </Field>
                <Field label="Alerte renouvellement (jours)">
                  <Input type="number" value={data.renewal_alert_days ?? 90} onChange={(e) => onUpdate('renewal_alert_days', Number(e.target.value))} />
                </Field>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loyers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Structure des loyers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Loyer mensuel HT (FCFA) *">
              <Input type="number" value={data.monthly_rent_ht} onChange={(e) => onUpdate('monthly_rent_ht', Number(e.target.value))} />
            </Field>
            <Field label="Loyer au m2 (FCFA)">
              <Input type="number" value={data.rent_per_sqm} readOnly className="bg-muted" />
            </Field>
            <Field label="Charges mensuelles HT (FCFA) *">
              <Input type="number" value={data.monthly_charges_ht} onChange={(e) => onUpdate('monthly_charges_ht', Number(e.target.value))} />
            </Field>
            <Field label="Jour d'echeance *">
              <Input type="number" min={1} max={28} value={data.payment_due_day} onChange={(e) => onUpdate('payment_due_day', Number(e.target.value))} />
            </Field>
            <Field label="Periodicite *">
              <Select value={data.periodicity} onValueChange={(v) => onUpdate('periodicity', v as Periodicity)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(PERIODICITY_LABELS) as [Periodicity, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Mode de paiement">
              <Input value={data.payment_method ?? ''} onChange={(e) => onUpdate('payment_method', e.target.value || undefined)} placeholder="Virement, cheque..." />
            </Field>
          </div>

          <Separator className="my-4" />

          {/* Variable rent */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <p className="text-sm font-medium">Loyer variable (% CA)</p>
              <Switch checked={data.has_variable_rent} onCheckedChange={(v) => onUpdate('has_variable_rent', v)} />
            </div>
            {data.has_variable_rent && (
              <>
                <Field label="Taux variable (%)">
                  <Input type="number" value={data.variable_rent_pct ?? ''} onChange={(e) => onUpdate('variable_rent_pct', Number(e.target.value))} />
                </Field>
                <Field label="CA minimum garanti (FCFA)">
                  <Input type="number" value={data.guaranteed_minimum_ca ?? ''} onChange={(e) => onUpdate('guaranteed_minimum_ca', e.target.value ? Number(e.target.value) : undefined)} />
                </Field>
              </>
            )}
          </div>

          <Separator className="my-4" />

          {/* Entry fee */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Pas-de-porte (FCFA)">
              <Input type="number" value={data.entry_fee ?? ''} onChange={(e) => onUpdate('entry_fee', e.target.value ? Number(e.target.value) : undefined)} />
            </Field>
            <Field label="Date encaissement">
              <Input type="date" value={data.entry_fee_date ?? ''} onChange={(e) => onUpdate('entry_fee_date', e.target.value || undefined)} />
            </Field>
          </div>

          <Separator className="my-4" />

          {/* Rent free */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <p className="text-sm font-medium">Franchise de loyer</p>
              <Switch checked={data.has_rent_free} onCheckedChange={(v) => onUpdate('has_rent_free', v)} />
            </div>
            {data.has_rent_free && (
              <>
                <Field label="Duree franchise (mois)">
                  <Input type="number" value={data.rent_free_months ?? ''} onChange={(e) => onUpdate('rent_free_months', Number(e.target.value))} />
                </Field>
                <Field label="Debut franchise">
                  <Input type="date" value={data.rent_free_start ?? ''} onChange={(e) => onUpdate('rent_free_start', e.target.value || undefined)} />
                </Field>
                <Field label="Fin franchise">
                  <Input type="date" value={data.rent_free_end ?? ''} readOnly className="bg-muted" />
                </Field>
                <Field label="Loyer post-franchise (FCFA)">
                  <Input type="number" value={data.post_free_rent ?? ''} onChange={(e) => onUpdate('post_free_rent', e.target.value ? Number(e.target.value) : undefined)} />
                </Field>
              </>
            )}
          </div>

          <Separator className="my-4" />

          {/* VAT */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <p className="text-sm font-medium">TVA applicable</p>
              <Switch checked={data.vat_applicable} onCheckedChange={(v) => onUpdate('vat_applicable', v)} />
            </div>
            {data.vat_applicable && (
              <Field label="Taux TVA (%)">
                <Input type="number" value={data.vat_rate ?? 18} onChange={(e) => onUpdate('vat_rate', Number(e.target.value))} />
              </Field>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Indexation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Indexation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Type d'indexation">
              <Select
                value={data.indexation_type ?? 'none'}
                onValueChange={(v) => onUpdate('indexation_type', v as FullIndexationType)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(INDEXATION_TYPE_LABELS) as [FullIndexationType, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {data.indexation_type && data.indexation_type !== 'none' && (
              <>
                <Field label="Taux (%)">
                  <Input type="number" value={data.indexation_rate ?? ''} onChange={(e) => onUpdate('indexation_rate', Number(e.target.value))} />
                </Field>
                <Field label="Date anniversaire">
                  <Input type="date" value={data.indexation_anniversary ?? ''} onChange={(e) => onUpdate('indexation_anniversary', e.target.value || undefined)} />
                </Field>
                <Field label="Prochain loyer revise (FCFA)">
                  <Input type="number" value={data.next_revised_rent ?? ''} readOnly className="bg-muted" />
                </Field>
                <Field label="Plafond indexation (%)">
                  <Input type="number" value={data.indexation_cap ?? ''} onChange={(e) => onUpdate('indexation_cap', e.target.value ? Number(e.target.value) : undefined)} />
                </Field>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Effort ratio */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Ratio d'effort</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ReadonlyField label="Ratio d'effort actuel" value={data.effort_ratio ? `${data.effort_ratio}%` : '-'} />
            <Field label="Seuil d'alerte (%)">
              <Input type="number" value={data.effort_alert_threshold ?? 15} onChange={(e) => onUpdate('effort_alert_threshold', Number(e.target.value))} />
            </Field>
            {data.effort_ratio && data.effort_alert_threshold && data.effort_ratio > data.effort_alert_threshold && (
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Ratio d'effort eleve</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// TAB 3 - AVENANTS
// =============================================================================

function TabAmendments({ amendments }: { amendments: LeaseAmendment[] }) {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Historique des avenants ({amendments.length})</h3>
        <Button size="sm" variant="outline" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Nouvel avenant
        </Button>
      </div>

      {showAddForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Nouvel avenant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Date de signature"><Input type="date" /></Field>
              <Field label="Date d'effet"><Input type="date" /></Field>
              <Field label="Type de modification"><Input placeholder="Extension, revision loyer..." /></Field>
              <Field label="Nouveau loyer (FCFA)"><Input type="number" /></Field>
              <Field label="Nouvelle surface (m2)"><Input type="number" /></Field>
              <Field label="Nouvelle echeance"><Input type="date" /></Field>
              <Field label="Description" className="sm:col-span-2 lg:col-span-3">
                <Textarea rows={2} placeholder="Description de la modification..." />
              </Field>
              <Field label="Signe par (locataire)"><Input /></Field>
              <Field label="Signe par (bailleur)"><Input /></Field>
              <Field label="Valide par"><Input /></Field>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>Annuler</Button>
              <Button size="sm" onClick={() => setShowAddForm(false)}>Enregistrer avenant</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {amendments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Aucun avenant enregistre pour ce bail.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N</TableHead>
                  <TableHead>Date signature</TableHead>
                  <TableHead>Date effet</TableHead>
                  <TableHead>Modifications</TableHead>
                  <TableHead>Nouveau loyer</TableHead>
                  <TableHead>Nouvelle surface</TableHead>
                  <TableHead>Valide par</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {amendments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.amendment_number}</TableCell>
                    <TableCell>{formatDate(a.signature_date)}</TableCell>
                    <TableCell>{formatDate(a.effective_date)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {a.modification_types.map((t) => (
                          <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{a.new_rent ? formatFCFA(a.new_rent) : '-'}</TableCell>
                    <TableCell>{a.new_area ? `${a.new_area} m2` : '-'}</TableCell>
                    <TableCell>{a.validated_by ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// =============================================================================
// TAB 4 - CA DECLARE
// =============================================================================

function TabDeclaredRevenue({
  revenues,
  hasVariableRent,
}: {
  revenues: DeclaredRevenue[];
  hasVariableRent: boolean;
}) {
  if (!hasVariableRent) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Onglet non applicable : ce bail ne comporte pas de loyer variable.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Chiffre d'affaires declare ({revenues.length} periodes)</h3>
        <Button size="sm" variant="outline">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Ajouter declaration
        </Button>
      </div>

      {/* Placeholder chart area */}
      <Card className="border-dashed">
        <CardContent className="py-6 text-center text-muted-foreground">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Graphique d'evolution du CA (a venir)</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Periode</TableHead>
                <TableHead className="text-right">CA declare (FCFA)</TableHead>
                <TableHead className="text-right">CA verifie (FCFA)</TableHead>
                <TableHead className="text-right">Loyer variable du</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date declaration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revenues.map((r) => (
                <TableRow key={r.period}>
                  <TableCell className="font-medium">{r.period}</TableCell>
                  <TableCell className="text-right">{formatFCFA(r.declared_ca)}</TableCell>
                  <TableCell className="text-right">{r.verified_ca ? formatFCFA(r.verified_ca) : '-'}</TableCell>
                  <TableCell className="text-right">{formatFCFA(r.variable_rent_due)}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === 'verified' ? 'success' : r.status === 'audited' ? 'secondary' : 'warning'}>
                      {DECLARED_STATUS_LABELS[r.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(r.declaration_date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// TAB 5 - COMPORTEMENT
// =============================================================================

function TabBehavior({
  counterparty,
  paymentProfile,
  lease,
  coldStart,
  isLoading,
  onUpdateOverrides,
  installmentPlans,
}: {
  counterparty: Counterparty;
  paymentProfile: any;
  lease: any;
  coldStart: any;
  isLoading: boolean;
  onUpdateOverrides: (o: any) => void;
  installmentPlans: InstallmentPlan[];
}) {
  const [showPlanForm, setShowPlanForm] = useState(false);

  return (
    <div className="space-y-6">
      <PaymentProfileCard
        counterparty={counterparty}
        profile={paymentProfile}
        lease={lease}
        coldStart={coldStart}
        isLoading={isLoading}
        onUpdateOverrides={onUpdateOverrides}
      />

      <Separator />

      {/* Installment Plans */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Plans d'echelonnement</h3>
          <Button size="sm" variant="outline" onClick={() => setShowPlanForm(!showPlanForm)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nouveau plan
          </Button>
        </div>

        {showPlanForm && (
          <Card className="mb-4 border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Nouveau plan d'echelonnement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Date debut"><Input type="date" /></Field>
                <Field label="Date fin"><Input type="date" /></Field>
                <Field label="Dette totale (FCFA)"><Input type="number" /></Field>
                <Field label="Mensualite (FCFA)"><Input type="number" /></Field>
                <Field label="Nombre d'echeances"><Input type="number" /></Field>
                <Field label="Notes" className="sm:col-span-2 lg:col-span-3">
                  <Textarea rows={2} />
                </Field>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => setShowPlanForm(false)}>Annuler</Button>
                <Button size="sm" onClick={() => setShowPlanForm(false)}>Creer plan</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {installmentPlans.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-muted-foreground text-sm">
              Aucun plan d'echelonnement actif.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead className="text-right">Dette totale</TableHead>
                    <TableHead className="text-right">Mensualite</TableHead>
                    <TableHead>Avancement</TableHead>
                    <TableHead className="text-right">Solde restant</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installmentPlans.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.plan_ref}</TableCell>
                      <TableCell>{formatDate(p.start_date)} - {formatDate(p.end_date)}</TableCell>
                      <TableCell className="text-right">{formatFCFA(p.total_debt)}</TableCell>
                      <TableCell className="text-right">{formatFCFA(p.monthly_payment)}</TableCell>
                      <TableCell>{p.paid_installments}/{p.nb_installments}</TableCell>
                      <TableCell className="text-right">{formatFCFA(p.remaining_balance)}</TableCell>
                      <TableCell>
                        <Badge variant={p.status === 'active' ? 'default' : p.status === 'completed' ? 'success' : 'destructive'}>
                          {INSTALLMENT_STATUS_LABELS[p.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// TAB 6 - DEPOTS & GARANTIES
// =============================================================================

function TabDeposits({
  data,
  onUpdate,
}: {
  data: DepositGuarantee | undefined;
  onUpdate: <K extends keyof DepositGuarantee>(key: K, value: DepositGuarantee[K]) => void;
}) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Cash Deposit */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Depot de garantie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Montant recu (FCFA)">
              <Input type="number" value={data.cash_deposit_received ?? ''} onChange={(e) => onUpdate('cash_deposit_received', e.target.value ? Number(e.target.value) : undefined)} />
            </Field>
            <Field label="Date de depot">
              <Input type="date" value={data.deposit_date ?? ''} onChange={(e) => onUpdate('deposit_date', e.target.value || undefined)} />
            </Field>
            <ReadonlyField label="Equivalent mois" value={data.months_equivalent ? `${data.months_equivalent} mois` : '-'} />
            <Field label="Compte de depot">
              <Input value={data.holding_account ?? ''} onChange={(e) => onUpdate('holding_account', e.target.value || undefined)} />
            </Field>
            <Field label="Date restitution prevue">
              <Input type="date" value={data.restitution_date ?? ''} onChange={(e) => onUpdate('restitution_date', e.target.value || undefined)} />
            </Field>
            <Field label="Conditions de restitution" className="sm:col-span-2 lg:col-span-3">
              <Textarea value={data.restitution_conditions ?? ''} onChange={(e) => onUpdate('restitution_conditions', e.target.value || undefined)} rows={2} />
            </Field>
          </div>

          <Separator className="my-4" />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Deduction estimee (FCFA)">
              <Input type="number" value={data.estimated_deduction ?? ''} onChange={(e) => onUpdate('estimated_deduction', e.target.value ? Number(e.target.value) : undefined)} />
            </Field>
            <Field label="Motif deduction">
              <Input value={data.deduction_reason ?? ''} onChange={(e) => onUpdate('deduction_reason', e.target.value || undefined)} />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Entry/Exit Inspections */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Etats des lieux</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Entry */}
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase">Entree</h4>
              <Field label="Date EDL entree">
                <Input type="date" value={data.entry_inspection_date ?? ''} onChange={(e) => onUpdate('entry_inspection_date', e.target.value || undefined)} />
              </Field>
              <Field label="Document">
                <Input value={data.entry_inspection_file ?? ''} onChange={(e) => onUpdate('entry_inspection_file', e.target.value || undefined)} placeholder="Nom du fichier..." />
              </Field>
              <Field label="Observations">
                <Textarea value={data.entry_inspection_notes ?? ''} onChange={(e) => onUpdate('entry_inspection_notes', e.target.value || undefined)} rows={2} />
              </Field>
            </div>
            {/* Exit */}
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase">Sortie</h4>
              <Field label="Date EDL sortie">
                <Input type="date" value={data.exit_inspection_date ?? ''} onChange={(e) => onUpdate('exit_inspection_date', e.target.value || undefined)} />
              </Field>
              <Field label="Document">
                <Input value={data.exit_inspection_file ?? ''} onChange={(e) => onUpdate('exit_inspection_file', e.target.value || undefined)} placeholder="Nom du fichier..." />
              </Field>
              <Field label="Observations">
                <Textarea value={data.exit_inspection_notes ?? ''} onChange={(e) => onUpdate('exit_inspection_notes', e.target.value || undefined)} rows={2} />
              </Field>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <p className="text-sm font-medium">Degradations constatees</p>
              <Switch checked={data.has_damages} onCheckedChange={(v) => onUpdate('has_damages', v)} />
            </div>
            {data.has_damages && (
              <Field label="Deduction degradations (FCFA)">
                <Input type="number" value={data.damage_deduction ?? ''} onChange={(e) => onUpdate('damage_deduction', e.target.value ? Number(e.target.value) : undefined)} />
              </Field>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bank Guarantee */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Garantie bancaire</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <p className="text-sm font-medium">Garantie bancaire active</p>
              <Switch checked={data.has_bank_guarantee} onCheckedChange={(v) => onUpdate('has_bank_guarantee', v)} />
            </div>
          </div>

          {data.has_bank_guarantee && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Reference garantie">
                <Input value={data.guarantee_ref ?? ''} onChange={(e) => onUpdate('guarantee_ref', e.target.value || undefined)} />
              </Field>
              <Field label="Banque garante">
                <Input value={data.guarantor_bank ?? ''} onChange={(e) => onUpdate('guarantor_bank', e.target.value || undefined)} />
              </Field>
              <Field label="Montant garanti (FCFA)">
                <Input type="number" value={data.guarantee_amount ?? ''} onChange={(e) => onUpdate('guarantee_amount', e.target.value ? Number(e.target.value) : undefined)} />
              </Field>
              <Field label="Date d'expiration">
                <Input type="date" value={data.guarantee_expiry ?? ''} onChange={(e) => onUpdate('guarantee_expiry', e.target.value || undefined)} />
              </Field>
              <Field label="Alerte renouvellement (jours)">
                <Input type="number" value={data.guarantee_renewal_alert_days ?? 60} onChange={(e) => onUpdate('guarantee_renewal_alert_days', Number(e.target.value))} />
              </Field>
              <Field label="Document">
                <Input value={data.guarantee_document ?? ''} onChange={(e) => onUpdate('guarantee_document', e.target.value || undefined)} placeholder="Nom du fichier..." />
              </Field>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// TAB 7 - ASSURANCES
// =============================================================================

function TabInsurance({
  data,
  onUpdate,
}: {
  data: TenantInsurance | undefined;
  onUpdate: <K extends keyof TenantInsurance>(key: K, value: TenantInsurance[K]) => void;
}) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* RC Pro */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Responsabilite Civile Professionnelle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <p className="text-sm font-medium">Assurance RC Pro</p>
              <Switch checked={data.has_rc_insurance} onCheckedChange={(v) => onUpdate('has_rc_insurance', v)} />
            </div>
          </div>

          {data.has_rc_insurance && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Compagnie">
                <Input value={data.rc_company ?? ''} onChange={(e) => onUpdate('rc_company', e.target.value || undefined)} />
              </Field>
              <Field label="N police">
                <Input value={data.rc_policy_number ?? ''} onChange={(e) => onUpdate('rc_policy_number', e.target.value || undefined)} />
              </Field>
              <Field label="Date debut">
                <Input type="date" value={data.rc_start_date ?? ''} onChange={(e) => onUpdate('rc_start_date', e.target.value || undefined)} />
              </Field>
              <Field label="Date expiration">
                <Input type="date" value={data.rc_expiry_date ?? ''} onChange={(e) => onUpdate('rc_expiry_date', e.target.value || undefined)} />
              </Field>
              <Field label="Couverture (FCFA)">
                <Input type="number" value={data.rc_coverage ?? ''} onChange={(e) => onUpdate('rc_coverage', e.target.value ? Number(e.target.value) : undefined)} />
              </Field>
              <Field label="Alerte expiration (jours)">
                <Input type="number" value={data.rc_expiry_alert_days ?? 30} onChange={(e) => onUpdate('rc_expiry_alert_days', Number(e.target.value))} />
              </Field>
              <Field label="Attestation">
                <Input value={data.rc_certificate_file ?? ''} onChange={(e) => onUpdate('rc_certificate_file', e.target.value || undefined)} placeholder="Nom du fichier..." />
              </Field>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Multirisque */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Multirisque</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <p className="text-sm font-medium">Assurance Multirisque</p>
              <Switch checked={data.has_multirisque} onCheckedChange={(v) => onUpdate('has_multirisque', v)} />
            </div>
          </div>

          {data.has_multirisque && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Compagnie">
                <Input value={data.mr_company ?? ''} onChange={(e) => onUpdate('mr_company', e.target.value || undefined)} />
              </Field>
              <Field label="N police">
                <Input value={data.mr_policy_number ?? ''} onChange={(e) => onUpdate('mr_policy_number', e.target.value || undefined)} />
              </Field>
              <Field label="Date debut">
                <Input type="date" value={data.mr_start_date ?? ''} onChange={(e) => onUpdate('mr_start_date', e.target.value || undefined)} />
              </Field>
              <Field label="Date expiration">
                <Input type="date" value={data.mr_expiry_date ?? ''} onChange={(e) => onUpdate('mr_expiry_date', e.target.value || undefined)} />
              </Field>
              <Field label="Couverture (FCFA)">
                <Input type="number" value={data.mr_coverage ?? ''} onChange={(e) => onUpdate('mr_coverage', e.target.value ? Number(e.target.value) : undefined)} />
              </Field>
              <Field label="Attestation">
                <Input value={data.mr_certificate_file ?? ''} onChange={(e) => onUpdate('mr_certificate_file', e.target.value || undefined)} placeholder="Nom du fichier..." />
              </Field>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardContent className="pt-4">
          <Field label="Notes assurances">
            <Textarea
              value={data.notes ?? ''}
              onChange={(e) => onUpdate('notes', e.target.value || undefined)}
              rows={3}
              placeholder="Observations sur les assurances du locataire..."
            />
          </Field>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// TAB 8 - TRAVAUX
// =============================================================================

function TabWorks({ works }: { works: TenantWork[] }) {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Travaux locataire ({works.length})</h3>
        <Button size="sm" variant="outline" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Nouvelle demande
        </Button>
      </div>

      {showAddForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Nouvelle demande de travaux</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Date de demande"><Input type="date" /></Field>
              <Field label="Cout estime (FCFA)"><Input type="number" /></Field>
              <Field label="Description" className="sm:col-span-2 lg:col-span-3">
                <Textarea rows={2} placeholder="Nature des travaux demandes..." />
              </Field>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <p className="text-sm font-medium">Remise en etat requise</p>
                <Switch />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>Annuler</Button>
              <Button size="sm" onClick={() => setShowAddForm(false)}>Enregistrer</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {works.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Hammer className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Aucune demande de travaux enregistree.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ref</TableHead>
                  <TableHead>Date demande</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Cout estime</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Remise en etat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {works.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.ref}</TableCell>
                    <TableCell>{formatDate(w.request_date)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{w.description}</TableCell>
                    <TableCell className="text-right">{w.estimated_cost ? formatFCFA(w.estimated_cost) : '-'}</TableCell>
                    <TableCell>
                      <Badge variant={WORK_STATUS_VARIANTS[w.status]}>
                        {WORK_STATUS_LABELS[w.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {w.start_date && <span>Debut: {formatDate(w.start_date)}</span>}
                      {w.actual_end_date && <span className="block">Fin: {formatDate(w.actual_end_date)}</span>}
                    </TableCell>
                    <TableCell>
                      {w.restoration_required ? (
                        <Badge variant="warning">Oui</Badge>
                      ) : (
                        <Badge variant="outline">Non</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// =============================================================================
// TAB 9 - HISTORIQUE
// =============================================================================

function TabHistory({ entries }: { entries: TransactionHistoryEntry[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Historique des transactions ({entries.length})</h3>

      <Card>
        <CardContent className="pt-4">
          {entries.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
              Aucune transaction enregistree.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Montant (FCFA)</TableHead>
                  <TableHead className="text-right">Solde apres</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.slice(0, 30).map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{formatDate(e.date)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">{e.type}</Badge>
                    </TableCell>
                    <TableCell>{e.description}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{e.reference ?? '-'}</TableCell>
                    <TableCell className={`text-right font-medium ${e.amount < 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {e.amount < 0 ? '-' : '+'}{formatFCFA(Math.abs(e.amount))}
                    </TableCell>
                    <TableCell className="text-right">{formatFCFA(e.balance_after)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// TAB 10 - CONTENTIEUX
// =============================================================================

function TabDisputes({ disputes }: { disputes: TenantDispute[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Dossiers contentieux ({disputes.length})</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <ChevronRight className="mr-1.5 h-3.5 w-3.5" />
            Voir module Contentieux
          </Button>
          <Button size="sm" variant="outline">
            <Banknote className="mr-1.5 h-3.5 w-3.5" />
            Generer mise en demeure
          </Button>
        </div>
      </div>

      {disputes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Scale className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Aucun dossier contentieux pour ce locataire.
          </CardContent>
        </Card>
      ) : (
        disputes.map((d) => (
          <Card key={d.id} className="border-destructive/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  {d.ref} - {d.type}
                </CardTitle>
                <Badge variant={d.status === 'open' || d.status === 'in_progress' ? 'destructive' : 'secondary'}>
                  {DISPUTE_STATUS_LABELS[d.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <ReadonlyField label="Date ouverture" value={formatDate(d.opened_date)} />
                <ReadonlyField label="Montant reclame" value={formatFCFA(d.amount_claimed)} />
                <ReadonlyField label="Avocat" value={d.lawyer ?? '-'} />
                <ReadonlyField label="Prochaine audience" value={d.next_hearing_date ? formatDate(d.next_hearing_date) : '-'} />
                {d.resolution_date && <ReadonlyField label="Date resolution" value={formatDate(d.resolution_date)} />}
                {d.resolution_amount != null && <ReadonlyField label="Montant resolution" value={formatFCFA(d.resolution_amount)} />}
              </div>
              <div className="mt-3">
                <p className="text-xs text-muted-foreground">Description</p>
                <p className="text-sm mt-1">{d.description}</p>
              </div>
              {d.notes && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm mt-1">{d.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
