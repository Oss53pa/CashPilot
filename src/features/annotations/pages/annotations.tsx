import { useState } from 'react';
import {
  MessageSquare,
  Search,
  Flag,
  AlertTriangle,
  AtSign,
  Filter,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  useAnnotations,
  useAnnotationStats,
} from '../hooks/use-annotations';
import { AnnotationThread } from '../components/annotation-thread';
import { AnnotationPanel } from '../components/annotation-panel';
import type { AnnotationFilter, Annotation, EntityType, AnnotationType } from '../types';

const COMPANY_ID = 'company-1';

const ENTITY_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Tous les objets' },
  { value: 'cash_flow', label: 'Flux de tresorerie' },
  { value: 'receivable', label: 'Creances' },
  { value: 'payable', label: 'Fournisseurs' },
  { value: 'forecast', label: 'Previsions' },
  { value: 'alert', label: 'Alertes' },
  { value: 'budget_line', label: 'Budget' },
  { value: 'dispute', label: 'Contentieux' },
  { value: 'capex', label: 'CAPEX' },
  { value: 'bank_account', label: 'Comptes bancaires' },
  { value: 'counterparty', label: 'Contreparties' },
  { value: 'tft_line', label: 'Lignes TFT' },
  { value: 'forecast_cell', label: 'Cellules prevision' },
];

const ANNOTATION_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Tous les types' },
  { value: 'comment', label: 'Commentaires' },
  { value: 'flag', label: 'Signalements' },
  { value: 'tag', label: 'Tags' },
  { value: 'document_link', label: 'Documents' },
];

const RESOLVED_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'unresolved', label: 'Non resolus' },
  { value: 'resolved', label: 'Resolus' },
];

export default function AnnotationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');
  const [annotationTypeFilter, setAnnotationTypeFilter] = useState('all');
  const [resolvedFilter, setResolvedFilter] = useState('all');
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);

  const filter: AnnotationFilter = {
    ...(entityTypeFilter !== 'all' ? { entity_type: entityTypeFilter as EntityType } : {}),
    ...(annotationTypeFilter !== 'all' ? { type: annotationTypeFilter as AnnotationType } : {}),
    ...(resolvedFilter === 'resolved' ? { is_resolved: true } : {}),
    ...(resolvedFilter === 'unresolved' ? { is_resolved: false } : {}),
    ...(searchQuery.length >= 2 ? { search: searchQuery } : {}),
  };

  const { data: annotations = [], isLoading } = useAnnotations(COMPANY_ID, filter);
  const { data: stats } = useAnnotationStats(COMPANY_ID);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Annotations & Commentaires"
        description="Recherchez, filtrez et gerez toutes les annotations du systeme."
      />

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total ?? '-'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non resolus</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.unresolved ?? '-'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drapeaux critiques</CardTitle>
            <Flag className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.flags_critical ?? '-'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drapeaux attention</CardTitle>
            <Flag className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.flags_warning ?? '-'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mes mentions</CardTitle>
            <AtSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.mentions_unread ?? '-'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans les annotations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
            <SelectTrigger className="h-9 text-sm w-auto min-w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ENTITY_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={annotationTypeFilter} onValueChange={setAnnotationTypeFilter}>
            <SelectTrigger className="h-9 text-sm w-auto min-w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANNOTATION_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={resolvedFilter} onValueChange={setResolvedFilter}>
            <SelectTrigger className="h-9 text-sm w-auto min-w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESOLVED_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Results */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Annotation list */}
        <div className="space-y-4">
          {isLoading && (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 rounded-lg bg-muted" />
              ))}
            </div>
          )}

          {!isLoading && annotations.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">Aucune annotation trouvee</p>
              <p className="text-sm mt-1">
                Modifiez vos filtres ou effectuez une autre recherche.
              </p>
            </div>
          )}

          {annotations.map((annotation) => (
            <div key={annotation.id}>
              {/* Entity context */}
              {annotation.entity_label && (
                <button
                  type="button"
                  className="mb-1 text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                  onClick={() => setSelectedAnnotation(annotation)}
                >
                  <Badge variant="outline" className="text-[10px] h-4">
                    {ENTITY_TYPE_OPTIONS.find((o) => o.value === annotation.entity_type)?.label ??
                      annotation.entity_type}
                  </Badge>
                  <span className="truncate max-w-[400px]">{annotation.entity_label}</span>
                </button>
              )}
              <AnnotationThread annotationId={annotation.id} />
            </div>
          ))}
        </div>

        {/* Stats sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Resume</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Annotations affichees</span>
                <span className="font-semibold">{annotations.length}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Commentaires</span>
                <span className="font-semibold">
                  {annotations.filter((a) => a.type === 'comment').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Signalements</span>
                <span className="font-semibold">
                  {annotations.filter((a) => a.type === 'flag').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tags</span>
                <span className="font-semibold">
                  {annotations.filter((a) => a.type === 'tag').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Documents</span>
                <span className="font-semibold">
                  {annotations.filter((a) => a.type === 'document_link').length}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Resolus</span>
                <span className="font-semibold text-green-600">
                  {annotations.filter((a) => a.is_resolved).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Non resolus</span>
                <span className="font-semibold text-yellow-600">
                  {annotations.filter((a) => !a.is_resolved).length}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Recent activity */}
          {stats?.recent && stats.recent.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Activite recente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.recent.slice(0, 5).map((a) => (
                  <div key={a.id} className="text-xs space-y-0.5">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{a.author_name}</span>
                      <span className="text-muted-foreground">
                        {new Date(a.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <p className="text-muted-foreground line-clamp-1">{a.content}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Panel for viewing entity annotations */}
      {selectedAnnotation && (
        <AnnotationPanel
          entityType={selectedAnnotation.entity_type}
          entityId={selectedAnnotation.entity_id}
          entityLabel={selectedAnnotation.entity_label}
          open={!!selectedAnnotation}
          onClose={() => setSelectedAnnotation(null)}
        />
      )}
    </div>
  );
}
