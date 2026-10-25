import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export function turnstileConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY
  );
}

/**
 * Verify a Cloudflare Turnstile token.
 * - When no secret key is configured: graceful no-op (returns true) so the site
 *   is never hard-blocked in development.
 * - When configured: FAILS CLOSED. A missing token or any network/verify
 *   error returns false so bot submissions are rejected.
 */
export async function verifyTurnstile(token: string | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token }),
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const json = (await res.json()) as { success?: boolean };
    return Boolean(json.success);
  } catch {
    return false;
  }
}

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Read and hard-limit the size of a JSON request body.
 * Prevents memory-CPU DoS through oversized POST bodies.
 * Returns null when the body is invalid or larger than maxBytes.
 */
export async function readJsonBody(
  request: NextRequest,
  maxBytes = 4096
): Promise<Record<string, unknown> | null> {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) return null;

  const text = await request.text();
  if (text.length > maxBytes) return null;
  try {
    const json = JSON.parse(text);
    return json && typeof json === 'object' ? json : null;
  } catch {
    return null;
  }
}

/**
 * Sliding-window rate limit.
 * 1. Records this request (anon insert, allowed by RLS).
 * 2. Counts recent rows for this ip/email SERVER-SIDE with the service-role
 *    client (the anon SELECT on public_request_log is disabled).
 * Fails open only if rate limiting itself is unconfigured/broken —
 * a broken limit must not block legitimate customers.
 */
export async function enforceRateLimit(
  request: NextRequest,
  endpoint: string,
  email?: string,
  limit = 5,
  windowMinutes = 10
): Promise<boolean> {
  const ip = clientIp(request).slice(0, 64);

  const anon = await createClient();
  const { error: insErr } = await anon
    .from('public_request_log')
    .insert({ ip, email: email ? email.toLowerCase().slice(0, 200) : null, endpoint });
  if (insErr) {
    console.error('Rate-limit log insert failed:', insErr.message);
    return true;
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    console.error('Rate limit counting unavailable (no service role); failing open.');
    return true;
  }

  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  const { count, error: cntErr } = await admin
    .from('public_request_log')
    .select('id', { count: 'exact', head: true })
    .eq('endpoint', endpoint)
    .gte('created_at', since)
    .or(`ip.eq.${ip},email.eq.${email ? email.toLowerCase() : ip}`);

  if (cntErr) {
    console.error('Rate-limit count failed:', cntErr.message);
    return true;
  }

  return (count ?? 0) <= limit;
}

/**
 * Escape a string for safe interpolation into HTML email bodies.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export { clientIp };
