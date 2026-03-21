import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createServiceClient } from '../_shared/supabase-client.ts'
import { jsonResponse, errorResponse, corsResponse } from '../_shared/response.ts'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================================
// TYPES
// ============================================================================

interface DOAInput {
  tenant_id: string
  company_id: string
  transaction_type: string
  amount: number // centimes
  user_id?: string // to check delegations
}

interface DOAResolution {
  requires_approval: boolean
  approvers: { order: number; role: string; label: string }[]
  deadline_hours: number
  escalation_role: string | null
  requires_convention: boolean
  requires_justification: boolean
  can_be_urgent: boolean
  label: string
  rule_id: string | null
  delegation_active: boolean
  delegation_info: Record<string, unknown> | null
}

// ============================================================================
// RESOLUTION LOGIC
// ============================================================================

async function resolveDOA(
  supabase: SupabaseClient,
  input: DOAInput
): Promise<DOAResolution> {
  // 1. Check for active delegation first
  let delegationActive = false
  let delegationInfo: Record<string, unknown> | null = null

  if (input.user_id) {
    const now = new Date().toISOString()
    const { data: delegation } = await supabase
      .from('doa_delegations')
      .select('*')
      .eq('delegate_id', input.user_id)
      .eq('company_id', input.company_id)
      .eq('is_active', true)
      .lte('valid_from', now)
      .gte('valid_until', now)
      .limit(1)
      .single()

    if (delegation) {
      // Check if delegation covers this transaction type
      const txTypes = delegation.transaction_types as string[] | null
      const amountMax = delegation.amount_max as number | null

      if (
        (!txTypes || txTypes.includes(input.transaction_type)) &&
        (!amountMax || input.amount <= amountMax)
      ) {
        delegationActive = true
        delegationInfo = {
          delegator_id: delegation.delegator_id,
          delegate_id: delegation.delegate_id,
          valid_until: delegation.valid_until,
          reason: delegation.reason,
        }
      }
    }
  }

  // 2. Find applicable DOA rule
  const { data: rule } = await supabase
    .from('doa_rules')
    .select('*')
    .eq('tenant_id', input.tenant_id)
    .eq('company_id', input.company_id)
    .eq('transaction_type', input.transaction_type)
    .eq('is_active', true)
    .lte('amount_min', input.amount)
    .or(`amount_max.is.null,amount_max.gte.${input.amount}`)
    .order('sort_order')
    .limit(1)
    .single()

  if (!rule) {
    // Fail-safe: DAF approval required by default
    return {
      requires_approval: true,
      approvers: [{ order: 1, role: 'company_cfo', label: 'DAF' }],
      deadline_hours: 24,
      escalation_role: 'deputy_ceo',
      requires_convention: false,
      requires_justification: false,
      can_be_urgent: true,
      label: 'Regle par defaut — DAF',
      rule_id: null,
      delegation_active: delegationActive,
      delegation_info: delegationInfo,
    }
  }

  return {
    requires_approval: (rule.approvers as unknown[]).length > 0,
    approvers: rule.approvers as { order: number; role: string; label: string }[],
    deadline_hours: rule.approval_deadline_hours as number,
    escalation_role: rule.escalation_role as string | null,
    requires_convention: rule.requires_convention as boolean,
    requires_justification: rule.requires_justification as boolean,
    can_be_urgent: rule.can_be_urgent as boolean,
    label: rule.label as string,
    rule_id: rule.id as string,
    delegation_active: delegationActive,
    delegation_info: delegationInfo,
  }
}

// ============================================================================
// SERVE
// ============================================================================

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const supabase = createServiceClient()
    const body = await req.json() as DOAInput

    if (!body.tenant_id || !body.company_id || !body.transaction_type || body.amount === undefined) {
      return errorResponse('Missing required fields: tenant_id, company_id, transaction_type, amount', 400)
    }

    const result = await resolveDOA(supabase, body)
    return jsonResponse(result)

  } catch (err) {
    console.error('resolve-doa error:', err)
    return errorResponse((err as Error).message)
  }
})
