import { Sparkle } from 'lucide-react';

export function EmptyState({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-line px-6 py-14 text-center">
      <Sparkle className="h-5 w-5 text-ink-faint" strokeWidth={1.5} />
      <p className="font-serif text-lg">{title}</p>
      <p className="max-w-xs text-xs tracking-wide text-ink-soft">{sub}</p>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="border border-line bg-paper-raised p-4">
      <div className="shimmer aspect-[4/3] w-full rounded-sm" />
      <div className="mt-4 h-4 w-2/3 rounded-sm shimmer" />
      <div className="mt-2 h-3 w-1/3 rounded-sm shimmer" />
    </div>
  );
}

export function OfferSkeleton() {
  return <div className="shimmer h-20 min-w-[260px] rounded-sm" />;
}
