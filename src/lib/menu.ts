import { applyBestOffer } from '@/lib/offers';
import { createPublicClient } from '@/lib/supabase/public';
import type { Category, MenuSection, MenuSettings, Offer, OfferLink, PublicService, Salon, Service } from '@/types/db';

/**
 * Loads everything the public menu needs, as an anonymous visitor.
 * RLS guarantees we only ever receive published/active/running rows.
 */
export async function loadMenuData(): Promise<{
  salon: Salon | null;
  settings: MenuSettings | null;
  sections: MenuSection[];
  offers: Offer[];
}> {
  const supabase = createPublicClient();

  const [salonQ, categoriesQ, servicesQ, offersQ, linksQ, settingsQ] = await Promise.all([
    supabase.from('salons').select('*').eq('is_active', true).order('created_at').limit(1),
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('services').select('*').eq('is_published', true).order('sort_order'),
    supabase.from('offers').select('*').order('start_date', { ascending: false }),
    supabase.from('offer_services').select('offer_id,service_id,category_id'),
    supabase.from('menu_settings').select('*').limit(1),
  ]);

  const salon = (salonQ.data as Salon[] | null)?.[0] ?? null;
  const settings = (settingsQ.data as MenuSettings[] | null)?.[0] ?? null;
  const categories = (categoriesQ.data as Category[] | null) ?? [];
  const services = (servicesQ.data as Service[] | null) ?? [];
  const offers = (offersQ.data as Offer[] | null) ?? [];
  const links = (linksQ.data as OfferLink[] | null) ?? [];

  const sections: MenuSection[] = [];
  for (const category of categories) {
    const inCategory = services.filter((s) => s.category_id === category.id);
    const publicServices: PublicService[] = inCategory.map((service) => ({
      ...service,
      ...applyBestOffer(service, offers, links),
    }));
    if (publicServices.length > 0) {
      sections.push({ category, services: publicServices });
    }
  }

  return { salon, settings, sections, offers };
}

/** One published service + its category for the detail page. */
export async function loadServiceDetail(id: string): Promise<{
  service: (PublicService & { category: Category }) | null;
  salon: Salon | null;
}> {
  const supabase = createPublicClient();

  const [{ data: serviceRow, error }, offersQ, linksQ, salonQ] = await Promise.all([
    supabase.from('services').select('*, categories:category_id(*)').eq('id', id).eq('is_published', true).maybeSingle(),
    supabase.from('offers').select('*'),
    supabase.from('offer_services').select('offer_id,service_id,category_id'),
    supabase.from('salons').select('*').eq('is_active', true).order('created_at').limit(1),
  ]);

  if (error || !serviceRow) return { service: null, salon: null };

  const service = serviceRow as Service & { categories: Category | Category[] | null };
  const category = Array.isArray(service.categories) ? service.categories[0] ?? null : service.categories ?? null;
  const offerBits = applyBestOffer(service, (offersQ.data as Offer[] | null) ?? [], (linksQ.data as OfferLink[] | null) ?? []);
  const salon = (salonQ.data as Salon[] | null)?.[0] ?? null;

  return {
    service: category ? { ...service, ...offerBits, category } : null,
    salon,
  };
}
