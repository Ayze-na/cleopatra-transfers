'use client';

import { supabase } from '@/lib/supabase/client';

/**
 * Upload an image to the public `site-images` bucket and return its public URL.
 */
export async function uploadSiteImage(file: File): Promise<string> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('site-images').upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('site-images').getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Best-effort write to activity_log for the currently signed-in admin.
 * Never throws — logging should not block an admin action.
 */
export async function logActivity(
  action: string,
  entity: string,
  entityId?: string | null,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    const { data } = await supabase.auth.getUser();
    const email = data.user?.email;
    if (!email) return;
    const { data: admin } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    await supabase.rpc('log_activity', {
      p_admin_id: admin?.id ?? null,
      p_action: action,
      p_entity: entity,
      p_entity_id: entityId ?? null,
      p_details: details ?? {},
    });
  } catch {
    /* ignore logging failures */
  }
}
