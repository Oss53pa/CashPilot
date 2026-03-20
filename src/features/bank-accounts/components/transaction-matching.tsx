import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Check,
  X,
  Plus,
  Link,
  ChevronDown,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { CurrencyDisplay } from '@/components/shared/currency-display';

import { useBankTransactions, useConfirmMatch } from '../hooks/use-bank-accounts';
import type { BankTransaction, MatchType } from '../types';

interface TransactionMatchingProps {
  statementId: string;
  currency?: string;
}

const MATCH_TYPE_LABELS: Record<MatchType, string> = {
  exact_ref: 'Exact Reference',
  exact_amount_counterparty: 'Amount + Counterparty',
  amount_date_range: 'Amount + Date Range',
  approx_amount_counterparty: 'Approx. Amount + Counterparty',
  manual: 'Manual Match',
};

const MATCH_LEVEL_ORDER: MatchType[] = [
  'exact_ref',
  'exact_amount_counterparty',
  'amount_date_range',
  'approx_amount_counterparty',
  'manual',
];

function getMatchLevel(confidence: number): MatchType {
  if (confidence >= 0.95) return 'exact_ref';
  if (confidence >= 0.75) return 'exact_amount_counterparty';
  if (confidence >= 0.6) return 'amount_date_range';
  if (confidence > 0) return 'approx_amount_counterparty';
  return 'manual';
}

function MatchStatusIcon({ status }: { status: BankTransaction['match_status'] }) {
  switch (status) {
    case 'matched':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'probable':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'unmatched':
      return <XCircle className="h-4 w-4 text-red-500" />;
  }
}

function MatchStatusBadge({ status }: { status: BankTransaction['match_status'] }) {
  const variant =
    status === 'matched'
      ? 'success'
      : status === 'probable'
        ? 'default'
        : 'destructive';

  return (
    <Badge variant={variant as 'default' | 'destructive'}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color =
    pct >= 90
      ? 'bg-green-500'
      : pct >= 70
        ? 'bg-yellow-500'
        : pct >= 50
          ? 'bg-orange-500'
          : 'bg-red-500';

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">{pct}%</span>
    </div>
  );
}

export function TransactionMatching({
  statementId,
  currency = 'XOF',
}: TransactionMatchingProps) {
  const { t } = useTranslation();
  const { data: transactions = [] } = useBankTransactions(statementId);
  const confirmMatch = useConfirmMatch();

  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const matched = transactions.filter((t) => t.match_status === 'matched');
  const probable = transactions.filter(
    (t) => t.match_status === 'probable' && !confirmedIds.has(t.id) && !rejectedIds.has(t.id),
  );
  const unmatched = transactions.filter(
    (t) => t.match_status === 'unmatched' || rejectedIds.has(t.id),
  );
  const newlyConfirmed = transactions.filter((t) => confirmedIds.has(t.id));

  const handleConfirm = (txn: BankTransaction) => {
    if (txn.matched_flow_id) {
      confirmMatch.mutate({ transactionId: txn.id, flowId: txn.matched_flow_id });
    }
    setConfirmedIds((prev) => new Set(prev).add(txn.id));
  };

  const handleReject = (txn: BankTransaction) => {
    setRejectedIds((prev) => new Set(prev).add(txn.id));
  };

  const handleConfirmAll = () => {
    probable.forEach((txn) => {
      if (txn.matched_flow_id) {
        confirmMatch.mutate({ transactionId: txn.id, flowId: txn.matched_flow_id });
      }
    });
    setConfirmedIds((prev) => {
      const next = new Set(prev);
      probable.forEach((t) => next.add(t.id));
      return next;
    });
  };

  const renderTransactionRow = (txn: BankTransaction, showActions: boolean) => {
    const matchLevel = getMatchLevel(txn.match_confidence);
    const isExpanded = expandedRow === txn.id;

    return (
      <Collapsible key={txn.id} open={isExpanded} onOpenChange={() => setExpandedRow(isExpanded ? null : txn.id)}>
        <TableRow className="cursor-pointer hover:bg-muted/50">
          <TableCell>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1.5">
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
                <span className="text-sm">
                  {new Date(txn.date).toLocaleDateString('fr-FR')}
                </span>
              </button>
            </CollapsibleTrigger>
          </TableCell>
          <TableCell className="text-sm max-w-[180px] truncate">
            {txn.description}
          </TableCell>
          <TableCell className="text-sm">{txn.counterparty_name}</TableCell>
          <TableCell className="text-sm font-mono">{txn.reference}</TableCell>
          <TableCell className="text-right">
            <CurrencyDisplay amount={txn.amount} currency={currency} colorize />
          </TableCell>
          <TableCell>
            <MatchStatusIcon status={confirmedIds.has(txn.id) ? 'matched' : txn.match_status} />
          </TableCell>
          <TableCell>
            {txn.match_confidence > 0 && <ConfidenceBar confidence={txn.match_confidence} />}
          </TableCell>
          <TableCell>
            {showActions && txn.match_status === 'probable' && !confirmedIds.has(txn.id) && !rejectedIds.has(txn.id) && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
                  onClick={(e) => { e.stopPropagation(); handleConfirm(txn); }}
                  title="Confirm match"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                  onClick={(e) => { e.stopPropagation(); handleReject(txn); }}
                  title="Reject match"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {txn.match_status === 'unmatched' && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={(e) => e.stopPropagation()}
                  title="Create new flow"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Flow
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={(e) => e.stopPropagation()}
                  title="Manual match"
                >
                  <Link className="h-3 w-3 mr-1" />
                  Match
                </Button>
              </div>
            )}
          </TableCell>
        </TableRow>
        <CollapsibleContent asChild>
          <TableRow className="bg-muted/30">
            <TableCell colSpan={8} className="p-3">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Value date: </span>
                  {new Date(txn.value_date).toLocaleDateString('fr-FR')}
                </div>
                <div>
                  <span className="text-muted-foreground">Match level: </span>
                  {txn.match_confidence > 0
                    ? MATCH_TYPE_LABELS[matchLevel]
                    : 'N/A'}
                </div>
                <div>
                  <span className="text-muted-foreground">Matching algorithm: </span>
                  {txn.match_confidence > 0 && (
                    <span className="inline-flex gap-1 ml-1">
                      {MATCH_LEVEL_ORDER.map((level, idx) => (
                        <span
                          key={level}
                          className={`inline-block w-3 h-3 rounded-sm ${
                            idx <= MATCH_LEVEL_ORDER.indexOf(matchLevel)
                              ? 'bg-primary'
                              : 'bg-muted'
                          }`}
                          title={MATCH_TYPE_LABELS[level]}
                        />
                      ))}
                    </span>
                  )}
                </div>
                {txn.matched_flow_id && (
                  <div className="col-span-3">
                    <span className="text-muted-foreground">Matched flow: </span>
                    <span className="font-mono text-xs">{txn.matched_flow_id}</span>
                  </div>
                )}
              </div>
            </TableCell>
          </TableRow>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Matched</span>
            </div>
            <p className="text-xl font-bold mt-1">{matched.length + newlyConfirmed.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Probable</span>
            </div>
            <p className="text-xl font-bold mt-1">{probable.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Unmatched</span>
            </div>
            <p className="text-xl font-bold mt-1">{unmatched.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="text-xl font-bold mt-1">{transactions.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Batch actions */}
      {probable.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-lg border bg-yellow-50/50 dark:bg-yellow-950/10">
          <p className="text-sm">
            <strong>{probable.length}</strong> probable matches awaiting review
          </p>
          <Button size="sm" onClick={handleConfirmAll}>
            <Check className="h-3 w-3 mr-1" />
            Confirm All Probable
          </Button>
        </div>
      )}

      {/* Transactions table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {t('bankAccounts.transactionList', 'Transactions')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Counterparty</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[40px]">Status</TableHead>
                  <TableHead className="w-[100px]">Confidence</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((txn) =>
                  renderTransactionRow(txn, true),
                )}
                {transactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {t('bankAccounts.noTransactions', 'No transactions to display')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
