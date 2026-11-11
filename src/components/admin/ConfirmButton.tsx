'use client';

import type { ReactNode } from 'react';

/**
 * A submit button that asks for confirmation first — used for every
 * destructive action (delete service, remove image, …).
 */
export function ConfirmButton({
  confirm,
  className,
  children,
  ...rest
}: {
  confirm: string;
  className?: string;
  children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
