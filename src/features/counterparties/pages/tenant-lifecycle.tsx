import {
  Bell, UserPlus, DoorOpen, Gift, TrendingUp,
  Send,
  Home,
} from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

// ============================================================================
// MOCK DATA
// ============================================================================

function formatFCFA(amount: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount) + ' FCFA';
}

// Process 1 — Active reminders
const mockReminders = [
  { id: '1', tenant: 'MY PLACE', amount: 24_800_000, step: 3, label: 'Mise en demeure', daysLate: 75, nextAction: 'Avocat si non regle J+15', channel: 'Courrier' },
  { id: '2', tenant: 'MTN Boutique', amount: 3_200_000, step: 2, label: 'Relance formelle', daysLate: 45, nextAction: 'Mise en demeure le 28/03', channel: 'Email + SMS' },
  { id: '3', tenant: 'CARREFOUR Market', amount: 1_800_000, step: 1, label: 'Rappel courtois', daysLate: 18, nextAction: 'Relance 2 le 22/03', channel: 'Email' },
  { id: '4', tenant: 'Kiosque Fleurs', amount: 70_000, step: 1, label: 'Rappel courtois', daysLate: 8, nextAction: 'Relance 2 le 23/03', channel: 'Email' },
];

// Process 2 — Applications
const mockApplications = [
  { id: '1', company: 'SEPHORA CI', sector: 'Cosmetiques', unit: 'A-15', rent: 3_500_000, status: 'evaluation', score: 82, docs: '4/7' },
  { id: '2', company: 'Burger King', sector: 'Restauration', unit: 'C-08', rent: 4_800_000, status: 'accepted', score: 91, docs: '7/7' },
  { id: '3', company: 'Boutique Mode X', sector: 'Mode', unit: 'B-12', rent: 1_200_000, status: 'pending_docs', score: null, docs: '3/7' },
];

// Process 3 — Lease endings
const mockLeaseEndings = [
  { id: '1', tenant: 'Locataire X', unit: 'A-12', scenario: 'non_renewal', endDate: '30/06/2026', checklist: '4/11', status: 'in_progress', deposit: 6_300_000 },
  { id: '2', tenant: 'Jumia CI', unit: 'B-08', scenario: 'judicial_termination', endDate: '15/05/2026', checklist: '2/11', status: 'pending', deposit: 4_500_000 },
];

// Process 5 — Active franchises
const mockFranchises = [
  { id: '1', tenant: 'SEPHORA CI', type: 'Franchise totale', start: '01/04/2026', end: '30/06/2026', rent: '0 FCFA', charges: '350 000 FCFA/mois' },
  { id: '2', tenant: 'Burger King', type: 'Loyer progressif', start: '01/05/2026', end: '31/10/2026', rent: '1 000 000 → 4 800 000', charges: 'Normales' },
];

// Process 6 — Pending revisions
const mockRevisions = [
  { id: '1', tenant: 'ZARA CI', currentRent: 2_100_000, newRent: 2_163_000, rate: '+3.0%', type: 'Taux fixe', date: '01/01/2027', status: 'validated_daf' },
  { id: '2', tenant: 'Orange CI', currentRent: 4_200_000, newRent: 4_326_000, rate: '+3.0%', type: 'Taux fixe', date: '01/01/2027', status: 'calculated' },
  { id: '3', tenant: 'Banque Atlantique', currentRent: 5_500_000, newRent: 5_665_000, rate: '+3.0%', type: 'Taux fixe', date: '01/07/2026', status: 'applied' },
];

// Process 7 — Vacant units
const mockVacants = [
  { id: '1', unit: 'B-04', zone: 'Zone B', surface: 85, vacantSince: '15/01/2026', days: 62, lostRent: 1_890_000, pipeline: true, returnEst: '01/05/2026' },
  { id: '2', unit: 'A-12', zone: 'Zone A', surface: 120, vacantSince: '01/07/2026', days: 0, lostRent: 2_478_000, pipeline: false, returnEst: '01/10/2026' },
];

const stepColors: Record<number, string> = { 1: 'bg-yellow-100 text-yellow-800', 2: 'bg-orange-100 text-orange-800', 3: 'bg-red-100 text-red-800', 4: 'bg-red-200 text-red-900' };
const statusColors: Record<string, string> = {
  evaluation: 'bg-blue-100 text-blue-800', accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800', pending_docs: 'bg-yellow-100 text-yellow-800',
  converted: 'bg-gray-100 text-gray-800',
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function TenantLifecyclePage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <PageHeader
        title="Cycle de vie locataires"
        description="Relances, candidatures, fins de bail, franchises, revisions, locaux vacants"
      />

      {/* KPI Cards */}
      <div className="grid gap-3 md:grid-cols-6">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-lg font-bold">{mockReminders.length}</p>
                <p className="text-[10px] text-muted-foreground">Relances actives</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-lg font-bold">{mockApplications.filter(a => a.status !== 'converted').length}</p>
                <p className="text-[10px] text-muted-foreground">Candidatures</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <DoorOpen className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-lg font-bold">{mockLeaseEndings.length}</p>
                <p className="text-[10px] text-muted-foreground">Fins de bail</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-lg font-bold">{mockFranchises.length}</p>
                <p className="text-[10px] text-muted-foreground">Franchises actives</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-lg font-bold">{mockRevisions.filter(r => r.status !== 'applied').length}</p>
                <p className="text-[10px] text-muted-foreground">Revisions a valider</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-lg font-bold">{mockVacants.length}</p>
                <p className="text-[10px] text-muted-foreground">Locaux vacants</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reminders">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="reminders" className="text-xs"><Bell className="h-3 w-3 mr-1" />Relances</TabsTrigger>
          <TabsTrigger value="applications" className="text-xs"><UserPlus className="h-3 w-3 mr-1" />Candidatures</TabsTrigger>
          <TabsTrigger value="lease-end" className="text-xs"><DoorOpen className="h-3 w-3 mr-1" />Fins bail</TabsTrigger>
          <TabsTrigger value="franchises" className="text-xs"><Gift className="h-3 w-3 mr-1" />Franchises</TabsTrigger>
          <TabsTrigger value="revisions" className="text-xs"><TrendingUp className="h-3 w-3 mr-1" />Revisions</TabsTrigger>
          <TabsTrigger value="vacant" className="text-xs"><Home className="h-3 w-3 mr-1" />Vacants</TabsTrigger>
        </TabsList>

        {/* TAB 1: REMINDERS */}
        <TabsContent value="reminders" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Relances en cours — {formatFCFA(mockReminders.reduce((s, r) => s + r.amount, 0))}</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Locataire</TableHead><TableHead className="text-right">Montant du</TableHead><TableHead className="text-center">Etape</TableHead>
                  <TableHead className="text-center">Retard</TableHead><TableHead>Canal</TableHead><TableHead>Prochaine action</TableHead><TableHead className="text-center">Action</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {mockReminders.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.tenant}</TableCell>
                      <TableCell className="text-right text-red-600 font-medium">{formatFCFA(r.amount)}</TableCell>
                      <TableCell className="text-center"><Badge className={cn('text-[10px]', stepColors[r.step])}>{r.label}</Badge></TableCell>
                      <TableCell className="text-center text-sm">{r.daysLate}j</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.channel}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.nextAction}</TableCell>
                      <TableCell className="text-center"><Button variant="ghost" size="sm"><Send className="h-3.5 w-3.5" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: APPLICATIONS */}
        <TabsContent value="applications" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Candidatures locataires</CardTitle><CardDescription>Evaluation, validation, conversion</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Entreprise</TableHead><TableHead>Secteur</TableHead><TableHead>Local vise</TableHead>
                  <TableHead className="text-right">Loyer propose</TableHead><TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-center">Documents</TableHead><TableHead className="text-center">Statut</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {mockApplications.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.company}</TableCell>
                      <TableCell className="text-sm">{a.sector}</TableCell>
                      <TableCell className="text-sm">{a.unit}</TableCell>
                      <TableCell className="text-right">{formatFCFA(a.rent)}</TableCell>
                      <TableCell className="text-center">{a.score ? <span className={a.score >= 80 ? 'text-green-600 font-medium' : 'text-orange-500'}>{a.score}/100</span> : '—'}</TableCell>
                      <TableCell className="text-center text-sm">{a.docs}</TableCell>
                      <TableCell className="text-center"><Badge className={cn('text-[10px]', statusColors[a.status])}>{a.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: LEASE ENDINGS */}
        <TabsContent value="lease-end" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Fins de bail en cours</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Locataire</TableHead><TableHead>Local</TableHead><TableHead>Scenario</TableHead>
                  <TableHead>Date fin</TableHead><TableHead className="text-center">Checklist</TableHead>
                  <TableHead className="text-right">Depot garantie</TableHead><TableHead className="text-center">Statut</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {mockLeaseEndings.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.tenant}</TableCell>
                      <TableCell>{l.unit}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{l.scenario.replace(/_/g, ' ')}</Badge></TableCell>
                      <TableCell>{l.endDate}</TableCell>
                      <TableCell className="text-center text-sm">{l.checklist}</TableCell>
                      <TableCell className="text-right">{formatFCFA(l.deposit)}</TableCell>
                      <TableCell className="text-center"><Badge variant={l.status === 'completed' ? 'success' : 'secondary'} className="text-[10px]">{l.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: FRANCHISES */}
        <TabsContent value="franchises" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Franchises de loyer actives</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Locataire</TableHead><TableHead>Type</TableHead><TableHead>Debut</TableHead><TableHead>Fin</TableHead>
                  <TableHead>Loyer pendant franchise</TableHead><TableHead>Charges</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {mockFranchises.map(f => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.tenant}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{f.type}</Badge></TableCell>
                      <TableCell>{f.start}</TableCell>
                      <TableCell>{f.end}</TableCell>
                      <TableCell className="font-medium">{f.rent}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{f.charges}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: REVISIONS */}
        <TabsContent value="revisions" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Revisions annuelles de loyer</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Locataire</TableHead><TableHead className="text-right">Loyer actuel</TableHead><TableHead className="text-right">Nouveau loyer</TableHead>
                  <TableHead className="text-center">Variation</TableHead><TableHead>Type</TableHead><TableHead>Date effet</TableHead><TableHead className="text-center">Statut</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {mockRevisions.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.tenant}</TableCell>
                      <TableCell className="text-right">{formatFCFA(r.currentRent)}</TableCell>
                      <TableCell className="text-right font-medium">{formatFCFA(r.newRent)}</TableCell>
                      <TableCell className="text-center text-green-600 font-medium">{r.rate}</TableCell>
                      <TableCell className="text-sm">{r.type}</TableCell>
                      <TableCell>{r.date}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={r.status === 'applied' ? 'success' : r.status === 'validated_daf' ? 'default' : 'secondary'} className="text-[10px]">
                          {r.status === 'applied' ? 'Applique' : r.status === 'validated_daf' ? 'Valide DAF' : 'A valider'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 6: VACANT UNITS */}
        <TabsContent value="vacant" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Locaux vacants</CardTitle>
              <CardDescription>Manque a gagner mensuel : {formatFCFA(mockVacants.reduce((s, v) => s + v.lostRent, 0))}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Local</TableHead><TableHead>Zone</TableHead><TableHead className="text-right">Surface</TableHead>
                  <TableHead>Vacant depuis</TableHead><TableHead className="text-right">Loyer perdu/mois</TableHead>
                  <TableHead className="text-center">Pipeline</TableHead><TableHead>Retour estime</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {mockVacants.map(v => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.unit}</TableCell>
                      <TableCell>{v.zone}</TableCell>
                      <TableCell className="text-right">{v.surface} m²</TableCell>
                      <TableCell>{v.vacantSince} <span className="text-xs text-muted-foreground">({v.days}j)</span></TableCell>
                      <TableCell className="text-right text-red-600 font-medium">{formatFCFA(v.lostRent)}</TableCell>
                      <TableCell className="text-center">{v.pipeline ? <Badge variant="success" className="text-[10px]">Actif</Badge> : <Badge variant="secondary" className="text-[10px]">Non</Badge>}</TableCell>
                      <TableCell>{v.returnEst}</TableCell>
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
