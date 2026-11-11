import { createAdminClient } from '@/lib/supabase/admin';
import type { Category, MenuSettings, Offer, Salon, Service } from '@/types/db';

/**
 * Admin data loaders. Reads use the service-role client SERVER-SIDE ONLY —
 * the admin must see drafts too. All writes go through the signed-in
 * session client (RLS + audit trail), never through here.
 */

export type ServiceWithCategory = Service & { category_name: string | null };

export async function loadAdminServices(filters: {
  q?: string;
  categoryId?: string;
  status?: 'published' | 'draft';
}): Promise<ServiceWithCategory[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from('services')
    .select('*, categories(name)')
    .order('category_id')
    .order('sort_order');

  if (filters.q && filters.q.trim()) {
    const term = `%${filters.q.trim()}%`;
    query = query.or(`name.ilike.${term},description.ilike.${term}`);
  }
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
  if (filters.status === 'published') query = query.eq('is_published', true);
  if (filters.status === 'draft') query = query.eq('is_published', false);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: Service & { categories: { name: string } | null }) => ({
    ...row,
    category_name: row.categories?.name ?? null,
  }));
}

export async function loadAdminCategories(): Promise<
  (Category & { service_count: number })[]
> {
  const supabase = createAdminClient();
  const [categoriesQ, countsQ] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('services').select('category_id'),
  ]);
  if (categoriesQ.error) throw new Error(categoriesQ.error.message);
  const counts = new Map<string, number>();
  for (const s of countsQ.data ?? []) {
    counts.set(s.category_id, (counts.get(s.category_id) ?? 0) + 1);
  }
  return (categoriesQ.data as Category[] ?? []).map((c) => ({
    ...c,
    service_count: counts.get(c.id) ?? 0,
  }));
}

export async function loadAdminService(id: string): Promise<{
  service: (Service & { category_name: string | null }) | null;
  salonExists: boolean;
}> {
  const supabase = createAdminClient();
  const [{ data, error }, salonQ] = await Promise.all([
    supabase.from('services').select('*, categories(name)').eq('id', id).maybeSingle(),
    supabase.from('salons').select('id', { count: 'exact', head: true }),
  ]);
  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  if (!data) return { service: null, salonExists: (salonQ.count ?? 0) > 0 };
  const row = data as Service & { categories: { name: string } | null };
  return { service: { ...row, category_name: row.categories?.name ?? null }, salonExists: (salonQ.count ?? 0) > 0 };
}

export async function loadAdminDashboard(): Promise<{
  totals: { categories: number; services: number; published: number; drafts: number; offers: number };
  audit: {
    id: string;
    created_at: string;
    action: string;
    table_name: string;
    actor_email: string | null;
    record_id: string | null;
  }[];
}> {
  const supabase = createAdminClient();
  const [catQ, svcQ, pubQ, draftQ, offQ, auditQ] = await Promise.all([
    supabase.from('categories').select('id', { count: 'exact', head: true }),
    supabase.from('services').select('id', { count: 'exact', head: true }),
    supabase.from('services').select('id', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('services').select('id', { count: 'exact', head: true }).eq('is_published', false),
    supabase.from('offers').select('id', { count: 'exact', head: true }),
    supabase
      .from('audit_logs')
      .select('id, created_at, action, table_name, actor_email, record_id')
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  const audit = (auditQ.data ?? []).map((a) => ({
    ...a,
    actor_email: (a as { actor_email: string | null }).actor_email ?? null,
  }));

  return {
    totals: {
      categories: catQ.count ?? 0,
      services: svcQ.count ?? 0,
      published: pubQ.count ?? 0,
      drafts: draftQ.count ?? 0,
      offers: offQ.count ?? 0,
    },
    audit,
  };
}

export async function loadSalonSettings(): Promise<{
  salon: Salon | null;
  settings: MenuSettings | null;
}> {
  const supabase = createAdminClient();
  const [salonQ, settingsQ] = await Promise.all([
    supabase.from('salons').select('*').order('created_at').limit(1),
    supabase.from('menu_settings').select('*').limit(1),
  ]);
  if (salonQ.error) throw new Error(salonQ.error.message);
  return {
    salon: (salonQ.data as Salon[] | null)?.[0] ?? null,
    settings: (settingsQ.data as MenuSettings[] | null)?.[0] ?? null,
  };
}

export async function loadAdminOffers(): Promise<
  {
    offer: Offer;
    service_names: string[];
    category_names: string[];
    scope: string[];
    status: 'running' | 'scheduled' | 'ended' | 'off';
    example_effect: string | null;
  }[]
> {
  const supabase = createAdminClient();
  const [offersQ, linksQ, servicesQ, categoriesQ] = await Promise.all([
    supabase.from('offers').select('*').order('start_date', { ascending: false }),
    supabase.from('offer_services').select('offer_id, service_id, category_id'),
    supabase.from('services').select('id, name, price, category_id'),
    supabase.from('categories').select('id, name'),
  ]);
  if (offersQ.error) throw new Error(offersQ.error.message);

  const services = new Map((servicesQ.data ?? []).map((s) => [s.id, s]));
  const categories = new Map((categoriesQ.data ?? []).map((c) => [c.id, c]));

  // "now" in the salon's timezone (IST), as comparable strings
  const istDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  const istTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());

  return (offersQ.data as Offer[] ?? []).map((offer) => {
    const links = (linksQ.data ?? []).filter((l) => l.offer_id === offer.id);
    const service_names: string[] = [];
    const category_names: string[] = [];
    const priced: number[] = [];
    const scope: string[] = [];

    for (const l of links) {
      if (l.service_id) {
        scope.push(`s:${l.service_id}`);
        const s = services.get(l.service_id);
        if (s) {
          service_names.push(s.name);
          if (s.price != null) priced.push(Number(s.price));
        }
      } else if (l.category_id) {
        scope.push(`c:${l.category_id}`);
        const c = categories.get(l.category_id);
        if (c) {
          category_names.push(c.name);
          for (const s of servicesQ.data ?? []) {
            if (s.category_id === l.category_id && s.price != null) priced.push(Number(s.price));
          }
        }
      }
    }

    let status: 'running' | 'scheduled' | 'ended' | 'off';
    if (!offer.is_active) status = 'off';
    else if (offer.end_date < istDate) status = 'ended';
    else if (offer.start_date > istDate) status = 'scheduled';
    else status = 'running';

    let example_effect: string | null = null;
    if (priced.length > 0) {
      const min = Math.min(...priced);
      const discounted =
        offer.discount_type === 'percent' ? min * (1 - Number(offer.discount_value) / 100) : min - Number(offer.discount_value);
      if (discounted >= 0) {
        example_effect = `e.g. ₹${min.toLocaleString('en-IN')} → ₹${Math.round(discounted * 100) / 100}`;
      } else {
        example_effect = '⚠ would discount below ₹0 — not shown on menu';
      }
    }

    return { offer, service_names, category_names, scope, status, example_effect };
  });
}

export async function loadAuditPage(limit = 50) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}
