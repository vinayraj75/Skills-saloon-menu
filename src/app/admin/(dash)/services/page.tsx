import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { loadAdminCategories, loadAdminServices } from '@/lib/admin-data';
import { ServiceRow } from './service-row';

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? '';
  const category = sp.category ?? '';
  const status = (sp.status === 'published' || sp.status === 'draft' ? sp.status : '') as '' | 'published' | 'draft';

  const [services, categories] = await Promise.all([
    loadAdminServices({ q, categoryId: category || undefined, status: status || undefined }),
    loadAdminCategories(),
  ]);

  const total = services.length;
  const filterChips = [
    { label: 'All', href: '/admin/services', active: !status },
    { label: 'Live', href: '/admin/services?status=published', active: status === 'published' },
    { label: 'Drafts', href: '/admin/services?status=draft', active: status === 'draft' },
  ];

  return (
    <main className="px-4 pb-16 pt-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Services</h1>
          <p className="mt-1 text-xs text-ink-soft">{total} of 24+ services shown — edits appear on the menu instantly.</p>
        </div>
        <Link
          href="/admin/services/new"
          className="flex shrink-0 items-center gap-1.5 border border-ink bg-ink px-3 py-2 text-[11px] tracking-luxe uppercase text-paper transition-opacity hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" /> Add service
        </Link>
      </div>

      {sp.err && <p className="mt-4 border border-ink bg-paper px-3 py-2 text-xs">⚠ {sp.err}</p>}
      {sp.ok && <p className="mt-4 border border-line bg-paper-raised px-3 py-2 text-xs">✓ {sp.ok}</p>}

      {/* search + filters */}
      <form method="get" className="mt-4 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search services by name or description…"
            className="w-full border border-line bg-paper-raised py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-ink-faint focus:border-ink-strong"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            name="category"
            defaultValue={category}
            className="border border-line bg-paper-raised px-2 py-2 text-xs outline-none focus:border-ink-strong"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            type="submit"
            className="border border-ink bg-ink px-3 py-2 text-[11px] tracking-luxe uppercase text-paper transition-opacity hover:opacity-90"
          >
            Apply
          </button>
          <Link href="/admin/services" className="text-[11px] tracking-wide uppercase text-ink-soft hover:text-ink">
            Reset
          </Link>
        </div>
      </form>

      <div className="mt-3 flex gap-2">
        {filterChips.map((f) => (
          <Link
            key={f.label}
            href={f.href}
            className={`px-3 py-1.5 text-[11px] tracking-wide uppercase transition-colors ${
              f.active ? 'bg-ink text-paper' : 'border border-line text-ink-soft hover:text-ink'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {total === 0 ? (
        <p className="mt-6 border border-dashed border-line px-4 py-10 text-center text-xs text-ink-soft">
          No services match these filters. Try “Reset”.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-line border border-line bg-paper-raised">
          {services.map((s) => (
            <ServiceRow key={s.id} service={s} />
          ))}
        </ul>
      )}
    </main>
  );
}
