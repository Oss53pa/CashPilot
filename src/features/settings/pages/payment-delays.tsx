import { useState, useMemo } from 'react';
import {
  Clock, Settings, Users, Calendar, History, ChevronRight,
  AlertTriangle, Brain, Lock, Unlock, Search,
} from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

// ============================================================================
// MOCK DATA
// ============================================================================

// Tab 1 — Global defaults
const defaultTenantDelays = {
  due_day: 1,
  tolerance_days: 5,
  second_reminder_days: 15,
  formal_notice_days: 30,
  litigation_days: 60,
  dispute_days: 90,
  late_interest_rate: 6,
  imputation_rule: 'fifo' as const,
  default_probability: 90,
};

const defaultSupplierDelays = {
  payment_delay_days: 30,
  calc_base: 'invoice_receipt' as const,
  invoice_receipt_days: 8,
  fixed_payment_day: null as number | null,
  early_discount: false,
  discount_rate: 0,
  discount_delay_days: 0,
};

const fixedDates = [
  { flux: 'Salaires', day: 25, frequency: 'Mensuel' },
  { flux: 'Charges sociales CNPS', day: 30, frequency: 'Mensuel' },
  { flux: 'TVA mensuelle', day: 15, frequency: 'Mensuel (M+1)' },
  { flux: 'Acomptes IS', day: 15, frequency: 'Trimestriel (mars/juin/sept/dec)' },
  { flux: 'Patente', day: 31, frequency: 'Annuel (mars)' },
  { flux: 'Taxe fonciere', day: 0, frequency: 'A parametrer' },
  { flux: 'Remboursements emprunts', day: 0, frequency: 'Selon tableau amortissement' },
];

// Tab 2 — Category defaults
const supplierCategories = [
  { category: 'Maintenance — Contrats fixes', receipt: 8, delay: 30, base: 'Reception facture', fixedDay: null, discount: false },
  { category: 'Maintenance — Curatif', receipt: 5, delay: 15, base: 'Reception facture', fixedDay: null, discount: false },
  { category: 'Energie (CIE, SODECI)', receipt: 10, delay: 20, base: 'Reception facture', fixedDay: null, discount: false },
  { category: 'Securite & Gardiennage', receipt: 8, delay: 30, base: 'Fin de mois', fixedDay: null, discount: false },
  { category: 'Nettoyage & Hygiene', receipt: 8, delay: 30, base: 'Fin de mois', fixedDay: null, discount: false },
  { category: 'Assurances', receipt: 0, delay: 0, base: 'Date prime', fixedDay: null, discount: false },
  { category: 'Honoraires & Conseil', receipt: 5, delay: 30, base: 'Reception facture', fixedDay: null, discount: true },
  { category: 'CAPEX — Situations travaux', receipt: 3, delay: 10, base: 'Reception + PV', fixedDay: null, discount: false },
];

const tenantCategories = [
  { category: 'Ancre (enseigne internationale)', delay: 3, probability: 98, relance: 'Standard' },
  { category: 'Grande enseigne nationale', delay: 7, probability: 95, relance: 'Standard' },
  { category: 'PME locale', delay: 12, probability: 88, relance: 'Acceleree' },
  { category: 'Restauration', delay: 15, probability: 85, relance: 'Acceleree' },
  { category: 'Kiosque / Petit commerce', delay: 5, probability: 92, relance: 'Standard' },
  { category: 'Nouveau locataire (< 3 mois)', delay: 10, probability: 80, relance: 'Renforcee' },
];

// Tab 3 — Consolidated view
type DelaySource = 'proph3t' | 'manual' | 'category' | 'default' | 'contentieux';

interface ConsolidatedTenant {
  name: string;
  rent: number;
  contractual: string;
  proph3tDelay: number | null;
  forcedDelay: number | null;
  appliedDelay: string;
  source: DelaySource;
  probability: number;
  score: number | null;
}

const consolidatedTenants: ConsolidatedTenant[] = [
  { name: 'ZARA CI', rent: 2_100_000, contractual: 'J+0', proph3tDelay: 11, forcedDelay: null, appliedDelay: 'J+11', source: 'proph3t', probability: 94, score: 87 },
  { name: 'Banque Atlantique', rent: 5_500_000, contractual: 'J+0', proph3tDelay: 3, forcedDelay: null, appliedDelay: 'J+3', source: 'proph3t', probability: 98, score: 94 },
  { name: 'CARREFOUR Market', rent: 3_800_000, contractual: 'J+0', proph3tDelay: 8, forcedDelay: null, appliedDelay: 'J+8', source: 'proph3t', probability: 92, score: 78 },
  { name: 'MTN Boutique', rent: 1_800_000, contractual: 'J+0', proph3tDelay: 22, forcedDelay: null, appliedDelay: 'J+22', source: 'proph3t', probability: 71, score: 61 },
  { name: 'MY PLACE', rent: 8_267_000, contractual: 'J+0', proph3tDelay: null, forcedDelay: null, appliedDelay: 'Contentieux', source: 'contentieux', probability: 0, score: 12 },
  { name: 'Orange CI', rent: 4_200_000, contractual: 'J+0', proph3tDelay: null, forcedDelay: 7, appliedDelay: 'J+7', source: 'manual', probability: 85, score: null },
  { name: 'Total Energies', rent: 2_800_000, contractual: 'J+0', proph3tDelay: 5, forcedDelay: null, appliedDelay: 'J+5', source: 'proph3t', probability: 96, score: 86 },
  { name: 'Nouveau locataire E', rent: 2_000_000, contractual: 'J+0', proph3tDelay: null, forcedDelay: null, appliedDelay: 'J+10', source: 'category', probability: 80, score: null },
];

// Tab 5 — Audit history
const auditHistory = [
  { date: '18/03/2026 14:32', user: 'Pamela (DGA)', type: 'Delai force locataire', counterparty: 'Orange CI', old: 'Proph3t J+15', new: 'Force J+7', reason: 'Accord verbal de paiement rapide' },
  { date: '15/03/2026 09:15', user: 'Aniela (DAF)', type: 'Delai categorie', counterparty: 'Honoraires & Conseil', old: '45j', new: '30j', reason: 'Renegociation conditions generales' },
  { date: '10/03/2026 11:00', user: 'Systeme (Proph3t)', type: 'Recalibrage auto', counterparty: 'MTN Boutique', old: 'J+18', new: 'J+22', reason: 'Degradation observee sur 3 mois' },
  { date: '05/03/2026 06:00', user: 'Systeme (Proph3t)', type: 'Recalibrage auto', counterparty: 'ZARA CI', old: 'J+12', new: 'J+11', reason: 'Amelioration comportement paiement' },
  { date: '01/03/2026 10:30', user: 'Aniela (DAF)', type: 'Delai global', counterparty: '—', old: 'Tolerance: 7j', new: 'Tolerance: 5j', reason: 'Politique de recouvrement plus stricte' },
];

const sourceConfig: Record<DelaySource, { label: string; color: string }> = {
  proph3t: { label: 'Proph3t', color: 'bg-blue-100 text-blue-800' },
  manual: { label: 'Manuel', color: 'bg-yellow-100 text-yellow-800' },
  category: { label: 'Categorie', color: 'bg-gray-100 text-gray-800' },
  default: { label: 'Defaut', color: 'bg-gray-50 text-gray-600' },
  contentieux: { label: 'Contentieux', color: 'bg-red-100 text-red-800' },
};

function formatFCFA(amount: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount) + ' FCFA';
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function PaymentDelaysPage() {
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const filteredTenants = useMemo(() => {
    let result = consolidatedTenants;
    if (search) result = result.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
    if (sourceFilter !== 'all') result = result.filter(t => t.source === sourceFilter);
    return result;
  }, [search, sourceFilter]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <PageHeader
        title="Parametrage des delais de paiement"
        description="Hierarchie a 4 niveaux : Defauts → Categories → Contreparties → Proph3t"
      />

      <Tabs defaultValue="defaults">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="defaults" className="text-xs"><Settings className="h-3 w-3 mr-1" />Defauts</TabsTrigger>
          <TabsTrigger value="categories" className="text-xs"><Users className="h-3 w-3 mr-1" />Categories</TabsTrigger>
          <TabsTrigger value="consolidated" className="text-xs"><Clock className="h-3 w-3 mr-1" />Vue consolidee</TabsTrigger>
          <TabsTrigger value="calendar" className="text-xs"><Calendar className="h-3 w-3 mr-1" />Calendrier</TabsTrigger>
          <TabsTrigger value="history" className="text-xs"><History className="h-3 w-3 mr-1" />Historique</TabsTrigger>
        </TabsList>

        {/* ============ TAB 1: DEFAULTS ============ */}
        <TabsContent value="defaults" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Delais cote encaissements (Locataires)</CardTitle>
              <CardDescription>Valeurs par defaut pour toute nouvelle contrepartie</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Jour d'echeance *</Label>
                  <Input type="number" defaultValue={defaultTenantDelays.due_day} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tolerance avant 1ere relance *</Label>
                  <Input type="number" defaultValue={defaultTenantDelays.tolerance_days} className="h-8 text-sm" />
                  <span className="text-[10px] text-muted-foreground">jours</span>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Delai 2eme relance *</Label>
                  <Input type="number" defaultValue={defaultTenantDelays.second_reminder_days} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Delai mise en demeure *</Label>
                  <Input type="number" defaultValue={defaultTenantDelays.formal_notice_days} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Delai statut litigieux *</Label>
                  <Input type="number" defaultValue={defaultTenantDelays.litigation_days} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Delai statut contentieux *</Label>
                  <Input type="number" defaultValue={defaultTenantDelays.dispute_days} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Taux interet retard</Label>
                  <Input type="number" step="0.5" defaultValue={defaultTenantDelays.late_interest_rate} className="h-8 text-sm" />
                  <span className="text-[10px] text-muted-foreground">% / an</span>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Regle imputation *</Label>
                  <Select defaultValue={defaultTenantDelays.imputation_rule}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fifo">FIFO</SelectItem>
                      <SelectItem value="lifo">LIFO</SelectItem>
                      <SelectItem value="prorata">Prorata</SelectItem>
                      <SelectItem value="manual">Manuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Probabilite encaissement</Label>
                  <Input type="number" defaultValue={defaultTenantDelays.default_probability} className="h-8 text-sm" />
                  <span className="text-[10px] text-muted-foreground">%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Delais cote decaissements (Fournisseurs)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Delai paiement standard *</Label>
                  <Input type="number" defaultValue={defaultSupplierDelays.payment_delay_days} className="h-8 text-sm" />
                  <span className="text-[10px] text-muted-foreground">jours</span>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Base de calcul *</Label>
                  <Select defaultValue={defaultSupplierDelays.calc_base}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="invoice_receipt">Reception facture</SelectItem>
                      <SelectItem value="end_of_month">Fin de mois</SelectItem>
                      <SelectItem value="service_date">Date de service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Delai reception factures *</Label>
                  <Input type="number" defaultValue={defaultSupplierDelays.invoice_receipt_days} className="h-8 text-sm" />
                  <span className="text-[10px] text-muted-foreground">jours</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Dates fixes (salaires, taxes, etc.)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flux</TableHead>
                    <TableHead>Jour du mois</TableHead>
                    <TableHead>Frequence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fixedDates.map((f, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-sm">{f.flux}</TableCell>
                      <TableCell><Input type="number" defaultValue={f.day || ''} className="h-7 w-16 text-xs" /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{f.frequency}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Button>Enregistrer les modifications</Button>
        </TabsContent>

        {/* ============ TAB 2: CATEGORIES ============ */}
        <TabsContent value="categories" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Categories fournisseurs</CardTitle>
              <CardDescription>Surchargent les delais par defaut pour une categorie</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categorie</TableHead>
                    <TableHead className="text-center">Reception facture</TableHead>
                    <TableHead className="text-center">Delai paiement</TableHead>
                    <TableHead>Base calcul</TableHead>
                    <TableHead className="text-center">Escompte</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplierCategories.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-sm">{c.category}</TableCell>
                      <TableCell className="text-center">{c.receipt > 0 ? `${c.receipt}j` : '—'}</TableCell>
                      <TableCell className="text-center">{c.delay > 0 ? `${c.delay}j` : '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.base}</TableCell>
                      <TableCell className="text-center">{c.discount ? <Badge variant="outline" className="text-[10px]">2% / 10j</Badge> : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Categories locataires</CardTitle>
              <CardDescription>Utilisees pour le cold start des nouveaux locataires</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categorie</TableHead>
                    <TableHead className="text-center">Delai observe moyen</TableHead>
                    <TableHead className="text-center">Probabilite</TableHead>
                    <TableHead>Regle relance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenantCategories.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-sm">{c.category}</TableCell>
                      <TableCell className="text-center">J+{c.delay}</TableCell>
                      <TableCell className="text-center">{c.probability}%</TableCell>
                      <TableCell>
                        <Badge variant={c.relance === 'Standard' ? 'secondary' : c.relance === 'Acceleree' ? 'warning' : 'destructive'} className="text-[10px]">
                          {c.relance}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ TAB 3: CONSOLIDATED VIEW ============ */}
        <TabsContent value="consolidated" className="space-y-4 mt-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
            </div>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes sources</SelectItem>
                <SelectItem value="proph3t">Proph3t</SelectItem>
                <SelectItem value="manual">Manuel</SelectItem>
                <SelectItem value="category">Categorie</SelectItem>
                <SelectItem value="contentieux">Contentieux</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Locataires — Delais appliques</CardTitle>
            </CardHeader>
            <CardContent className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Locataire</TableHead>
                    <TableHead className="text-right">Loyer</TableHead>
                    <TableHead className="text-center">Echeance</TableHead>
                    <TableHead className="text-center">Delai Proph3t</TableHead>
                    <TableHead className="text-center">Force</TableHead>
                    <TableHead className="text-center">Applique</TableHead>
                    <TableHead className="text-center">Source</TableHead>
                    <TableHead className="text-center">Probabilite</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map((t, i) => {
                    const src = sourceConfig[t.source];
                    return (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-sm">{t.name}</TableCell>
                        <TableCell className="text-right text-sm">{formatFCFA(t.rent)}</TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">{t.contractual}</TableCell>
                        <TableCell className="text-center text-sm">
                          {t.proph3tDelay !== null ? (
                            <span className="flex items-center justify-center gap-1">
                              <Brain className="h-3 w-3 text-blue-500" />J+{t.proph3tDelay}
                            </span>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {t.forcedDelay !== null ? (
                            <span className="flex items-center justify-center gap-1">
                              <Lock className="h-3 w-3 text-yellow-600" />J+{t.forcedDelay}
                            </span>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="text-center font-bold text-sm">{t.appliedDelay}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn('text-[10px]', src.color)}>{src.label}</Badge>
                        </TableCell>
                        <TableCell className={cn('text-center text-sm font-medium', t.probability < 80 ? 'text-red-600' : t.probability < 90 ? 'text-orange-500' : 'text-green-600')}>
                          {t.probability}%
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {t.score !== null ? (
                            <span className={cn('font-medium', t.score < 50 ? 'text-red-600' : t.score < 70 ? 'text-orange-500' : 'text-green-600')}>
                              {t.score}/100
                            </span>
                          ) : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ TAB 4: CALENDAR ============ */}
        <TabsContent value="calendar" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Calendrier des paiements — Mars / Avril 2026</CardTitle>
              <CardDescription>Flux attendus avec date probable et certitude</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date prevue</TableHead>
                    <TableHead>Flux</TableHead>
                    <TableHead>Contrepartie</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-center">Certitude</TableHead>
                    <TableHead>Compte</TableHead>
                    <TableHead className="text-center">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { date: '20/03', flux: 'Decaissement', cp: 'Prestataire Securite', amount: -4_200_000, cert: 'Certain', account: 'SGBCI', status: 'Programme' },
                    { date: '22/03', flux: 'Encaissement', cp: 'ZARA CI', amount: 2_478_000, cert: '94%', account: 'BICICI', status: 'Attendu' },
                    { date: '25/03', flux: 'Decaissement', cp: 'Salaires', amount: -28_400_000, cert: 'Certain', account: 'SGBCI', status: 'Programme' },
                    { date: '31/03', flux: 'Decaissement', cp: 'SODECI Eau', amount: -1_100_000, cert: 'Quasi-certain', account: 'SGBCI', status: 'Attendu' },
                    { date: '01/04', flux: 'Encaissement', cp: 'Banque Atlantique', amount: 5_500_000, cert: '98%', account: 'BICICI', status: 'Attendu' },
                    { date: '15/04', flux: 'Decaissement', cp: 'TVA mars', amount: -7_200_000, cert: 'Certain', account: 'SGBCI', status: 'Programme' },
                    { date: '15/04', flux: 'Decaissement', cp: 'CAPEX Entrepreneur', amount: -28_000_000, cert: 'Certain', account: 'ECOBANK', status: 'Provision insuffisante' },
                  ].map((f, i) => (
                    <TableRow key={i} className={f.status === 'Provision insuffisante' ? 'bg-red-50' : ''}>
                      <TableCell className="font-medium text-sm">{f.date}</TableCell>
                      <TableCell className="text-sm">{f.flux}</TableCell>
                      <TableCell className="text-sm">{f.cp}</TableCell>
                      <TableCell className={cn('text-right text-sm font-medium', f.amount > 0 ? 'text-green-600' : 'text-red-600')}>
                        {formatFCFA(f.amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={f.cert === 'Certain' ? 'default' : f.cert === 'Quasi-certain' ? 'secondary' : 'outline'} className="text-[10px]">
                          {f.cert}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{f.account}</TableCell>
                      <TableCell className="text-center">
                        {f.status === 'Provision insuffisante' ? (
                          <Badge variant="destructive" className="text-[10px]"><AlertTriangle className="h-3 w-3 mr-1" />{f.status}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">{f.status}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ TAB 5: HISTORY ============ */}
        <TabsContent value="history" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Historique des modifications</CardTitle>
              <CardDescription>Piste d'audit de tous les changements de delais</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Contrepartie</TableHead>
                    <TableHead>Ancienne valeur</TableHead>
                    <TableHead>Nouvelle valeur</TableHead>
                    <TableHead>Motif</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditHistory.map((h, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{h.date}</TableCell>
                      <TableCell className="text-sm">
                        {h.user.includes('Proph3t') ? (
                          <span className="flex items-center gap-1"><Brain className="h-3 w-3 text-blue-500" />{h.user}</span>
                        ) : h.user}
                      </TableCell>
                      <TableCell className="text-sm">{h.type}</TableCell>
                      <TableCell className="text-sm font-medium">{h.counterparty}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{h.old}</TableCell>
                      <TableCell className="text-sm font-medium">{h.new}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{h.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
