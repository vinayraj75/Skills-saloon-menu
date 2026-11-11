'use client';

import { useActionState } from 'react';
import { Plus } from 'lucide-react';
import { createCategory, type CatState } from './actions';

export function CreateCategoryForm() {
  const [state, formAction, pending] = useActionState<CatState, FormData>(createCategory, {});

  return (
    <form action={formAction} className="space-y-3 border border-line bg-paper-raised p-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="block flex-1">
          <span className="mb-1 block text-[10px] tracking-luxe uppercase text-ink-soft">Name</span>
          <input
            name="name"
            required
            maxLength={80}
            placeholder="e.g. Bridal Packages"
            className="w-full border border-line bg-paper px-3 py-2 text-sm outline-none transition-colors focus:border-ink-strong"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="mt-0 flex h-fit items-center gap-1.5 self-start border border-ink bg-ink px-3 py-2 text-[11px] tracking-luxe uppercase text-paper transition-opacity hover:opacity-90 disabled:opacity-40 sm:mt-5"
        >
          <Plus className="h-3.5 w-3.5" /> Add category
        </button>
      </div>
      <label className="block">
        <span className="mb-1 block text-[10px] tracking-luxe uppercase text-ink-soft">Description (optional)</span>
        <input
          name="description"
          maxLength={300}
          className="w-full border border-line bg-paper px-3 py-2 text-sm outline-none transition-colors focus:border-ink-strong"
        />
      </label>
      {state.error && <p className="text-xs text-ink">⚠ {state.error}</p>}
      {state.ok && <p className="text-xs text-ink-soft">✓ {state.ok}</p>}
    </form>
  );
}
