import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarClock, ArrowRight, RotateCw } from 'lucide-react';
import type { LeaseContract, IndexationHistoryEntry, IndexationType } from '../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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

interface RentIndexationProps {
  lease: LeaseContract;
  history: IndexationHistoryEntry[];
  isLoadingHistory?: boolean;
  onApplyIndexation?: (leaseId: string) => void;
  isApplying?: boolean;
}

function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal' }).format(amount) + ' FCFA';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const INDEXATION_TYPE_LABELS: Record<IndexationType, string> = {
  fixed_rate: 'Fixed Rate',
  external_index: 'External Index (IRL/ICC)',
  contractual_step: 'Contractual Step',
  manual: 'Manual Adjustment',
};

const INDEXATION_TYPE_DESCRIPTIONS: Record<IndexationType, string> = {
  fixed_rate: 'Annual increase at a pre-defined fixed percentage',
  external_index: 'Indexed on an external reference (IRL, ICC, BCEAO rate)',
  contractual_step: 'Step increases defined in the lease schedule',
  manual: 'Manually determined by landlord / property manager',
};

export function RentIndexation({
  lease,
  history,
  isLoadingHistory,
  onApplyIndexation,
  isApplying,
}: RentIndexationProps) {
  const { t } = useTranslation('counterparties');
  const [selectedType, setSelectedType] = useState<IndexationType>(lease.indexation_type);

  // Projected next rent after indexation
  const projectedRent = Math.round(lease.monthly_rent_ht * (1 + lease.indexation_rate / 100));

  // Sort history by date descending
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.applied_date).getTime() - new Date(a.applied_date).getTime()
  );

  return (
    <div className="space-y-4">
      {/* Current Lease Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            {t('indexation.lease_details', 'Lease & Indexation Details')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">{t('indexation.reference', 'Reference')}</p>
              <p className="font-medium">{lease.lease_reference}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('indexation.current_rent', 'Current Rent HT')}</p>
              <p className="font-medium">{formatFCFA(lease.monthly_rent_ht)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('indexation.period', 'Lease Period')}</p>
              <p className="font-medium">
                {formatDate(lease.start_date)} - {lease.end_date ? formatDate(lease.end_date) : 'Indefinite'}
              </p>
            </div>
          </div>

          {/* Indexation type selector */}
          <div className="mt-4 rounded-lg border p-4">
            <label className="text-sm font-medium">
              {t('indexation.type', 'Indexation Type')}
            </label>
            <Select
              value={selectedType}
              onValueChange={(val) => setSelectedType(val as IndexationType)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(INDEXATION_TYPE_LABELS) as [IndexationType, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              {INDEXATION_TYPE_DESCRIPTIONS[selectedType]}
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">{t('indexation.rate', 'Current Rate')}</p>
                <p className="font-medium">{lease.indexation_rate}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('indexation.last_applied', 'Last Applied')}</p>
                <p className="font-medium">{formatDate(lease.indexation_date)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Indexation Preview */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {t('indexation.next_preview', 'Next Indexation Preview')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('indexation.next_date', 'Next Date')}</p>
              <Badge variant="outline" className="mt-1">{formatDate(lease.next_indexation_date)}</Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">{t('indexation.current', 'Current')}</p>
                <p className="font-medium">{formatFCFA(lease.monthly_rent_ht)}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground">{t('indexation.projected', 'Projected')}</p>
                <p className="font-medium text-blue-700">{formatFCFA(projectedRent)}</p>
              </div>
              <Badge variant="secondary" className="ml-2">
                +{lease.indexation_rate}%
              </Badge>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              size="sm"
              onClick={() => onApplyIndexation?.(lease.id)}
              disabled={isApplying}
            >
              <RotateCw className={`mr-2 h-4 w-4 ${isApplying ? 'animate-spin' : ''}`} />
              {isApplying
                ? t('indexation.applying', 'Applying...')
                : t('indexation.apply', 'Apply Indexation')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Indexation History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {t('indexation.history', 'Indexation History')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {t('indexation.loading', 'Loading history...')}
            </p>
          ) : sortedHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {t('indexation.no_history', 'No indexation history available yet.')}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('indexation.date', 'Date')}</TableHead>
                  <TableHead className="text-right">{t('indexation.old_amount', 'Old Rent HT')}</TableHead>
                  <TableHead className="text-right">{t('indexation.new_amount', 'New Rent HT')}</TableHead>
                  <TableHead className="text-right">{t('indexation.rate_applied', 'Rate Applied')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedHistory.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{formatDate(entry.applied_date)}</TableCell>
                    <TableCell className="text-right">{formatFCFA(entry.old_rent_ht)}</TableCell>
                    <TableCell className="text-right font-medium">{formatFCFA(entry.new_rent_ht)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">+{entry.rate_applied}%</Badge>
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
}
