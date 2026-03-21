import { supabase } from '@/config/supabase';
import type {
  ReconciliationSession,
  ReconciliationItem,
  SessionMetrics,
  ChatMessage,
  SessionParticipant,
  ReconciliationItemStatus,
} from '../types';

// ---------------------------------------------------------------------------
// Service — queries reconciliation_sessions, reconciliation_items, etc.
// Tables may not exist yet; queries will return empty arrays until migration.
// ---------------------------------------------------------------------------

function emptyMetrics(): SessionMetrics {
  return {
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
  };
}

export const reconciliationService = {
  async getSessions(companyId: string): Promise<ReconciliationSession[]> {
    const { data, error } = await supabase
      .from('reconciliation_sessions')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map((s) => ({
      ...s,
      participants: s.participants ?? [],
      metrics: s.metrics ?? emptyMetrics(),
      unresolved_count: s.unresolved_count ?? 0,
      total_transactions: s.total_transactions ?? 0,
      resolved_count: s.resolved_count ?? 0,
    })) as ReconciliationSession[];
  },

  async getSession(sessionId: string): Promise<ReconciliationSession> {
    const { data, error } = await supabase
      .from('reconciliation_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Session not found');
    return {
      ...data,
      participants: data.participants ?? [],
      metrics: data.metrics ?? emptyMetrics(),
      unresolved_count: data.unresolved_count ?? 0,
      total_transactions: data.total_transactions ?? 0,
      resolved_count: data.resolved_count ?? 0,
    } as ReconciliationSession;
  },

  async createSession(accountId: string): Promise<ReconciliationSession> {
    const { data: currentUser } = await supabase.auth.getUser();
    const userId = currentUser?.user?.id ?? '';

    // Get account info
    const { data: account } = await supabase
      .from('bank_accounts')
      .select('id, account_name, company_id')
      .eq('id', accountId)
      .single();

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name, tenant_id')
      .eq('id', userId)
      .maybeSingle();

    const participant: SessionParticipant = {
      user_id: userId,
      user_name: profile?.full_name ?? 'Utilisateur',
      avatar_initial: (profile?.full_name ?? 'U')[0],
      color: '#6366f1',
      role: 'owner',
      joined_at: new Date().toISOString(),
      last_active: new Date().toISOString(),
      is_online: true,
    };

    const { data, error } = await supabase
      .from('reconciliation_sessions')
      .insert({
        tenant_id: profile?.tenant_id ?? '',
        company_id: account?.company_id ?? '',
        account_id: accountId,
        account_name: account?.account_name ?? '',
        status: 'active',
        created_by: userId,
        participants: [participant],
        metrics: emptyMetrics(),
        unresolved_count: 0,
        total_transactions: 0,
        resolved_count: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data as ReconciliationSession;
  },

  async joinSession(sessionId: string): Promise<SessionParticipant> {
    const { data: currentUser } = await supabase.auth.getUser();
    const userId = currentUser?.user?.id ?? '';

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', userId)
      .maybeSingle();

    const participant: SessionParticipant = {
      user_id: userId,
      user_name: profile?.full_name ?? 'Utilisateur',
      avatar_initial: (profile?.full_name ?? 'U')[0],
      color: '#f59e0b',
      role: 'participant',
      joined_at: new Date().toISOString(),
      last_active: new Date().toISOString(),
      is_online: true,
    };

    // Append participant to session
    const { data: session } = await supabase
      .from('reconciliation_sessions')
      .select('participants')
      .eq('id', sessionId)
      .single();

    const participants = [...(session?.participants ?? []), participant];
    await supabase
      .from('reconciliation_sessions')
      .update({ participants })
      .eq('id', sessionId);

    return participant;
  },

  async leaveSession(sessionId: string): Promise<void> {
    const { data: currentUser } = await supabase.auth.getUser();
    const userId = currentUser?.user?.id ?? '';

    const { data: session } = await supabase
      .from('reconciliation_sessions')
      .select('participants')
      .eq('id', sessionId)
      .single();

    const participants = ((session?.participants ?? []) as SessionParticipant[]).map((p) =>
      p.user_id === userId ? { ...p, is_online: false } : p,
    );

    await supabase
      .from('reconciliation_sessions')
      .update({ participants })
      .eq('id', sessionId);
  },

  async getSessionItems(
    sessionId: string,
    filter?: ReconciliationItemStatus | 'all',
  ): Promise<ReconciliationItem[]> {
    let query = supabase
      .from('reconciliation_items')
      .select('*')
      .eq('session_id', sessionId)
      .order('date', { ascending: false });

    if (filter && filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as ReconciliationItem[];
  },

  async lockItem(itemId: string): Promise<void> {
    const { data: currentUser } = await supabase.auth.getUser();
    const userId = currentUser?.user?.id ?? '';

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', userId)
      .maybeSingle();

    const { error } = await supabase
      .from('reconciliation_items')
      .update({
        status: 'in_progress',
        locked_by: userId,
        locked_by_name: profile?.full_name ?? 'Utilisateur',
        locked_at: new Date().toISOString(),
      })
      .eq('id', itemId);
    if (error) throw error;
  },

  async unlockItem(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('reconciliation_items')
      .update({
        status: 'pending',
        locked_by: null,
        locked_by_name: null,
        locked_at: null,
      })
      .eq('id', itemId);
    if (error) throw error;
  },

  async proposeMatch(
    itemId: string,
    matchData: { flow_id: string; flow_label: string; match_type: string; confidence: number; notes?: string },
  ): Promise<void> {
    const { data: currentUser } = await supabase.auth.getUser();
    const userId = currentUser?.user?.id ?? '';

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', userId)
      .maybeSingle();

    const proposed_match = {
      proposed_by: userId,
      proposed_by_name: profile?.full_name ?? 'Utilisateur',
      proposed_at: new Date().toISOString(),
      matched_flow_id: matchData.flow_id,
      matched_flow_label: matchData.flow_label,
      match_type: matchData.match_type,
      confidence: matchData.confidence,
      notes: matchData.notes,
    };

    const { error } = await supabase
      .from('reconciliation_items')
      .update({ status: 'proposed', proposed_match })
      .eq('id', itemId);
    if (error) throw error;
  },

  async validateProposal(itemId: string): Promise<void> {
    const { data: currentUser } = await supabase.auth.getUser();
    const userId = currentUser?.user?.id ?? '';

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', userId)
      .maybeSingle();

    const resolution = {
      resolved_by: userId,
      resolved_by_name: profile?.full_name ?? 'Utilisateur',
      resolved_at: new Date().toISOString(),
      action: 'matched',
    };

    const { error } = await supabase
      .from('reconciliation_items')
      .update({ status: 'validated', resolution })
      .eq('id', itemId);
    if (error) throw error;
  },

  async rejectProposal(itemId: string, reason: string): Promise<void> {
    const { data: currentUser } = await supabase.auth.getUser();
    const userId = currentUser?.user?.id ?? '';

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', userId)
      .maybeSingle();

    const resolution = {
      resolved_by: userId,
      resolved_by_name: profile?.full_name ?? 'Utilisateur',
      resolved_at: new Date().toISOString(),
      action: 'rejected',
      notes: reason,
    };

    const { error } = await supabase
      .from('reconciliation_items')
      .update({ status: 'rejected', resolution, proposed_match: null })
      .eq('id', itemId);
    if (error) throw error;
  },

  async resolveItem(itemId: string, action: string, notes?: string): Promise<void> {
    const { data: currentUser } = await supabase.auth.getUser();
    const userId = currentUser?.user?.id ?? '';

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', userId)
      .maybeSingle();

    const resolution = {
      resolved_by: userId,
      resolved_by_name: profile?.full_name ?? 'Utilisateur',
      resolved_at: new Date().toISOString(),
      action,
      notes,
    };

    const { error } = await supabase
      .from('reconciliation_items')
      .update({ status: 'validated', resolution })
      .eq('id', itemId);
    if (error) throw error;
  },

  async skipItem(itemId: string, reason?: string): Promise<void> {
    const { data: currentUser } = await supabase.auth.getUser();
    const userId = currentUser?.user?.id ?? '';

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', userId)
      .maybeSingle();

    const resolution = {
      resolved_by: userId,
      resolved_by_name: profile?.full_name ?? 'Utilisateur',
      resolved_at: new Date().toISOString(),
      action: 'skipped',
      notes: reason,
    };

    const { error } = await supabase
      .from('reconciliation_items')
      .update({ status: 'skipped', resolution })
      .eq('id', itemId);
    if (error) throw error;
  },

  async addComment(itemId: string, content: string): Promise<void> {
    const { data: currentUser } = await supabase.auth.getUser();
    const userId = currentUser?.user?.id ?? '';

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', userId)
      .maybeSingle();

    // Fetch current comments
    const { data: item } = await supabase
      .from('reconciliation_items')
      .select('comments')
      .eq('id', itemId)
      .single();

    const comments = [
      ...((item?.comments ?? []) as Array<Record<string, unknown>>),
      {
        id: crypto.randomUUID?.() ?? `cmt-${Date.now()}`,
        user_id: userId,
        user_name: profile?.full_name ?? 'Utilisateur',
        content,
        created_at: new Date().toISOString(),
      },
    ];

    const { error } = await supabase
      .from('reconciliation_items')
      .update({ comments })
      .eq('id', itemId);
    if (error) throw error;
  },

  async getSessionMetrics(sessionId: string): Promise<SessionMetrics> {
    const { data: session, error } = await supabase
      .from('reconciliation_sessions')
      .select('metrics')
      .eq('id', sessionId)
      .single();
    if (error) throw error;
    return (session?.metrics as SessionMetrics) ?? emptyMetrics();
  },

  async completeSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('reconciliation_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId);
    if (error) throw error;
  },

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('reconciliation_chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    return (data ?? []) as ChatMessage[];
  },

  async sendChatMessage(sessionId: string, content: string): Promise<ChatMessage> {
    const { data: currentUser } = await supabase.auth.getUser();
    const userId = currentUser?.user?.id ?? '';

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', userId)
      .maybeSingle();

    const { data, error } = await supabase
      .from('reconciliation_chat_messages')
      .insert({
        session_id: sessionId,
        user_id: userId,
        user_name: profile?.full_name ?? 'Utilisateur',
        content,
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as ChatMessage;
  },

  getSuggestedMatches(_itemId: string): Array<{ flow_id: string; flow_label: string; match_type: string; confidence: number }> {
    // Suggested matches require AI/ML matching engine; returns empty until implemented
    return [];
  },
};
