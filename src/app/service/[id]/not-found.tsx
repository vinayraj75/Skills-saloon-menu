import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-4 text-center">
      <p className="text-[10px] tracking-luxe uppercase text-ink-faint">404</p>
      <h1 className="mt-2 font-serif text-3xl font-semibold">Service not found</h1>
      <p className="mt-2 text-sm text-ink-soft">It may have been removed or is not published yet.</p>
      <Link
        href="/"
        className="mt-6 border border-ink px-4 py-2 text-xs tracking-luxe uppercase transition-colors hover:bg-ink hover:text-paper"
      >
        Back to menu
      </Link>
    </div>
  );
}
