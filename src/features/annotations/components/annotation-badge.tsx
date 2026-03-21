import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnnotationsForEntity } from '../hooks/use-annotations';
import { AnnotationPanel } from './annotation-panel';
import type { EntityType } from '../types';

interface AnnotationBadgeProps {
  entityType: EntityType;
  entityId: string;
  entityLabel?: string;
  className?: string;
}

export function AnnotationBadge({
  entityType,
  entityId,
  entityLabel,
  className,
}: AnnotationBadgeProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const { data: annotations = [] } = useAnnotationsForEntity(entityType, entityId);

  const count = annotations.length;
  const hasUnresolvedFlags = annotations.some(
    (a) => a.type === 'flag' && !a.is_resolved,
  );

  if (count === 0 && !panelOpen) {
    return (
      <button
        type="button"
        className={cn(
          'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-accent transition-colors',
          className,
        )}
        onClick={() => setPanelOpen(true)}
      >
        <MessageSquare className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        className={cn(
          'relative inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium transition-colors',
          'bg-muted hover:bg-accent text-foreground',
          className,
        )}
        onClick={() => setPanelOpen(true)}
      >
        <MessageSquare className="h-3.5 w-3.5" />
        {count > 0 && <span>{count}</span>}
        {hasUnresolvedFlags && (
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-background" />
        )}
      </button>

      <AnnotationPanel
        entityType={entityType}
        entityId={entityId}
        entityLabel={entityLabel}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
      />
    </>
  );
}
