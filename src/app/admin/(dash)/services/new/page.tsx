import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { loadAdminCategories } from '@/lib/admin-data';
import { ServiceForm } from '../service-form';

export default async function NewServicePage() {
  const categories = await loadAdminCategories();

  return (
    <main className="px-4 pb-16 pt-6">
      <Link href="/admin/services" className="flex w-fit items-center gap-1.5 text-xs text-ink-soft hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to services
      </Link>
      <h1 className="mt-3 font-serif text-2xl font-semibold">Add service</h1>
      <p className="mt-1 text-xs text-ink-soft">
        Give the service a name and confirmed price to publish it to the customer menu right away —
        or leave it as a draft until you are ready.
      </p>

      <div className="mt-5 max-w-xl">
        <ServiceForm categories={categories} />
      </div>
    </main>
  );
}
