'use client';

import { useActionState } from 'react';
import { Save } from 'lucide-react';
import type { Category } from '@/types/db';
import { createService, updateService, type ServiceState } from './actions';
import { PRICE_STATUS_LABELS } from '@/lib/publish';
import type { Service } from '@/types/db';

const input = 'w-full border border-line bg-paper px-3 py-2 text-sm outline-none transition-colors focus:border-ink-strong';

export function ServiceForm({
  categories,
  service,
}: {
  categories: Category[];
  service?: (Service & { category_name: string | null }) | null;
}) {
  const initial: ServiceState = {};
  const [state, formAction, pending] = useActionState<ServiceState, FormData>(
    service ? updateService : createService,
    initial,
  );

  return (
    <form action={formAction} className="space-y-4 border border-line bg-paper-raised p-4">
      {service && <input type="hidden" name="id" value={service.id} />}
      {service && <input type="hidden" name="sort_order" value={service.sort_order} />}

      <label className="block">
        <span className="mb-1 block text-[10px] tracking-luxe uppercase text-ink-soft">Service name</span>
        <input name="name" required maxLength={120} defaultValue={service?.name ?? ''} className={input} />
      </label>

      <label className="block">
        <span className="mb-1 block text-[10px] tracking-luxe uppercase text-ink-soft">Description (optional, shown on the card)</span>
        <textarea
          name="description"
          rows={3}
          maxLength={500}
          defaultValue={service?.description ?? ''}
          className={input}
        />
      </label>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-[10px] tracking-luxe uppercase text-ink-soft">Price (₹, optional)</span>
          <input
            name="price"
            type="number"
            min={0}
            max={1000000}
            step="0.01"
            defaultValue={service?.price != null ? String(service.price) : ''}
            placeholder="e.g. 199"
            className={input}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[10px] tracking-luxe uppercase text-ink-soft">Price status</span>
          <select name="price_status" defaultValue={service?.price_status ?? 'pending'} className={input}>
            {Object.entries(PRICE_STATUS_LABELS).map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[10px] tracking-luxe uppercase text-ink-soft">Category</span>
          <select name="category_id" defaultValue={service?.category_id ?? ''} required className={input}>
            <option value="" disabled>Choose…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
      </div>

      {!service && (
        <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-soft">
          <input type="checkbox" name="is_published" className="h-3.5 w-3.5 accent-black" />
          Publish immediately (allowed only when a confirmed price is given)
        </label>
      )}

      {service && (
        <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-soft">
          <input
            type="checkbox"
            name="is_available"
            defaultChecked={service.is_available}
            className="h-3.5 w-3.5 accent-black"
          />
          Currently available (untick to show “Not available” on the menu)
        </label>
      )}

      {state.error && <p className="text-xs text-ink">⚠ {state.error}</p>}
      {state.ok && <p className="text-xs text-ink-soft">✓ {state.ok}</p>}

      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1.5 border border-ink bg-ink px-4 py-2 text-[11px] tracking-luxe uppercase text-paper transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        <Save className="h-3.5 w-3.5" /> {pending ? 'Saving…' : service ? 'Save changes' : 'Create service'}
      </button>
    </form>
  );
}
