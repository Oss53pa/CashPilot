import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Create a Supabase client using the service role key.
 * Used by Edge Functions for full database access (bypasses RLS).
 */
export function createServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )
}

/**
 * Create a Supabase client using the user's JWT (respects RLS).
 */
export function createUserClient(authHeader: string): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    }
  )
}

/**
 * Extract tenant_id and company_id from JWT or request body.
 * For pg_cron triggered functions, context comes from the body.
 * For user-triggered functions, context comes from the JWT.
 */
export interface TenantContext {
  tenant_id: string
  company_id: string
  user_id?: string
}

export async function extractContext(
  req: Request,
  supabase: SupabaseClient,
  body?: Record<string, unknown>
): Promise<TenantContext> {
  // If body has explicit tenant/company (pg_cron or service-role calls)
  if (body?.tenant_id && body?.company_id) {
    return {
      tenant_id: body.tenant_id as string,
      company_id: body.company_id as string,
    }
  }

  // Extract from JWT
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) throw new Error('Missing Authorization header')

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) throw new Error('Invalid token')

  // Get tenant_id from user_profiles
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile) throw new Error('User profile not found')

  // company_id from body or first accessible company
  let company_id = body?.company_id as string | undefined
  if (!company_id) {
    const { data: access } = await supabase
      .from('user_company_access')
      .select('company_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()
    company_id = access?.company_id
  }

  if (!company_id) throw new Error('No company access found')

  return {
    tenant_id: profile.tenant_id,
    company_id,
    user_id: user.id,
  }
}
