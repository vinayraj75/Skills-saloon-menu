import { ChevronsUpDown, FolderPlus } from 'lucide-react';
import { loadAdminCategories } from '@/lib/admin-data';
import { CategoryRow } from './category-row';
import { CreateCategoryForm } from './create-form';

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string; ok?: string }>;
}) {
  const { err, ok } = await searchParams;
  const categories = await loadAdminCategories();

  return (
    <main className="px-4 pb-16 pt-6">
      <h1 className="font-serif text-2xl font-semibold">Categories</h1>
      <p className="mt-1 text-xs text-ink-soft">Menu sections. Order here = order on the customer menu.</p>

      {err && <p className="mt-4 border border-ink bg-paper px-3 py-2 text-xs">⚠ {err}</p>}
      {ok && <p className="mt-4 border border-line bg-paper-raised px-3 py-2 text-xs">✓ {ok}</p>}

      <section className="mt-6">
        <h2 className="mb-2 flex items-center gap-1.5 font-serif text-lg font-semibold">
          <FolderPlus className="h-4 w-4" /> Add a category
        </h2>
        <CreateCategoryForm />
      </section>

      <section className="mt-8">
        <h2 className="mb-2 flex items-center gap-1.5 font-serif text-lg font-semibold">
          <ChevronsUpDown className="h-4 w-4" /> Manage ({categories.length})
        </h2>
        {categories.length === 0 ? (
          <p className="border border-dashed border-line px-4 py-6 text-center text-xs text-ink-soft">
            No categories yet — add your first one above.
          </p>
        ) : (
          <ul className="space-y-3">
            {categories.map((c, i) => (
              <CategoryRow key={c.id} category={c} first={i === 0} last={i === categories.length - 1} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
