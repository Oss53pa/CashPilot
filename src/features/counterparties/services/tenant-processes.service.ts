import { supabase } from '@/config/supabase';

// ============================================================================
// PROCESS 1: Tenant Reminders
// ============================================================================

export interface Reminder {
  id: string;
  counterparty_id: string;
  counterparty_name?: string;
  step: number;
  channel: string;
  status: string;
  amount_due: number;
  interest_amount: number;
  sent_at: string | null;
  response_note: string | null;
  created_at: string;
}

export async function getActiveReminders(companyId: string) {
  const { data, error } = await supabase
    .from('reminders')
    .select('*, counterparties(name)')
    .eq('company_id', companyId)
    .in('status', ['pending', 'sent', 'delivered'])
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getReminderHistory(companyId: string, counterpartyId: string) {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('company_id', companyId)
    .eq('counterparty_id', counterpartyId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function sendReminder(reminder: Partial<Reminder>) {
  const { data, error } = await supabase
    .from('reminders')
    .insert({ ...reminder, status: 'sent', sent_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function cancelReminder(reminderId: string, reason: string) {
  const { error } = await supabase
    .from('reminders')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancel_reason: reason })
    .eq('id', reminderId);
  if (error) throw error;
}

// ============================================================================
// PROCESS 2: Tenant Onboarding (Applications)
// ============================================================================

export interface TenantApplication {
  id: string;
  company_name: string;
  sector: string;
  concept: string;
  target_unit: string;
  proposed_rent: number;
  surface_sqm: number;
  lease_duration_months: number;
  declared_revenue: number;
  effort_rate: number;
  status: string;
  risk_score: number | null;
  documents: Record<string, { uploaded: boolean; file_path?: string }>;
  checklist: Record<string, boolean>;
  created_at: string;
}

export async function getApplications(companyId: string, status?: string) {
  let query = supabase
    .from('tenant_applications')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createApplication(data: Partial<TenantApplication> & { tenant_id: string; company_id: string }) {
  const effortRate = data.proposed_rent && data.declared_revenue
    ? data.proposed_rent / data.declared_revenue
    : 0;
  const { data: created, error } = await supabase
    .from('tenant_applications')
    .insert({ ...data, effort_rate: effortRate })
    .select()
    .single();
  if (error) throw error;
  return created;
}

export async function updateApplicationStatus(applicationId: string, status: string, validatorField?: string) {
  const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (validatorField) {
    const { data: { user } } = await supabase.auth.getUser();
    updates[validatorField] = user?.id;
  }
  const { error } = await supabase
    .from('tenant_applications')
    .update(updates)
    .eq('id', applicationId);
  if (error) throw error;
}

export async function convertApplicationToTenant(applicationId: string) {
  // Get application data
  const { data: app } = await supabase
    .from('tenant_applications')
    .select('*')
    .eq('id', applicationId)
    .single();
  if (!app) throw new Error('Application not found');

  // Create counterparty
  const { data: counterparty, error: cpError } = await supabase
    .from('counterparties')
    .insert({
      tenant_id: app.tenant_id,
      company_id: app.company_id,
      name: app.company_name,
      type: 'tenant',
      status: 'active',
      counterparty_category: app.sector,
    })
    .select()
    .single();
  if (cpError) throw cpError;

  // Update application
  await supabase
    .from('tenant_applications')
    .update({ status: 'converted', converted_to: counterparty.id, converted_at: new Date().toISOString() })
    .eq('id', applicationId);

  return counterparty;
}

// ============================================================================
// PROCESS 3: Lease End
// ============================================================================

export interface LeaseEnding {
  id: string;
  counterparty_id: string;
  unit_id: string;
  scenario: string;
  lease_end_date: string;
  departure_date: string | null;
  total_due: number;
  deposit_held: number;
  deposit_to_return: number;
  checklist: Record<string, boolean>;
  status: string;
}

export async function getLeaseEndings(companyId: string) {
  const { data, error } = await supabase
    .from('lease_endings')
    .select('*, counterparties(name)')
    .eq('company_id', companyId)
    .order('lease_end_date');
  if (error) throw error;
  return data ?? [];
}

export async function createLeaseEnding(data: Partial<LeaseEnding> & { tenant_id: string; company_id: string }) {
  const depositToReturn = (data.deposit_held ?? 0) - (data.total_due ?? 0);
  const { data: created, error } = await supabase
    .from('lease_endings')
    .insert({ ...data, deposit_to_return: Math.max(0, depositToReturn) })
    .select()
    .single();
  if (error) throw error;
  return created;
}

export async function updateLeaseChecklist(endingId: string, checklist: Record<string, boolean>) {
  const allDone = Object.values(checklist).every(v => v);
  const { error } = await supabase
    .from('lease_endings')
    .update({ checklist, status: allDone ? 'completed' : 'in_progress' })
    .eq('id', endingId);
  if (error) throw error;
}

// ============================================================================
// PROCESS 5: Franchises & Grace Periods
// ============================================================================

export interface LeaseFranchise {
  id: string;
  counterparty_id: string;
  franchise_type: string;
  start_date: string;
  end_date: string;
  rent_percentage: number;
  progressive_tiers: { months: number; amount: number }[] | null;
  charges_waived: boolean;
  is_active: boolean;
}

export async function getFranchises(companyId: string) {
  const { data, error } = await supabase
    .from('lease_franchises')
    .select('*, counterparties(name)')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('start_date');
  if (error) throw error;
  return data ?? [];
}

export async function createFranchise(data: Partial<LeaseFranchise> & { tenant_id: string; company_id: string }) {
  const { data: created, error } = await supabase
    .from('lease_franchises')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return created;
}

// ============================================================================
// PROCESS 6: Rent Revision
// ============================================================================

export interface RentRevision {
  id: string;
  counterparty_id: string;
  revision_date: string;
  indexation_type: string;
  rate_or_index: number;
  rent_before: number;
  rent_after: number;
  rent_variation: number;
  status: string;
  notification_sent: boolean;
}

export async function getPendingRevisions(companyId: string) {
  const { data, error } = await supabase
    .from('rent_revisions')
    .select('*, counterparties(name)')
    .eq('company_id', companyId)
    .in('status', ['calculated', 'validated_daf'])
    .order('revision_date');
  if (error) throw error;
  return data ?? [];
}

export async function getRevisionHistory(companyId: string, counterpartyId?: string) {
  let query = supabase
    .from('rent_revisions')
    .select('*, counterparties(name)')
    .eq('company_id', companyId)
    .order('revision_date', { ascending: false });
  if (counterpartyId) query = query.eq('counterparty_id', counterpartyId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function validateRevision(revisionId: string, role: 'daf' | 'dga') {
  const { data: { user } } = await supabase.auth.getUser();
  const field = role === 'daf' ? 'validated_by_daf' : 'validated_by_dga';
  const newStatus = role === 'daf' ? 'validated_daf' : 'validated_dga';
  const { error } = await supabase
    .from('rent_revisions')
    .update({ [field]: user?.id, status: newStatus })
    .eq('id', revisionId);
  if (error) throw error;
}

export async function applyRevision(revisionId: string) {
  const { error } = await supabase
    .from('rent_revisions')
    .update({ status: 'applied', applied_at: new Date().toISOString() })
    .eq('id', revisionId);
  if (error) throw error;
}

// ============================================================================
// PROCESS 7: Vacant Units
// ============================================================================

export interface VacantUnit {
  id: string;
  unit_reference: string;
  zone: string;
  surface_sqm: number;
  vacancy_reason: string;
  previous_tenant_id: string | null;
  vacant_since: string;
  target_rent: number;
  relocation_date_est: string | null;
  relocation_probability: number;
  pipeline_active: boolean;
  monthly_carrying_cost: number;
  status: string;
}

export async function getVacantUnits(companyId: string) {
  const { data, error } = await supabase
    .from('vacant_units')
    .select('*, counterparties:previous_tenant_id(name)')
    .eq('company_id', companyId)
    .in('status', ['vacant', 'under_renovation', 'available', 'reserved'])
    .order('vacant_since');
  if (error) throw error;
  return data ?? [];
}

export async function createVacantUnit(data: Partial<VacantUnit> & { tenant_id: string; company_id: string }) {
  const { data: created, error } = await supabase
    .from('vacant_units')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return created;
}

export async function updateVacantUnit(unitId: string, updates: Partial<VacantUnit>) {
  const { error } = await supabase
    .from('vacant_units')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', unitId);
  if (error) throw error;
}

export async function markUnitAsLeased(unitId: string, counterpartyId: string) {
  const { error } = await supabase
    .from('vacant_units')
    .update({ status: 'leased', leased_to: counterpartyId, leased_at: new Date().toISOString().split('T')[0] })
    .eq('id', unitId);
  if (error) throw error;
}

// ============================================================================
// OCCUPANCY METRICS
// ============================================================================

export async function getOccupancyMetrics(companyId: string) {
  const { data: vacants } = await supabase
    .from('vacant_units')
    .select('surface_sqm, target_rent, monthly_carrying_cost')
    .eq('company_id', companyId)
    .in('status', ['vacant', 'under_renovation', 'available']);

  const totalVacantSurface = (vacants ?? []).reduce((s, v) => s + (v.surface_sqm || 0), 0);
  const monthlyLostRent = (vacants ?? []).reduce((s, v) => s + (v.target_rent || 0), 0);
  const monthlyCarryingCost = (vacants ?? []).reduce((s, v) => s + (v.monthly_carrying_cost || 0), 0);

  return {
    vacant_count: (vacants ?? []).length,
    vacant_surface: totalVacantSurface,
    monthly_lost_rent: monthlyLostRent,
    monthly_carrying_cost: monthlyCarryingCost,
    annual_lost_rent: monthlyLostRent * 12,
  };
}
