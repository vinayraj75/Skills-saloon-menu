import Link from 'next/link';
import { ShieldX, ShieldCheck } from 'lucide-react';
import { setupTokenConfigured, tokenMatches } from './token';
import { SetupForm } from './setup-form';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * ONE-TIME page. Reachable only while BOTH are true:
 *   1. the secret ?t= token matches ADMIN_SETUP_TOKEN from .env.local
 *   2. no admin account exists yet
 * As soon as the owner's admin is created, this page is permanently closed.
 */
export default async function AdminSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const token = t ?? '';

  const lockedScreen = (title: string, sub: string) => (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center px-4 text-center">
      <ShieldX className="h-8 w-8 text-ink-faint" strokeWidth={1.5} />
      <h1 className="mt-4 font-serif text-2xl font-semibold">{title}</h1>
      <p className="mt-2 max-w-xs text-xs leading-relaxed text-ink-soft">{sub}</p>
      <Link href="/admin/login" className="mt-6 text-xs text-ink-soft transition-colors hover:text-ink">
        Go to admin login →
      </Link>
    </div>
  );

  if (!setupTokenConfigured()) {
    return lockedScreen(
      'Setup is not configured',
      'ADMIN_SETUP_TOKEN is missing in .env.local, so owner setup is disabled.',
    );
  }
  if (!tokenMatches(token)) {
    return lockedScreen(
      'Invalid setup link',
      'This link is missing its secret key or was mistyped. Ask the developer for the correct one-time link.',
    );
  }

  // The one-time bootstrap needs the optional service key. When it is absent
  // or rejected, the owner account is created in the Supabase dashboard
  // instead — never fall through to a setup form that cannot work.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return lockedScreen(
      'Setup is closed',
      'The owner account is managed in Supabase. Use the admin login page.',
    );
  }

  // Token valid — but the page only exists while no admin exists
  const admin = createAdminClient();
  const { count, error } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'admin');

  if (error) {
    return lockedScreen(
      'Setup is unavailable',
      'The one-time setup service is not configured. Use the admin login page.',
    );
  }

  if ((count ?? 0) > 0) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center px-4 text-center">
        <ShieldCheck className="h-8 w-8 text-ink" strokeWidth={1.5} />
        <h1 className="mt-4 font-serif text-2xl font-semibold">Setup already complete</h1>
        <p className="mt-2 max-w-xs text-xs leading-relaxed text-ink-soft">
          An admin account exists. For security this one-time setup page is now permanently closed.
        </p>
        <Link
          href="/admin/login"
          className="mt-6 border border-ink bg-ink px-4 py-2 text-xs tracking-luxe uppercase text-paper transition-opacity hover:opacity-90"
        >
          Go to admin login
        </Link>
      </div>
    );
  }

  return <SetupForm token={token} />;
}
