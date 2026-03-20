import { supabase } from '@/config/supabase';

// ============================================================================
// Document Storage Service (Supabase Storage + metadata table)
// ============================================================================

const BUCKET_NAME = 'documents';

export interface DocumentMetadata {
  id: string;
  tenant_id: string;
  company_id: string;
  name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  document_type: 'bank_statement' | 'report' | 'attachment' | 'justificatif' | 'other';
  related_entity_type: string | null;
  related_entity_id: string | null;
  uploaded_by: string | null;
  created_at: string;
}

/**
 * Upload a file to Supabase Storage and create a metadata record.
 */
export async function uploadDocument(
  companyId: string,
  file: File,
  documentType: DocumentMetadata['document_type'],
  relatedEntityType?: string,
  relatedEntityId?: string
): Promise<DocumentMetadata> {
  // Build storage path: {company_id}/{document_type}/{timestamp}_{filename}
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${companyId}/${documentType}/${timestamp}_${safeName}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  // Get user info
  const { data: { user } } = await supabase.auth.getUser();

  // Get tenant_id from user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user?.id)
    .single();

  // Create metadata record
  const { data: doc, error: metaError } = await supabase
    .from('documents')
    .insert({
      tenant_id: profile?.tenant_id,
      company_id: companyId,
      name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type || 'application/octet-stream',
      document_type: documentType,
      related_entity_type: relatedEntityType || null,
      related_entity_id: relatedEntityId || null,
      uploaded_by: user?.id || null,
    })
    .select('*')
    .single();

  if (metaError) throw new Error(`Metadata insert failed: ${metaError.message}`);

  return doc as DocumentMetadata;
}

/**
 * Get a signed download URL for a document.
 */
export async function getDocumentUrl(filePath: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, expiresIn);

  if (error) throw new Error(`Failed to get URL: ${error.message}`);
  return data.signedUrl;
}

/**
 * Download a document as a Blob.
 */
export async function downloadDocument(filePath: string): Promise<Blob> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(filePath);

  if (error) throw new Error(`Download failed: ${error.message}`);
  return data;
}

/**
 * List documents for an entity.
 */
export async function listDocuments(
  companyId: string,
  options?: {
    documentType?: DocumentMetadata['document_type'];
    relatedEntityType?: string;
    relatedEntityId?: string;
    limit?: number;
  }
): Promise<DocumentMetadata[]> {
  let query = supabase
    .from('documents')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (options?.documentType) query = query.eq('document_type', options.documentType);
  if (options?.relatedEntityType) query = query.eq('related_entity_type', options.relatedEntityType);
  if (options?.relatedEntityId) query = query.eq('related_entity_id', options.relatedEntityId);
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;
  return data as DocumentMetadata[];
}

/**
 * Delete a document (storage + metadata).
 */
export async function deleteDocument(documentId: string): Promise<void> {
  // Get metadata to find file path
  const { data: doc, error: getError } = await supabase
    .from('documents')
    .select('file_path')
    .eq('id', documentId)
    .single();

  if (getError) throw getError;

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([doc.file_path]);

  if (storageError) {
    console.error('Storage delete failed:', storageError);
  }

  // Delete metadata
  const { error: metaError } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId);

  if (metaError) throw metaError;
}

/**
 * Format file size for display.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
