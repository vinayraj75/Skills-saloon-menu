'use client';

import { useActionState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { createAdmin, type SetupState } from './actions';

export function SetupForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<SetupState, FormData>(createAdmin, {});

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4">
      <div className="mb-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center border border-ink">
          <ShieldCheck className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <h1 className="mt-4 font-serif text-2xl font-semibold">Owner Setup</h1>
        <p className="mt-1 text-[10px] tracking-luxe uppercase text-ink-soft">
          One-time · Create your admin account
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="token" value={token} />

        <label className="block">
          <span className="mb-1 block text-[10px] tracking-luxe uppercase text-ink-soft">Your name</span>
          <input
            name="fullName"
            autoComplete="name"
            required
            className="w-full border border-line bg-paper-raised px-3 py-2.5 text-sm outline-none transition-colors focus:border-ink-strong"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[10px] tracking-luxe uppercase text-ink-soft">Owner email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full border border-line bg-paper-raised px-3 py-2.5 text-sm outline-none transition-colors focus:border-ink-strong"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[10px] tracking-luxe uppercase text-ink-soft">
            Choose a password (min 8 characters)
          </span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="w-full border border-line bg-paper-raised px-3 py-2.5 text-sm outline-none transition-colors focus:border-ink-strong"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[10px] tracking-luxe uppercase text-ink-soft">Repeat password</span>
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="w-full border border-line bg-paper-raised px-3 py-2.5 text-sm outline-none transition-colors focus:border-ink-strong"
          />
        </label>

        {state.error && (
          <p className="border border-line bg-paper px-3 py-2 text-xs text-ink">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full border border-ink bg-ink py-2.5 text-xs font-medium tracking-luxe uppercase text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? 'Creating account…' : 'Create admin account'}
        </button>
      </form>

      <p className="mt-6 text-center text-[10px] leading-relaxed text-ink-faint">
        This setup link works exactly once. After your account is created, this page closes forever.
      </p>
    </div>
  );
}
