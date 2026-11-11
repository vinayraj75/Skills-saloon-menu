'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { assertAdmin, createAuthServerClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/publish';

export type ServiceState = { error?: string; ok?: string };

const SERVICES = '/admin/services';

/** Refresh customer menu (on-demand ISR) + admin pages. */
function refresh(id?: string) {
  revalidatePath('/');
  revalidatePath(SERVICES);
  if (id) revalidatePath(`/service/${id}`);
}

/** The single salon of this install — stamps salon_id on every insert. */
async function currentSalonId(
  supabase: Awaited<ReturnType<typeof createAuthServerClient>>,
): Promise<string | null> {
  const { data } = await supabase.from('salons').select('id').order('created_at').limit(1).maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

/* ------------------------------------------------------------------ */
/* Field schema shared by create + update                              */
/* ------------------------------------------------------------------ */

const priceSchema = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v == null || v === '' ? null : Number(v)))
  .refine((v) => v == null || (Number.isFinite(v) && v >= 0 && v <= 1_000_000), 'Enter a valid price (0 or more)');

const baseFields = z.object({
  name: z.string().trim().min(1, 'Service name is required').max(120),
  description: z.string().trim().max(500).optional(),
  price: priceSchema,
  price_status: z.enum(['confirmed', 'needs_verification', 'pending']),
  category_id: z.string().uuid('Choose a category'),
  sort_order: z.coerce.number().int().min(0).max(9999),
});

/* ------------------------------------------------------------------ */
/* Create                                                              */
/* ------------------------------------------------------------------ */

export async function createService(_prev: ServiceState, formData: FormData): Promise<ServiceState> {
  let supabase: Awaited<ReturnType<typeof createAuthServerClient>>;
  try {
    await assertAdmin();
    supabase = await createAuthServerClient();
  } catch {
    return { error: 'Session expired. Please sign in again.' };
  }

  const raw = {
    name: formData.get('name'),
    description: formData.get('description'),
    price: formData.get('price'),
    price_status: formData.get('price_status'),
    category_id: formData.get('category_id'),
    is_published: formData.get('is_published') != null,
  };
  const fields = baseFields.omit({ sort_order: true }).extend({
    is_published: z.coerce.boolean().default(false),
  });
  const parsed = fields.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid details' };

  const d = parsed.data;
  const salonId = await currentSalonId(supabase);
  if (!salonId) return { error: 'No salon record exists yet — set one up in Salon settings first.' };

  // draft-first rule: only publish immediately when price is confirmed
  const wantsPublish = d.is_published && d.price != null && d.price_status === 'confirmed';

  const { data: created, error } = await supabase
    .from('services')
    .insert({
      name: d.name,
      description: d.description || null,
      price: d.price,
      price_status: d.price_status,
      category_id: d.category_id,
      is_published: wantsPublish,
      is_available: true,
      salon_id: salonId,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };
  refresh(created.id);
  redirect(`${SERVICES}/${created.id}?ok=${encodeURIComponent('Service created.')}`);
}

/* ------------------------------------------------------------------ */
/* Update (all editable fields except ordering)                        */
/* ------------------------------------------------------------------ */

export async function updateService(_prev: ServiceState, formData: FormData): Promise<ServiceState> {
  let supabase: Awaited<ReturnType<typeof createAuthServerClient>>;
  try {
    await assertAdmin();
    supabase = await createAuthServerClient();
  } catch {
    return { error: 'Session expired. Please sign in again.' };
  }

  const parsed = baseFields.extend({ id: z.string().uuid() }).safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
    description: formData.get('description'),
    price: formData.get('price'),
    price_status: formData.get('price_status'),
    category_id: formData.get('category_id'),
    sort_order: formData.get('sort_order'),
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid details' };

  const d = parsed.data;

  // Publishing is a separate, explicit toggle; its rules live in setPublished.
  const { error } = await supabase
    .from('services')
    .update({
      name: d.name,
      description: d.description || null,
      price: d.price,
      price_status: d.price_status,
      category_id: d.category_id,
      sort_order: d.sort_order,
      is_available: formData.get('is_available') != null,
    })
    .eq('id', d.id);

  if (error) return { error: error.message };
  refresh(d.id);
  return { ok: 'Changes saved.' };
}

/* ------------------------------------------------------------------ */
/* Publish / unpublish (draft-protection enforced)                     */
/* ------------------------------------------------------------------ */

export async function setPublished(formData: FormData) {
  let supabase: Awaited<ReturnType<typeof createAuthServerClient>>;
  try {
    await assertAdmin();
    supabase = await createAuthServerClient();
  } catch {
    redirect('/admin/login?error=not_admin');
  }

  const id = z.string().uuid().safeParse(formData.get('id'));
  const publish = formData.get('publish') === '1';
  if (!id.success) redirect(`${SERVICES}?err=invalid`);

  const { data: svc } = await supabase
    .from('services')
    .select('id, price, price_status, name')
    .eq('id', id.data)
    .maybeSingle();
  if (!svc) redirect(`${SERVICES}?err=${encodeURIComponent('Service not found.')}`);
  const row = svc as unknown as { price: number | null; price_status: string; name: string };

  if (publish && row.price == null) {
    redirect(`${SERVICES}?err=${encodeURIComponent(`"${row.name}" has no price. Add a price first.`)}`);
  }
  if (publish && row.price_status !== 'confirmed') {
    redirect(`${SERVICES}?err=${encodeURIComponent(`Mark the price of "${row.name}" as Confirmed before publishing.`)}`);
  }

  const { error } = await supabase.from('services').update({ is_published: publish }).eq('id', id.data);
  if (error) redirect(`${SERVICES}?err=${encodeURIComponent(error.message)}`);

  refresh(id.data);
  redirect(`${SERVICES}?ok=${encodeURIComponent(publish ? 'Service is now live on the menu.' : 'Service unpublished.')}`);
}

/* ------------------------------------------------------------------ */
/* Availability toggle (visible on menu but marked "not available")    */
/* ------------------------------------------------------------------ */

export async function setAvailable(formData: FormData) {
  let supabase: Awaited<ReturnType<typeof createAuthServerClient>>;
  try {
    await assertAdmin();
    supabase = await createAuthServerClient();
  } catch {
    redirect('/admin/login?error=not_admin');
  }

  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) redirect(`${SERVICES}?err=invalid`);
  const available = formData.get('available') === '1';

  const { error } = await supabase.from('services').update({ is_available: available }).eq('id', id.data);
  if (error) redirect(`${SERVICES}/${id.data}?err=${encodeURIComponent(error.message)}`);
  refresh(id.data);
  redirect(
    `${SERVICES}?ok=${encodeURIComponent(
      available
        ? 'Marked available.'
        : 'Marked NOT available — the menu shows a "Not available" badge.',
    )}`,
  );
}

/* ------------------------------------------------------------------ */
/* Reorder (swap sort_order with the neighbour in the same category)   */
/* ------------------------------------------------------------------ */

export async function moveService(formData: FormData) {
  let supabase: Awaited<ReturnType<typeof createAuthServerClient>>;
  try {
    await assertAdmin();
    supabase = await createAuthServerClient();
  } catch {
    redirect('/admin/login?error=not_admin');
  }

  const id = String(formData.get('id') ?? '');
  const dir = formData.get('dir') === 'up' ? -1 : 1;
  // where to send the user back after the move (list or edit page)
  const where = String(formData.get('where') ?? SERVICES);

  const { data: svc } = await supabase
    .from('services')
    .select('id, category_id, sort_order')
    .eq('id', id)
    .maybeSingle();
  if (!svc) redirect(`${where}?err=invalid`);
  const row = svc as unknown as { id: string; category_id: string; sort_order: number };

  const { data: siblings } = await supabase
    .from('services')
    .select('id, sort_order')
    .eq('category_id', row.category_id)
    .order('sort_order')
    .order('created_at');
  const list = (siblings ?? []) as unknown as { id: string; sort_order: number }[];

  const idx = list.findIndex((s) => s.id === row.id);
  const other = list[idx + dir];
  if (idx === -1 || !other) {
    redirect(`${where}${where.includes('?') ? '&' : '?'}err=${encodeURIComponent('Already at the edge of the list.')}`);
  }

  const res = await Promise.all([
    supabase.from('services').update({ sort_order: other.sort_order }).eq('id', row.id),
    supabase.from('services').update({ sort_order: row.sort_order }).eq('id', other.id),
  ]);
  const err = res.find((r) => r.error)?.error;
  if (err) redirect(`${where}?err=${encodeURIComponent(err.message)}`);
  refresh();
  redirect(where);
}

/* ------------------------------------------------------------------ */
/* Delete (confirm handled in UI)                                      */
/* ------------------------------------------------------------------ */

export async function deleteService(formData: FormData) {
  let supabase: Awaited<ReturnType<typeof createAuthServerClient>>;
  try {
    await assertAdmin();
    supabase = await createAuthServerClient();
  } catch {
    redirect('/admin/login?error=not_admin');
  }

  const id = String(formData.get('id') ?? '');
  // offer_links cascade automatically; the file in Storage stays (history-safe)
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) redirect(`${SERVICES}?err=${encodeURIComponent(error.message)}`);
  refresh();
  redirect(`${SERVICES}?ok=${encodeURIComponent('Service deleted.')}`);
}

/* ------------------------------------------------------------------ */
/* Images: upload / replace / remove — with type + size validation     */
/* ------------------------------------------------------------------ */

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const SUPABASE_HOST = (() => {
  try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').host; } catch { return ''; }
})();

export async function saveServiceImage(_prev: ServiceState, formData: FormData): Promise<ServiceState> {
  let supabase: Awaited<ReturnType<typeof createAuthServerClient>>;
  try {
    await assertAdmin();
    supabase = await createAuthServerClient();
  } catch {
    return { error: 'Session expired. Please sign in again.' };
  }

  const id = z.string().uuid().safeParse(formData.get('id'));
  const file = formData.get('image');
  if (!id.success) return { error: 'Invalid service.' };
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose an image file first.' };

  const ext = ALLOWED_IMAGE_TYPES[file.type];
  if (!ext) return { error: 'Only JPG, PNG or WebP images are allowed.' };
  if (file.size > MAX_IMAGE_BYTES) return { error: 'Image is too large — maximum 2 MB.' };

  // Reuse the current object path when replacing; new path from the name.
  const { data: svc } = await supabase.from('services').select('name, image_url').eq('id', id.data).maybeSingle();
  const svcRow = (svc ?? null) as { name: string; image_url: string | null } | null;
  if (!svcRow) return { error: 'Service not found.' };

  let path: string | null = null;
  if (svcRow.image_url) {
    const m = svcRow.image_url.match(/service-images\/([^?/]+)\.(jpg|jpeg|png|webp)/i);
    if (m) path = `${m[1]}.${m[2].toLowerCase()}`;
  }
  if (!path) path = `${slugify(svcRow.name)}-${id.data.slice(0, 8)}.${ext}`;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await supabase
    .storage
    .from('service-images')
    .upload(path, bytes, { contentType: file.type, upsert: true });

  if (error) {
    return {
      error: error.message.includes('exceeded') || error.message.includes('413')
        ? 'Image too large — the bucket limit is 2 MB.'
        : error.message.includes('type') || error.message.includes('415') || error.message.toLowerCase().includes('mime')
          ? 'Only JPG, PNG or WebP images are allowed.'
          : error.message,
    };
  }

  const url = `https://${SUPABASE_HOST}/storage/v1/object/public/service-images/${path}?v=${Date.now()}`;
  const { error: dbErr } = await supabase.from('services').update({ image_url: url }).eq('id', id.data);
  if (dbErr) return { error: dbErr.message };

  refresh(id.data);
  return { ok: 'Image saved.' };
}

export async function removeServiceImage(formData: FormData) {
  let supabase: Awaited<ReturnType<typeof createAuthServerClient>>;
  try {
    await assertAdmin();
    supabase = await createAuthServerClient();
  } catch {
    redirect('/admin/login?error=not_admin');
  }

  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) redirect(`${SERVICES}?err=invalid`);

  const { data: svc } = await supabase.from('services').select('image_url').eq('id', id.data).maybeSingle();
  const url = (svc as { image_url: string | null } | null)?.image_url;
  if (url) {
    const m = url.match(/service-images\/([^?/]+)/);
    if (m) await supabase.storage.from('service-images').remove([m[1]]);
  }
  const { error } = await supabase.from('services').update({ image_url: null }).eq('id', id.data);
  if (error) redirect(`${SERVICES}/${id.data}?err=${encodeURIComponent(error.message)}`);
  refresh(id.data);
  redirect(`${SERVICES}/${id.data}?ok=${encodeURIComponent('Image removed.')}`);
}
