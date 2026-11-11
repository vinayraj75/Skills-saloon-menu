import { Tag } from 'lucide-react';
import { loadAdminCategories, loadAdminOffers, loadAdminServices } from '@/lib/admin-data';
import { CreateOfferForm } from './offer-form';
import { OfferRow } from './offer-row';

export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const [offers, categories, services] = await Promise.all([
    loadAdminOffers(),
    loadAdminCategories(),
    loadAdminServices({}),
  ]);

  return (
    <main className="px-4 pb-16 pt-6">
      <h1 className="font-serif text-2xl font-semibold">Offers</h1>
      <p className="mt-1 text-xs text-ink-soft">
        Discounts that start and expire automatically (salon time is IST). The best
        offer per service is applied for the customer.
      </p>

      {sp.err && <p className="mt-4 border border-ink bg-paper px-3 py-2 text-xs">⚠ {sp.err}</p>}
      {sp.ok && <p className="mt-4 border border-line bg-paper-raised px-3 py-2 text-xs">✓ {sp.ok}</p>}

      <section className="mt-6">
        <h2 className="mb-2 flex items-center gap-1.5 font-serif text-lg font-semibold">
          <Tag className="h-4 w-4" /> Create an offer
        </h2>
        <CreateOfferForm categories={categories} services={services} />
      </section>

      <section className="mt-8">
        <h2 className="mb-2 font-serif text-lg font-semibold">Manage ({offers.length})</h2>
        {offers.length === 0 ? (
          <p className="border border-dashed border-line px-4 py-6 text-center text-xs text-ink-soft">
            No offers yet — create your first one above.
          </p>
        ) : (
          <ul className="space-y-3">
            {offers.map((o) => (
              <OfferRow
                key={o.offer.id}
                data={o}
                categories={categories}
                services={services}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
