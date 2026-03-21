import { useState } from 'react';
import {
  MessageSquare,
  Flag,
  Tag,
  Link2,
  Clock,
  AtSign,
  CheckCircle2,
  ListFilter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  useAnnotations,
  useMyMentions,
} from '../hooks/use-annotations';
import type { Annotation, EntityType } from '../types';

interface AnnotationFeedProps {
  companyId: string;
  userId?: string;
  maxItems?: number;
  onAnnotationClick?: (annotation: Annotation) => void;
}

type FeedTab = 'all' | 'mentions' | 'unresolved';

const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  cash_flow: 'Flux',
  receivable: 'Creance',
  payable: 'Fournisseur',
  forecast: 'Prevision',
  alert: 'Alerte',
  budget_line: 'Budget',
  dispute: 'Contentieux',
  capex: 'CAPEX',
  bank_account: 'Compte',
  counterparty: 'Contrepartie',
  tft_line: 'TFT',
  forecast_cell: 'Prevision',
};

const ENTITY_TYPE_COLORS: Record<string, string> = {
  cash_flow: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  receivable: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  payable: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  forecast: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  alert: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  budget_line: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
  dispute: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  capex: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  bank_account: 'bg-slate-100 text-slate-700 dark:bg-slate-950 dark:text-slate-300',
  counterparty: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  tft_line: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  forecast_cell: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
};

const TYPE_ICONS: Record<string, typeof MessageSquare> = {
  comment: MessageSquare,
  tag: Tag,
  flag: Flag,
  document_link: Link2,
  mention: AtSign,
  resolution: CheckCircle2,
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "A l'instant";
  if (diffMin < 60) return `${diffMin} min`;
  if (diffH < 24) return `${diffH}h`;
  if (diffD < 7) return `${diffD}j`;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function FeedItem({
  annotation,
  onClick,
}: {
  annotation: Annotation;
  onClick?: () => void;
}) {
  const TypeIcon = TYPE_ICONS[annotation.type] ?? MessageSquare;

  return (
    <button
      type="button"
      className="w-full text-left rounded-lg border bg-card p-3 hover:bg-accent/50 transition-colors space-y-1.5"
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Badge
            className={cn(
              'text-[10px] h-5 shrink-0 border-0',
              ENTITY_TYPE_COLORS[annotation.entity_type] ?? 'bg-muted text-muted-foreground',
            )}
          >
            {ENTITY_TYPE_LABELS[annotation.entity_type as EntityType] ?? annotation.entity_type}
          </Badge>
          <TypeIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {annotation.type === 'flag' && annotation.flag_level === 'critical' && (
            <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
          )}
          {annotation.type === 'flag' && annotation.flag_level === 'warning' && (
            <span className="h-2 w-2 rounded-full bg-yellow-500 shrink-0" />
          )}
        </div>
        <span className="text-[11px] text-muted-foreground flex items-center gap-1 shrink-0">
          <Clock className="h-3 w-3" />
          {formatDate(annotation.created_at)}
        </span>
      </div>

      {annotation.entity_label && (
        <p className="text-xs font-medium text-muted-foreground truncate">
          {annotation.entity_label}
        </p>
      )}

      <div className="flex items-start gap-2">
        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 mt-0.5">
          {annotation.author_name.charAt(0)}
        </div>
        <div className="min-w-0">
          <span className="text-xs font-medium">{annotation.author_name}</span>
          <p className="text-xs text-muted-foreground line-clamp-2">{annotation.content}</p>
        </div>
      </div>

      {annotation.replies_count > 0 && (
        <p className="text-[11px] text-primary ml-7">
          {annotation.replies_count} reponse{annotation.replies_count !== 1 ? 's' : ''}
        </p>
      )}
    </button>
  );
}

export function AnnotationFeed({
  companyId,
  userId = 'usr-001',
  maxItems = 10,
  onAnnotationClick,
}: AnnotationFeedProps) {
  const [tab, setTab] = useState<FeedTab>('all');

  const { data: allAnnotations = [] } = useAnnotations(companyId);
  const { data: mentions = [] } = useMyMentions(userId);

  let displayedAnnotations: Annotation[] = [];
  switch (tab) {
    case 'all':
      displayedAnnotations = allAnnotations;
      break;
    case 'mentions':
      displayedAnnotations = mentions;
      break;
    case 'unresolved':
      displayedAnnotations = allAnnotations.filter((a) => !a.is_resolved);
      break;
  }
  displayedAnnotations = displayedAnnotations.slice(0, maxItems);

  const TABS: { value: FeedTab; label: string }[] = [
    { value: 'all', label: 'Toutes' },
    { value: 'mentions', label: 'Mes mentions' },
    { value: 'unresolved', label: 'Non resolues' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <ListFilter className="h-4 w-4" />
          Fil d'activite
        </h3>
      </div>

      <div className="flex gap-1">
        {TABS.map((t) => (
          <Button
            key={t.value}
            variant={tab === t.value ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setTab(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <ScrollArea className="max-h-[500px]">
        <div className="space-y-2">
          {displayedAnnotations.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
              Aucune annotation
            </div>
          )}

          {displayedAnnotations.map((annotation) => (
            <FeedItem
              key={annotation.id}
              annotation={annotation}
              onClick={() => onAnnotationClick?.(annotation)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
