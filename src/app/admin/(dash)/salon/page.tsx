import { requireAdmin } from '@/lib/supabase/server';
import { loadSalonSettings } from '@/lib/admin-data';
import { SalonForm, AnnouncementForm } from './forms';

export default async function SalonSettingsPage() {
  await requireAdmin();
  const { salon, settings } = await loadSalonSettings();

  if (!salon) {
    return (
      <main className="px-4 pb-16 pt-6">
        <h1 className="font-serif text-2xl font-semibold">Salon settings</h1>
        <p className="mt-4 border border-dashed border-line px-4 py-6 text-center text-xs text-ink-soft">
          No salon record exists in the database yet.
        </p>
      </main>
    );
  }

  return (
    <main className="px-4 pb-16 pt-6">
      <h1 className="font-serif text-2xl font-semibold">Salon settings</h1>
      <p className="mt-1 text-xs text-ink-soft">
        These details appear on the customer menu header and footer.
      </p>
      <div className="mt-4 max-w-2xl space-y-4">
        <SalonForm salon={salon} />
        <AnnouncementForm settings={settings} />
      </div>
    </main>
  );
}
