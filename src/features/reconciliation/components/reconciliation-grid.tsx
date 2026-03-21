import { useState } from 'react';
import { Lock, ChevronDown } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CurrencyDisplay } from '@/components/shared/currency-display';
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

import type { ReconciliationItem, ReconciliationItemStatus } from '../types';
import { ItemWorkspace } from './item-workspace';

interface ReconciliationGridProps {
  items: ReconciliationItem[];
  currentUserId: string;
  onLock: (itemId: string) => void;
  onUnlock: (itemId: string) => void;
  onProposeMatch: (itemId: string, data: { flow_id: string; flow_label: string; match_type: string; confidence: number; notes?: string }) => void;
  onValidateProposal: (itemId: string) => void;
  onRejectProposal: (itemId: string, reason: string) => void;
  onResolve: (itemId: string, action: string, notes?: string) => void;
  onSkip: (itemId: string, reason?: string) => void;
  onAddComment: (itemId: string, content: string) => void;
}

type FilterTab = 'all' | ReconciliationItemStatus;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'pending', label: 'En attente' },
  { key: 'in_progress', label: 'En cours' },
  { key: 'proposed', label: 'Proposé' },
  { key: 'validated', label: 'Résolu' },
];

const STATUS_BADGE: Record<ReconciliationItemStatus, { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' | 'warning' | 'outline' }> = {
  pending: { label: 'En attente', variant: 'secondary' },
  in_progress: { label: 'En cours', variant: 'default' },
  proposed: { label: 'Proposé', variant: 'warning' },
  validated: { label: 'Validé', variant: 'success' },
  rejected: { label: 'Rejeté', variant: 'destructive' },
  skipped: { label: 'Ignoré', variant: 'outline' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function ReconciliationGrid({
  items,
  currentUserId,
  onLock,
  onUnlock,
  onProposeMatch,
  onValidateProposal,
  onRejectProposal,
  onResolve,
  onSkip,
  onAddComment,
}: ReconciliationGridProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const filteredItems = activeFilter === 'all'
    ? items
    : activeFilter === 'validated'
      ? items.filter((i) => i.status === 'validated' || i.status === 'rejected' || i.status === 'skipped')
      : items.filter((i) => i.status === activeFilter);

  const counts: Record<FilterTab, number> = {
    all: items.length,
    pending: items.filter((i) => i.status === 'pending').length,
    in_progress: items.filter((i) => i.status === 'in_progress').length,
    proposed: items.filter((i) => i.status === 'proposed').length,
    validated: items.filter((i) => ['validated', 'rejected', 'skipped'].includes(i.status)).length,
    rejected: 0,
    skipped: 0,
  };

  const handleRowClick = (item: ReconciliationItem) => {
    if (expandedItem === item.id) {
      setExpandedItem(null);
      if (item.locked_by === currentUserId) {
        onUnlock(item.id);
      }
    } else {
      setExpandedItem(item.id);
      if (!item.locked_by && item.status !== 'validated' && item.status !== 'rejected' && item.status !== 'skipped') {
        onLock(item.id);
      }
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Transactions à réconcilier</CardTitle>
          <span className="text-sm text-muted-foreground">
            {filteredItems.length} élément{filteredItems.length > 1 ? 's' : ''}
          </span>
        </div>
        {/* Filter tabs */}
        <div className="flex gap-1 mt-2">
          {FILTER_TABS.map((tab) => (
            <Button
              key={tab.key}
              variant={activeFilter === tab.key ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setActiveFilter(tab.key)}
            >
              {tab.label}
              <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                {counts[tab.key]}
              </Badge>
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]" />
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead className="text-right w-[140px]">Montant</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Contrepartie</TableHead>
                <TableHead className="w-[100px]">Statut</TableHead>
                <TableHead className="w-[140px]">Verrou</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => {
                const isExpanded = expandedItem === item.id;
                const isLockedByMe = item.locked_by === currentUserId;
                const isLockedByOther = item.locked_by && item.locked_by !== currentUserId;
                const statusConfig = STATUS_BADGE[item.status];

                return (
                  <Collapsible
                    key={item.id}
                    open={isExpanded}
                    onOpenChange={() => handleRowClick(item)}
                  >
                    <TableRow
                      className={`cursor-pointer transition-colors ${
                        isLockedByMe
                          ? 'bg-primary/5 hover:bg-primary/10'
                          : isLockedByOther
                            ? 'bg-muted/30'
                            : 'hover:bg-muted/50'
                      }`}
                    >
                      <TableCell>
                        <CollapsibleTrigger asChild>
                          <button className="p-1">
                            <ChevronDown
                              className={`h-3.5 w-3.5 transition-transform text-muted-foreground ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                        </CollapsibleTrigger>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(item.date)}</TableCell>
                      <TableCell className="text-right">
                        <CurrencyDisplay amount={item.amount} currency="XOF" colorize />
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">
                        {item.description}
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.counterparty ?? <span className="text-muted-foreground italic">Non identifié</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig.variant as 'default' | 'secondary' | 'destructive' | 'outline'}>
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isLockedByOther && (
                          <div className="flex items-center gap-1.5">
                            <Lock className="h-3 w-3" style={{ color: getParticipantColor(item.locked_by_name) }} />
                            <span
                              className="text-xs font-medium"
                              style={{ color: getParticipantColor(item.locked_by_name) }}
                            >
                              En cours — {item.locked_by_name}
                            </span>
                          </div>
                        )}
                        {isLockedByMe && (
                          <div className="flex items-center gap-1.5">
                            <Lock className="h-3 w-3 text-primary" />
                            <span className="text-xs font-medium text-primary">
                              Votre verrou
                            </span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                    <CollapsibleContent asChild>
                      <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableCell colSpan={7} className="p-0">
                          <ItemWorkspace
                            item={item}
                            currentUserId={currentUserId}
                            onProposeMatch={(data) => onProposeMatch(item.id, data)}
                            onValidateProposal={() => onValidateProposal(item.id)}
                            onRejectProposal={(reason) => onRejectProposal(item.id, reason)}
                            onResolve={(action, notes) => onResolve(item.id, action, notes)}
                            onSkip={(reason) => onSkip(item.id, reason)}
                            onAddComment={(content) => onAddComment(item.id, content)}
                          />
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
              {filteredItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucun élément dans cette catégorie
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function getParticipantColor(name?: string): string {
  switch (name) {
    case 'Aniela': return '#6366f1';
    case 'Koné': return '#f59e0b';
    case 'Fatou': return '#10b981';
    default: return '#6b7280';
  }
}
