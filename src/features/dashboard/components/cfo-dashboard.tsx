import {
  Landmark,
  AlertCircle,
  FileQuestion,
  Calculator,
  CheckSquare,
  Download,
  Receipt,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { TreasuryLineChart } from '@/components/charts/treasury-line-chart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useCompanyStore } from '@/stores/company.store';
import { useCFODashboard } from '../hooks/use-dashboard';

export function CFODashboard() {
  const currentCompany = useCompanyStore((s) => s.currentCompany);
  const companyId = currentCompany?.id;
  const { data, isLoading } = useCFODashboard(companyId);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[350px] w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

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
        return 'OK';
      case 'warning':
        return 'Attention';
      case 'critical':
        return 'Critique';
    }
  };

  const ratioStatusBadge = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'good':
        return 'success' as const;
      case 'warning':
        return 'warning' as const;
      case 'critical':
        return 'destructive' as const;
    }
  };

  const ratioStatusLabel = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'good':
        return 'Bon';
      case 'warning':
        return 'À surveiller';
      case 'critical':
        return 'Critique';
    }
  };

  // Transform weekly plan data for the TreasuryLineChart
  const weeklyChartData = data.weeklyPlan.map((w) => ({
    date: w.week,
    receipts: w.receipts,
    disbursements: w.disbursements,
    net: w.net,
  }));

  const totalRealBalance = data.bankPositions.reduce((sum, bp) => sum + bp.realBalance, 0);

  return (
    <div className="space-y-6">
      {/* Bank Positions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            Position bancaire
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Total: <span className="font-bold text-foreground"><CurrencyDisplay amount={totalRealBalance} currency="XOF" /></span>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Compte</TableHead>
                <TableHead>Banque</TableHead>
                <TableHead className="text-right">Solde réel</TableHead>
                <TableHead className="text-right">Prévision J+7</TableHead>
                <TableHead className="text-right">Tendance</TableHead>
                <TableHead className="text-right">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.bankPositions.map((bp) => {
                const diff = bp.forecastJ7 - bp.realBalance;
                return (
                  <TableRow key={bp.id}>
                    <TableCell className="font-medium">{bp.accountName}</TableCell>
                    <TableCell>{bp.bankName}</TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay amount={bp.realBalance} currency="XOF" />
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay amount={bp.forecastJ7} currency="XOF" />
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`flex items-center justify-end gap-1 text-sm ${
                        diff >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {diff >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <CurrencyDisplay amount={diff} currency="XOF" />
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={statusBadge(bp.status)}>
                        {statusLabel(bp.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 13-Week Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Plan de trésorerie 13 semaines</CardTitle>
        </CardHeader>
        <CardContent>
          <TreasuryLineChart data={weeklyChartData} height={350} />
        </CardContent>
      </Card>

      {/* Daily Actions Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Flux non identifiés
            </CardTitle>
            <FileQuestion className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.dailyActions.unidentifiedFlows}</div>
            <p className="text-xs text-muted-foreground mt-1">À traiter aujourd'hui</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Arrêtés de caisse manquants
            </CardTitle>
            <Calculator className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.dailyActions.missingCashCounts}</div>
            <p className="text-xs text-muted-foreground mt-1">Caisses sans arrêté</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approbations en attente
            </CardTitle>
            <CheckSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.dailyActions.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground mt-1">Demandes à valider</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Imports bancaires manquants
            </CardTitle>
            <Download className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.dailyActions.missingBankImports}</div>
            <p className="text-xs text-muted-foreground mt-1">Relevés non importés</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* VAT Due */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              TVA à payer ce mois
            </CardTitle>
            <Badge variant={data.vatDue.daysRemaining <= 7 ? 'destructive' : data.vatDue.daysRemaining <= 14 ? 'warning' : 'outline'}>
              {data.vatDue.daysRemaining} jours restants
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              <CurrencyDisplay amount={data.vatDue.amount} currency="XOF" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Date limite : {data.vatDue.deadline}
            </p>
          </CardContent>
        </Card>

        {/* Financial Ratios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Ratios financiers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {data.financialRatios.map((ratio) => (
                <div key={ratio.name} className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{ratio.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xl font-bold">
                      {ratio.value}{ratio.unit !== 'x' ? '' : ''} {ratio.unit}
                    </span>
                    <Badge variant={ratioStatusBadge(ratio.status)} className="text-xs">
                      {ratioStatusLabel(ratio.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
