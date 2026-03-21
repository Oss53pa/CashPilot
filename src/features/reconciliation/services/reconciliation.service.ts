import type {
  ReconciliationSession,
  ReconciliationItem,
  SessionMetrics,
  ChatMessage,
  SessionParticipant,
  ReconciliationItemStatus,
} from '../types';

// ---------------------------------------------------------------------------
// Mock participants
// ---------------------------------------------------------------------------
const MOCK_PARTICIPANTS: SessionParticipant[] = [
  {
    user_id: 'user-001',
    user_name: 'Aniela',
    avatar_initial: 'A',
    color: '#6366f1',
    role: 'owner',
    joined_at: '2026-03-21T08:00:00Z',
    last_active: '2026-03-21T10:42:00Z',
    is_online: true,
    current_item_id: 'item-003',
  },
  {
    user_id: 'user-002',
    user_name: 'Koné',
    avatar_initial: 'K',
    color: '#f59e0b',
    role: 'participant',
    joined_at: '2026-03-21T08:15:00Z',
    last_active: '2026-03-21T10:40:00Z',
    is_online: true,
    current_item_id: 'item-007',
  },
  {
    user_id: 'user-003',
    user_name: 'Fatou',
    avatar_initial: 'F',
    color: '#10b981',
    role: 'participant',
    joined_at: '2026-03-21T09:00:00Z',
    last_active: '2026-03-21T10:38:00Z',
    is_online: false,
  },
];

// ---------------------------------------------------------------------------
// Mock metrics
// ---------------------------------------------------------------------------
const MOCK_METRICS: SessionMetrics = {
  total_items: 25,
  auto_matched: 10,
  manual_matched: 5,
  pending: 6,
  skipped: 2,
  rejected: 2,
  total_amount_reconciled: 187_500_000,
  total_amount_pending: 42_350_000,
  avg_resolution_time_seconds: 145,
  session_duration_minutes: 162,
};

// ---------------------------------------------------------------------------
// Mock sessions
// ---------------------------------------------------------------------------
function generateMockSessions(_companyId: string): ReconciliationSession[] {
  return [
    {
      id: 'recon-001',
      tenant_id: 'tenant-001',
      company_id: _companyId,
      account_id: 'acc-1',
      account_name: 'Compte Courant Exploitation — SGBCI',
      statement_id: 'stmt-001',
      status: 'active',
      created_by: 'user-001',
      created_at: '2026-03-21T08:00:00Z',
      participants: MOCK_PARTICIPANTS,
      metrics: MOCK_METRICS,
      unresolved_count: 6,
      total_transactions: 25,
      resolved_count: 19,
    },
    {
      id: 'recon-002',
      tenant_id: 'tenant-001',
      company_id: _companyId,
      account_id: 'acc-2',
      account_name: 'Compte Projet Cocody — BICICI',
      status: 'completed',
      created_by: 'user-001',
      created_at: '2026-03-14T09:30:00Z',
      completed_at: '2026-03-14T14:15:00Z',
      participants: MOCK_PARTICIPANTS.slice(0, 2),
      metrics: {
        ...MOCK_METRICS,
        pending: 0,
        total_items: 18,
        auto_matched: 12,
        manual_matched: 4,
        skipped: 1,
        rejected: 1,
        total_amount_reconciled: 245_000_000,
        total_amount_pending: 0,
        avg_resolution_time_seconds: 120,
        session_duration_minutes: 285,
      },
      unresolved_count: 0,
      total_transactions: 18,
      resolved_count: 18,
    },
    {
      id: 'recon-003',
      tenant_id: 'tenant-001',
      company_id: _companyId,
      account_id: 'acc-3',
      account_name: 'Compte Epargne — Ecobank',
      status: 'completed',
      created_by: 'user-002',
      created_at: '2026-03-07T10:00:00Z',
      completed_at: '2026-03-07T12:30:00Z',
      participants: [MOCK_PARTICIPANTS[1]],
      metrics: {
        ...MOCK_METRICS,
        pending: 0,
        total_items: 9,
        auto_matched: 7,
        manual_matched: 2,
        skipped: 0,
        rejected: 0,
        total_amount_reconciled: 98_750_000,
        total_amount_pending: 0,
        avg_resolution_time_seconds: 95,
        session_duration_minutes: 150,
      },
      unresolved_count: 0,
      total_transactions: 9,
      resolved_count: 9,
    },
  ];
}

// ---------------------------------------------------------------------------
// Mock items (25 items for the active session)
// ---------------------------------------------------------------------------
function generateMockItems(_sessionId: string): ReconciliationItem[] {
  return [
    {
      id: 'item-001',
      session_id: _sessionId,
      transaction_id: 'txn-r001',
      type: 'bank_transaction',
      date: '2026-03-20',
      amount: -12_500_000,
      description: 'Paiement facture SOGECI BTP — Travaux facade',
      counterparty: 'SOGECI BTP',
      reference: 'VIR-2026-03-0147',
      status: 'validated',
      resolution: {
        resolved_by: 'user-001',
        resolved_by_name: 'Aniela',
        resolved_at: '2026-03-21T08:15:00Z',
        action: 'matched',
        notes: 'Correspondance exacte avec le flux sortant F-0147',
      },
      comments: [],
    },
    {
      id: 'item-002',
      session_id: _sessionId,
      transaction_id: 'txn-r002',
      type: 'bank_transaction',
      date: '2026-03-19',
      amount: 45_000_000,
      description: 'Encaissement loyer Tour Ivoire — Mars 2026',
      counterparty: 'SCI TOUR IVOIRE',
      reference: 'ENC-2026-03-0089',
      status: 'validated',
      resolution: {
        resolved_by: 'user-002',
        resolved_by_name: 'Koné',
        resolved_at: '2026-03-21T08:22:00Z',
        action: 'matched',
      },
      comments: [],
    },
    {
      id: 'item-003',
      session_id: _sessionId,
      transaction_id: 'txn-r003',
      type: 'bank_transaction',
      date: '2026-03-19',
      amount: -8_750_000,
      description: 'Règlement SODECI — Eau bureaux Plateau',
      counterparty: 'SODECI',
      reference: 'VIR-2026-03-0142',
      status: 'in_progress',
      locked_by: 'user-001',
      locked_by_name: 'Aniela',
      locked_at: '2026-03-21T10:40:00Z',
      comments: [
        {
          id: 'cmt-001',
          user_id: 'user-002',
          user_name: 'Koné',
          content: 'Le montant ne correspond pas exactement au contrat. Vérifier avec la compta.',
          created_at: '2026-03-21T09:30:00Z',
        },
      ],
    },
    {
      id: 'item-004',
      session_id: _sessionId,
      transaction_id: 'txn-r004',
      type: 'bank_transaction',
      date: '2026-03-18',
      amount: -3_200_000,
      description: 'Prélèvement CIE électricité',
      counterparty: 'CIE',
      reference: 'PRE-2026-03-0055',
      status: 'proposed',
      proposed_match: {
        proposed_by: 'user-002',
        proposed_by_name: 'Koné',
        proposed_at: '2026-03-21T09:45:00Z',
        matched_flow_id: 'flow-cie-q1',
        matched_flow_label: 'Charges électricité Q1-2026',
        match_type: 'approximate',
        confidence: 0.78,
        notes: 'Montant proche du prévisionnel (3 150 000 FCFA)',
      },
      comments: [],
    },
    {
      id: 'item-005',
      session_id: _sessionId,
      transaction_id: 'txn-r005',
      type: 'bank_transaction',
      date: '2026-03-18',
      amount: -1_850_000,
      description: 'Chèque n.8812 — Fournitures bureau',
      counterparty: 'PAPETERIE ABIDJAN',
      reference: 'CHQ-2026-03-8812',
      status: 'pending',
      comments: [],
    },
    {
      id: 'item-006',
      session_id: _sessionId,
      transaction_id: 'txn-r006',
      type: 'bank_transaction',
      date: '2026-03-17',
      amount: 22_000_000,
      description: 'Versement client SIFCA — Contrat maintenance',
      counterparty: 'SIFCA SA',
      reference: 'ENC-2026-03-0076',
      status: 'validated',
      resolution: {
        resolved_by: 'user-001',
        resolved_by_name: 'Aniela',
        resolved_at: '2026-03-21T08:35:00Z',
        action: 'matched',
      },
      comments: [],
    },
    {
      id: 'item-007',
      session_id: _sessionId,
      transaction_id: 'txn-r007',
      type: 'bank_transaction',
      date: '2026-03-17',
      amount: -5_400_000,
      description: 'Salaires Mars 2026 — Acompte',
      counterparty: 'PERSONNEL',
      reference: 'VIR-2026-03-0138',
      status: 'in_progress',
      locked_by: 'user-002',
      locked_by_name: 'Koné',
      locked_at: '2026-03-21T10:38:00Z',
      comments: [
        {
          id: 'cmt-002',
          user_id: 'user-001',
          user_name: 'Aniela',
          content: 'C\'est un acompte sur salaires, pas le virement principal. Créer un nouveau flux.',
          created_at: '2026-03-21T09:50:00Z',
        },
        {
          id: 'cmt-003',
          user_id: 'user-002',
          user_name: 'Koné',
          content: 'D\'accord, je m\'en occupe.',
          created_at: '2026-03-21T09:52:00Z',
        },
      ],
    },
    {
      id: 'item-008',
      session_id: _sessionId,
      transaction_id: 'txn-r008',
      type: 'bank_transaction',
      date: '2026-03-16',
      amount: -750_000,
      description: 'Commission bancaire — Gestion compte',
      counterparty: 'SGBCI',
      reference: 'COM-2026-03-0012',
      status: 'skipped',
      resolution: {
        resolved_by: 'user-003',
        resolved_by_name: 'Fatou',
        resolved_at: '2026-03-21T09:10:00Z',
        action: 'skipped',
        notes: 'Commission récurrente, à traiter en batch',
      },
      comments: [],
    },
    {
      id: 'item-009',
      session_id: _sessionId,
      transaction_id: 'txn-r009',
      type: 'bank_transaction',
      date: '2026-03-15',
      amount: 15_500_000,
      description: 'Paiement Orange CI — Contrat télécom',
      counterparty: 'ORANGE CI',
      reference: 'ENC-2026-03-0062',
      status: 'validated',
      resolution: {
        resolved_by: 'user-003',
        resolved_by_name: 'Fatou',
        resolved_at: '2026-03-21T09:15:00Z',
        action: 'matched',
      },
      comments: [],
    },
    {
      id: 'item-010',
      session_id: _sessionId,
      transaction_id: 'txn-r010',
      type: 'bank_transaction',
      date: '2026-03-15',
      amount: -2_100_000,
      description: 'Assurance locaux NSIA — Prime Q1',
      counterparty: 'NSIA ASSURANCES',
      reference: 'VIR-2026-03-0125',
      status: 'rejected',
      resolution: {
        resolved_by: 'user-001',
        resolved_by_name: 'Aniela',
        resolved_at: '2026-03-21T09:25:00Z',
        action: 'rejected',
        notes: 'Doublon détecté — déjà comptabilisé en février',
      },
      comments: [
        {
          id: 'cmt-004',
          user_id: 'user-003',
          user_name: 'Fatou',
          content: 'Vérifié : c\'est bien un doublon, la prime Q1 a été payée le 28/02.',
          created_at: '2026-03-21T09:28:00Z',
        },
      ],
    },
    {
      id: 'item-011',
      session_id: _sessionId,
      transaction_id: 'txn-r011',
      type: 'bank_transaction',
      date: '2026-03-14',
      amount: 8_350_000,
      description: 'Virement reçu — Remboursement TVA',
      counterparty: 'DGI',
      reference: 'TVA-2026-03-001',
      status: 'validated',
      resolution: {
        resolved_by: 'user-002',
        resolved_by_name: 'Koné',
        resolved_at: '2026-03-21T08:50:00Z',
        action: 'matched',
      },
      comments: [],
    },
    {
      id: 'item-012',
      session_id: _sessionId,
      transaction_id: 'txn-r012',
      type: 'bank_transaction',
      date: '2026-03-14',
      amount: -6_200_000,
      description: 'Paiement fournisseur CIMAF — Ciment',
      counterparty: 'CIMAF CI',
      reference: 'VIR-2026-03-0118',
      status: 'validated',
      resolution: {
        resolved_by: 'user-001',
        resolved_by_name: 'Aniela',
        resolved_at: '2026-03-21T08:55:00Z',
        action: 'matched',
      },
      comments: [],
    },
    {
      id: 'item-013',
      session_id: _sessionId,
      transaction_id: 'txn-r013',
      type: 'bank_transaction',
      date: '2026-03-13',
      amount: -4_500_000,
      description: 'Location matériel BTP — Engins mars',
      counterparty: 'MATFORCE',
      reference: 'VIR-2026-03-0112',
      status: 'proposed',
      proposed_match: {
        proposed_by: 'user-003',
        proposed_by_name: 'Fatou',
        proposed_at: '2026-03-21T09:35:00Z',
        matched_flow_id: 'flow-matforce-mars',
        matched_flow_label: 'Location engins chantier Cocody',
        match_type: 'exact',
        confidence: 0.95,
      },
      comments: [],
    },
    {
      id: 'item-014',
      session_id: _sessionId,
      transaction_id: 'txn-r014',
      type: 'bank_transaction',
      date: '2026-03-13',
      amount: 32_000_000,
      description: 'Encaissement Bolloré — Transport maritime',
      counterparty: 'BOLLORE LOGISTICS',
      reference: 'ENC-2026-03-0055',
      status: 'validated',
      resolution: {
        resolved_by: 'user-002',
        resolved_by_name: 'Koné',
        resolved_at: '2026-03-21T09:00:00Z',
        action: 'matched',
      },
      comments: [],
    },
    {
      id: 'item-015',
      session_id: _sessionId,
      transaction_id: 'txn-r015',
      type: 'bank_transaction',
      date: '2026-03-12',
      amount: -1_250_000,
      description: 'Abonnement Internet — Moov Africa',
      counterparty: 'MOOV AFRICA',
      reference: 'PRE-2026-03-0048',
      status: 'pending',
      comments: [],
    },
    {
      id: 'item-016',
      session_id: _sessionId,
      transaction_id: 'txn-r016',
      type: 'bank_transaction',
      date: '2026-03-12',
      amount: -9_800_000,
      description: 'Honoraires cabinet juridique',
      counterparty: 'CABINET DIALLO & ASSOCIES',
      reference: 'VIR-2026-03-0105',
      status: 'validated',
      resolution: {
        resolved_by: 'user-001',
        resolved_by_name: 'Aniela',
        resolved_at: '2026-03-21T09:05:00Z',
        action: 'created_new',
        notes: 'Nouveau flux créé : Honoraires juridiques contentieux Plateau',
      },
      comments: [],
    },
    {
      id: 'item-017',
      session_id: _sessionId,
      transaction_id: 'txn-r017',
      type: 'bank_transaction',
      date: '2026-03-11',
      amount: 18_750_000,
      description: 'Encaissement client Petroci — Maintenance',
      counterparty: 'PETROCI',
      reference: 'ENC-2026-03-0042',
      status: 'validated',
      resolution: {
        resolved_by: 'user-003',
        resolved_by_name: 'Fatou',
        resolved_at: '2026-03-21T09:20:00Z',
        action: 'matched',
      },
      comments: [],
    },
    {
      id: 'item-018',
      session_id: _sessionId,
      transaction_id: 'txn-r018',
      type: 'bank_transaction',
      date: '2026-03-11',
      amount: -2_800_000,
      description: 'Frais de gardiennage — SECURIFORCE',
      counterparty: 'SECURIFORCE SARL',
      reference: 'VIR-2026-03-0098',
      status: 'pending',
      comments: [],
    },
    {
      id: 'item-019',
      session_id: _sessionId,
      transaction_id: 'txn-r019',
      type: 'bank_transaction',
      date: '2026-03-10',
      amount: -15_000_000,
      description: 'Acompte sous-traitant — SADEM',
      counterparty: 'SADEM SA',
      reference: 'VIR-2026-03-0092',
      status: 'skipped',
      resolution: {
        resolved_by: 'user-002',
        resolved_by_name: 'Koné',
        resolved_at: '2026-03-21T09:40:00Z',
        action: 'skipped',
        notes: 'En attente confirmation du bon de commande',
      },
      comments: [],
    },
    {
      id: 'item-020',
      session_id: _sessionId,
      transaction_id: 'txn-r020',
      type: 'bank_transaction',
      date: '2026-03-10',
      amount: 12_000_000,
      description: 'Versement MTN CI — Contrat réseau',
      counterparty: 'MTN CI',
      reference: 'ENC-2026-03-0035',
      status: 'validated',
      resolution: {
        resolved_by: 'user-001',
        resolved_by_name: 'Aniela',
        resolved_at: '2026-03-21T08:40:00Z',
        action: 'matched',
      },
      comments: [],
    },
    {
      id: 'item-021',
      session_id: _sessionId,
      transaction_id: 'txn-r021',
      type: 'bank_transaction',
      date: '2026-03-09',
      amount: -3_750_000,
      description: 'Entretien véhicules — CFAO Motors',
      counterparty: 'CFAO MOTORS',
      reference: 'VIR-2026-03-0085',
      status: 'rejected',
      resolution: {
        resolved_by: 'user-003',
        resolved_by_name: 'Fatou',
        resolved_at: '2026-03-21T09:45:00Z',
        action: 'rejected',
        notes: 'Facture non conforme — retour au fournisseur',
      },
      comments: [],
    },
    {
      id: 'item-022',
      session_id: _sessionId,
      transaction_id: 'txn-r022',
      type: 'bank_transaction',
      date: '2026-03-08',
      amount: 7_500_000,
      description: 'Encaissement AVR — Prestation conseil',
      counterparty: 'AVR CONSULTING',
      reference: 'ENC-2026-03-0028',
      status: 'validated',
      resolution: {
        resolved_by: 'user-002',
        resolved_by_name: 'Koné',
        resolved_at: '2026-03-21T09:55:00Z',
        action: 'matched',
      },
      comments: [],
    },
    {
      id: 'item-023',
      session_id: _sessionId,
      transaction_id: 'txn-r023',
      type: 'bank_transaction',
      date: '2026-03-07',
      amount: -850_000,
      description: 'Frais bancaires — Tenue de compte',
      counterparty: 'SGBCI',
      reference: 'COM-2026-03-0008',
      status: 'pending',
      comments: [],
    },
    {
      id: 'item-024',
      session_id: _sessionId,
      transaction_id: 'txn-r024',
      type: 'unidentified',
      date: '2026-03-06',
      amount: -2_350_000,
      description: 'Virement non identifié — Réf. interne manquante',
      reference: 'VIR-2026-03-0072',
      status: 'pending',
      comments: [
        {
          id: 'cmt-005',
          user_id: 'user-001',
          user_name: 'Aniela',
          content: 'Qui peut vérifier cette opération ? Pas de contrepartie identifiée.',
          created_at: '2026-03-21T10:00:00Z',
        },
      ],
    },
    {
      id: 'item-025',
      session_id: _sessionId,
      transaction_id: 'txn-r025',
      type: 'bank_transaction',
      date: '2026-03-05',
      amount: 25_000_000,
      description: 'Encaissement Sotra — Contrat transport',
      counterparty: 'SOTRA',
      reference: 'ENC-2026-03-0020',
      status: 'validated',
      resolution: {
        resolved_by: 'user-001',
        resolved_by_name: 'Aniela',
        resolved_at: '2026-03-21T08:45:00Z',
        action: 'matched',
      },
      comments: [],
    },
  ];
}

// ---------------------------------------------------------------------------
// Mock chat messages
// ---------------------------------------------------------------------------
function generateMockChatMessages(_sessionId: string): ChatMessage[] {
  return [
    {
      id: 'msg-001',
      session_id: _sessionId,
      user_id: 'user-001',
      user_name: 'Aniela',
      content: 'Bonjour ! J\'ai démarré la session de réconciliation pour le relevé SGBCI de mars.',
      timestamp: '2026-03-21T08:00:00Z',
    },
    {
      id: 'msg-002',
      session_id: _sessionId,
      user_id: 'user-002',
      user_name: 'Koné',
      content: 'Bien reçu. Je prends en charge les encaissements clients.',
      timestamp: '2026-03-21T08:16:00Z',
    },
    {
      id: 'msg-003',
      session_id: _sessionId,
      user_id: 'user-003',
      user_name: 'Fatou',
      content: 'Je suis là aussi. Je vais traiter les commissions bancaires et frais récurrents.',
      timestamp: '2026-03-21T09:01:00Z',
    },
    {
      id: 'msg-004',
      session_id: _sessionId,
      user_id: 'user-001',
      user_name: 'Aniela',
      content: 'Attention au poste NSIA Assurances — il y a un doublon avec février. J\'ai rejeté la ligne.',
      timestamp: '2026-03-21T09:26:00Z',
    },
    {
      id: 'msg-005',
      session_id: _sessionId,
      user_id: 'user-002',
      user_name: 'Koné',
      content: 'OK noté. Pour les salaires (item-007), c\'est un acompte exceptionnel, il faut créer un nouveau flux.',
      timestamp: '2026-03-21T09:51:00Z',
    },
    {
      id: 'msg-006',
      session_id: _sessionId,
      user_id: 'user-003',
      user_name: 'Fatou',
      content: 'La commission bancaire est récurrente, je l\'ignore pour le traitement en batch de fin de mois.',
      timestamp: '2026-03-21T09:12:00Z',
    },
    {
      id: 'msg-007',
      session_id: _sessionId,
      user_id: 'user-001',
      user_name: 'Aniela',
      content: 'Il reste 6 éléments non résolus. On avance bien !',
      timestamp: '2026-03-21T10:30:00Z',
    },
    {
      id: 'msg-008',
      session_id: _sessionId,
      user_id: 'user-002',
      user_name: 'Koné',
      content: 'Je m\'occupe de l\'acompte SADEM dès que j\'ai le bon de commande.',
      timestamp: '2026-03-21T10:35:00Z',
    },
  ];
}

// ---------------------------------------------------------------------------
// Suggested matches for workspace
// ---------------------------------------------------------------------------
const SUGGESTED_MATCHES: Record<string, Array<{
  flow_id: string;
  flow_label: string;
  match_type: 'exact' | 'approximate' | 'split' | 'new_flow';
  confidence: number;
}>> = {
  'item-003': [
    { flow_id: 'flow-sodeci-q1', flow_label: 'Charges eau Plateau Q1-2026', match_type: 'approximate', confidence: 0.72 },
    { flow_id: 'flow-sodeci-feb', flow_label: 'Eau bureaux — Février 2026', match_type: 'approximate', confidence: 0.55 },
  ],
  'item-005': [
    { flow_id: 'flow-fournitures-mars', flow_label: 'Fournitures bureau — Mars 2026', match_type: 'exact', confidence: 0.88 },
  ],
  'item-015': [
    { flow_id: 'flow-internet-mars', flow_label: 'Abonnement Moov — Mars 2026', match_type: 'exact', confidence: 0.92 },
    { flow_id: 'flow-internet-feb', flow_label: 'Abonnement Moov — Février 2026', match_type: 'approximate', confidence: 0.45 },
  ],
  'item-018': [
    { flow_id: 'flow-securiforce-q1', flow_label: 'Gardiennage chantier Q1', match_type: 'approximate', confidence: 0.68 },
  ],
  'item-023': [
    { flow_id: 'flow-frais-sgbci', flow_label: 'Frais bancaires SGBCI — récurrent', match_type: 'exact', confidence: 0.90 },
  ],
  'item-024': [],
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------
export const reconciliationService = {
  async getSessions(companyId: string): Promise<ReconciliationSession[]> {
    await delay(300);
    return generateMockSessions(companyId);
  },

  async getSession(sessionId: string): Promise<ReconciliationSession> {
    await delay(200);
    const sessions = generateMockSessions('company-001');
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error('Session not found');
    return session;
  },

  async createSession(accountId: string): Promise<ReconciliationSession> {
    await delay(400);
    return {
      id: `recon-${Date.now()}`,
      tenant_id: 'tenant-001',
      company_id: 'company-001',
      account_id: accountId,
      account_name: 'Nouveau compte',
      status: 'active',
      created_by: 'user-001',
      created_at: new Date().toISOString(),
      participants: [MOCK_PARTICIPANTS[0]],
      metrics: {
        total_items: 0,
        auto_matched: 0,
        manual_matched: 0,
        pending: 0,
        skipped: 0,
        rejected: 0,
        total_amount_reconciled: 0,
        total_amount_pending: 0,
        avg_resolution_time_seconds: 0,
        session_duration_minutes: 0,
      },
      unresolved_count: 0,
      total_transactions: 0,
      resolved_count: 0,
    };
  },

  async joinSession(_sessionId: string): Promise<SessionParticipant> {
    await delay(200);
    return MOCK_PARTICIPANTS[0];
  },

  async leaveSession(_sessionId: string): Promise<void> {
    await delay(200);
  },

  async getSessionItems(
    sessionId: string,
    filter?: ReconciliationItemStatus | 'all',
  ): Promise<ReconciliationItem[]> {
    await delay(300);
    const items = generateMockItems(sessionId);
    if (!filter || filter === 'all') return items;
    return items.filter((i) => i.status === filter);
  },

  async lockItem(_itemId: string): Promise<void> {
    await delay(150);
  },

  async unlockItem(_itemId: string): Promise<void> {
    await delay(150);
  },

  async proposeMatch(
    _itemId: string,
    _data: { flow_id: string; flow_label: string; match_type: string; confidence: number; notes?: string },
  ): Promise<void> {
    await delay(300);
  },

  async validateProposal(_itemId: string): Promise<void> {
    await delay(200);
  },

  async rejectProposal(_itemId: string, _reason: string): Promise<void> {
    await delay(200);
  },

  async resolveItem(_itemId: string, _action: string, _notes?: string): Promise<void> {
    await delay(200);
  },

  async skipItem(_itemId: string, _reason?: string): Promise<void> {
    await delay(200);
  },

  async addComment(_itemId: string, _content: string): Promise<void> {
    await delay(200);
  },

  async getSessionMetrics(_sessionId: string): Promise<SessionMetrics> {
    await delay(200);
    return MOCK_METRICS;
  },

  async completeSession(_sessionId: string): Promise<void> {
    await delay(400);
  },

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    await delay(200);
    return generateMockChatMessages(sessionId);
  },

  async sendChatMessage(_sessionId: string, _content: string): Promise<ChatMessage> {
    await delay(200);
    return {
      id: `msg-${Date.now()}`,
      session_id: _sessionId,
      user_id: 'user-001',
      user_name: 'Aniela',
      content: _content,
      timestamp: new Date().toISOString(),
    };
  },

  getSuggestedMatches(itemId: string) {
    return SUGGESTED_MATCHES[itemId] ?? [];
  },
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
