'use client';

import { useActionState } from 'react';
import { Save } from 'lucide-react';
import type { SalonState } from './actions';
import { updateSalon, updateAnnouncement } from './actions';
import type { MenuSettings, Salon } from '@/types/db';

const input =
  'w-full border border-line bg-paper px-3 py-2 text-sm outline-none transition-colors focus:border-ink-strong';

export function SalonForm({ salon }: { salon: Salon }) {
  const [state, formAction, pending] = useActionState<SalonState, FormData>(updateSalon, {});

  return (
    <form action={formAction} className="space-y-4 border border-line bg-paper-raised p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[10px] tracking-luxe uppercase text-ink-soft">Salon name</span>
          <input name="name" required maxLength={120} defaultValue={salon.name} className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] tracking-luxe uppercase text-ink-soft">Tagline</span>
          <input name="tagline" maxLength={120} defaultValue={salon.tagline ?? ''} className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] tracking-luxe uppercase text-ink-soft">Phone (shown on menu)</span>
          <input name="phone" maxLength={30} defaultValue={salon.phone ?? ''} className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] tracking-luxe uppercase text-ink-soft">Address (shown on menu)</span>
          <input name="address" maxLength={240} defaultValue={salon.address ?? ''} className={input} />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-[10px] tracking-luxe uppercase text-ink-soft">About (footer of the menu)</span>
        <textarea name="description" rows={3} maxLength={500} defaultValue={salon.description ?? ''} className={input} />
      </label>
      {state.error && <p className="text-xs text-ink">⚠ {state.error}</p>}
      {state.ok && <p className="text-xs text-ink-soft">✓ {state.ok}</p>}
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1.5 border border-ink bg-ink px-4 py-2 text-[11px] tracking-luxe uppercase text-paper transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        <Save className="h-3.5 w-3.5" /> {pending ? 'Saving…' : 'Save salon details'}
      </button>
    </form>
  );
}

export function AnnouncementForm({ settings }: { settings: MenuSettings | null }) {
  const [state, formAction, pending] = useActionState<SalonState, FormData>(updateAnnouncement, {});

  return (
    <form action={formAction} className="space-y-3 border border-line bg-paper-raised p-4">
      <p className="text-[10px] tracking-luxe uppercase text-ink-soft">
        Announcement bar (top of the customer menu)
      </p>
      <label className="block">
        <span className="mb-1 block text-[10px] tracking-luxe uppercase text-ink-soft">Text</span>
        <input
          name="announcement_text"
          maxLength={200}
          defaultValue={settings?.announcement_text ?? ''}
          placeholder="e.g. Diwali week — 15% off on all facials"
          className={input}
        />
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-soft">
        <input
          type="checkbox"
          name="announcement_active"
          defaultChecked={settings?.announcement_active ?? false}
          className="h-3.5 w-3.5 accent-black"
        />
        Show announcement on the menu
      </label>
      {state.error && <p className="text-xs text-ink">⚠ {state.error}</p>}
      {state.ok && <p className="text-xs text-ink-soft">✓ {state.ok}</p>}
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1.5 border border-ink px-4 py-2 text-[11px] tracking-luxe uppercase text-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-40"
      >
        {pending ? 'Saving…' : 'Save announcement'}
      </button>
    </form>
  );
}
