'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Lock } from 'lucide-react';
import { logIn, type LoginState } from './actions';

export function LoginForm() {
  const params = useSearchParams();
  const nextParam = params.get('next') ?? '';
  const [state, formAction, pending] = useActionState<LoginState, FormData>(logIn, {});

  const preError =
    params.get('error') === 'not_admin' ? 'This account does not have admin access.' : null;

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4">
      <div className="mb-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center border border-ink">
          <Lock className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <h1 className="mt-4 font-serif text-2xl font-semibold">Admin Login</h1>
        <p className="mt-1 text-xs tracking-luxe uppercase text-ink-soft">Skills Saloon</p>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={nextParam} />

        <label className="block">
          <span className="mb-1 block text-[10px] tracking-luxe uppercase text-ink-soft">Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full border border-line bg-paper-raised px-3 py-2.5 text-sm outline-none transition-colors focus:border-ink-strong"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[10px] tracking-luxe uppercase text-ink-soft">Password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full border border-line bg-paper-raised px-3 py-2.5 text-sm outline-none transition-colors focus:border-ink-strong"
          />
        </label>

        {(state.error ?? preError) && (
          <p className="border border-line bg-paper px-3 py-2 text-xs text-ink">
            {state.error ?? preError}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full border border-ink bg-ink py-2.5 text-xs font-medium tracking-luxe uppercase text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <Link href="/" className="mt-8 text-center text-xs text-ink-soft transition-colors hover:text-ink">
        ← Back to menu
      </Link>
    </div>
  );
}
