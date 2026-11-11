import { CardSkeleton, OfferSkeleton } from '@/components/menu/skeletons';

export default function MenuLoading() {
  return (
    <div className="mx-auto min-h-dvh max-w-3xl bg-paper">
      {/* header skeleton */}
      <div className="flex flex-col items-center gap-3 px-4 pb-6 pt-8 text-center">
        <div className="shimmer h-16 w-16" />
        <div className="shimmer h-7 w-44 rounded-sm" />
        <div className="shimmer h-3 w-32 rounded-sm" />
      </div>
      {/* offers skeleton */}
      <div className="flex gap-3 overflow-hidden border-y border-line px-4 py-4">
        <OfferSkeleton />
        <OfferSkeleton />
      </div>
      {/* chips skeleton */}
      <div className="flex gap-2 px-4 pb-3 pt-3">
        {[72, 96, 80, 104].map((w) => (
          <div key={w} className="shimmer h-7 rounded-sm" style={{ width: w }} />
        ))}
      </div>
      {/* cards */}
      <main className="px-4 pt-4">
        <div className="shimmer h-7 w-40 rounded-sm" />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
