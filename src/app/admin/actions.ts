'use server';

import { redirect } from 'next/navigation';
import { createAuthServerClient } from '@/lib/supabase/server';

export async function logOut() {
  const supabase = await createAuthServerClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
