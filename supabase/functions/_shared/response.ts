/**
 * Standard HTTP response helpers for Edge Functions.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/** JSON success response */
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

/** JSON error response */
export function errorResponse(message: string, status = 500): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

/** CORS preflight response */
export function corsResponse(): Response {
  return new Response('ok', { headers: CORS_HEADERS })
}

/** Format FCFA amount (centimes to display) */
export function formatFCFA(amountCentimes: number): string {
  const amount = amountCentimes / 100
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
