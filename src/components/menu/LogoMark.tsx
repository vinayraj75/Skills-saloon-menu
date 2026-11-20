'use client';

import { useState } from 'react';

/**
 * Salon logo with graceful fallback:
 * 1. DB logo_url (admin-uploaded)
 * 2. /logo-mark.png — square mark cropped from the owner's logo
 * 3. /logo.png — full logo lockup placed by the owner
 * 4. elegant serif monogram
 */
export function LogoMark({
  src,
  name,
  className,
}: {
  src: string | null;
  name: string;
  className?: string;
}) {
  const [stage, setStage] = useState(0);
  const remote = src || null;
  const candidates = [remote, '/logo-mark.png', '/logo.png', '/logo.svg'].filter(Boolean) as (string | null)[];
  const current = stage <= candidates.length - 1 ? candidates[stage] : null;

  if (!current) {
    return (
      <div
        className={`flex items-center justify-center border border-line bg-paper-raised ${className ?? ''}`}
        aria-label={name}
      >
        <span className="font-serif text-xl font-semibold leading-none">
          {name.trim().charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={`${name} logo`}
      onError={() => setStage((s) => s + 1)}
      className={`object-contain ${className ?? ''}`}
    />
  );
}
