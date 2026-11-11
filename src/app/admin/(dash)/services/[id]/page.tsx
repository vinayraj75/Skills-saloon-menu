import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, Trash2 } from 'lucide-react';
import { requireAdmin } from '@/lib/supabase/server';
import { loadAdminCategories, loadAdminService } from '@/lib/admin-data';
import { canPublish, publishBlockReason } from '@/lib/publish';
import { setPublished, deleteService } from '../actions';
import { ServiceForm } from '../service-form';
import { ServiceImageManager } from '@/components/admin/ServiceImageManager';
import { ConfirmButton } from '@/components/admin/ConfirmButton';

export default async function EditServicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { ok, err } = await searchParams;
  const [{ service }, categories] = await Promise.all([
    loadAdminService(id),
    loadAdminCategories(),
  ]);

  if (!service) notFound();

  const publishable = canPublish(service);

  return (
    <main className="px-4 pb-16 pt-6">
      <Link href="/admin/services" className="flex w-fit items-center gap-1.5 text-xs text-ink-soft hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to services
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-serif text-2xl font-semibold">Edit — {service.name}</h1>
        {service.is_published && (
          <Link
            href={`/service/${service.id}`}
            target="_blank"
            className="flex items-center gap-1 text-[11px] tracking-wide uppercase text-ink-soft hover:text-ink"
          >
            <ExternalLink className="h-3 w-3" /> View on menu
          </Link>
        )}
      </div>

      {ok && <p className="mt-3 border border-line bg-paper-raised px-3 py-2 text-xs">✓ {ok}</p>}
      {err && <p className="mt-3 border border-ink bg-paper px-3 py-2 text-xs">⚠ {err}</p>}

      <div className="mt-4 space-y-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="max-w-xl">
            <ServiceForm categories={categories} service={service} />
          </div>

          <div className="space-y-4">
            <ServiceImageManager
              serviceId={service.id}
              currentUrl={service.image_url}
              serviceName={service.name}
            />

            <div className="border border-line bg-paper-raised p-4">
              <p className="text-[10px] tracking-luxe uppercase text-ink-soft">Customer menu</p>
              {service.is_published ? (
                <>
                  <p className="mt-2 text-xs text-ink-soft">
                    Live on the customer menu right now.
                  </p>
                  <form action={setPublished} className="mt-3">
                    <input type="hidden" name="id" value={service.id} />
                    <input type="hidden" name="publish" value="0" />
                    <ConfirmButton
                      confirm={`Unpublish "${service.name}"? Customers will stop seeing it immediately.`}
                      className="border border-ink px-3 py-2 text-[11px] tracking-luxe uppercase text-ink transition-colors hover:bg-ink hover:text-paper"
                    >
                      Unpublish now
                    </ConfirmButton>
                  </form>
                </>
              ) : (
                <>
                  <p className="mt-2 text-xs text-ink-soft">Hidden as a draft. To publish:</p>
                  <ul className="mt-1.5 ml-4 list-disc text-xs text-ink-soft">
                    <li>price must be filled in</li>
                    <li>price status must be “Confirmed”</li>
                  </ul>
                  {publishable ? null : (
                    <p className="mt-2 text-[11px] text-ink-faint">{publishBlockReason(service)}</p>
                  )}
                  <form action={setPublished} className="mt-3">
                    <input type="hidden" name="id" value={service.id} />
                    <input type="hidden" name="publish" value="1" />
                    <button
                      type="submit"
                      disabled={!publishable}
                      title={publishable ? undefined : publishBlockReason(service)}
                      className="border border-ink bg-ink px-3 py-2 text-[11px] tracking-luxe uppercase text-paper transition-opacity hover:opacity-90 disabled:opacity-30"
                    >
                      Publish to menu
                    </button>
                  </form>
                </>
              )}
            </div>

            <form action={deleteService} className="border border-line bg-paper-raised p-4">
              <input type="hidden" name="id" value={service.id} />
              <p className="text-[10px] tracking-luxe uppercase text-ink-soft">Danger zone</p>
              <ConfirmButton
                confirm={`Permanently delete "${service.name}"? This cannot be undone.`}
                className="mt-2 flex items-center gap-1.5 border border-line px-3 py-2 text-[11px] tracking-luxe uppercase text-ink-soft transition-colors hover:border-ink hover:text-ink"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete this service
              </ConfirmButton>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
