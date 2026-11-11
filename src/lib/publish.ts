import type { Service } from '@/types/db';

export type PriceStatus = Service['price_status'];

/**
 * A service may go live on the customer menu only when its price is
 * confirmed — this is the draft-protection rule from the data model.
 */
export function canPublish(s: Pick<Service, 'price' | 'price_status'>): boolean {
  return s.price != null && s.price_status === 'confirmed';
}

export function publishBlockReason(s: Pick<Service, 'price' | 'price_status'>): string {
  if (s.price == null) return 'Add a price first — services without a price cannot go live.';
  if (s.price_status !== 'confirmed') {
    return 'Mark the price as “Confirmed” before publishing.';
  }
  return '';
}

export const PRICE_STATUS_LABELS: Record<PriceStatus, string> = {
  confirmed: 'Confirmed',
  needs_verification: 'Needs verification',
  pending: 'Pending',
};

/** "Hair Colour" + extras -> URL & storage-friendly kebab slug */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'item';
}
