import type { Offer, OfferLink, PublicService, Service } from '@/types/db';

/** ₹ 199 → "₹199" ; 1999.5 → "₹1,999.50" (INR, Indian grouping) */
export function formatINR(amount: number): string {
  const n = Math.round(amount * 100) % 100 === 0
    ? amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })
    : amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `₹${n}`;
}

/** Short offer label, e.g. "20% OFF" or "₹200 OFF" */
export function offerBadgeLabel(offer: Offer): string {
  return offer.discount_type === 'percent'
    ? `${Number(offer.discount_value).toLocaleString('en-IN')}% OFF`
    : `${formatINR(Number(offer.discount_value))} OFF`;
}

/**
 * The best (lowest) discounted price a service can get from RUNNING offers.
 * Public RLS already guarantees only currently-running offers are read.
 * A discount that would take the price below zero is ignored (never negative).
 */
export function applyBestOffer(
  service: Service,
  offers: Offer[],
  links: OfferLink[],
): Pick<PublicService, 'offerId' | 'offerTitle' | 'discountedPrice'> {
  if (service.price == null) {
    return { offerId: null, offerTitle: null, discountedPrice: null };
  }

  let best: { id: string; title: string; discounted: number } | null = null;

  for (const offer of offers) {
    // offer applies to this service directly, or to its whole category
    const applies = links.some(
      (l) =>
        l.offer_id === offer.id &&
        (l.service_id === service.id || (l.category_id !== null && l.category_id === service.category_id)),
    );
    if (!applies) continue;

    const discounted =
      offer.discount_type === 'percent'
        ? Number(service.price) * (1 - Number(offer.discount_value) / 100)
        : Number(service.price) - Number(offer.discount_value);

    if (discounted < 0) continue; // price safety: never negative

    const effective = Math.round(discounted * 100) / 100;
    if (!best || effective < best.discounted) {
      best = { id: offer.id, title: offer.title, discounted: effective };
    }
  }

  return best
    ? { offerId: best.id, offerTitle: best.title, discountedPrice: best.discounted }
    : { offerId: null, offerTitle: null, discountedPrice: null };
}
