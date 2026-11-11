'use client';

import { useActionState, useMemo, useState } from 'react';
import type { ServiceWithCategory } from '@/lib/admin-data';
import { createOffer, updateOffer, type OfferState } from './actions';

const inputCls =
  'w-full border border-line bg-paper px-3 py-2 text-sm outline-none transition-colors focus:border-ink-strong';
const labelCls = 'mb-1 block text-[10px] tracking-luxe uppercase text-ink-soft';

function istDay(offsetDays = 0): string {
  const d = new Date();
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  ist.setDate(ist.getDate() + offsetDays);
  return ist.toISOString().slice(0, 10);
}
function thisWeekRange(): [string, string] {
  const todayIST = istDay();
  const d = new Date(todayIST + 'T00:00:00Z');
  const dow = d.getUTCDay(); // 0 Sun … 6 Sat
  const toMonday = dow === 0 ? -6 : 1 - dow;
  const start = new Date(d);
  start.setUTCDate(d.getUTCDate() + toMonday);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
}
function thisMonthRange(): [string, string] {
  const first = istDay().slice(0, 8);
  const d = new Date(istDay() + 'T00:00:00Z');
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
  return [first, last.toISOString().slice(0, 10)];
}

export function CreateOfferForm({
  categories,
  services,
}: {
  categories: Awaited<ReturnType<typeof import('@/lib/admin-data').loadAdminCategories>>;
  services: ServiceWithCategory[];
}) {
  const [state, formAction, pending] = useActionState<OfferState, FormData>(createOffer, {});
  return <OfferFormInner state={state} action={formAction} pending={pending} categories={categories} services={services} />;
}

export function EditOfferForm({
  id,
  values,
  initialScope,
  categories,
  services,
}: {
  id: string;
  values: {
    title: string;
    description: string | null;
    discount_type: 'percent' | 'fixed';
    discount_value: number;
    start_date: string;
    end_date: string;
    start_time: string | null;
    end_time: string | null;
    is_active: boolean;
  };
  initialScope: string[];
  categories: Awaited<ReturnType<typeof import('@/lib/admin-data').loadAdminCategories>>;
  services: ServiceWithCategory[];
}) {
  const [state, formAction, pending] = useActionState<OfferState, FormData>(updateOffer, {});
  return (
    <OfferFormInner
      state={state}
      action={formAction}
      pending={pending}
      categories={categories}
      services={services}
      id={id}
      values={values}
      initialScope={initialScope}
    />
  );
}

function OfferFormInner({
  state,
  action,
  pending,
  categories,
  services,
  id,
  values,
  initialScope,
}: {
  state: OfferState;
  action: (fd: FormData) => void;
  pending: boolean;
  categories: Awaited<ReturnType<typeof import('@/lib/admin-data').loadAdminCategories>>;
  services: ServiceWithCategory[];
  id?: string;
  values?: {
    title: string;
    description: string | null;
    discount_type: 'percent' | 'fixed';
    discount_value: number;
    start_date: string;
    end_date: string;
    start_time: string | null;
    end_time: string | null;
    is_active: boolean;
  };
  initialScope?: string[];
}) {
  const [preset, setPreset] = useState('custom');
  const [discountType, setDiscountType] = useState<string>(values?.discount_type ?? 'percent');
  const [selected, setSelected] = useState<Set<string>>(new Set(initialScope ?? ['c-all']));
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const presets: Record<string, { start: string; end: string }> = useMemo(() => ({
    today: { start: istDay(), end: istDay() },
    week: Object.fromEntries([['start', thisWeekRange()[0]], ['end', thisWeekRange()[1]]]) as { start: string; end: string },
    month: Object.fromEntries([['start', thisMonthRange()[0]], ['end', thisMonthRange()[1]]]) as { start: string; end: string },
  }), []);

  const range = presets[preset];
  const startDefault = values?.start_date ?? range?.start ?? istDay();
  const endDefault = values?.end_date ?? range?.end ?? istDay();

  const visibleServices = services.filter(
    (s) => !categoryFilter || s.category_id === categoryFilter,
  );

  function toggleScope(key: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (key === 'c-all') {
        if (checked) next.add('c-all');
        else next.delete('c-all');
        return next;
      }
      if (checked) {
        next.add(key);
        next.delete('c-all');
      } else {
        next.delete(key);
      }
      // if nothing else is selected and c-all was selected, keep it
      if (next.size === 0) next.add('c-all');
      return next;
    });
  }

  return (
    <form action={action} className="space-y-4 border border-line bg-paper-raised p-4">
      {id && <input type="hidden" name="id" value={id} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={labelCls}>Offer title</span>
          <input name="title" required maxLength={120} defaultValue={values?.title ?? ''} placeholder="e.g. Diwali Special" className={inputCls} />
        </label>
        <label className="block">
          <span className={labelCls}>Short description (optional)</span>
          <input name="description" maxLength={300} defaultValue={values?.description ?? ''} className={inputCls} />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className={labelCls}>Discount type</span>
          <select name="discount_type" value={discountType} onChange={(e) => setDiscountType(e.target.value)} className={inputCls}>
            <option value="percent">% off</option>
            <option value="fixed">₹ off (flat)</option>
          </select>
        </label>
        <label className="block">
          <span className={labelCls}>{discountType === 'percent' ? 'Discount % (1–100)' : 'Discount ₹'}</span>
          <input
            name="discount_value"
            type="number"
            min={discountType === 'percent' ? 1 : 1}
            max={discountType === 'percent' ? 100 : undefined}
            step={discountType === 'percent' ? 1 : 0.01}
            required
            defaultValue={values?.discount_value != null ? String(Number(values.discount_value)) : ''}
            placeholder={discountType === 'percent' ? 'e.g. 20' : 'e.g. 100'}
            className={inputCls}
          />
        </label>
        {!id && (
          <label className="block">
            <span className={labelCls}>Schedule preset</span>
            <select value={preset} onChange={(e) => setPreset(e.target.value)} className={inputCls}>
              <option value="custom">Custom dates ↓</option>
              <option value="today">Today only</option>
              <option value="week">This week (Mon–Sun)</option>
              <option value="month">This month (1st–end)</option>
            </select>
          </label>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <label className="block">
          <span className={labelCls}>Start date</span>
          <input
            name="start_date"
            type="date"
            required
            defaultValue={startDefault}
            value={!id && preset !== 'custom' ? range?.start : undefined}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className={labelCls}>End date</span>
          <input
            name="end_date"
            type="date"
            required
            defaultValue={endDefault}
            value={!id && preset !== 'custom' ? range?.end : undefined}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className={labelCls}>Start time (optional, IST)</span>
          <input name="start_time" type="time" defaultValue={values?.start_time?.slice(0, 5) ?? ''} className={inputCls} />
        </label>
        <label className="block">
          <span className={labelCls}>End time (optional, IST)</span>
          <input name="end_time" type="time" defaultValue={values?.end_time?.slice(0, 5) ?? ''} className={inputCls} />
        </label>
      </div>

      {!id && (
        <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-soft">
          <input type="checkbox" name="is_active" defaultChecked={values?.is_active ?? true} className="h-3.5 w-3.5 accent-black" />
          Activate immediately (it still only shows during its schedule)
        </label>
      )}

      {/* scope */}
      <fieldset className="border border-line p-3">
        <legend className="px-1 text-[10px] tracking-luxe uppercase text-ink-soft">
          Applies to — select services or entire categories
        </legend>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex cursor-pointer items-center gap-1.5 border border-line px-2.5 py-1 text-[11px]">
            <input
              type="checkbox"
              name="scope"
              value="c:all"
              checked={selected.has('c-all')}
              onChange={(e) => toggleScope('c-all', e.target.checked)}
              className="h-3.5 w-3.5 accent-black"
            />
            Whole menu
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-line bg-paper px-2 py-1.5 text-[11px] outline-none focus:border-ink-strong"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="mt-2 max-h-44 space-y-3 overflow-y-auto pr-1">
          {categories
            .filter((c) => !categoryFilter || c.id === categoryFilter)
            .map((c) => (
              <div key={c.id}>
                <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-medium">
                  <input
                    type="checkbox"
                    name="scope"
                    value={`c:${c.id}`}
                    checked={selected.has(`c:${c.id}`)}
                    onChange={(e) => toggleScope(`c:${c.id}`, e.target.checked)}
                    className="h-3.5 w-3.5 accent-black"
                  />
                  <span className={selected.has('c-all') ? 'italic text-ink-faint' : ''}>{c.name} (whole category)</span>
                </label>
                <div className="ml-5 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                  {visibleServices
                    .filter((s) => s.category_id === c.id)
                    .map((s) => (
                      <label
                        key={s.id}
                        className={`flex cursor-pointer items-center gap-1 text-[11px] ${selected.has('c-all') ? 'text-ink-faint' : ''}`}
                      >
                        <input
                          type="checkbox"
                          name="scope"
                          value={`s:${s.id}`}
                          checked={selected.has(`s:${s.id}`)}
                          onChange={(e) => toggleScope(`s:${s.id}`, e.target.checked)}
                          className="h-3 w-3 accent-black"
                        />
                        {s.name}
                      </label>
                    ))}
                </div>
              </div>
            ))}
        </div>
      </fieldset>

      {state.error && <p className="text-xs text-ink">⚠ {state.error}</p>}
      {state.ok && <p className="text-xs text-ink-soft">✓ {state.ok}</p>}

      <button
        type="submit"
        disabled={pending}
        className="border border-ink bg-ink px-4 py-2 text-[11px] tracking-luxe uppercase text-paper transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {pending ? 'Saving…' : id ? 'Save changes' : 'Create offer'}
      </button>
    </form>
  );
}
