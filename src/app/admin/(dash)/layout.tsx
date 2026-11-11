import Link from 'next/link';
import { requireAdmin } from '@/lib/supabase/server';
import { logOut } from '../actions';
import { LogOut, ExternalLink } from 'lucide-react';

const MENU_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/services', label: 'Services' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/offers', label: 'Offers' },
  { href: '/admin/salon', label: 'Salon settings' },
  { href: '/admin/qr', label: 'QR code' },
  { href: '/admin/audit', label: 'Audit log' },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin();

  return (
    <div className="mx-auto min-h-dvh max-w-4xl">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="font-serif text-lg font-semibold leading-tight">Skills Saloon</p>
            <p className="text-[10px] tracking-luxe uppercase text-ink-soft">
              Admin · {profile.full_name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={MENU_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 border border-line px-3 py-1.5 text-[11px] tracking-wide uppercase text-ink-soft transition-colors hover:border-ink-strong hover:text-ink"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Preview menu
            </Link>
            <form action={logOut}>
              <button
                type="submit"
                className="flex items-center gap-1.5 border border-line px-3 py-1.5 text-[11px] tracking-wide uppercase text-ink-soft transition-colors hover:border-ink-strong hover:text-ink"
              >
                <LogOut className="h-3.5 w-3.5" /> Logout
              </button>
            </form>
          </div>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-4 pb-2">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="shrink-0 border border-transparent px-3 py-1.5 text-[11px] tracking-wide uppercase text-ink-soft transition-colors hover:border-line hover:text-ink"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      {children}
    </div>
  );
}
