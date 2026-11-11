'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { assertAdmin, createAuthServerClient } from '@/lib/supabase/server';

export type SalonState = { error?: string; ok?: string };
const BACK = '/admin/salon';

function refresh(path?: string) {
  revalidatePath('/');
  if (path) revalidatePath(path);
}

const salonSchema = z.object({
  name: z.string().trim().min(1, 'Salon name is required').max(120),
  tagline: z.string().trim().max(120).optional(),
  description: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(30).optional(),
  address: z.string().trim().max(240).optional(),
});

export async function updateSalon(_prev: SalonState, formData: FormData): Promise<SalonState> {
  let supabase: Awaited<ReturnType<typeof createAuthServerClient>>;
  try {
    await assertAdmin();
    supabase = await createAuthServerClient();
  } catch {
    return { error: 'Session expired. Please sign in again.' };
  }

  const parsed = salonSchema.safeParse({
    name: formData.get('name'),
    tagline: formData.get('tagline'),
    description: formData.get('description'),
    phone: formData.get('phone'),
    address: formData.get('address'),
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid details' };

  // single-salon install: update the one active row
  const { data: existing } = await supabase
    .from('salons')
    .select('id')
    .order('created_at')
    .limit(1)
    .maybeSingle();
  if (!existing) return { error: 'No salon record found in the database.' };

  const { error } = await supabase
    .from('salons')
    .update({
      name: parsed.data.name,
      tagline: parsed.data.tagline || null,
      description: parsed.data.description || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
    })
    .eq('id', (existing as { id: string }).id);

  if (error) return { error: error.message };
  refresh('/');
  return { ok: 'Salon details saved — the customer menu updates instantly.' };
}

const announcementSchema = z.object({
  announcement_text: z.string().trim().max(200).optional(),
  announcement_active: z.boolean().optional(),
});

export async function updateAnnouncement(_prev: SalonState, formData: FormData): Promise<SalonState> {
  let supabase: Awaited<ReturnType<typeof createAuthServerClient>>;
  try {
    await assertAdmin();
    supabase = await createAuthServerClient();
  } catch {
    return { error: 'Session expired. Please sign in again.' };
  }

  const text = String(formData.get('announcement_text') ?? '');
  const active = formData.get('announcement_active') != null;
  const parsed = announcementSchema.safeParse({
    announcement_text: text || undefined,
    announcement_active: active,
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid details' };

  // shown only when both on AND text non-empty
  const { data: existing } = await supabase.from('menu_settings').select('id').limit(1).maybeSingle();
  const values = {
    announcement_text: text || null,
    announcement_active: active && text.trim() !== '',
  };

  const { error } = existing
    ? await supabase.from('menu_settings').update(values).eq('id', (existing as { id: string }).id)
    : await supabase.from('menu_settings').insert({ ...values });

  if (error) return { error: error.message };
  refresh(BACK);
  return { ok: 'Announcement saved.' };
}
