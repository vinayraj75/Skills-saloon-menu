'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { createAuthServerClient, getProfile } from '@/lib/supabase/server';

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  next: z.string().optional(),
});

export type LoginState = { error?: string };

export async function logIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next') ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid details' };
  }
  const { email, password, next } = parsed.data;

  const supabase = await createAuthServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: 'Wrong email or password.' };

  const profile = await getProfile();
  if (!profile || profile.role !== 'admin') {
    // signed in but not the admin — end the session immediately
    await supabase.auth.signOut();
    return { error: 'This account does not have admin access.' };
  }

  // Only follow safe internal paths
  const target =
    next && next.startsWith('/admin') && !next.includes('//') ? next : '/admin';
  redirect(target);
}
