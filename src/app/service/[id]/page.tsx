import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, Ban, BadgePercent } from 'lucide-react';
import { loadServiceDetail } from '@/lib/menu';
import { formatINR } from '@/lib/offers';
import { EmptyState } from '@/components/menu/skeletons';

export const revalidate = 30;

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { service, salon } = await loadServiceDetail(id);

  if (!service) notFound();

  const hasDiscount =
    service.discountedPrice != null &&
    service.price != null &&
    Number(service.discountedPrice) < Number(service.price);

  return (
    <div className="mx-auto min-h-dvh max-w-2xl bg-paper pb-16">
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs tracking-wide text-ink-soft transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Menu
        </Link>
        <span className="h-px flex-1 bg-line" />
        {salon && <span className="font-serif text-sm font-semibold">{salon.name}</span>}
      </div>

      <article className="fade-up">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-paper">
          {service.image_url ? (
            <Image
              src={service.image_url}
              alt={service.name}
              fill
              sizes="(max-width: 768px) 100vw, 640px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="font-serif text-6xl text-ink-faint">
                {service.name.trim().charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {!service.is_available && (
            <span className="absolute bottom-3 left-4 flex items-center gap-1.5 bg-ink px-2.5 py-1.5 text-[10px] tracking-luxe uppercase text-paper">
              <Ban className="h-3.5 w-3.5" /> Currently not available
            </span>
          )}
        </div>

        <div className="px-4 pt-6">
          <p className="text-[10px] tracking-luxe uppercase text-ink-faint">
            {service.category.name} · Unisex Salon
          </p>
          <h1 className="mt-1.5 font-serif text-3xl font-semibold">{service.name}</h1>

          <div className="mt-4 flex items-baseline gap-3">
            {hasDiscount && (
              <span className="text-sm text-ink-faint line-through">{formatINR(service.price!)}</span>
            )}
            <span className="font-serif text-2xl font-semibold">
              {formatINR(hasDiscount ? service.discountedPrice! : service.price ?? 0)}
            </span>
            {hasDiscount && (
              <span className="inline-flex items-center gap-1 border border-ink px-2 py-1 text-[9px] tracking-luxe uppercase">
                <BadgePercent className="h-3 w-3" /> Save {formatINR(Number(service.price!) - Number(service.discountedPrice!))}
              </span>
            )}
          </div>

          {service.description && (
            <p className="mt-5 border-t border-line pt-5 text-sm leading-relaxed text-ink-soft">
              {service.description}
            </p>
          )}

          {salon?.phone && (
            <p className="mt-8 text-xs text-ink-soft">
              Prices are indicative. To book, call the salon at{' '}
              <a href={`tel:${salon.phone}`} className="underline underline-offset-2 hover:text-ink">
                {salon.phone}
              </a>
              .
            </p>
          )}
        </div>
      </article>
    </div>
  );
}

export function generateMetadata() {
  return { title: 'Skills Saloon — Cut · Style · Repeat' };
}
