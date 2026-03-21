import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { annotationsService } from '../services/annotations.service';
import type { AnnotationFilter, AnnotationFormData } from '../types';

const KEYS = {
  all: ['annotations'] as const,
  list: (companyId: string, filter?: AnnotationFilter) =>
    [...KEYS.all, 'list', companyId, filter] as const,
  thread: (id: string) => [...KEYS.all, 'thread', id] as const,
  entity: (entityType: string, entityId: string) =>
    [...KEYS.all, 'entity', entityType, entityId] as const,
  stats: (companyId: string) => [...KEYS.all, 'stats', companyId] as const,
  search: (companyId: string, query: string) =>
    [...KEYS.all, 'search', companyId, query] as const,
  mentions: (userId: string) => [...KEYS.all, 'mentions', userId] as const,
  feed: (userId: string) => [...KEYS.all, 'feed', userId] as const,
  users: () => [...KEYS.all, 'users'] as const,
};

export function useAnnotations(companyId: string, filter?: AnnotationFilter) {
  return useQuery({
    queryKey: KEYS.list(companyId, filter),
    queryFn: () => annotationsService.getAnnotations(companyId, filter),
    enabled: !!companyId,
  });
}

export function useAnnotationThread(annotationId: string) {
  return useQuery({
    queryKey: KEYS.thread(annotationId),
    queryFn: () => annotationsService.getAnnotationThread(annotationId),
    enabled: !!annotationId,
  });
}

export function useAnnotationsForEntity(entityType: string, entityId: string) {
  return useQuery({
    queryKey: KEYS.entity(entityType, entityId),
    queryFn: () => annotationsService.getAnnotationsForEntity(entityType, entityId),
    enabled: !!entityType && !!entityId,
  });
}

export function useAnnotationStats(companyId: string) {
  return useQuery({
    queryKey: KEYS.stats(companyId),
    queryFn: () => annotationsService.getAnnotationStats(companyId),
    enabled: !!companyId,
  });
}

export function useSearchAnnotations(companyId: string, query: string) {
  return useQuery({
    queryKey: KEYS.search(companyId, query),
    queryFn: () => annotationsService.searchAnnotations(companyId, query),
    enabled: !!companyId && query.length >= 2,
  });
}

export function useMyMentions(userId: string) {
  return useQuery({
    queryKey: KEYS.mentions(userId),
    queryFn: () => annotationsService.getMyMentions(userId),
    enabled: !!userId,
  });
}

export function useMyAnnotationFeed(userId: string) {
  return useQuery({
    queryKey: KEYS.feed(userId),
    queryFn: () => annotationsService.getMyAnnotationFeed(userId),
    enabled: !!userId,
  });
}

export function useAnnotationUsers() {
  return useQuery({
    queryKey: KEYS.users(),
    queryFn: () => annotationsService.getUsers(),
  });
}

export function useCreateAnnotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AnnotationFormData) => annotationsService.createAnnotation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useUpdateAnnotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      annotationsService.updateAnnotation(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useDeleteAnnotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => annotationsService.deleteAnnotation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useResolveAnnotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      annotationsService.resolveAnnotation(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useUnresolveAnnotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => annotationsService.unresolveAnnotation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}
