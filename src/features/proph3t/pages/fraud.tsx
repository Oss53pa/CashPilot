import { useState, useMemo } from 'react';
import {
  Shield, ShieldAlert, ShieldCheck, ShieldOff, Eye, Search as SearchIcon,
  AlertTriangle, CheckCircle, XCircle, Clock,
} from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FraudType = 'duplicate_payment' | 'unusual_amount' | 'unauthorized_vendor' | 'timing_anomaly' | 'round_amount';
type FraudSeverity = 'critical' | 'high' | 'medium';
type FraudStatus = 'detected' | 'investigating' | 'confirmed' | 'dismissed';

interface FraudAlert {
  id: string;
  date: string;
  type: FraudType;
  description: string;
  amount: number;
  severity: FraudSeverity;
  status: FraudStatus;
  evidence: string[];
  recommendedActions: string[];
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const typeLabels: Record<FraudType, string> = {
  duplicate_payment: 'Doublon de paiement',
  unusual_amount: 'Montant inhabituel',
  unauthorized_vendor: 'Fournisseur non autorise',
  timing_anomaly: 'Anomalie horaire',
  round_amount: 'Montant rond suspect',
};

const severityConfig: Record<FraudSeverity, { label: string; cls: string; badgeCls: string }> = {
  critical: { label: 'Critique', cls: 'text-red-600', badgeCls: 'bg-red-600 text-white' },
  high: { label: 'Haute', cls: 'text-orange-500', badgeCls: 'bg-orange-500 text-white' },
  medium: { label: 'Moyenne', cls: 'text-yellow-600', badgeCls: 'bg-yellow-500 text-white' },
};

const statusConfig: Record<FraudStatus, { label: string; variant: 'destructive' | 'default' | 'secondary' | 'outline' }> = {
  detected: { label: 'Detectee', variant: 'destructive' },
  investigating: { label: 'En investigation', variant: 'default' },
  confirmed: { label: 'Confirmee', variant: 'destructive' },
  dismissed: { label: 'Rejetee', variant: 'outline' },
};

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const initialAlerts: FraudAlert[] = [
  {
    id: '1', date: '20/03/2026 14:22', type: 'duplicate_payment', severity: 'critical', status: 'detected',
    description: 'Doublon detecte: virement de 8 500 000 FCFA a SAHAM Assurance identique au paiement du 13/03/2026 (meme montant, meme beneficiaire, meme reference)',
    amount: 8_500_000,
    evidence: [
      'Transaction #TXN-2026-0412: 8 500 000 FCFA le 13/03/2026 a SAHAM Assurance',
      'Transaction #TXN-2026-0487: 8 500 000 FCFA le 20/03/2026 a SAHAM Assurance',
      'Reference facture identique: FAC-SAH-2026-0089',
      'Emis par le meme utilisateur (K. Ouattara)',
    ],
    recommendedActions: ['Bloquer immediatement le second virement', 'Verifier avec le fournisseur si deux factures distinctes existent', 'Auditer l\'historique des paiements a SAHAM sur 6 mois'],
  },
  {
    id: '2', date: '19/03/2026 23:47', type: 'timing_anomaly', severity: 'critical', status: 'investigating',
    description: 'Transaction de 25 000 000 FCFA initiee a 23h47 depuis le compte SGBCI Exploitation vers un compte externe. Hors plage horaire autorisee (08h-18h).',
    amount: 25_000_000,
    evidence: [
      'Heure de la transaction: 23h47 (plage autorisee: 08h00-18h00)',
      'Compte beneficiaire: CI08 XXXX XXXX 4521 (nouveau beneficiaire, jamais utilise)',
      'Initie par: acces API (token #TK-882)',
      'Adresse IP source: 41.207.xxx.xxx (Abidjan, mais VPN detecte)',
    ],
    recommendedActions: ['Geler le compte beneficiaire immediatement', 'Revoquer le token API #TK-882', 'Contacter le responsable IT pour analyse des logs', 'Signaler a la Banque pour rappel de fonds si non encore credite'],
  },
  {
    id: '3', date: '18/03/2026 11:05', type: 'unusual_amount', severity: 'high', status: 'detected',
    description: 'Paiement fournisseur BATIREX SARL de 45 200 000 FCFA. Montant 3.2x superieur a la moyenne historique des paiements a ce fournisseur (14 100 000 FCFA).',
    amount: 45_200_000,
    evidence: [
      'Moyenne paiements BATIREX (12 derniers mois): 14 100 000 FCFA',
      'Ecart-type: 3 200 000 FCFA',
      'Le montant est a 9.7 ecarts-types de la moyenne',
      'Bon de commande associe: BC-2026-0234 (signe par M. Diallo)',
    ],
    recommendedActions: ['Verifier le bon de commande BC-2026-0234 et obtenir validation de la direction', 'Comparer avec le contrat cadre BATIREX', 'Demander une facture detaillee avant reglement'],
  },
  {
    id: '4', date: '17/03/2026 09:30', type: 'unauthorized_vendor', severity: 'high', status: 'detected',
    description: 'Ordre de paiement de 12 000 000 FCFA au profit de GLOBAL SERVICES INTL (non reference dans la base fournisseurs approuves).',
    amount: 12_000_000,
    evidence: [
      'Fournisseur GLOBAL SERVICES INTL: absent de la base fournisseurs',
      'RIB fourni: compte recemment ouvert (janvier 2026)',
      'Pas de contrat ni de bon de commande en base',
      'Demande initiee par: S. Traore (niveau autorisation insuffisant pour ce montant)',
    ],
    recommendedActions: ['Suspendre l\'ordre de paiement', 'Verifier l\'identite et l\'existence legale de GLOBAL SERVICES INTL', 'Exiger un contrat signe et un bon de commande valide', 'Verifier les autorisations de S. Traore'],
  },
  {
    id: '5', date: '16/03/2026 15:20', type: 'round_amount', severity: 'medium', status: 'dismissed',
    description: 'Serie de 4 virements de 5 000 000 FCFA chacun (total: 20 000 000 FCFA) en 15 minutes vers 4 comptes differents. Pattern de fractionnement potentiel.',
    amount: 20_000_000,
    evidence: [
      '15h05 - 5 000 000 FCFA vers CI08-XXX-1234',
      '15h08 - 5 000 000 FCFA vers CI08-XXX-5678',
      '15h12 - 5 000 000 FCFA vers CI08-XXX-9012',
      '15h20 - 5 000 000 FCFA vers CI08-XXX-3456',
      'Seuil d\'autorisation simple: < 10 000 000 FCFA',
    ],
    recommendedActions: ['Verifier si les 4 beneficiaires sont lies', 'Croiser avec les bons de commande', 'Alerter le responsable conformite'],
  },
  {
    id: '6', date: '15/03/2026 10:15', type: 'duplicate_payment', severity: 'medium', status: 'confirmed',
    description: 'Double paiement salaire employe #EMP-0234 (A. Kone) pour le mois de fevrier 2026. Montant: 1 850 000 FCFA x 2.',
    amount: 1_850_000,
    evidence: [
      'Virement paie du 28/02/2026: 1 850 000 FCFA',
      'Virement complementaire du 15/03/2026: 1 850 000 FCFA (libelle "Regularisation fevrier")',
      'Aucune note de regularisation en base RH',
    ],
    recommendedActions: ['Contacter l\'employe pour recuperation du trop-percu', 'Verifier le processus de paie complementaire', 'Mettre a jour le controle des doublons'],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFCFA(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' FCFA';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Fraud() {
  const [alerts, setAlerts] = useState<FraudAlert[]>(initialAlerts);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return alerts;
    return alerts.filter((a) => a.status === statusFilter);
  }, [alerts, statusFilter]);

  const stats = useMemo(() => ({
    total: alerts.length,
    confirmed: alerts.filter((a) => a.status === 'confirmed').length,
    investigating: alerts.filter((a) => a.status === 'investigating').length,
    dismissed: alerts.filter((a) => a.status === 'dismissed').length,
  }), [alerts]);

  const handleStatusChange = (id: string, newStatus: FraudStatus) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, status: newStatus } : a));
    setSelectedAlert(null);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <PageHeader title="Detection de Fraude" description="Detection temps reel des patterns de fraude par le moteur IA" />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total alertes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fraudes confirmees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="text-2xl font-bold text-red-600">{stats.confirmed}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En investigation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold text-orange-500">{stats.investigating}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Faux positifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{stats.dismissed}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="detected">Detectees</SelectItem>
            <SelectItem value="investigating">En investigation</SelectItem>
            <SelectItem value="confirmed">Confirmees</SelectItem>
            <SelectItem value="dismissed">Rejetees</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Fraud Alert Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Description</th>
                  <th className="text-right px-4 py-3 font-medium">Montant</th>
                  <th className="text-center px-4 py-3 font-medium">Severite</th>
                  <th className="text-center px-4 py-3 font-medium">Statut</th>
                  <th className="text-center px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((alert) => {
                  const sev = severityConfig[alert.severity];
                  const st = statusConfig[alert.status];
                  return (
                    <tr key={alert.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{alert.date}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">{typeLabels[alert.type]}</Badge>
                      </td>
                      <td className="px-4 py-3 max-w-[350px]">
                        <p className="text-sm truncate">{alert.description}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-medium whitespace-nowrap">{formatFCFA(alert.amount)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${sev.badgeCls}`}>
                          {sev.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedAlert(alert)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={(open) => { if (!open) setSelectedAlert(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedAlert && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {typeLabels[selectedAlert.type]}
                </DialogTitle>
                <DialogDescription>{selectedAlert.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${severityConfig[selectedAlert.severity].badgeCls}`}>
                    {severityConfig[selectedAlert.severity].label}
                  </span>
                  <Badge variant={statusConfig[selectedAlert.status].variant}>
                    {statusConfig[selectedAlert.status].label}
                  </Badge>
                  <span className="text-sm font-bold">{formatFCFA(selectedAlert.amount)}</span>
                  <span className="text-xs text-muted-foreground">{selectedAlert.date}</span>
                </div>

                {/* Evidence */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Elements de preuve</h4>
                  <div className="space-y-1.5">
                    {selectedAlert.evidence.map((e, i) => (
                      <div key={i} className="flex items-start gap-2 bg-muted/50 rounded px-3 py-2 text-sm">
                        <AlertTriangle className="h-4 w-4 mt-0.5 text-orange-500 shrink-0" />
                        {e}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Actions */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Actions recommandees</h4>
                  <div className="space-y-1.5">
                    {selectedAlert.recommendedActions.map((a, i) => (
                      <div key={i} className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/20 rounded px-3 py-2 text-sm">
                        <CheckCircle className="h-4 w-4 mt-0.5 text-blue-600 shrink-0" />
                        {a}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter className="flex gap-2">
                {selectedAlert.status === 'detected' && (
                  <Button variant="outline" onClick={() => handleStatusChange(selectedAlert.id, 'investigating')}>
                    <Eye className="mr-1.5 h-4 w-4" />
                    Investiguer
                  </Button>
                )}
                {(selectedAlert.status === 'detected' || selectedAlert.status === 'investigating') && (
                  <>
                    <Button variant="outline" onClick={() => handleStatusChange(selectedAlert.id, 'dismissed')}>
                      <ShieldCheck className="mr-1.5 h-4 w-4" />
                      Faux positif
                    </Button>
                    <Button variant="destructive" onClick={() => handleStatusChange(selectedAlert.id, 'confirmed')}>
                      <XCircle className="mr-1.5 h-4 w-4" />
                      Confirmer fraude
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
