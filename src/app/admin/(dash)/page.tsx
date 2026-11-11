import Link from 'next/link';
import { requireAdmin } from '@/lib/supabase/server';
import { loadAdminDashboard } from '@/lib/admin-data';

export default async function AdminHomePage() {
  const profile = await requireAdmin();
  const { totals, audit } = await loadAdminDashboard();

  const stats = [
    { label: 'Categories', value: totals.categories, href: '/admin/categories' },
    { label: 'Services', value: totals.services, href: '/admin/services' },
    { label: 'Live on menu', value: totals.published, href: '/admin/services?status=published' },
    { label: 'Drafts', value: totals.drafts, href: '/admin/services?status=draft' },
    { label: 'Offers', value: totals.offers, href: '/admin' },
  ];

  return (
    <main className="px-4 pb-16 pt-6">
      <h1 className="font-serif text-2xl font-semibold">Welcome, {profile.full_name}</h1>
      <p className="mt-1 text-xs text-ink-soft">
        Everything you change here appears on the customer menu automatically.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="border border-line bg-paper-raised p-4 transition-colors hover:border-ink-strong">
            <p className="font-serif text-2xl font-semibold">{s.value}</p>
            <p className="mt-0.5 text-[10px] tracking-luxe uppercase text-ink-faint">{s.label}</p>
          </Link>
        ))}
      </div>

      <section className="mt-8">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-serif text-lg font-semibold">Latest changes</h2>
          <Link href="/admin/audit" className="text-[11px] tracking-wide uppercase text-ink-soft hover:text-ink">
            Full audit log →
          </Link>
        </div>
        {audit.length === 0 ? (
          <p className="border border-dashed border-line px-4 py-6 text-center text-xs text-ink-soft">
            No changes yet. Everything you do is recorded here automatically.
          </p>
        ) : (
          <ul className="divide-y divide-line border border-line bg-paper-raised">
            {audit.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                <span className="truncate">
                  <span className="font-medium">{a.action}</span>
                  {' '}
                  <span className="text-ink-soft">on {a.table_name}</span>
                </span>
                <span className="shrink-0 text-[10px] text-ink-faint">
                  {new Date(a.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
