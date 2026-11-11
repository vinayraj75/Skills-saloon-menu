'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BadgePercent, Search, MoveRight, Ban, LockKeyhole } from 'lucide-react';
import type { MenuSection, MenuSettings, Offer, Salon } from '@/types/db';
import { formatINR } from '@/lib/offers';
import { EmptyState } from './skeletons';
import { LogoMark } from './LogoMark';

/* ------------------------------------------------------------------ */
/* Announcement bar                                                     */
/* ------------------------------------------------------------------ */
function AnnouncementBar({ settings }: { settings: MenuSettings | undefined }) {
  if (!settings?.announcement_active || !settings.announcement_text || settings.announcement_text.trim() === '') {
    return null;
  }
  return (
    <div className="bg-ink px-4 py-2 text-center text-[11px] tracking-luxe uppercase text-paper">
      {settings.announcement_text}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Header: logo, name, tagline, "Unisex Salon"                          */
/* ------------------------------------------------------------------ */
function MenuHeader({ salon }: { salon: Salon }) {
  return (
    <header className="flex flex-col items-center gap-3 px-4 pb-6 pt-8 text-center">
      <LogoMark src={salon.logo_url} name={salon.name} className="h-16 w-16" />
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">{salon.name}</h1>
        {salon.tagline && (
          <p className="mt-1 text-[10px] tracking-luxe uppercase text-ink-soft">{salon.tagline}</p>
        )}
      </div>
      <span className="border border-ink px-3 py-1 text-[10px] font-medium tracking-luxe uppercase">
        Unisex Salon
      </span>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Search + sticky category chips                                       */
/* ------------------------------------------------------------------ */
function CategoryBar({
  sections,
  query,
  onQuery,
}: {
  sections: MenuSection[];
  query: string;
  onQuery: (q: string) => void;
}) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // simple scroll-spy: highlight the section currently in view
  useEffect(() => {    const spy = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          // find which section heading the chips should point at
          const ids = sections.map((s) => s.category.id);
          const current = ids.find((id) => id === visible[0].target.id);
          if (current) setActiveCategory(current);
        }
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    sections.forEach((s) => {
      const el = document.getElementById(`section-${s.category.id}`);
      if (el) spy.observe(el);
    });
    return () => spy.disconnect();
  }, [sections]);

  const scrollTo = (id: string) => {
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
      <div className="px-4 pt-3">
        <label className="relative block">
          <span className="sr-only">Search services</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search services…"
            className="w-full border border-line bg-paper-raised py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-ink-faint focus:border-ink-strong transition-colors"
          />
        </label>
      </div>
      <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto px-4 pb-3">
        {sections.map((s) => {
          const id = s.category.id;
          const isActive = query.trim() === '' && activeCategory === id;
          return (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={`shrink-0 whitespace-nowrap px-3 py-1.5 text-[11px] tracking-wide uppercase transition-colors ${
                isActive ? 'bg-ink text-paper' : 'border border-line text-ink-soft hover:text-ink'
              }`}
            >
              {s.category.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Service card                                                         */
/* ------------------------------------------------------------------ */
function ServiceImage({
  name,
  imageUrl,
  unavailable,
}: {
  name: string;
  imageUrl: string | null;
  unavailable: boolean;
}) {
  return (
    <div
      className={`relative aspect-[4/3] w-full overflow-hidden ${
        unavailable ? 'opacity-40' : ''
      } ${imageUrl ? '' : 'flex items-center justify-center border-b border-line bg-paper'}`}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes="(min-width: 640px) 50vw, (min-width: 1024px) 33vw, 100vw"
          className="object-cover transition-transform duration-500 hover:scale-[1.03]"
        />
      ) : (
        <span className="font-serif text-4xl text-ink-faint">{name.trim().charAt(0).toUpperCase()}</span>
      )}
      {unavailable && (
        <span className="absolute bottom-2 left-2 flex items-center gap-1 bg-ink px-2 py-1 text-[9px] tracking-luxe uppercase text-paper">
          <Ban className="h-3 w-3" /> Not available
        </span>
      )}
    </div>
  );
}

function PriceRow({ price, discounted }: { price: number | null; discounted: number | null }) {
  if (price == null) return null;
  return (
    <p className="flex items-baseline gap-2">
      {discounted != null && discounted < Number(price) && (
        <span className="text-xs text-ink-faint line-through">{formatINR(price)}</span>
      )}
      <span className="font-serif text-lg font-semibold">{formatINR(discounted ?? price)}</span>
    </p>
  );
}

function ServiceCard({ service }: { service: MenuSection['services'][number] }) {
  const hasDiscount =
    service.discountedPrice != null &&
    service.price != null &&
    Number(service.discountedPrice) < Number(service.price);

  return (
    <Link
      href={`/service/${service.id}`}
      className={`group flex flex-col border border-line bg-paper-raised transition-colors hover:border-ink-strong ${
        service.is_available ? '' : ''
      }`}
    >
      <ServiceImage name={service.name} imageUrl={service.image_url} unavailable={!service.is_available} />
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-base font-medium leading-snug">{service.name}</h3>
          {hasDiscount && (
            <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 border border-ink px-1.5 py-0.5 text-[9px] tracking-luxe uppercase">
              <BadgePercent className="h-3 w-3" /> {offerLabelFor(service)}
            </span>
          )}
        </div>
        {service.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-ink-soft">{service.description}</p>
        )}
        <div className="mt-auto pt-1">
          <PriceRow price={service.price} discounted={service.discountedPrice} />
        </div>
      </div>
    </Link>
  );
}

function offerLabelFor(service: MenuSection['services'][number]): string {
  if (service.discountedPrice == null || service.price == null) return '';
  const saving = Number(service.price) - Number(service.discountedPrice);
  return saving > 0 ? `Save ${formatINR(saving)}` : 'Offer';
}

/* ------------------------------------------------------------------ */
/* Active offers strip                                                  */
/* ------------------------------------------------------------------ */
function OffersStrip({ offers }: { offers: Offer[] }) {
  if (offers.length === 0) return null;
  return (
    <section className="border-t border-line bg-ink text-paper">
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 py-4">
        {offers.map((o) => (
          <div key={o.id} className="min-w-[240px] flex-1 border border-paper/30 px-4 py-3 transition-colors hover:border-paper">
            <p className="flex items-center gap-1.5 text-[10px] tracking-luxe uppercase opacity-80">
              <BadgePercent className="h-3.5 w-3.5" /> Limited time offer
            </p>
            <p className="mt-1 font-serif text-base font-semibold">{o.title}</p>
            <p className="mt-0.5 text-xs opacity-80">
              {Number(o.discount_value).toLocaleString('en-IN')}
              {o.discount_type === 'percent' ? '% off' : ' ₹ off'}
              {o.description ? ` · ${o.description}` : ''}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Main interactive menu                                                */
/* ------------------------------------------------------------------ */
export function MenuView({
  salon,
  settings,
  sections,
  offers,
}: {
  salon: Salon;
  settings: MenuSettings | null;
  sections: MenuSection[];
  offers: Offer[];
}) {
  const [query, setQuery] = useState('');

  const visibleSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((s) => ({
        ...s,
        services: s.services.filter(
          (v) =>
            v.name.toLowerCase().includes(q) ||
            (v.description ?? '').toLowerCase().includes(q),
        ),
      }))
      .filter((s) => s.services.length > 0);
  }, [sections, query]);

  const totalPublished = sections.reduce((acc, s) => acc + s.services.length, 0);

  return (
    <div className="relative mx-auto min-h-dvh max-w-3xl bg-paper">
      {/* discreet owner access */}
      <Link
        href="/admin"
        aria-label="Admin login"
        className="absolute right-3 top-3 z-50 flex h-8 w-8 items-center justify-center border border-transparent text-ink-faint transition-colors hover:border-line hover:text-ink"
      >
        <LockKeyhole className="h-4 w-4" strokeWidth={1.5} />
      </Link>
      <AnnouncementBar settings={settings ?? undefined} />
      <MenuHeader salon={salon} />
      <OffersStrip offers={offers} />
      <CategoryBar sections={sections} query={query} onQuery={setQuery} />

      <main className="px-4 pb-24 pt-6">
        {totalPublished === 0 ? (
          <EmptyState
            title="Our menu is being prepared"
            sub="Services will appear here shortly. Check back soon."
          />
        ) : !query.trim() && offers.length > 0 ? (
          <p className="mb-4 flex items-center gap-1.5 text-[11px] tracking-luxe uppercase text-ink-faint">
            Live offers <MoveRight className="h-3.5 w-3.5" />
          </p>
        ) : null}

        {visibleSections.length === 0 && totalPublished > 0 ? (
          <EmptyState title="No matches" sub="Try a different word — for example “hair” or “facial”." />
        ) : (
          visibleSections.map((section) => (
            <section key={section.category.id} id={`section-${section.category.id}`} className="mb-10 scroll-mt-40">
              <div className="mb-3 flex items-baseline gap-3">
                <h2 className="font-serif text-2xl font-semibold">{section.category.name}</h2>
                <span className="h-px flex-1 bg-line" />
                <span className="text-[10px] tracking-luxe uppercase text-ink-faint">
                  {section.services.length}
                </span>
              </div>
              {section.category.description && (
                <p className="mb-4 text-xs text-ink-soft">{section.category.description}</p>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {section.services.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      <footer className="border-t border-line px-4 py-8 text-center">
        <p className="text-[10px] tracking-luxe uppercase text-ink-soft">{salon.tagline}</p>
        {salon.phone && <p className="mt-2 text-xs text-ink-soft">Call {salon.phone}</p>}
        {salon.address && <p className="mt-1 text-xs text-ink-soft">{salon.address}</p>}
        <p className="mt-4 text-[10px] text-ink-faint">
          {salon.name} · Unisex Salon · © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
