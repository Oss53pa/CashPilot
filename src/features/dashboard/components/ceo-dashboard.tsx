import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  AlertTriangle,
  Bell,
  Users,
  CheckCircle2,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useCompanyStore } from '@/stores/company.store';
import { useCEODashboard } from '../hooks/use-dashboard';

export function CEODashboard() {
  const currentCompany = useCompanyStore((s) => s.currentCompany);
  const tenantId = currentCompany?.tenant_id;
  const { data, isLoading } = useCEODashboard(tenantId);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-36" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  const severityColor = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'info':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
  };

  const severityBadge = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical':
        return 'destructive' as const;
      case 'warning':
        return 'warning' as const;
      case 'info':
        return 'secondary' as const;
    }
  };

  const statusBadge = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy':
        return 'success' as const;
      case 'warning':
        return 'warning' as const;
      case 'critical':
        return 'destructive' as const;
    }
  };

  const statusLabel = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy':
        return 'Sain';
      case 'warning':
        return 'Attention';
      case 'critical':
        return 'Critique';
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Trésorerie consolidée (réelle)
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={data.consolidatedPosition} currency="XOF" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Prévision J+30
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={data.forecastJ30} currency="XOF" />
            </div>
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +5,3% vs position actuelle
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Prévision J+90
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={data.forecastJ90} currency="XOF" />
            </div>
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +19,2% vs position actuelle
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertes actives
          </CardTitle>
          <Badge variant="outline">{data.alerts.length}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start gap-3 rounded-lg border p-3 ${severityColor(alert.severity)}`}
            >
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{alert.title}</p>
                  <Badge variant={severityBadge(alert.severity)} className="text-xs">
                    {alert.severity === 'critical' ? 'Critique' : alert.severity === 'warning' ? 'Attention' : 'Info'}
                  </Badge>
                </div>
                <p className="text-xs mt-1 opacity-80">{alert.message}</p>
              </div>
              <span className="text-xs opacity-60 flex-shrink-0">{alert.date}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Budget vs Actual */}
      <Card>
        <CardHeader>
          <CardTitle>Budget vs Réalisé - Mars 2026</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Catégorie</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-right">Réalisé</TableHead>
                <TableHead className="text-right">Écart</TableHead>
                <TableHead className="text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.budgetVsActual.map((item) => (
                <TableRow key={item.category}>
                  <TableCell className="font-medium">{item.category}</TableCell>
                  <TableCell>
                    <Badge variant={item.type === 'revenue' ? 'success' : 'secondary'} className="text-xs">
                      {item.type === 'revenue' ? 'Recette' : 'Dépense'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={item.budget} currency="XOF" />
                  </TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={item.actual} currency="XOF" />
                  </TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={item.variance} currency="XOF" colorize />
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`flex items-center justify-end gap-1 text-sm font-medium ${
                      item.variancePercent > 0 ? 'text-green-600' : item.variancePercent < 0 ? 'text-red-600' : 'text-muted-foreground'
                    }`}>
                      {item.variancePercent > 0 ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : item.variancePercent < 0 ? (
                        <ArrowDownRight className="h-3 w-3" />
                      ) : null}
                      {item.variancePercent > 0 ? '+' : ''}{item.variancePercent.toFixed(1)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top 3 Delinquent Tenants */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Locataires délinquants
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.delinquentTenants.map((tenant) => (
              <div
                key={tenant.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{tenant.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {tenant.daysOverdue} jours de retard
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-red-600">
                    <CurrencyDisplay amount={tenant.amountDue} currency="XOF" />
                  </span>
                  <Badge variant={severityBadge(tenant.severity)} className="text-xs">
                    {tenant.severity === 'critical' ? 'Critique' : tenant.severity === 'warning' ? 'Retard' : 'Nouveau'}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Approbations en attente
            </CardTitle>
            <Badge variant="outline">{data.pendingApprovals.length}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.pendingApprovals.map((approval) => {
              const priorityBadge = (p: string) => {
                switch (p) {
                  case 'urgent': return 'destructive' as const;
                  case 'high': return 'warning' as const;
                  case 'medium': return 'secondary' as const;
                  default: return 'outline' as const;
                }
              };
              return (
                <div
                  key={approval.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{approval.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Par {approval.requestedBy} - {approval.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-bold">
                      <CurrencyDisplay amount={approval.amount} currency="XOF" />
                    </span>
                    <Badge variant={priorityBadge(approval.priority)} className="text-xs capitalize">
                      {approval.priority === 'urgent' ? 'Urgent' : approval.priority === 'high' ? 'Haute' : approval.priority === 'medium' ? 'Moyenne' : 'Basse'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Per-entity Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Position par entité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entité</TableHead>
                <TableHead className="text-right">Position</TableHead>
                <TableHead className="text-right">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.entityBreakdown.map((entity) => (
                <TableRow key={entity.id}>
                  <TableCell className="font-medium">{entity.companyName}</TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={entity.position} currency="XOF" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={statusBadge(entity.status)}>
                      {statusLabel(entity.status)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
