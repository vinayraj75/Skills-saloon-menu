import { requireAdmin } from '@/lib/supabase/server';
import { loadSalonSettings } from '@/lib/admin-data';
import { QrStudio } from './qr-studio';

const MENU_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const IS_LOCAL = /localhost|127\.0\.0\.1/.test(MENU_URL);

export default async function QrPage() {
  await requireAdmin();
  const { salon } = await loadSalonSettings();

  if (!salon) {
    return (
      <main className="px-4 pb-16 pt-6">
        <h1 className="font-serif text-2xl font-semibold">QR code</h1>
        <p className="mt-4 border border-dashed border-line px-4 py-6 text-center text-xs text-ink-soft">
          No salon record found — set up the salon in Salon settings first.
        </p>
      </main>
    );
  }

  return (
    <main className="px-4 pb-16 pt-6">
      <h1 className="font-serif text-2xl font-semibold">QR code & poster</h1>
      <p className="mt-1 text-xs text-ink-soft">
        One permanent QR for every table. It always opens the live menu — price or
        offer changes need no new printing.
      </p>

      <div className="qr-studio-area mt-5">
        <QrStudio salon={salon} menuUrl={MENU_URL} isLocalUrl={IS_LOCAL} />
      </div>
    </main>
  );
}
