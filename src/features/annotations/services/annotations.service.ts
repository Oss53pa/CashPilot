import { supabase } from '@/config/supabase';
import type {
  Annotation,
  AnnotationFilter,
  AnnotationFormData,
  AnnotationStats,
  AnnotationThread,
} from '../types';

// ---------------------------------------------------------------------------
// Service — queries the `annotations` table in Supabase
// ---------------------------------------------------------------------------
export const annotationsService = {
  async getAnnotations(
    companyId: string,
    filter?: AnnotationFilter,
  ): Promise<Annotation[]> {
    let query = supabase
      .from('annotations')
      .select('*')
      .eq('company_id', companyId)
      .is('parent_id', null)
      .order('created_at', { ascending: false });

    if (filter?.entity_type) {
      query = query.eq('entity_type', filter.entity_type);
    }
    if (filter?.entity_id) {
      query = query.eq('entity_id', filter.entity_id);
    }
    if (filter?.author_id) {
      query = query.eq('author_id', filter.author_id);
    }
    if (filter?.type) {
      query = query.eq('type', filter.type);
    }
    if (filter?.visibility) {
      query = query.eq('visibility', filter.visibility);
    }
    if (filter?.is_resolved !== undefined) {
      query = query.eq('is_resolved', filter.is_resolved);
    }
    if (filter?.date_from) {
      query = query.gte('created_at', filter.date_from);
    }
    if (filter?.date_to) {
      query = query.lte('created_at', filter.date_to);
    }
    if (filter?.search) {
      query = query.ilike('content', `%${filter.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  async getAnnotationThread(annotationId: string): Promise<AnnotationThread> {
    // Fetch root
    const { data: root, error: rootError } = await supabase
      .from('annotations')
      .select('*')
      .eq('id', annotationId)
      .single();
    if (rootError) throw rootError;
    if (!root) throw new Error('Annotation introuvable');

    // Fetch replies
    const { data: replies, error: repliesError } = await supabase
      .from('annotations')
      .select('*')
      .eq('parent_id', annotationId)
      .order('created_at', { ascending: true });
    if (repliesError) throw repliesError;

    return { root: root as Annotation, replies: (replies ?? []) as Annotation[] };
  },

  async getAnnotationsForEntity(
    entityType: string,
    entityId: string,
  ): Promise<Annotation[]> {
    const { data, error } = await supabase
      .from('annotations')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .is('parent_id', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Annotation[];
  },

  async createAnnotation(data: AnnotationFormData): Promise<Annotation> {
    const { data: currentUser } = await supabase.auth.getUser();
    const userId = currentUser?.user?.id ?? '';

    // Fetch user profile for author_name
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name, avatar_url')
      .eq('id', userId)
      .maybeSingle();

    const row = {
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      entity_label: data.entity_label,
      parent_id: data.parent_id ?? null,
      author_id: userId,
      author_name: profile?.full_name ?? 'Utilisateur',
      author_avatar: profile?.avatar_url ?? null,
      type: data.type,
      content: data.content,
      tags: data.tags ?? null,
      flag_level: data.flag_level ?? null,
      document_url: data.document_url ?? null,
      mentioned_user_ids: data.mentioned_user_ids ?? null,
      visibility: data.visibility,
      is_resolved: false,
      replies_count: 0,
    };

    const { data: created, error } = await supabase
      .from('annotations')
      .insert(row)
      .select()
      .single();
    if (error) throw error;

    // Update parent replies_count
    if (data.parent_id) {
      await supabase.rpc('increment_annotation_replies', { annotation_id: data.parent_id }).catch(() => {
        // If RPC doesn't exist, try manual update
        supabase
          .from('annotations')
          .update({ replies_count: supabase.rpc ? undefined : 0 })
          .eq('id', data.parent_id!)
          .then(() => {});
      });
    }

    return created as Annotation;
  },

  async updateAnnotation(id: string, content: string): Promise<Annotation> {
    const { data, error } = await supabase
      .from('annotations')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Annotation;
  },

  async deleteAnnotation(id: string): Promise<void> {
    // Delete replies first
    await supabase.from('annotations').delete().eq('parent_id', id);
    const { error } = await supabase.from('annotations').delete().eq('id', id);
    if (error) throw error;
  },

  async resolveAnnotation(id: string, note?: string): Promise<Annotation> {
    const { data: currentUser } = await supabase.auth.getUser();
    const userId = currentUser?.user?.id ?? '';

    const { data, error } = await supabase
      .from('annotations')
      .update({
        is_resolved: true,
        resolved_by: userId,
        resolved_at: new Date().toISOString(),
        resolution_note: note ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Annotation;
  },

  async unresolveAnnotation(id: string): Promise<Annotation> {
    const { data, error } = await supabase
      .from('annotations')
      .update({
        is_resolved: false,
        resolved_by: null,
        resolved_at: null,
        resolution_note: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Annotation;
  },

  async getAnnotationStats(companyId: string): Promise<AnnotationStats> {
    const { data: all, error } = await supabase
      .from('annotations')
      .select('*')
      .eq('company_id', companyId)
      .is('parent_id', null)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const annotations = (all ?? []) as Annotation[];
    const unresolved = annotations.filter((a) => !a.is_resolved);
    const flagsCritical = annotations.filter(
      (a) => a.type === 'flag' && a.flag_level === 'critical' && !a.is_resolved,
    );
    const flagsWarning = annotations.filter(
      (a) => a.type === 'flag' && a.flag_level === 'warning' && !a.is_resolved,
    );

    const { data: currentUser } = await supabase.auth.getUser();
    const userId = currentUser?.user?.id ?? '';
    const mentionsUnread = annotations.filter(
      (a) => a.mentioned_user_ids?.includes(userId) && !a.is_resolved,
    );

    const recent = annotations.slice(0, 5);

    return {
      total: annotations.length,
      unresolved: unresolved.length,
      flags_critical: flagsCritical.length,
      flags_warning: flagsWarning.length,
      mentions_unread: mentionsUnread.length,
      recent,
    };
  },

  async searchAnnotations(companyId: string, query: string): Promise<Annotation[]> {
    return this.getAnnotations(companyId, { search: query });
  },

  async getMyMentions(userId: string): Promise<Annotation[]> {
    const { data, error } = await supabase
      .from('annotations')
      .select('*')
      .contains('mentioned_user_ids', [userId])
      .is('parent_id', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Annotation[];
  },

  async getMyAnnotationFeed(userId: string): Promise<Annotation[]> {
    // Annotations where user is author or mentioned
    const { data: authored, error: authError } = await supabase
      .from('annotations')
      .select('*')
      .eq('author_id', userId)
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .limit(50);
    if (authError) throw authError;

    const { data: mentioned, error: mentionError } = await supabase
      .from('annotations')
      .select('*')
      .contains('mentioned_user_ids', [userId])
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .limit(50);
    if (mentionError) throw mentionError;

    // Merge and deduplicate
    const allAnnotations = [...(authored ?? []), ...(mentioned ?? [])] as Annotation[];
    const seen = new Set<string>();
    const unique = allAnnotations.filter((a) => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });

    return unique.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  },

  /** Get the list of users for @mention autocomplete */
  async getUsers(): Promise<{ id: string; name: string; avatar?: string }[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, full_name, avatar_url')
      .eq('is_active', true)
      .order('full_name');
    if (error) throw error;

    return (data ?? []).map((u) => ({
      id: u.id,
      name: u.full_name,
      avatar: u.avatar_url ?? undefined,
    }));
  },
};
