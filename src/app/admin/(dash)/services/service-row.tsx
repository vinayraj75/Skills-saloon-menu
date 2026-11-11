import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowUp, Ban, CheckCircle2, Pencil, Trash2, XCircle } from 'lucide-react';
import type { ServiceWithCategory } from '@/lib/admin-data';
import { canPublish, publishBlockReason, PRICE_STATUS_LABELS } from '@/lib/publish';
import { setPublished, setAvailable, moveService, deleteService } from './actions';
import { ConfirmButton } from '@/components/admin/ConfirmButton';

export function ServiceRow({ service }: { service: ServiceWithCategory }) {
  const publishable = canPublish(service);

  return (
    <li className="flex flex-wrap items-center gap-3 px-3 py-2.5">
      {/* thumbnail */}
      <div className="relative h-12 w-16 shrink-0 overflow-hidden border border-line bg-paper">
        {service.image_url ? (
          <Image
            src={service.image_url.replace(/\?v=\d+$/, '')}
            alt={service.name}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center font-serif text-xl text-ink-faint">
            {service.name.trim().charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* name + meta */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/admin/services/${service.id}`} className="font-serif text-sm font-medium hover:underline">
            {service.name}
          </Link>
          {service.is_published ? (
            <span className="border border-ink px-1.5 py-0.5 text-[9px] tracking-luxe uppercase">Live</span>
          ) : (
            <span className="border border-line px-1.5 py-0.5 text-[9px] tracking-luxe uppercase text-ink-faint">Draft</span>
          )}
          {!service.is_available && (
            <span className="flex items-center gap-1 bg-ink px-1.5 py-0.5 text-[9px] tracking-luxe uppercase text-paper">
              <Ban className="h-2.5 w-2.5" /> Not available
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-[11px] text-ink-soft">
          {service.category_name ?? 'No category'} · {PRICE_STATUS_LABELS[service.price_status]} ·{' '}
          {service.price != null
            ? `₹${Number(service.price).toLocaleString('en-IN')}`
            : 'no price set'}
        </p>
      </div>

      {/* controls */}
      <div className="flex items-center gap-1">
        <form action={moveService}>
          <input type="hidden" name="id" value={service.id} />
          <input type="hidden" name="dir" value="up" />
          <input type="hidden" name="what" value="list" />
          <button type="submit" title="Move up" className="p-1 text-ink-faint transition-colors hover:text-ink">
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </form>
        <form action={moveService}>
          <input type="hidden" name="id" value={service.id} />
          <input type="hidden" name="dir" value="down" />
          <input type="hidden" name="what" value="list" />
          <button type="submit" title="Move down" className="p-1 text-ink-faint transition-colors hover:text-ink">
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
        </form>

        <form action={setAvailable}>
          <input type="hidden" name="id" value={service.id} />
          <input type="hidden" name="available" value={service.is_available ? '0' : '1'} />
          <button
            type="submit"
            title={service.is_available ? 'Mark NOT available' : 'Mark available'}
            className="p-1 text-ink-faint transition-colors hover:text-ink"
          >
            {service.is_available ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
          </button>
        </form>

        <form action={setPublished}>
          <input type="hidden" name="id" value={service.id} />
          {service.is_published ? (
            <ConfirmButton
              confirm={`Unpublish "${service.name}"? Customers will stop seeing it immediately.`}
              className="border border-line px-2 py-1 text-[10px] tracking-luxe uppercase text-ink-soft transition-colors hover:border-ink-strong hover:text-ink"
            >
              Unpublish
            </ConfirmButton>
          ) : (
            <button
              type="submit"
              name="publish"
              value="1"
              disabled={!publishable}
              title={publishable ? 'Show on the customer menu' : publishBlockReason(service)}
              className="border border-ink px-2 py-1 text-[10px] tracking-luxe uppercase text-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-30"
            >
              Publish
            </button>
          )}
        </form>

        <Link
          href={`/admin/services/${service.id}`}
          title="Edit"
          className="p-1 text-ink-faint transition-colors hover:text-ink"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Link>

        <form action={deleteService}>
          <input type="hidden" name="id" value={service.id} />
          <ConfirmButton
            confirm={`Permanently delete "${service.name}"? This cannot be undone.`}
            title="Delete service"
            className="p-1 text-ink-faint transition-colors hover:text-ink"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </ConfirmButton>
        </form>
      </div>
    </li>
  );
}
