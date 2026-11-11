'use client';

import { useActionState, useRef, useState } from 'react';
import { ImagePlus, RefreshCw, Trash2 } from 'lucide-react';
import type { ServiceState } from '@/app/admin/(dash)/services/actions';
import { saveServiceImage, removeServiceImage } from '@/app/admin/(dash)/services/actions';

/**
 * Upload / replace / remove a service image with a live preview BEFORE
 * saving. Type + size are validated here and again server-side + bucket.
 */
export function ServiceImageManager({
  serviceId,
  currentUrl,
  serviceName,
}: {
  serviceId: string;
  currentUrl: string | null;
  serviceName: string;
}) {
  const [state, formAction, pending] = useActionState<ServiceState, FormData>(saveServiceImage, { error: undefined, ok: undefined } as ServiceState);
  const [preview, setPreview] = useState<string | null>(null);
  const [picked, setPicked] = useState<File | null>(null);
  const inputKey = useRef(0);

  const shown = preview ?? currentUrl;
  const isJpgPngWebp = (f: File) => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type);

  return (
    <div className="border border-line bg-paper-raised p-4">
      <p className="text-[10px] tracking-luxe uppercase text-ink-soft">Service image</p>

      <div className="mt-3 flex flex-col gap-4 sm:flex-row">
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden border border-line bg-paper sm:w-56">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt={serviceName} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center font-serif text-4xl text-ink-faint">
              {serviceName.trim().charAt(0).toUpperCase()}
            </span>
          )}
          {pending && (
            <div className="absolute inset-0 flex items-center justify-center bg-paper/70 text-xs tracking-luxe uppercase">
              Saving…
            </div>
          )}
        </div>

        <div className="flex-1">
          <form action={formAction} className="space-y-3">
            <input type="hidden" name="id" value={serviceId} />
            <label className="block cursor-pointer">
              <span className="mb-1 flex items-center gap-1.5 text-[10px] tracking-luxe uppercase text-ink-soft">
                <ImagePlus className="h-3.5 w-3.5" /> Choose image (JPG / PNG / WebP · max 2 MB)
              </span>
              <input
                key={inputKey.current}
                type="file"
                name="image"
                accept="image/jpeg,image/png,image/webp"
                className="w-full border border-line bg-paper px-3 py-2 text-xs file:mr-3 file:border-0 file:bg-ink file:px-2 file:py-1 file:text-[10px] file:uppercase file:text-paper"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setPicked(f);
                  setPreview(f && isJpgPngWebp(f) && f.size <= 2 * 1024 * 1024 ? URL.createObjectURL(f) : null);
                }}
              />
            </label>

            {picked && !isJpgPngWebp(picked) && (
              <p className="text-xs text-ink">Only JPG, PNG or WebP files are allowed.</p>
            )}
            {picked && picked.size > 2 * 1024 * 1024 && (
              <p className="text-xs text-ink">That file is over 2 MB. Please choose a smaller image.</p>
            )}
            {picked && preview && (
              <p className="text-xs text-ink-soft">Preview above — nothing is saved until you click Save.</p>
            )}

            <button
              type="submit"
              disabled={pending || !picked || !isJpgPngWebp(picked) || picked.size > 2 * 1024 * 1024}
              className="flex w-full items-center gap-1.5 border border-ink bg-ink px-3 py-2 text-[11px] tracking-luxe uppercase text-paper transition-opacity hover:opacity-90 disabled:opacity-40 sm:w-auto"
            >
              <RefreshCw className="h-3.5 w-3.5" /> {currentUrl ? 'Replace image' : 'Save image'}
            </button>
          </form>

          {state.error && <p className="mt-2 text-xs text-ink">{state.error}</p>}
          {state.ok && <p className="mt-2 text-xs text-ink-soft">✓ {state.ok}</p>}

          {currentUrl && (
            <form action={removeServiceImage} className="mt-3">
              <input type="hidden" name="id" value={serviceId} />
              <button
                type="submit"
                onClick={(e) => {
                  if (!window.confirm('Remove this image? The service will show its letter monogram instead.')) {
                    e.preventDefault();
                  }
                }}
                className="flex items-center gap-1.5 border border-line px-3 py-2 text-[11px] tracking-luxe uppercase text-ink-soft transition-colors hover:border-ink-strong hover:text-ink"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove image
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
