'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { createAuthServerClient } from '@/lib/supabase/server';
import { tokenMatches } from './token';

const schema = z
  .object({
    token: z.string().min(1),
    fullName: z.string().trim().min(2, 'Enter your name'),
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SetupState = { error?: string };

export async function createAdmin(_prev: SetupState, formData: FormData): Promise<SetupState> {
  const parsed = schema.safeParse({
    token: formData.get('token'),
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid details' };
  }
  const { token, fullName, email, password } = parsed.data;

  // 1. The secret link token must match, server-side only
  if (!tokenMatches(token)) return { error: 'This setup link is not valid.' };

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: 'Setup is closed. Use the admin login page.' };
  }

  const admin = createAdminClient();

  // 2. Only allowed while NO admin exists (one-time page)
  const { count, error: countErr } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'admin');
  if (countErr) return { error: 'Setup is unavailable. Use the admin login page.' };
  if ((count ?? 0) > 0) return { error: 'Admin already exists. This page is closed.' };

  // 3. Create the user directly (email confirmed — no verification loop)
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (createErr || !created.user) {
    return { error: createErr?.message.includes('already registered')
      ? 'That email is already registered. Use a unique email for the owner account.'
      : 'Could not create the account. Try again.' };
  }

  // 4. Elevate THIS profile to admin (DB unique index guarantees max 1)
  const { error: roleErr } = await admin
    .from('profiles')
    .update({ role: 'admin', full_name: fullName })
    .eq('id', created.user.id);
  if (roleErr) {
    await admin.auth.admin.deleteUser(created.user.id); // don't leave staff behind
    return { error: 'Could not grant admin rights. Try again.' };
  }

  // 5. Sign the new admin in (session cookies set server-side)
  const supabase = await createAuthServerClient();
  await supabase.auth.signInWithPassword({ email, password });

  // 6. Disarm the setup link forever: nothing to append to .env.local from here —
  //    the page self-closes because an admin now exists (checked in step 2).
  redirect('/admin');
}
