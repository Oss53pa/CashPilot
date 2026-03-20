import { useState, useMemo } from 'react';
import {
  AlertTriangle, Bell, CheckCircle, Clock, Eye, XCircle,
  Shield, CreditCard, TrendingUp, Droplets, Users, Building,
} from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// ---------------------------------------------------------------------------
// Types & Config
// ---------------------------------------------------------------------------

type Severity = 'critical' | 'high' | 'medium' | 'low';
type Status = 'active' | 'acknowledged' | 'resolved';

interface MockAlert {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  module: string;
  recommendedAction: string;
  timestamp: string;
  status: Status;
}

const severityStyles: Record<Severity, { label: string; border: string; badgeCls: string; icon: string }> = {
  critical: { label: 'Critique', border: 'border-l-4 border-l-red-600', badgeCls: 'bg-red-600 text-white', icon: 'text-red-600' },
  high: { label: 'Haute', border: 'border-l-4 border-l-orange-500', badgeCls: 'bg-orange-500 text-white', icon: 'text-orange-500' },
  medium: { label: 'Moyenne', border: 'border-l-4 border-l-yellow-500', badgeCls: 'bg-yellow-500 text-white', icon: 'text-yellow-600' },
  low: { label: 'Basse', border: 'border-l-4 border-l-gray-400', badgeCls: 'bg-gray-400 text-white', icon: 'text-gray-400' },
};

const statusStyles: Record<Status, { label: string; variant: 'destructive' | 'default' | 'secondary' }> = {
  active: { label: 'Active', variant: 'destructive' },
  acknowledged: { label: 'Acquittee', variant: 'default' },
  resolved: { label: 'Resolue', variant: 'secondary' },
};

const moduleIcons: Record<string, React.ElementType> = {
  Liquidite: Droplets,
  Creances: Users,
  Comptes: Building,
  Fiscal: CreditCard,
  Investissement: TrendingUp,
  Fraude: Shield,
};

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const initialAlerts: MockAlert[] = [
  {
    id: '1', severity: 'critical', status: 'active',
    title: 'Deficit prevu compte ECOBANK CAPEX dans 15 jours',
    description: 'Le solde previsionnel du compte ECOBANK CAPEX passera sous zero le 04/04/2026. Deficit estime: -45 200 000 FCFA. Probabilite: 94%.',
    module: 'Liquidite',
    recommendedAction: 'Transferer 50 000 000 FCFA depuis le compte SGBCI Exploitation ou negocier un tirage sur la ligne de credit revolving.',
    timestamp: '20 mars 2026, 08:15',
  },
  {
    id: '2', severity: 'critical', status: 'active',
    title: 'Echeance fiscale TVA dans 5 jours',
    description: 'La declaration et le reglement de la TVA (periode fevrier 2026) sont dus le 25/03/2026. Montant estime: 32 800 000 FCFA.',
    module: 'Fiscal',
    recommendedAction: 'Verifier la provision TVA sur le compte dedie et preparer l\'ordre de virement DGI.',
    timestamp: '20 mars 2026, 07:00',
  },
  {
    id: '3', severity: 'high', status: 'active',
    title: 'Taux de recouvrement en baisse de 8%',
    description: 'Le taux de recouvrement global est passe de 89% a 81% sur les 4 dernieres semaines. Principaux retardataires: CARREFOUR Market (-12j), MTN Boutique (-18j).',
    module: 'Creances',
    recommendedAction: 'Envoyer des relances automatiques aux locataires en retard et planifier un appel avec CARREFOUR Market.',
    timestamp: '19 mars 2026, 14:30',
  },
  {
    id: '4', severity: 'high', status: 'active',
    title: 'Desequilibre inter-comptes detecte',
    description: 'Le compte SIB Exploitation presente un excedent de 120 000 000 FCFA tandis que le compte ECOBANK CAPEX est en tension. Recommandation de nivellement.',
    module: 'Comptes',
    recommendedAction: 'Effectuer un virement interne de 60 000 000 FCFA vers le compte ECOBANK CAPEX.',
    timestamp: '19 mars 2026, 10:00',
  },
  {
    id: '5', severity: 'medium', status: 'acknowledged',
    title: 'Excedent placable detecte: 85 000 000 FCFA',
    description: 'Le solde consolide depasse le seuil de securite de 40 jours d\'exploitation. Un excedent de 85 000 000 FCFA peut etre place en DAT.',
    module: 'Investissement',
    recommendedAction: 'Placer 80 000 000 FCFA en DAT 3 mois a 5.25% aupres de la Banque Atlantique.',
    timestamp: '18 mars 2026, 16:45',
  },
  {
    id: '6', severity: 'medium', status: 'active',
    title: 'Score locataire JUMIA CI en chute critique',
    description: 'Le score comportemental de JUMIA CI est passe de 68 a 42 en 4 semaines. Risque d\'impaye eleve sur les 3 prochains mois.',
    module: 'Creances',
    recommendedAction: 'Contacter le responsable JUMIA CI pour negocier un echeancier et renforcer les garanties.',
    timestamp: '18 mars 2026, 11:20',
  },
  {
    id: '7', severity: 'low', status: 'resolved',
    title: 'Variation saisonniere charges sociales',
    description: 'Augmentation prevue de 12% des charges sociales en avril (primes annuelles). Pattern conforme a l\'historique.',
    module: 'Liquidite',
    recommendedAction: 'Aucune action requise - variation anticipee dans le budget.',
    timestamp: '17 mars 2026, 09:00',
  },
  {
    id: '8', severity: 'low', status: 'active',
    title: 'Covenant ratio dette/EBITDA a surveiller',
    description: 'Le ratio dette nette / EBITDA est a 2.8x, proche du seuil covenant de 3.0x. Tendance stable.',
    module: 'Liquidite',
    recommendedAction: 'Surveiller mensuellement et preparer un plan de reduction si le ratio depasse 2.9x.',
    timestamp: '16 mars 2026, 15:00',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Alerts() {
  const [alerts, setAlerts] = useState<MockAlert[]>(initialAlerts);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = alerts;
    if (severityFilter !== 'all') result = result.filter((a) => a.severity === severityFilter);
    if (statusFilter !== 'all') result = result.filter((a) => a.status === statusFilter);
    return result;
  }, [alerts, severityFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: alerts.length,
    critical: alerts.filter((a) => a.severity === 'critical').length,
    high: alerts.filter((a) => a.severity === 'high').length,
    medium: alerts.filter((a) => a.severity === 'medium').length,
    low: alerts.filter((a) => a.severity === 'low').length,
  }), [alerts]);

  const handleAcknowledge = (id: string) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, status: 'acknowledged' as Status } : a));
  };

  const handleResolve = (id: string) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, status: 'resolved' as Status } : a));
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <PageHeader title="Alertes Predictives" description="Alertes generees automatiquement par le moteur IA" />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total alertes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critiques</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-red-600">{stats.critical}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hautes</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-orange-500">{stats.high}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Moyennes</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-yellow-600">{stats.medium}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Basses</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-gray-400">{stats.low}</span>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Severite" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes severites</SelectItem>
            <SelectItem value="critical">Critique</SelectItem>
            <SelectItem value="high">Haute</SelectItem>
            <SelectItem value="medium">Moyenne</SelectItem>
            <SelectItem value="low">Basse</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="active">Actives</SelectItem>
            <SelectItem value="acknowledged">Acquittees</SelectItem>
            <SelectItem value="resolved">Resolues</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {filtered.map((alert) => {
          const sev = severityStyles[alert.severity];
          const st = statusStyles[alert.status];
          const IconComp = moduleIcons[alert.module] || AlertTriangle;
          const isExpanded = expandedId === alert.id;

          return (
            <Card
              key={alert.id}
              className={`cursor-pointer transition-shadow hover:shadow-md ${sev.border}`}
              onClick={() => setExpandedId(isExpanded ? null : alert.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <IconComp className={`h-5 w-5 shrink-0 mt-0.5 ${sev.icon}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${sev.badgeCls}`}>
                        {sev.label}
                      </span>
                      <Badge variant={st.variant}>{st.label}</Badge>
                      <span className="text-xs text-muted-foreground">{alert.module}</span>
                    </div>
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>

                    {isExpanded && (
                      <div className="mt-3 space-y-3">
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-xs font-medium mb-1">Action recommandee</p>
                          <p className="text-sm">{alert.recommendedAction}</p>
                        </div>
                        <div className="flex gap-2">
                          {alert.status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); handleAcknowledge(alert.id); }}
                            >
                              <Eye className="mr-1.5 h-3.5 w-3.5" />
                              Acquitter
                            </Button>
                          )}
                          {alert.status !== 'resolved' && (
                            <Button
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleResolve(alert.id); }}
                            >
                              <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                              Resoudre
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground whitespace-nowrap">{alert.timestamp}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Aucune alerte ne correspond aux filtres selectionnes.</p>
          </div>
        )}
      </div>
    </div>
  );
}
