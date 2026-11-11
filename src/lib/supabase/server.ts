import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * Server-side Supabase client using the signed-in user's session cookies.
 * Publishable key only — this client can do nothing the logged-in user
 * could not do themselves (RLS still applies).
 */
export async function createAuthServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — middleware refreshes
            // the session cookie right after, so this is safe to ignore.
          }
        },
      },
    },
  );
}

/** The signed-in user's profile (id, full_name, role, salon_id) or null. */
export async function getProfile() {
  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, role, salon_id')
    .eq('id', user.id)
    .maybeSingle();
  return data as { id: string; full_name: string; role: string; salon_id: string } | null;
}

/**
 * Server-side gate for admin pages. Redirects to /admin/login when not
 * signed in, and back to /admin/login with an error when not admin.
 */
export async function requireAdmin() {
  const profile = await getProfile();
  if (!profile) redirect('/admin/login');
  if (profile.role !== 'admin') redirect('/admin/login?error=not_admin');
  return profile;
}

/**
 * Guard for every admin server action. Unlike requireAdmin (which
 * redirects), this throws so the action can turn it into a readable error.
 */
export async function assertAdmin() {
  const profile = await getProfile();
  if (!profile || profile.role !== 'admin') {
    throw new Error('Unauthorized. Please sign in as the admin again.');
  }
  return profile;
}
