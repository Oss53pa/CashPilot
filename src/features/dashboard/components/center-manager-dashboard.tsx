import {
  Users,
  Phone,
  CircleDot,
  CheckCircle2,
  XCircle,
  Minus,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { CategoryPieChart } from '@/components/charts/category-pie-chart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useCompanyStore } from '@/stores/company.store';
import { useCenterManagerDashboard } from '../hooks/use-dashboard';

export function CenterManagerDashboard() {
  const currentCompany = useCompanyStore((s) => s.currentCompany);
  const companyId = currentCompany?.id;
  const { data, isLoading } = useCenterManagerDashboard(companyId);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[300px] w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
    );
  }

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

  const severityLabel = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical':
        return 'Critique';
      case 'warning':
        return 'Retard';
      case 'info':
        return 'Récent';
    }
  };

  const registerStatusIcon = (status: 'open' | 'closed' | 'discrepancy') => {
    switch (status) {
      case 'open':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'closed':
        return <Minus className="h-4 w-4 text-muted-foreground" />;
      case 'discrepancy':
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const registerStatusBadge = (status: 'open' | 'closed' | 'discrepancy') => {
    switch (status) {
      case 'open':
        return 'success' as const;
      case 'closed':
        return 'secondary' as const;
      case 'discrepancy':
        return 'destructive' as const;
    }
  };

  const registerStatusLabel = (status: 'open' | 'closed' | 'discrepancy') => {
    switch (status) {
      case 'open':
        return 'Ouverte';
      case 'closed':
        return 'Fermée';
      case 'discrepancy':
        return 'Écart';
    }
  };

  // Prepare pie chart data
  const { tenantStatus } = data;
  const pieData = [
    { name: 'À jour', value: tenantStatus.upToDate, color: '#22c55e' },
    { name: 'En retard', value: tenantStatus.late, color: '#f59e0b' },
    { name: 'Litige', value: tenantStatus.dispute, color: '#ef4444' },
    { name: 'Vacant', value: tenantStatus.vacant, color: '#a3a3a3' },
  ];

  const pct = (v: number) => ((v / tenantStatus.total) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Daily Follow-ups */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Suivi quotidien - Locataires à contacter
          </CardTitle>
          <Badge variant="outline">{data.followUps.length} locataires</Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Locataire</TableHead>
                <TableHead className="text-right">Montant dû</TableHead>
                <TableHead className="text-right">Jours de retard</TableHead>
                <TableHead>Sévérité</TableHead>
                <TableHead>Dernière action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.followUps.map((followUp) => (
                <TableRow key={followUp.id}>
                  <TableCell className="font-medium">{followUp.name}</TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold text-red-600">
                      <CurrencyDisplay amount={followUp.amountDue} currency="XOF" />
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-medium ${
                      followUp.daysOverdue >= 30 ? 'text-red-600' :
                      followUp.daysOverdue >= 14 ? 'text-orange-600' : 'text-yellow-600'
                    }`}>
                      {followUp.daysOverdue} j
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={severityBadge(followUp.severity)} className="text-xs">
                      {severityLabel(followUp.severity)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {followUp.lastAction}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cash Register Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircleDot className="h-5 w-5" />
              État des caisses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.cashRegisters.map((register) => (
              <div
                key={register.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  {registerStatusIcon(register.status)}
                  <div>
                    <p className="text-sm font-medium">{register.name}</p>
                    <Badge variant={registerStatusBadge(register.status)} className="text-xs mt-0.5">
                      {registerStatusLabel(register.status)}
                    </Badge>
                  </div>
                </div>
                <span className="text-sm font-bold">
                  <CurrencyDisplay amount={register.balance} currency="XOF" />
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tenant Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Répartition locataires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPieChart data={pieData} height={200} />
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="flex items-center gap-2 rounded-lg border p-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">À jour</p>
                  <p className="text-sm font-bold">{tenantStatus.upToDate} ({pct(tenantStatus.upToDate)}%)</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border p-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">En retard</p>
                  <p className="text-sm font-bold">{tenantStatus.late} ({pct(tenantStatus.late)}%)</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border p-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Litige</p>
                  <p className="text-sm font-bold">{tenantStatus.dispute} ({pct(tenantStatus.dispute)}%)</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border p-2">
                <div className="h-3 w-3 rounded-full bg-neutral-400" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Vacant</p>
                  <p className="text-sm font-bold">{tenantStatus.vacant} ({pct(tenantStatus.vacant)}%)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
