import { useState, Fragment } from 'react';
import {
  MessageSquare,
  Tag,
  Flag,
  Link2,
  MoreHorizontal,
  CheckCircle2,
  RotateCcw,
  Pencil,
  Trash2,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  useAnnotationThread,
  useResolveAnnotation,
  useUnresolveAnnotation,
  useUpdateAnnotation,
  useDeleteAnnotation,
} from '../hooks/use-annotations';
import { AnnotationComposer } from './annotation-composer';
import type { Annotation } from '../types';

interface AnnotationThreadProps {
  annotationId: string;
  onDelete?: () => void;
}

const CURRENT_USER_ID = 'usr-001'; // mock current user

const TYPE_ICONS: Record<string, typeof MessageSquare> = {
  comment: MessageSquare,
  tag: Tag,
  flag: Flag,
  document_link: Link2,
  mention: MessageSquare,
  resolution: CheckCircle2,
};

const TYPE_LABELS: Record<string, string> = {
  comment: 'Commentaire',
  tag: 'Tag',
  flag: 'Signalement',
  document_link: 'Document',
  mention: 'Mention',
  resolution: 'Resolution',
};

const FLAG_BORDER_COLORS: Record<string, string> = {
  info: 'border-l-blue-500',
  warning: 'border-l-yellow-500',
  critical: 'border-l-red-500',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "A l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD < 7) return `Il y a ${diffD}j`;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function highlightMentions(text: string): React.ReactNode {
  const parts = text.split(/(@[A-Za-zÀ-ÿ]+(?: \([^)]+\))?)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      return (
        <span
          key={i}
          className="font-semibold text-primary bg-primary/10 rounded px-0.5 cursor-pointer hover:underline"
        >
          {part}
        </span>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

function AnnotationItem({
  annotation,
  isReply = false,
  onDelete,
}: {
  annotation: Annotation;
  isReply?: boolean;
  onDelete?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(annotation.content);
  const updateMutation = useUpdateAnnotation();
  const deleteMutation = useDeleteAnnotation();
  const isOwn = annotation.author_id === CURRENT_USER_ID;
  const TypeIcon = TYPE_ICONS[annotation.type] ?? MessageSquare;
  const flagBorder = annotation.type === 'flag' && annotation.flag_level
    ? FLAG_BORDER_COLORS[annotation.flag_level]
    : '';

  const handleSaveEdit = () => {
    if (!editContent.trim()) return;
    updateMutation.mutate(
      { id: annotation.id, content: editContent.trim() },
      { onSuccess: () => setEditing(false) },
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(annotation.id, { onSuccess: onDelete });
  };

  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-3 space-y-2',
        flagBorder && `border-l-4 ${flagBorder}`,
        isReply && 'ml-8 bg-muted/30',
        annotation.is_resolved && 'opacity-70',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Avatar */}
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
            {annotation.author_name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-semibold truncate">{annotation.author_name}</span>
              {!isReply && (
                <Badge variant="outline" className="text-[10px] h-5 gap-1">
                  <TypeIcon className="h-3 w-3" />
                  {TYPE_LABELS[annotation.type]}
                </Badge>
              )}
              {annotation.is_resolved && (
                <Badge variant="success" className="text-[10px] h-5 gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Resolu
                </Badge>
              )}
              {annotation.visibility === 'private' && (
                <Badge variant="secondary" className="text-[10px] h-5">
                  Prive
                </Badge>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(annotation.created_at)}
            </span>
          </div>
        </div>

        {/* Actions dropdown */}
        {isOwn && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setEditing(true); setEditContent(annotation.content); }}>
                <Pencil className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      {editing ? (
        <div className="space-y-2">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[60px] text-sm"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
              Annuler
            </Button>
            <Button size="sm" onClick={handleSaveEdit} disabled={updateMutation.isPending}>
              Enregistrer
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {highlightMentions(annotation.content)}
        </p>
      )}

      {/* Tags */}
      {annotation.tags && annotation.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {annotation.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px]">
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Document link */}
      {annotation.document_url && (
        <a
          href={annotation.document_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <Link2 className="h-3.5 w-3.5" />
          Voir le document
        </a>
      )}

      {/* Resolution note */}
      {annotation.is_resolved && annotation.resolution_note && (
        <div className="rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 px-3 py-2 text-sm">
          <span className="font-medium text-green-700 dark:text-green-400">Note de resolution : </span>
          {annotation.resolution_note}
        </div>
      )}
    </div>
  );
}

export function AnnotationThread({ annotationId, onDelete }: AnnotationThreadProps) {
  const { data: thread, isLoading } = useAnnotationThread(annotationId);
  const resolveMutation = useResolveAnnotation();
  const unresolveMutation = useUnresolveAnnotation();
  const [showReplyComposer, setShowReplyComposer] = useState(false);
  const [resolveNote, setResolveNote] = useState('');
  const [showResolveInput, setShowResolveInput] = useState(false);

  if (isLoading || !thread) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-24 rounded-lg bg-muted" />
        <div className="h-16 rounded-lg bg-muted ml-8" />
      </div>
    );
  }

  const { root, replies } = thread;

  const handleResolve = () => {
    resolveMutation.mutate(
      { id: root.id, note: resolveNote || undefined },
      {
        onSuccess: () => {
          setShowResolveInput(false);
          setResolveNote('');
        },
      },
    );
  };

  const handleUnresolve = () => {
    unresolveMutation.mutate(root.id);
  };

  return (
    <div className="space-y-2">
      {/* Root annotation */}
      <AnnotationItem annotation={root} onDelete={onDelete} />

      {/* Replies */}
      {replies.map((reply) => (
        <AnnotationItem key={reply.id} annotation={reply} isReply />
      ))}

      {/* Action buttons */}
      <div className="flex items-center gap-2 ml-8">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => setShowReplyComposer((v) => !v)}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Repondre
        </Button>

        {!root.is_resolved ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-green-600"
            onClick={() => setShowResolveInput((v) => !v)}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Resoudre
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={handleUnresolve}
            disabled={unresolveMutation.isPending}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Rouvrir
          </Button>
        )}
      </div>

      {/* Resolve input */}
      {showResolveInput && (
        <div className="ml-8 flex items-center gap-2">
          <Input
            placeholder="Note de resolution (optionnel)..."
            value={resolveNote}
            onChange={(e) => setResolveNote(e.target.value)}
            className="h-8 text-sm flex-1"
          />
          <Button
            size="sm"
            className="h-8"
            onClick={handleResolve}
            disabled={resolveMutation.isPending}
          >
            Confirmer
          </Button>
        </div>
      )}

      {/* Reply composer */}
      {showReplyComposer && (
        <div className="ml-8">
          <AnnotationComposer
            entityType={root.entity_type}
            entityId={root.entity_id}
            entityLabel={root.entity_label}
            parentId={root.id}
            parentAnnotation={root}
            compact
            onSuccess={() => setShowReplyComposer(false)}
          />
        </div>
      )}
    </div>
  );
}
