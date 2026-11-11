import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * DANGEROUS client — full backend access (bypasses RLS).
 * Server-side ONLY: `server-only` makes any browser import fail the build.
 * Used exclusively by the one-time /admin/setup page and, from Phase 5,
 * admin server actions that must bypass RLS. Never returns data to the UI.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
