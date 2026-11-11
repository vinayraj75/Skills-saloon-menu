import { loadMenuData } from '@/lib/menu';
import { MenuView } from '@/components/menu/MenuView';
import { MenuRealtime } from '@/components/menu/MenuRealtime';
import { EmptyState } from '@/components/menu/skeletons';

// ISR: the menu re-renders from the database at least every 30 seconds,
// and Supabase Realtime pushes instant refreshes (see MenuRealtime).
export const revalidate = 30;

export default async function HomePage() {
  const { salon, settings, sections, offers } = await loadMenuData();

  if (!salon) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-3xl items-center justify-center px-4">
        <EmptyState title="Coming soon" sub="The salon menu will appear here once it is set up." />
      </div>
    );
  }

  return (
    <>
      {/* Instant client-side refresh whenever the owner changes anything */}
      <MenuRealtime />
      <MenuView salon={salon} settings={settings} sections={sections} offers={offers} />
    </>
  );
}
