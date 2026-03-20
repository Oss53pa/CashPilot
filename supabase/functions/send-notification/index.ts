import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createServiceClient } from '../_shared/supabase-client.ts'
import { jsonResponse, errorResponse, corsResponse } from '../_shared/response.ts'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================================
// TYPES
// ============================================================================

interface NotificationInput {
  tenant_id: string
  company_id: string
  user_ids?: string[]        // specific users, or null for all company users
  alert_type: string
  subject: string
  body: string
  severity?: 'info' | 'warning' | 'critical'
  entity_type?: string
  entity_id?: string
}

// ============================================================================
// EMAIL SENDING (via Supabase Auth / SMTP)
// ============================================================================

async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string
): Promise<{ success: boolean; error?: string }> {
  // Use Supabase's built-in email via Edge Function fetch to SMTP
  // Or use a configurable SMTP relay (Resend, SendGrid, Mailgun)
  const smtpUrl = Deno.env.get('SMTP_API_URL')
  const smtpKey = Deno.env.get('SMTP_API_KEY')
  const fromEmail = Deno.env.get('SMTP_FROM_EMAIL') || 'noreply@cashpilot.app'
  const fromName = Deno.env.get('SMTP_FROM_NAME') || 'CashPilot'

  if (!smtpUrl || !smtpKey) {
    // Fallback: log the notification (no SMTP configured)
    console.log(`[NOTIFICATION] To: ${to} | Subject: ${subject}`)
    return { success: true }
  }

  try {
    const response = await fetch(smtpUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${smtpKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject,
        html: htmlBody,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return { success: false, error: err }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// ============================================================================
// EMAIL TEMPLATE
// ============================================================================

function buildEmailHtml(
  subject: string,
  body: string,
  severity: string,
  alertType: string
): string {
  const severityColors: Record<string, string> = {
    critical: '#dc2626',
    warning: '#f59e0b',
    info: '#3b82f6',
  }
  const color = severityColors[severity] || '#3b82f6'

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="border-left: 4px solid ${color}; padding: 16px 20px; background: #f9fafb; border-radius: 0 8px 8px 0;">
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
      <span style="background: ${color}; color: white; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase;">${severity}</span>
      <span style="color: #6b7280; font-size: 13px;">${alertType.replace(/_/g, ' ')}</span>
    </div>
    <h2 style="margin: 0 0 12px; color: #111827; font-size: 18px;">${subject}</h2>
    <div style="color: #374151; font-size: 14px; line-height: 1.6; white-space: pre-line;">${body}</div>
  </div>
  <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      CashPilot — Gestion de tresorerie<br>
      <a href="${Deno.env.get('SITE_URL') || 'https://app.cashpilot.com'}" style="color: #3b82f6; text-decoration: none;">Ouvrir CashPilot</a>
    </p>
  </div>
</body>
</html>`
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function executeNotification(
  supabase: SupabaseClient,
  input: NotificationInput
): Promise<Record<string, unknown>> {
  // Determine target users
  let targetUserIds = input.user_ids || []

  if (targetUserIds.length === 0) {
    // Send to all users of the company
    const { data: access } = await supabase
      .from('user_company_access')
      .select('user_id')
      .eq('company_id', input.company_id)

    targetUserIds = (access ?? []).map((a: Record<string, unknown>) => a.user_id as string)
  }

  if (targetUserIds.length === 0) {
    return { sent: 0, message: 'No target users found' }
  }

  // Get user emails and preferences
  const { data: profiles = [] } = await supabase
    .from('user_profiles')
    .select('id, full_name')
    .in('id', targetUserIds)

  // Get notification preferences
  const { data: prefs = [] } = await supabase
    .from('notification_preferences')
    .select('*')
    .in('user_id', targetUserIds)
    .eq('company_id', input.company_id)
    .eq('alert_type', input.alert_type)

  const prefsMap = new Map<string, Record<string, unknown>>()
  for (const p of prefs) {
    prefsMap.set(p.user_id as string, p)
  }

  // Get user emails from Supabase Auth
  const emailResults: { userId: string; email: string; name: string }[] = []
  for (const profile of profiles) {
    const { data: authUser } = await supabase.auth.admin.getUserById(profile.id as string)
    if (authUser?.user?.email) {
      emailResults.push({
        userId: profile.id as string,
        email: authUser.user.email,
        name: (profile.full_name as string) || authUser.user.email,
      })
    }
  }

  // Build email content
  const htmlBody = buildEmailHtml(
    input.subject,
    input.body,
    input.severity || 'info',
    input.alert_type
  )

  let sentCount = 0
  let errorCount = 0

  // Send to each user (respecting preferences)
  for (const user of emailResults) {
    const userPref = prefsMap.get(user.userId)
    const emailEnabled = userPref ? (userPref.email_enabled as boolean) : true // default: enabled

    if (!emailEnabled) continue

    const { success, error } = await sendEmail(user.email, `[CashPilot] ${input.subject}`, htmlBody)

    // Log notification
    await supabase.from('notification_log').insert({
      tenant_id: input.tenant_id,
      company_id: input.company_id,
      user_id: user.userId,
      channel: 'email',
      alert_type: input.alert_type,
      subject: input.subject,
      body: input.body,
      status: success ? 'sent' : 'failed',
      error_message: error || null,
    })

    if (success) sentCount++
    else errorCount++
  }

  // Also create in-app alert
  await supabase.from('alerts').insert({
    tenant_id: input.tenant_id,
    company_id: input.company_id,
    type: input.alert_type,
    severity: input.severity || 'info',
    title: input.subject,
    message: input.body,
    is_read: false,
    entity_type: input.entity_type || null,
    entity_id: input.entity_id || null,
  })

  return {
    sent: sentCount,
    errors: errorCount,
    total_users: emailResults.length,
    in_app_created: true,
  }
}

// ============================================================================
// SERVE
// ============================================================================

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const supabase = createServiceClient()
    const body = await req.json() as NotificationInput

    if (!body.tenant_id || !body.company_id || !body.subject) {
      return errorResponse('Missing required fields: tenant_id, company_id, subject', 400)
    }

    const result = await executeNotification(supabase, body)
    return jsonResponse(result)

  } catch (err) {
    console.error('send-notification error:', err)
    return errorResponse((err as Error).message)
  }
})
