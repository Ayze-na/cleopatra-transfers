import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export function turnstileConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY
  );
}

/**
 * Verify a Cloudflare Turnstile token.
 * When no secret key is configured, verification is a graceful no-op
 * (returns true) so the site is never hard-blocked in development.
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
    const json = (await res.json()) as { success?: boolean };
    return Boolean(json.success);
  } catch {
    // Fail open on network errors to avoid locking out valid users.
    return true;
  }
}

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Enforce a sliding-window rate limit.
 * Inserts a row into public_request_log (anon RLS allows insert) and counts
 * recent attempts. Uses the service-role client for a reliable count when
 * available, falling back to the anon client.
 * Returns true if the request is within the limit.
 */
export async function enforceRateLimit(
  request: NextRequest,
  endpoint: string,
  email?: string,
  limit = 5,
  windowMinutes = 10
): Promise<boolean> {
  const ip = clientIp(request);
  const supabase = await createClient();

  const { data: inserted, error: insErr } = await supabase
    .from('public_request_log')
    .insert({ ip, email: email || null, endpoint })
    .select('id');

  if (insErr) {
    // If we cannot log, fail open rather than block a legitimate submission.
    console.error('Rate-limit log insert failed:', insErr.message);
    return true;
  }

  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  const { count, error: cntErr } = await supabase
    .from('public_request_log')
    .select('id', { count: 'exact', head: true })
    .eq('endpoint', endpoint)
    .gte('created_at', since)
    .or(`ip.eq.${ip},email.eq.${email || ip}`);

  if (cntErr) {
    console.error('Rate-limit count failed:', cntErr.message);
    return true;
  }

  return (count ?? 0) <= limit;
}

export { clientIp };
