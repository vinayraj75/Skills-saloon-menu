import { Pencil, PowerOff, Power, Trash2 } from 'lucide-react';
import { ConfirmButton } from '@/components/admin/ConfirmButton';
import { formatINR } from '@/lib/offers';
import { toggleOffer, deleteOffer } from './actions';
import { EditOfferForm } from './offer-form';
import type { ServiceWithCategory } from '@/lib/admin-data';

type CatData = Awaited<ReturnType<typeof import('@/lib/admin-data').loadAdminCategories>>;

const STATUS_LABEL: Record<string, { label: string; live: boolean }> = {
  running: { label: 'Running now', live: true },
  scheduled: { label: 'Scheduled', live: false },
  ended: { label: 'Ended', live: false },
  off: { label: 'Switched off', live: false },
};

export function OfferRow({
  data,
  categories,
  services,
}: {
  data: {
    offer: {
      id: string;
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
    service_names: string[];
    category_names: string[];
    scope: string[];
    status: 'running' | 'scheduled' | 'ended' | 'off';
    example_effect: string | null;
  };
  categories: CatData;
  services: ServiceWithCategory[];
}) {
  const { offer } = data;
  const st = STATUS_LABEL[data.status];

  const scopeSummary =
    data.category_names.length > 0 && data.service_names.length > 0
      ? `${data.category_names.map((n) => `${n} (category)`).join(', ')}, ${data.service_names.join(', ')}`
      : data.category_names.length > 0
        ? data.category_names.length > 2
          ? `${data.category_names.slice(0, 2).join(', ')} +${data.category_names.length - 2} categories`
          : `${data.category_names.join(', ')} (whole categories)`
        : data.service_names.length > 3
          ? `${data.service_names.slice(0, 3).join(', ')} +${data.service_names.length - 3} more`
          : data.service_names.join(', ') || 'No items linked yet';

  return (
    <li className="border border-line bg-paper-raised">
      <details>
        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 px-3 py-2.5">
          <span
            className={`px-2 py-0.5 text-[9px] tracking-luxe uppercase ${
              st.live ? 'bg-ink text-paper' : 'border border-line text-ink-faint'
            }`}
          >
            {st.label}
          </span>
          <span className="font-serif text-sm font-medium">{offer.title}</span>
          <span className="border border-line px-1.5 py-0.5 text-[10px] font-medium">
            {offer.discount_type === 'percent'
              ? `${Number(offer.discount_value).toLocaleString('en-IN')}% off`
              : `${formatINR(Number(offer.discount_value))} off`}
          </span>
          <span className="text-[11px] text-ink-faint">
            {offer.start_date} → {offer.end_date}
            {offer.start_time ? ` (${offer.start_time.slice(0, 5)}–${offer.end_time?.slice(0, 5)} IST)` : ''}
          </span>
          <span className="ml-auto flex items-center gap-1 text-[10px] tracking-luxe uppercase text-ink-soft">
            <Pencil className="h-3 w-3" /> Edit
          </span>
        </summary>

        <div className="border-t border-line px-3 py-3">
          <p className="text-[11px] text-ink-soft">
            <span className="tracking-luxe uppercase text-ink-faint">Applies to: </span>
            {scopeSummary}
          </p>
          {data.example_effect && (
            <p className="mt-1 text-[11px] text-ink-soft">{data.example_effect}</p>
          )}

          <details className="mt-3">
            <summary className="cursor-pointer w-fit text-[11px] tracking-luxe uppercase text-ink-soft hover:text-ink">
              Open editor
            </summary>
            <div className="mt-3">
              <EditOfferForm
                id={offer.id}
                values={{
                  title: offer.title,
                  description: offer.description,
                  discount_type: offer.discount_type,
                  discount_value: Number(offer.discount_value),
                  start_date: offer.start_date,
                  end_date: offer.end_date,
                  start_time: offer.start_time,
                  end_time: offer.end_time,
                  is_active: offer.is_active,
                }}
                initialScope={data.scope}
                categories={categories}
                services={services}
              />
            </div>
          </details>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
            <form action={toggleOffer}>
              <input type="hidden" name="id" value={offer.id} />
              <input type="hidden" name="activate" value={offer.is_active ? '0' : '1'} />
              <button
                type="submit"
                className="flex items-center gap-1.5 border border-line px-3 py-1.5 text-[10px] tracking-luxe uppercase text-ink-soft transition-colors hover:border-ink-strong hover:text-ink"
              >
                {offer.is_active ? <PowerOff className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                {offer.is_active ? 'Switch off' : 'Switch on'}
              </button>
            </form>

            <form action={deleteOffer} className="ml-auto">
              <input type="hidden" name="id" value={offer.id} />
              <ConfirmButton
                confirm={`Delete offer "${offer.title}"? This cannot be undone.`}
                className="flex items-center gap-1 border border-line px-3 py-1.5 text-[10px] tracking-luxe uppercase text-ink-soft transition-colors hover:border-ink-strong hover:text-ink"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </ConfirmButton>
            </form>
          </div>
        </div>
      </details>
    </li>
  );
}
