'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Printer, RefreshCw } from 'lucide-react';
import { LogoMark } from '@/components/menu/LogoMark';
import type { Salon } from '@/types/db';

/**
 * Generates the permanent QR pointing at the salon's one menu URL.
 * Includes: Q R preview, PNG download, and a print-friendly A4 poster.
 */
export function QrStudio({ salon, menuUrl, isLocalUrl }: { salon: Salon; menuUrl: string; isLocalUrl: boolean }) {
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(menuUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 900,
      color: { dark: '#111111', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setQr(url);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [menuUrl]);

  function downloadPng() {
    if (!qr) return;
    const a = document.createElement('a');
    a.href = qr;
    a.download = 'skills-saloon-menu-qr.png';
    a.click();
  }

  return (
    <div className="space-y-6">
      {isLocalUrl && (
        <p className="border border-ink bg-paper px-3 py-2 text-xs">
          ⚠ This QR points at <strong>{menuUrl}</strong> — only your computer can
          open that. Do NOT print or distribute it yet. After Phase 8 deployment the QR
          regenerates automatically from the permanent Vercel URL.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* live QR card */}
        <div className="border border-line bg-paper-raised p-4 text-center">
          <p className="text-[10px] tracking-luxe uppercase text-ink-soft">QR code preview</p>
          <div className="mx-auto mt-3 w-full max-w-[260px] border border-line bg-white p-3">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="Skills Saloon menu QR code" className="h-auto w-full" />
            ) : error ? (
              <p className="py-16 text-xs text-ink">Could not generate: {error}</p>
            ) : (
              <div className="flex aspect-square items-center justify-center shimmer text-xs text-ink-faint">
                <RefreshCw className="h-4 w-4 animate-spin" />
              </div>
            )}
          </div>
          <p className="mt-3 break-all text-[10px] text-ink-faint">{menuUrl}</p>
          <button
            type="button"
            onClick={downloadPng}
            disabled={!qr}
            className="mt-3 flex w-full items-center justify-center gap-1.5 border border-ink bg-ink px-3 py-2 text-[11px] tracking-luxe uppercase text-paper transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" /> Download PNG
          </button>
        </div>

        {/* poster */}
        <div>
          <p className="mb-2 text-[10px] tracking-luxe uppercase text-ink-soft">
            Table poster (A4) — print via your browser (Ctrl/Cmd + P)
          </p>
          <div className="qr-poster flex flex-col items-center border border-line bg-white px-6 py-10 text-center"
            style={{ minHeight: '840px' }}
          >
            <LogoMark src={salon.logo_url} name={salon.name} className="mb-4 h-24 w-24" />
            <h1 className="font-serif text-4xl font-semibold tracking-tight">{salon.name}</h1>
            <p className="mt-1 text-[13px] tracking-luxe uppercase text-ink-soft">Cut · Style · Repeat</p>
            <p className="mt-2 text-[11px] tracking-luxe uppercase text-ink-faint">Unisex Salon</p>

            <div className="my-6 h-px w-40 bg-line" />

            {/* eslint-disable-next-line @next/next/no-img-element */}
            {qr && <img src={qr} alt="" className="h-72 w-72" />}

            <p className="mt-5 font-serif text-2xl font-semibold">Scan for our menu</p>
            <p className="mt-1 text-xs text-ink-soft">
              Point your phone camera at the code —<br />
              the live menu opens instantly, always up to date.
            </p>

            <div className="mt-auto pt-8 text-[10px] tracking-luxe uppercase text-ink-faint">
              {salon.phone ? `Call ${salon.phone} · ` : ''}
              {salon.address ?? ''}
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!qr}
            className="mt-3 flex items-center justify-center gap-1.5 border border-ink px-3 py-2 text-[11px] tracking-luxe uppercase text-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-40"
          >
            <Printer className="h-3.5 w-3.5" /> Print poster
          </button>
        </div>
      </div>
    </div>
  );
}
