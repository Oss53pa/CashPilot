import { useState, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Tag,
  Flag,
  Link2,
  Lock,
  Globe,
  Send,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useCreateAnnotation, useAnnotationUsers } from '../hooks/use-annotations';
import type {
  AnnotationType,
  AnnotationVisibility,
  AnnotationFormData,
  Annotation,
  EntityType,
} from '../types';

interface AnnotationComposerProps {
  entityType: EntityType;
  entityId: string;
  entityLabel?: string;
  parentId?: string;
  parentAnnotation?: Annotation;
  onSuccess?: () => void;
  compact?: boolean;
}

const TYPE_OPTIONS: { value: AnnotationType; label: string; icon: typeof MessageSquare }[] = [
  { value: 'comment', label: 'Commentaire', icon: MessageSquare },
  { value: 'tag', label: 'Tag', icon: Tag },
  { value: 'flag', label: 'Signalement', icon: Flag },
  { value: 'document_link', label: 'Lien document', icon: Link2 },
];

const FLAG_LEVELS = [
  { value: 'info', label: 'Info', color: 'bg-blue-500' },
  { value: 'warning', label: 'Attention', color: 'bg-yellow-500' },
  { value: 'critical', label: 'Critique', color: 'bg-red-500' },
];

export function AnnotationComposer({
  entityType,
  entityId,
  entityLabel,
  parentId,
  parentAnnotation,
  onSuccess,
  compact = false,
}: AnnotationComposerProps) {
  const [type, setType] = useState<AnnotationType>('comment');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<AnnotationVisibility>('shared');
  const [flagLevel, setFlagLevel] = useState<string>('info');
  const [documentUrl, setDocumentUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const createMutation = useCreateAnnotation();
  const { data: users = [] } = useAnnotationUsers();

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(mentionQuery.toLowerCase()),
  );

  const handleContentChange = useCallback(
    (value: string) => {
      setContent(value);
      // Detect @mention trigger
      const lastAt = value.lastIndexOf('@');
      if (lastAt >= 0) {
        const afterAt = value.slice(lastAt + 1);
        if (!afterAt.includes(' ') && afterAt.length > 0) {
          setMentionQuery(afterAt);
          setShowMentions(true);
          return;
        }
      }
      setShowMentions(false);
    },
    [],
  );

  const insertMention = useCallback(
    (user: { id: string; name: string }) => {
      const lastAt = content.lastIndexOf('@');
      if (lastAt >= 0) {
        const before = content.slice(0, lastAt);
        setContent(`${before}@${user.name} `);
        if (!mentionedUserIds.includes(user.id)) {
          setMentionedUserIds((prev) => [...prev, user.id]);
        }
      }
      setShowMentions(false);
      textareaRef.current?.focus();
    },
    [content, mentionedUserIds],
  );

  const addTag = useCallback(() => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags((prev) => [...prev, t]);
    }
    setTagInput('');
  }, [tagInput, tags]);

  const removeTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!content.trim()) return;

    const data: AnnotationFormData = {
      entity_type: entityType,
      entity_id: entityId,
      entity_label: entityLabel,
      type,
      content: content.trim(),
      visibility,
      parent_id: parentId,
      ...(type === 'tag' && tags.length > 0 ? { tags } : {}),
      ...(type === 'flag' ? { flag_level: flagLevel } : {}),
      ...(type === 'document_link' && documentUrl ? { document_url: documentUrl } : {}),
      ...(mentionedUserIds.length > 0 ? { mentioned_user_ids: mentionedUserIds } : {}),
    };

    createMutation.mutate(data, {
      onSuccess: () => {
        setContent('');
        setTags([]);
        setTagInput('');
        setDocumentUrl('');
        setMentionedUserIds([]);
        onSuccess?.();
      },
    });
  }, [
    content,
    entityType,
    entityId,
    entityLabel,
    type,
    visibility,
    parentId,
    tags,
    flagLevel,
    documentUrl,
    mentionedUserIds,
    createMutation,
    onSuccess,
  ]);

  const SelectedTypeIcon = TYPE_OPTIONS.find((t) => t.value === type)?.icon ?? MessageSquare;

  return (
    <div className={cn('rounded-lg border bg-card p-3 space-y-3', compact && 'p-2 space-y-2')}>
      {/* Quoted parent for replies */}
      {parentAnnotation && (
        <div className="rounded-md bg-muted/50 border-l-2 border-muted-foreground/30 px-3 py-2 text-sm text-muted-foreground">
          <span className="font-medium">{parentAnnotation.author_name}</span>
          {': '}
          <span className="line-clamp-2">{parentAnnotation.content}</span>
        </div>
      )}

      {/* Type selector + Visibility (only for root annotations) */}
      {!parentId && (
        <div className="flex items-center gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <SelectedTypeIcon className="h-3.5 w-3.5" />
                {TYPE_OPTIONS.find((t) => t.value === type)?.label}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {TYPE_OPTIONS.map((opt) => (
                <DropdownMenuItem key={opt.value} onClick={() => setType(opt.value)}>
                  <opt.icon className="h-4 w-4 mr-2" />
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() =>
              setVisibility((v) => (v === 'shared' ? 'private' : 'shared'))
            }
          >
            {visibility === 'shared' ? (
              <>
                <Globe className="h-3.5 w-3.5" />
                Partage
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5" />
                Prive
              </>
            )}
          </Button>
        </div>
      )}

      {/* Flag level selector */}
      {type === 'flag' && !parentId && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Niveau :</span>
          {FLAG_LEVELS.map((fl) => (
            <Button
              key={fl.value}
              variant={flagLevel === fl.value ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setFlagLevel(fl.value)}
            >
              <span className={cn('h-2 w-2 rounded-full', fl.color)} />
              {fl.label}
            </Button>
          ))}
        </div>
      )}

      {/* Tag input */}
      {type === 'tag' && !parentId && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Ajouter un tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              className="h-8 text-sm"
            />
            <Button variant="outline" size="sm" className="h-8" onClick={addTag}>
              Ajouter
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeTag(tag)}
                >
                  {tag} x
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Document URL input */}
      {type === 'document_link' && !parentId && (
        <Input
          placeholder="URL du document..."
          value={documentUrl}
          onChange={(e) => setDocumentUrl(e.target.value)}
          className="h-8 text-sm"
        />
      )}

      {/* Text area with @mention */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          placeholder={parentId ? 'Repondre...' : 'Ecrire un commentaire... (@ pour mentionner)'}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          className={cn('min-h-[60px] text-sm resize-none', compact && 'min-h-[40px]')}
        />

        {/* Mention dropdown */}
        {showMentions && filteredUsers.length > 0 && (
          <div className="absolute bottom-full left-0 mb-1 w-64 rounded-md border bg-popover p-1 shadow-md z-50">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => insertMention(user)}
              >
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                  {user.name.charAt(0)}
                </div>
                {user.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <Button
          size="sm"
          className="gap-1.5"
          onClick={handleSubmit}
          disabled={!content.trim() || createMutation.isPending}
        >
          <Send className="h-3.5 w-3.5" />
          {createMutation.isPending ? 'Envoi...' : parentId ? 'Repondre' : 'Publier'}
        </Button>
      </div>
    </div>
  );
}
