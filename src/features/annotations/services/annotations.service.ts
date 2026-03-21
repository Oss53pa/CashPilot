import type {
  Annotation,
  AnnotationFilter,
  AnnotationFormData,
  AnnotationStats,
  AnnotationThread,
} from '../types';

// ---------------------------------------------------------------------------
// Mock users
// ---------------------------------------------------------------------------
const MOCK_AUTHORS = [
  { id: 'usr-001', name: 'Aniela (DAF)', avatar: undefined },
  { id: 'usr-002', name: 'Cheick (DG)', avatar: undefined },
  { id: 'usr-003', name: 'Pamela (DGA)', avatar: undefined },
  { id: 'usr-004', name: 'Kone (Tresorier)', avatar: undefined },
  { id: 'usr-005', name: 'Moussa (Comptable)', avatar: undefined },
  { id: 'usr-006', name: 'Fatou (Auditrice)', avatar: undefined },
];

// ---------------------------------------------------------------------------
// Mock annotations (French, FCFA context)
// ---------------------------------------------------------------------------
const MOCK_ANNOTATIONS: Annotation[] = [
  {
    id: 'ann-001',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    entity_type: 'cash_flow',
    entity_id: 'cf-101',
    entity_label: 'Encaissement client SONATEL - 45 000 000 FCFA',
    author_id: 'usr-001',
    author_name: 'Aniela (DAF)',
    type: 'comment',
    content: 'Le virement de SONATEL a ete recu avec 3 jours de retard. @Kone (Tresorier) merci de verifier la date de valeur bancaire.',
    mentioned_user_ids: ['usr-004'],
    visibility: 'shared',
    is_resolved: false,
    created_at: '2026-03-20T09:15:00Z',
    updated_at: '2026-03-20T09:15:00Z',
    replies_count: 2,
  },
  {
    id: 'ann-002',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    entity_type: 'cash_flow',
    entity_id: 'cf-101',
    entity_label: 'Encaissement client SONATEL - 45 000 000 FCFA',
    parent_id: 'ann-001',
    author_id: 'usr-004',
    author_name: 'Kone (Tresorier)',
    type: 'comment',
    content: 'Verifie. La date de valeur est bien le 17/03. Le retard est du a un probleme de compensation interbancaire.',
    visibility: 'shared',
    is_resolved: false,
    created_at: '2026-03-20T10:30:00Z',
    updated_at: '2026-03-20T10:30:00Z',
    replies_count: 0,
  },
  {
    id: 'ann-003',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    entity_type: 'cash_flow',
    entity_id: 'cf-101',
    entity_label: 'Encaissement client SONATEL - 45 000 000 FCFA',
    parent_id: 'ann-001',
    author_id: 'usr-001',
    author_name: 'Aniela (DAF)',
    type: 'comment',
    content: 'Merci @Kone (Tresorier). On va surveiller ce point pour les prochains virements.',
    mentioned_user_ids: ['usr-004'],
    visibility: 'shared',
    is_resolved: false,
    created_at: '2026-03-20T11:00:00Z',
    updated_at: '2026-03-20T11:00:00Z',
    replies_count: 0,
  },
  {
    id: 'ann-004',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    entity_type: 'receivable',
    entity_id: 'rec-201',
    entity_label: 'Creance Orange CI - 120 000 000 FCFA (echeance 15/04)',
    author_id: 'usr-002',
    author_name: 'Cheick (DG)',
    type: 'flag',
    content: 'Creance majeure. S\'assurer du suivi rapproche avec le service commercial. Le retard de paiement impacterait notre prevision Q2.',
    flag_level: 'critical',
    visibility: 'shared',
    is_resolved: false,
    created_at: '2026-03-19T14:00:00Z',
    updated_at: '2026-03-19T14:00:00Z',
    replies_count: 1,
  },
  {
    id: 'ann-005',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    entity_type: 'receivable',
    entity_id: 'rec-201',
    entity_label: 'Creance Orange CI - 120 000 000 FCFA (echeance 15/04)',
    parent_id: 'ann-004',
    author_id: 'usr-003',
    author_name: 'Pamela (DGA)',
    type: 'comment',
    content: 'J\'ai relance le directeur commercial d\'Orange. Retour attendu cette semaine.',
    visibility: 'shared',
    is_resolved: false,
    created_at: '2026-03-19T16:45:00Z',
    updated_at: '2026-03-19T16:45:00Z',
    replies_count: 0,
  },
  {
    id: 'ann-006',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    entity_type: 'forecast',
    entity_id: 'fcast-301',
    entity_label: 'Prevision hebdo S13 - Decaissements fournisseurs',
    author_id: 'usr-004',
    author_name: 'Kone (Tresorier)',
    type: 'tag',
    content: 'Prevision ajustee suite au report de la commande equipements IT.',
    tags: ['ajustement', 'report', 'IT'],
    visibility: 'shared',
    is_resolved: false,
    created_at: '2026-03-18T08:30:00Z',
    updated_at: '2026-03-18T08:30:00Z',
    replies_count: 0,
  },
  {
    id: 'ann-007',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    entity_type: 'alert',
    entity_id: 'alrt-401',
    entity_label: 'Alerte solde bas - Compte SIB 0042',
    author_id: 'usr-001',
    author_name: 'Aniela (DAF)',
    type: 'flag',
    content: 'Le solde est passe sous le seuil minimum de 50 000 000 FCFA. @Kone (Tresorier) transfert interne a prevoir depuis le compte NSIA.',
    flag_level: 'warning',
    mentioned_user_ids: ['usr-004'],
    visibility: 'shared',
    is_resolved: true,
    resolved_by: 'usr-004',
    resolved_at: '2026-03-18T15:00:00Z',
    resolution_note: 'Transfert de 75 000 000 FCFA effectue depuis NSIA. Ref: TRF-2026-0342.',
    created_at: '2026-03-18T07:00:00Z',
    updated_at: '2026-03-18T15:00:00Z',
    replies_count: 0,
  },
  {
    id: 'ann-008',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    entity_type: 'budget_line',
    entity_id: 'bud-501',
    entity_label: 'Budget Marketing Q1 2026 - 25 000 000 FCFA',
    author_id: 'usr-003',
    author_name: 'Pamela (DGA)',
    type: 'comment',
    content: 'Depassement de 12% sur le poste evenementiel. Demande de rallonge budgetaire en cours de validation.',
    visibility: 'shared',
    is_resolved: false,
    created_at: '2026-03-17T11:20:00Z',
    updated_at: '2026-03-17T11:20:00Z',
    replies_count: 0,
  },
  {
    id: 'ann-009',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    entity_type: 'dispute',
    entity_id: 'dsp-601',
    entity_label: 'Contentieux SAHAM Assurance - 8 500 000 FCFA',
    author_id: 'usr-006',
    author_name: 'Fatou (Auditrice)',
    type: 'document_link',
    content: 'PV de la derniere audience du 12/03/2026 joint. Prochaine audience fixee au 15/04.',
    document_url: 'https://docs.cashpilot.io/contentieux/saham-pv-20260312.pdf',
    visibility: 'shared',
    is_resolved: false,
    created_at: '2026-03-16T09:45:00Z',
    updated_at: '2026-03-16T09:45:00Z',
    replies_count: 0,
  },
  {
    id: 'ann-010',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    entity_type: 'capex',
    entity_id: 'cpx-701',
    entity_label: 'Projet renovation siege - 350 000 000 FCFA',
    author_id: 'usr-002',
    author_name: 'Cheick (DG)',
    type: 'flag',
    content: 'Le prestataire BTP a demande une avance supplementaire de 15%. @Pamela (DGA) @Aniela (DAF) validation necessaire avant deblocage.',
    flag_level: 'warning',
    mentioned_user_ids: ['usr-003', 'usr-001'],
    visibility: 'shared',
    is_resolved: false,
    created_at: '2026-03-15T14:30:00Z',
    updated_at: '2026-03-15T14:30:00Z',
    replies_count: 2,
  },
  {
    id: 'ann-011',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    entity_type: 'capex',
    entity_id: 'cpx-701',
    entity_label: 'Projet renovation siege - 350 000 000 FCFA',
    parent_id: 'ann-010',
    author_id: 'usr-003',
    author_name: 'Pamela (DGA)',
    type: 'comment',
    content: 'L\'avance supplementaire me semble justifiee vu l\'avancement des travaux. J\'approuve sous reserve de la validation DAF.',
    visibility: 'shared',
    is_resolved: false,
    created_at: '2026-03-15T16:00:00Z',
    updated_at: '2026-03-15T16:00:00Z',
    replies_count: 0,
  },
  {
    id: 'ann-012',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    entity_type: 'capex',
    entity_id: 'cpx-701',
    entity_label: 'Projet renovation siege - 350 000 000 FCFA',
    parent_id: 'ann-010',
    author_id: 'usr-001',
    author_name: 'Aniela (DAF)',
    type: 'comment',
    content: 'Approuve. Merci de preparer l\'ordre de virement pour 52 500 000 FCFA. @Kone (Tresorier)',
    mentioned_user_ids: ['usr-004'],
    visibility: 'shared',
    is_resolved: false,
    created_at: '2026-03-16T08:00:00Z',
    updated_at: '2026-03-16T08:00:00Z',
    replies_count: 0,
  },
  {
    id: 'ann-013',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    entity_type: 'bank_account',
    entity_id: 'ba-801',
    entity_label: 'Compte courant NSIA Banque - 042.1234.5678',
    author_id: 'usr-005',
    author_name: 'Moussa (Comptable)',
    type: 'comment',
    content: 'Frais bancaires du mois de fevrier anormalement eleves (1 250 000 FCFA vs 800 000 habituel). Demande de detail a la banque envoyee.',
    visibility: 'shared',
    is_resolved: false,
    created_at: '2026-03-14T10:00:00Z',
    updated_at: '2026-03-14T10:00:00Z',
    replies_count: 0,
  },
  {
    id: 'ann-014',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    entity_type: 'counterparty',
    entity_id: 'ctp-901',
    entity_label: 'Fournisseur CFAO Motors',
    author_id: 'usr-004',
    author_name: 'Kone (Tresorier)',
    type: 'tag',
    content: 'Negociation en cours pour passer les delais de paiement de 30 a 60 jours.',
    tags: ['negociation', 'delai_paiement', 'prioritaire'],
    visibility: 'shared',
    is_resolved: false,
    created_at: '2026-03-13T13:30:00Z',
    updated_at: '2026-03-13T13:30:00Z',
    replies_count: 0,
  },
  {
    id: 'ann-015',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    entity_type: 'forecast_cell',
    entity_id: 'fc-1001',
    entity_label: 'Prevision Avril 2026 - Encaissements locataires',
    author_id: 'usr-001',
    author_name: 'Aniela (DAF)',
    type: 'comment',
    content: 'Revoir a la hausse suite au renouvellement du bail Carrefour (+8 000 000 FCFA/mois).',
    visibility: 'private',
    is_resolved: false,
    created_at: '2026-03-12T15:45:00Z',
    updated_at: '2026-03-12T15:45:00Z',
    replies_count: 0,
  },
  {
    id: 'ann-016',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    entity_type: 'cash_flow',
    entity_id: 'cf-102',
    entity_label: 'Decaissement fournisseur SOGEA - 28 750 000 FCFA',
    author_id: 'usr-006',
    author_name: 'Fatou (Auditrice)',
    type: 'flag',
    content: 'Montant superieur au seuil de validation DG (25 000 000 FCFA). Verifier que l\'approbation a bien ete obtenue.',
    flag_level: 'info',
    visibility: 'shared',
    is_resolved: true,
    resolved_by: 'usr-001',
    resolved_at: '2026-03-11T16:30:00Z',
    resolution_note: 'Approbation DG confirmee - ref: APR-2026-0189.',
    created_at: '2026-03-11T09:00:00Z',
    updated_at: '2026-03-11T16:30:00Z',
    replies_count: 0,
  },
  {
    id: 'ann-017',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    entity_type: 'tft_line',
    entity_id: 'tft-1101',
    entity_label: 'TFT Mars 2026 - Flux operationnels nets',
    author_id: 'usr-005',
    author_name: 'Moussa (Comptable)',
    type: 'comment',
    content: 'Ecart de 2 300 000 FCFA entre le TFT et le rapprochement bancaire. Investigation en cours.',
    visibility: 'shared',
    is_resolved: false,
    created_at: '2026-03-21T08:00:00Z',
    updated_at: '2026-03-21T08:00:00Z',
    replies_count: 0,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function delay(ms = 200): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function filterAnnotations(annotations: Annotation[], filter?: AnnotationFilter): Annotation[] {
  if (!filter) return annotations;
  let result = [...annotations];

  if (filter.entity_type) {
    result = result.filter((a) => a.entity_type === filter.entity_type);
  }
  if (filter.entity_id) {
    result = result.filter((a) => a.entity_id === filter.entity_id);
  }
  if (filter.author_id) {
    result = result.filter((a) => a.author_id === filter.author_id);
  }
  if (filter.type) {
    result = result.filter((a) => a.type === filter.type);
  }
  if (filter.visibility) {
    result = result.filter((a) => a.visibility === filter.visibility);
  }
  if (filter.is_resolved !== undefined) {
    result = result.filter((a) => a.is_resolved === filter.is_resolved);
  }
  if (filter.search) {
    const q = filter.search.toLowerCase();
    result = result.filter(
      (a) =>
        a.content.toLowerCase().includes(q) ||
        a.entity_label?.toLowerCase().includes(q) ||
        a.author_name.toLowerCase().includes(q) ||
        a.tags?.some((t) => t.toLowerCase().includes(q)),
    );
  }
  if (filter.date_from) {
    result = result.filter((a) => a.created_at >= filter.date_from!);
  }
  if (filter.date_to) {
    result = result.filter((a) => a.created_at <= filter.date_to!);
  }

  return result;
}

let localAnnotations = [...MOCK_ANNOTATIONS];

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------
export const annotationsService = {
  async getAnnotations(
    companyId: string,
    filter?: AnnotationFilter,
  ): Promise<Annotation[]> {
    await delay();
    const rootAnnotations = localAnnotations.filter(
      (a) => a.company_id === companyId && !a.parent_id,
    );
    return filterAnnotations(rootAnnotations, filter).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  },

  async getAnnotationThread(annotationId: string): Promise<AnnotationThread> {
    await delay();
    const root = localAnnotations.find((a) => a.id === annotationId);
    if (!root) throw new Error('Annotation introuvable');
    const replies = localAnnotations
      .filter((a) => a.parent_id === annotationId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return { root, replies };
  },

  async getAnnotationsForEntity(
    entityType: string,
    entityId: string,
  ): Promise<Annotation[]> {
    await delay();
    return localAnnotations
      .filter((a) => a.entity_type === entityType && a.entity_id === entityId && !a.parent_id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async createAnnotation(data: AnnotationFormData): Promise<Annotation> {
    await delay(300);
    const now = new Date().toISOString();
    const author = MOCK_AUTHORS[0]; // simulate current user as Aniela
    const newAnnotation: Annotation = {
      id: `ann-${Date.now()}`,
      tenant_id: 'tenant-1',
      company_id: 'company-1',
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      entity_label: data.entity_label,
      parent_id: data.parent_id,
      author_id: author.id,
      author_name: author.name,
      author_avatar: author.avatar,
      type: data.type,
      content: data.content,
      tags: data.tags,
      flag_level: data.flag_level as Annotation['flag_level'],
      document_url: data.document_url,
      mentioned_user_ids: data.mentioned_user_ids,
      visibility: data.visibility,
      is_resolved: false,
      created_at: now,
      updated_at: now,
      replies_count: 0,
    };

    localAnnotations.push(newAnnotation);

    // Update parent replies_count
    if (data.parent_id) {
      const parent = localAnnotations.find((a) => a.id === data.parent_id);
      if (parent) {
        parent.replies_count += 1;
      }
    }

    return newAnnotation;
  },

  async updateAnnotation(id: string, content: string): Promise<Annotation> {
    await delay(200);
    const annotation = localAnnotations.find((a) => a.id === id);
    if (!annotation) throw new Error('Annotation introuvable');
    annotation.content = content;
    annotation.updated_at = new Date().toISOString();
    return { ...annotation };
  },

  async deleteAnnotation(id: string): Promise<void> {
    await delay(200);
    localAnnotations = localAnnotations.filter((a) => a.id !== id && a.parent_id !== id);
  },

  async resolveAnnotation(id: string, note?: string): Promise<Annotation> {
    await delay(200);
    const annotation = localAnnotations.find((a) => a.id === id);
    if (!annotation) throw new Error('Annotation introuvable');
    annotation.is_resolved = true;
    annotation.resolved_by = 'usr-001';
    annotation.resolved_at = new Date().toISOString();
    annotation.resolution_note = note || undefined;
    annotation.updated_at = new Date().toISOString();
    return { ...annotation };
  },

  async unresolveAnnotation(id: string): Promise<Annotation> {
    await delay(200);
    const annotation = localAnnotations.find((a) => a.id === id);
    if (!annotation) throw new Error('Annotation introuvable');
    annotation.is_resolved = false;
    annotation.resolved_by = undefined;
    annotation.resolved_at = undefined;
    annotation.resolution_note = undefined;
    annotation.updated_at = new Date().toISOString();
    return { ...annotation };
  },

  async getAnnotationStats(companyId: string): Promise<AnnotationStats> {
    await delay();
    const all = localAnnotations.filter(
      (a) => a.company_id === companyId && !a.parent_id,
    );
    const unresolved = all.filter((a) => !a.is_resolved);
    const flagsCritical = all.filter(
      (a) => a.type === 'flag' && a.flag_level === 'critical' && !a.is_resolved,
    );
    const flagsWarning = all.filter(
      (a) => a.type === 'flag' && a.flag_level === 'warning' && !a.is_resolved,
    );
    const mentionsUnread = all.filter(
      (a) => a.mentioned_user_ids?.includes('usr-001') && !a.is_resolved,
    );
    const recent = all
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    return {
      total: all.length,
      unresolved: unresolved.length,
      flags_critical: flagsCritical.length,
      flags_warning: flagsWarning.length,
      mentions_unread: mentionsUnread.length,
      recent,
    };
  },

  async searchAnnotations(companyId: string, query: string): Promise<Annotation[]> {
    await delay();
    return this.getAnnotations(companyId, { search: query });
  },

  async getMyMentions(userId: string): Promise<Annotation[]> {
    await delay();
    return localAnnotations
      .filter((a) => a.mentioned_user_ids?.includes(userId) && !a.parent_id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getMyAnnotationFeed(userId: string): Promise<Annotation[]> {
    await delay();
    // Return recent root annotations where user is mentioned or is the author
    return localAnnotations
      .filter(
        (a) =>
          !a.parent_id &&
          (a.author_id === userId || (a.mentioned_user_ids?.includes(userId) ?? false)),
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  /** Get the list of available mock users for @mention autocomplete */
  async getUsers(): Promise<{ id: string; name: string; avatar?: string }[]> {
    await delay(100);
    return [...MOCK_AUTHORS];
  },
};
