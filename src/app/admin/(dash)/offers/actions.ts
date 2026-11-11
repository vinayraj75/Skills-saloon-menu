'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { assertAdmin, createAuthServerClient } from '@/lib/supabase/server';

export type OfferState = { error?: string; ok?: string };

const OFFERS = '/admin/offers';

function refresh() {
  revalidatePath('/');
  revalidatePath(OFFERS);
}

/** The single salon of this install — stamps salon_id on every insert. */
async function currentSalonId(
  supabase: Awaited<ReturnType<typeof createAuthServerClient>>,
): Promise<string | null> {
  const { data } = await supabase.from('salons').select('id').order('created_at').limit(1).maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

/* ------------------------------------------------------------------ */
/* Scope parsing: checkbox values look like "c:<uuid>" or "s:<uuid>";   */
/* "c:all" means the whole menu (expanded to every category server-side)*/
/* ------------------------------------------------------------------ */

function parseScope(formData: FormData) {
  const raw = formData.getAll('scope').map(String);
  const category_ids: string[] = [];
  const service_ids: string[] = [];
  let wholeMenu = false;
  for (const v of raw) {
    if (v === 'c:all') {
      wholeMenu = true;
      continue;
    }
    if (v.startsWith('c:')) category_ids.push(v.slice(2));
    else if (v.startsWith('s:')) service_ids.push(v.slice(2));
  }
  return { category_ids, service_ids, wholeMenu };
}

async function resolveScope(
  supabase: Awaited<ReturnType<typeof createAuthServerClient>>,
  formData: FormData,
): Promise<{ ok: true; category_ids: string[]; service_ids: string[] } | { ok: false; error: string }> {
  const { category_ids, service_ids, wholeMenu } = parseScope(formData);
  let cats = category_ids;

  if (wholeMenu) {
    const { data, error } = await supabase.from('categories').select('id');
    if (error) return { ok: false, error: error.message };
    cats = Array.from(new Set([...cats, ...((data ?? []) as { id: string }[]).map((c) => c.id)]));
  }

  if (cats.length === 0 && service_ids.length === 0) {
    return { ok: false, error: 'Choose at least one service or category for the offer to apply to' };
  }
  return { ok: true, category_ids: cats, service_ids };
}

/* ------------------------------------------------------------------ */
/* Field schema                                                        */
/* ------------------------------------------------------------------ */

const fieldsSchema = z
  .object({
    title: z.string().trim().min(1, 'Offer title is required').max(120),
    description: z.string().trim().max(300).optional(),
    discount_type: z.enum(['percent', 'fixed']),
    discount_value: z.coerce.number().refine((v) => Number.isFinite(v) && v > 0, 'Discount must be more than 0'),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date is required'),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date is required'),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid start time').optional().or(z.literal('').transform(() => undefined)),
    end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid end time').optional().or(z.literal('').transform(() => undefined)),
  })
  .refine((d) => d.start_date <= d.end_date, {
    message: 'End date must be on or after the start date',
    path: ['end_date'],
  })
  .refine(
    (d) => !(d.start_time && d.end_time) || d.start_time < d.end_time,
    { message: 'End time must be after start time', path: ['end_time'] },
  );

type ParsedOffer = z.infer<typeof fieldsSchema>;

/** Price safety: a fixed discount may not exceed the cheapest linked price. */
async function priceSafetyCheck(
  supabase: Awaited<ReturnType<typeof createAuthServerClient>>,
  offer: { discount_type: string; discount_value: number },
  category_ids: string[],
  service_ids: string[],
): Promise<string | null> {
  if (offer.discount_type !== 'fixed') return null; // percent ≤100 can never go negative

  let minPrice: number | null = null;
  if (service_ids.length > 0) {
    const { data } = await supabase
      .from('services')
      .select('price')
      .in('id', service_ids)
      .not('price', 'is', null);
    for (const s of (data ?? []) as unknown as { price: number }[]) {
      if (minPrice == null || Number(s.price) < minPrice) minPrice = Number(s.price);
    }
  }
  if (category_ids.length > 0) {
    const { data } = await supabase
      .from('services')
      .select('price')
      .in('category_id', category_ids)
      .not('price', 'is', null);
    for (const s of (data ?? []) as unknown as { price: number }[]) {
      if (minPrice == null || Number(s.price) < minPrice) minPrice = Number(s.price);
    }
  }
  if (minPrice != null && offer.discount_value >= minPrice) {
    return `This fixed discount is larger than the cheapest linked price (₹${minPrice.toLocaleString(
      'en-IN',
    )}). Lower it so no price goes below ₹0.`;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Create                                                              */
/* ------------------------------------------------------------------ */

export async function createOffer(_prev: OfferState, formData: FormData): Promise<OfferState> {
  let supabase: Awaited<ReturnType<typeof createAuthServerClient>>;
  try {
    await assertAdmin();
    supabase = await createAuthServerClient();
  } catch {
    return { error: 'Session expired. Please sign in again.' };
  }

  const fields = {
    title: formData.get('title'),
    description: formData.get('description'),
    discount_type: formData.get('discount_type'),
    discount_value: formData.get('discount_value'),
    start_date: formData.get('start_date'),
    end_date: formData.get('end_date'),
    start_time: formData.get('start_time'),
    end_time: formData.get('end_time'),
  };

  const parsed = fieldsSchema.safeParse(fields);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid details' };

  const guard = parsed.data.discount_type === 'percent' && parsed.data.discount_value > 100
    ? 'Percentage discount cannot exceed 100.'
    : null;
  if (guard) return { error: guard };

  const scope = await resolveScope(supabase, formData);
  if (!scope.ok) return { error: scope.error };
  const { category_ids, service_ids } = scope;

  const safety = await priceSafetyCheck(supabase, parsed.data, category_ids, service_ids);
  if (safety) return { error: safety };

  const salonId = await currentSalonId(supabase);
  if (!salonId) return { error: 'No salon record exists yet — set one up in Salon settings first.' };

  const insert: Record<string, unknown> = {
    salon_id: salonId,
    title: parsed.data.title,
    description: parsed.data.description || null,
    discount_type: parsed.data.discount_type,
    discount_value: parsed.data.discount_value,
    start_date: parsed.data.start_date,
    end_date: parsed.data.end_date,
    is_active: formData.get('is_active') != null,
  };
  if (parsed.data.start_time) insert.start_time = parsed.data.start_time + ':00';
  if (parsed.data.end_time) insert.end_time = parsed.data.end_time + ':00';

  const { data: created, error } = await supabase.from('offers').insert(insert).select('id').single();
  if (error) return { error: error.message };

  const links = [
    ...category_ids.map((category_id) => ({ offer_id: (created as { id: string }).id, category_id })),
    ...service_ids.map((service_id) => ({ offer_id: (created as { id: string }).id, service_id })),
  ];
  const { error: linkErr } = await supabase.from('offer_services').insert(links);
  if (linkErr) return { error: linkErr.message };

  refresh();
  return { ok: 'Offer created — it shows on the menu automatically during its schedule.' };
}

/* ------------------------------------------------------------------ */
/* Update (fields + scope)                                             */
/* ------------------------------------------------------------------ */

export async function updateOffer(_prev: OfferState, formData: FormData): Promise<OfferState> {
  let supabase: Awaited<ReturnType<typeof createAuthServerClient>>;
  try {
    await assertAdmin();
    supabase = await createAuthServerClient();
  } catch {
    return { error: 'Session expired. Please sign in again.' };
  }

  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return { error: 'Invalid offer.' };

  const parsed = fieldsSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    discount_type: formData.get('discount_type'),
    discount_value: formData.get('discount_value'),
    start_date: formData.get('start_date'),
    end_date: formData.get('end_date'),
    start_time: formData.get('start_time'),
    end_time: formData.get('end_time'),
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid details' };
  const d = parsed.data as ParsedOffer;

  const guard = d.discount_type === 'percent' && d.discount_value > 100
    ? 'Percentage discount cannot exceed 100.'
    : null;
  if (guard) return { error: guard };

  const scope = await resolveScope(supabase, formData);
  if (!scope.ok) return { error: scope.error };
  const { category_ids, service_ids } = scope;

  const safety = await priceSafetyCheck(supabase, d, category_ids, service_ids);
  if (safety) return { error: safety };

  const update: Record<string, unknown> = {
    title: d.title,
    description: d.description || null,
    discount_type: d.discount_type,
    discount_value: d.discount_value,
    start_date: d.start_date,
    end_date: d.end_date,
    start_time: d.start_time ? d.start_time + ':00' : null,
    end_time: d.end_time ? d.end_time + ':00' : null,
  };

  const { error } = await supabase.from('offers').update(update).eq('id', id.data);
  if (error) return { error: error.message };

  const { error: rmErr } = await supabase.from('offer_services').delete().eq('offer_id', id.data);
  if (rmErr) return { error: rmErr.message };

  const links = [
    ...category_ids.map((category_id) => ({ offer_id: id.data, category_id })),
    ...service_ids.map((service_id) => ({ offer_id: id.data, service_id })),
  ];
  const { error: linkErr } = await supabase.from('offer_services').insert(links);
  if (linkErr) return { error: linkErr.message };

  refresh();
  return { ok: 'Offer saved.' };
}

/* ------------------------------------------------------------------ */
/* Toggle on/off + delete (plain actions)                              */
/* ------------------------------------------------------------------ */

export async function toggleOffer(formData: FormData) {
  let supabase: Awaited<ReturnType<typeof createAuthServerClient>>;
  try {
    await assertAdmin();
    supabase = await createAuthServerClient();
  } catch {
    redirect('/admin/login?error=not_admin');
  }

  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) redirect(`${OFFERS}?err=invalid`);
  const activate = formData.get('activate') === '1';

  const { error } = await supabase.from('offers').update({ is_active: activate }).eq('id', id.data);
  if (error) redirect(`${OFFERS}?err=${encodeURIComponent(error.message)}`);
  refresh();
  redirect(`${OFFERS}?ok=${encodeURIComponent(activate ? 'Offer switched on.' : 'Offer switched off.')}`);
}

export async function deleteOffer(formData: FormData) {
  let supabase: Awaited<ReturnType<typeof createAuthServerClient>>;
  try {
    await assertAdmin();
    supabase = await createAuthServerClient();
  } catch {
    redirect('/admin/login?error=not_admin');
  }

  const id = String(formData.get('id') ?? '');
  const { error } = await supabase.from('offers').delete().eq('id', id);
  if (error) redirect(`${OFFERS}?err=${encodeURIComponent(error.message)}`);
  refresh();
  redirect(`${OFFERS}?ok=${encodeURIComponent('Offer deleted.')}`);
}
