'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { assertAdmin, createAuthServerClient } from '@/lib/supabase/server';

export type CatState = { error?: string; ok?: string };

const BASE = '/admin/categories';

function refresh() {
  revalidatePath('/');
  revalidatePath(BASE);
}

const createSchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(80),
  description: z.string().trim().max(300).optional(),
});

const updateSchema = createSchema.extend({ id: z.string().uuid() });

/** The single salon of this install — stamps salon_id on every insert. */
async function currentSalonId(
  supabase: Awaited<ReturnType<typeof createAuthServerClient>>,
): Promise<string | null> {
  const { data } = await supabase.from('salons').select('id').order('created_at').limit(1).maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

export async function createCategory(_prev: CatState, formData: FormData): Promise<CatState> {
  let supabase: Awaited<ReturnType<typeof createAuthServerClient>>;
  try {
    await assertAdmin();
    supabase = await createAuthServerClient();
  } catch {
    return { error: 'Session expired. Please sign in again.' };
  }

  const parsed = createSchema.safeParse({ name: formData.get('name'), description: formData.get('description') });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid details' };

  const salonId = await currentSalonId(supabase);
  if (!salonId) return { error: 'No salon record exists yet — set one up in Salon settings first.' };

  const { error } = await supabase.from('categories').insert({
    name: parsed.data.name,
    description: parsed.data.description || null,
    salon_id: salonId,
  });
  if (error) return { error: error.message };
  refresh();
  return { ok: `Category "${parsed.data.name}" created.` };
}

export async function updateCategory(formData: FormData) {
  let supabase: Awaited<ReturnType<typeof createAuthServerClient>>;
  try {
    await assertAdmin();
    supabase = await createAuthServerClient();
  } catch {
    redirect(`${BASE}?err=session`);
  }

  const parsed = updateSchema.safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
    description: formData.get('description'),
  });
  if (!parsed.success) {
    redirect(`${BASE}?err=${encodeURIComponent(parsed.error.errors[0]?.message ?? 'Invalid details')}`);
  }

  // the visibility checkbox ships with the same form; unchecked = hidden
  const isActive = formData.get('is_active') != null;

  const { error } = await supabase.from('categories').update({
    name: parsed.data.name,
    description: parsed.data.description || null,
    is_active: isActive,
  }).eq('id', parsed.data.id);

  if (error) redirect(`${BASE}?err=${encodeURIComponent(error.message)}`);
  refresh();
  const shown = isActive ? 'shown on menu' : 'hidden from menu';
  redirect(`${BASE}?ok=${encodeURIComponent(`"${parsed.data.name}" saved (${shown}).`)}`);
}

export async function deleteCategory(formData: FormData) {
  let supabase: Awaited<ReturnType<typeof createAuthServerClient>>;
  try {
    await assertAdmin();
    supabase = await createAuthServerClient();
  } catch {
    redirect(`${BASE}?err=session`);
  }

  const id = z.string().uuid().safeParse(formData.get('id'));
  const serviceCount = Number(formData.get('serviceCount') ?? 0);
  if (!id.success) redirect(`${BASE}?err=invalid`);

  if (serviceCount > 0) {
    // the DB would CASCADE-delete every service inside — never allow that blind
    redirect(`${BASE}?err=${encodeURIComponent(`Category still contains ${serviceCount} service(s). Move or delete them first.`)}`);
  }

  const { error } = await supabase.from('categories').delete().eq('id', id.data);
  if (error) redirect(`${BASE}?err=${encodeURIComponent(error.message)}`);
  refresh();
  redirect(`${BASE}?ok=${encodeURIComponent('Category deleted.')}`);
}

export async function moveCategory(formData: FormData) {
  let supabase: Awaited<ReturnType<typeof createAuthServerClient>>;
  try {
    await assertAdmin();
    supabase = await createAuthServerClient();
  } catch {
    redirect(`${BASE}?err=session`);
  }

  const id = formData.get('id') as string;
  const dir = formData.get('dir') === 'up' ? -1 : 1;

  const { data: cats, error } = await supabase
    .from('categories')
    .select('id, sort_order')
    .order('sort_order')
    .order('created_at');
  if (error || !cats) redirect(`${BASE}?err=${encodeURIComponent('Could not reorder.')}`);

  const idx = cats.findIndex((c: { id: string }) => c.id === id);
  const swapIdx = idx + dir;
  if (idx === -1 || swapIdx < 0 || swapIdx >= cats.length) redirect(BASE);

  const res = await Promise.all([
    supabase.from('categories').update({ sort_order: cats[swapIdx].sort_order }).eq('id', cats[idx].id),
    supabase.from('categories').update({ sort_order: cats[idx].sort_order }).eq('id', cats[swapIdx].id),
  ]);
  const err = res.find((r) => r.error)?.error;
  if (err) redirect(`${BASE}?err=${encodeURIComponent(err.message)}`);
  refresh();
  redirect(BASE);
}
