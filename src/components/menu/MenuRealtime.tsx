'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '@/lib/supabase/browser';

/**
 * Live updates: subscribes (as anon; RLS-protected) to menu tables and
 * refreshes the page when anything changes. ISR revalidation on the
 * server is the fallback if this channel is unavailable.
 */
export function MenuRealtime() {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = getBrowserClient();

    const channel = supabase
      .channel('menu-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offer_services' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_settings' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'salons' }, scheduleRefresh)
      .subscribe();

    function scheduleRefresh() {
      // debounce: bursts of admin edits should cause one refresh, not many
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 600);
    }

    return () => {
      if (timer.current) clearTimeout(timer.current);
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
