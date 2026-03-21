import { useState } from 'react';
import {
  X,
  MessageSquare,
  Flag,
  AlertTriangle,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAnnotationsForEntity,
} from '../hooks/use-annotations';
import { AnnotationThread } from './annotation-thread';
import { AnnotationComposer } from './annotation-composer';
import type { EntityType } from '../types';

interface AnnotationPanelProps {
  entityType: EntityType;
  entityId: string;
  entityLabel?: string;
  open: boolean;
  onClose: () => void;
}

const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  cash_flow: 'Flux de tresorerie',
  receivable: 'Creance',
  payable: 'Fournisseur',
  forecast: 'Prevision',
  alert: 'Alerte',
  budget_line: 'Ligne budgetaire',
  dispute: 'Contentieux',
  capex: 'CAPEX',
  bank_account: 'Compte bancaire',
  counterparty: 'Contrepartie',
  tft_line: 'Ligne TFT',
  forecast_cell: 'Cellule prevision',
};

export function AnnotationPanel({
  entityType,
  entityId,
  entityLabel,
  open,
  onClose,
}: AnnotationPanelProps) {
  const { data: annotations = [], isLoading } = useAnnotationsForEntity(entityType, entityId);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterResolved, setFilterResolved] = useState<string>('all');

  if (!open) return null;

  const filtered = annotations.filter((a) => {
    if (filterType !== 'all' && a.type !== filterType) return false;
    if (filterResolved === 'unresolved' && a.is_resolved) return false;
    if (filterResolved === 'resolved' && !a.is_resolved) return false;
    return true;
  });

  const totalCount = annotations.length;
  const unresolvedCount = annotations.filter((a) => !a.is_resolved).length;
  const flagsCount = annotations.filter(
    (a) => a.type === 'flag' && !a.is_resolved,
  ).length;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto flex h-full w-full max-w-md flex-col border-l bg-background shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 border-b px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] shrink-0">
                {ENTITY_TYPE_LABELS[entityType]}
              </Badge>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {entityLabel && (
              <p className="mt-1 text-sm font-medium truncate">{entityLabel}</p>
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-3 border-b px-4 py-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {totalCount} annotation{totalCount !== 1 ? 's' : ''}
          </span>
          {unresolvedCount > 0 && (
            <span className="flex items-center gap-1 text-yellow-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              {unresolvedCount} non resolu{unresolvedCount !== 1 ? 's' : ''}
            </span>
          )}
          {flagsCount > 0 && (
            <span className="flex items-center gap-1 text-red-600">
              <Flag className="h-3.5 w-3.5" />
              {flagsCount} signalement{flagsCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 border-b px-4 py-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-7 text-xs w-auto min-w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="comment">Commentaires</SelectItem>
              <SelectItem value="flag">Signalements</SelectItem>
              <SelectItem value="tag">Tags</SelectItem>
              <SelectItem value="document_link">Documents</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterResolved} onValueChange={setFilterResolved}>
            <SelectTrigger className="h-7 text-xs w-auto min-w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="unresolved">Non resolus</SelectItem>
              <SelectItem value="resolved">Resolus</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Thread list */}
        <ScrollArea className="flex-1">
          <div className="space-y-4 p-4">
            {isLoading && (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 rounded-lg bg-muted" />
                ))}
              </div>
            )}

            {!isLoading && filtered.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                Aucune annotation pour le moment
              </div>
            )}

            {filtered.map((annotation) => (
              <AnnotationThread key={annotation.id} annotationId={annotation.id} />
            ))}
          </div>
        </ScrollArea>

        {/* Composer at bottom */}
        <Separator />
        <div className="p-3">
          <AnnotationComposer
            entityType={entityType}
            entityId={entityId}
            entityLabel={entityLabel}
            compact
          />
        </div>
      </div>
    </div>
  );
}
