import {
  Receipt,
  HelpCircle,
  Calculator,
  FileWarning,
  ArrowRight,
  CalendarClock,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { useTreasurerDashboard } from '../hooks/use-dashboard';

const iconMap = {
  receipt: Receipt,
  'help-circle': HelpCircle,
  calculator: Calculator,
  'file-warning': FileWarning,
};

export function TreasurerDashboard() {
  const currentCompany = useCompanyStore((s) => s.currentCompany);
  const companyId = currentCompany?.id;
  const { data, isLoading } = useTreasurerDashboard(companyId);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  const iconColor = (key: string) => {
    switch (key) {
      case 'receiptsToMatch':
        return 'bg-blue-100 text-blue-600';
      case 'unidentifiedFlows':
        return 'bg-orange-100 text-orange-600';
      case 'pendingCashCounts':
        return 'bg-purple-100 text-purple-600';
      case 'overdueJustifications':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const isToday = (dateStr: string) => dateStr === '2026-03-19';
  const isTomorrow = (dateStr: string) => dateStr === '2026-03-20';

  return (
    <div className="space-y-6">
      {/* To Process Today */}
      <div>
        <h2 className="text-lg font-semibold mb-4">À traiter aujourd'hui</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {data.toProcess.map((item) => {
            const IconComponent = iconMap[item.icon as keyof typeof iconMap] ?? HelpCircle;
            return (
              <Card key={item.key}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconColor(item.key)}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground truncate">{item.label}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold">{item.count}</span>
                    <Button variant="outline" size="sm" className="gap-1">
                      Traiter
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Next 7 Days Deadlines */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Échéances des 7 prochains jours
          </CardTitle>
          <Badge variant="outline">{data.deadlines.length} échéances</Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Compte bancaire</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.deadlines.map((deadline) => (
                <TableRow key={deadline.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{deadline.date}</span>
                      {isToday(deadline.date) && (
                        <Badge variant="destructive" className="text-xs">Aujourd'hui</Badge>
                      )}
                      {isTomorrow(deadline.date) && (
                        <Badge variant="warning" className="text-xs">Demain</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{deadline.description}</TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold">
                      <CurrencyDisplay amount={deadline.amount} currency="XOF" />
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{deadline.bankAccount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
