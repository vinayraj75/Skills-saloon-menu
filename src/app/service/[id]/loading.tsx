export default function ServiceDetailLoading() {
  return (
    <div className="mx-auto min-h-dvh max-w-2xl bg-paper pb-16">
      <div className="border-b border-line px-4 py-3">
        <div className="shimmer h-4 w-20 rounded-sm" />
      </div>
      <div className="shimmer aspect-[16/10] w-full" />
      <div className="px-4 pt-6">
        <div className="shimmer h-3 w-32 rounded-sm" />
        <div className="mt-2 shimmer h-8 w-56 rounded-sm" />
        <div className="mt-4 shimmer h-7 w-40 rounded-sm" />
        <div className="mt-6 shimmer h-20 w-full rounded-sm" />
      </div>
    </div>
  );
}
