import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react';
import { ConfirmButton } from '@/components/admin/ConfirmButton';
import { updateCategory, deleteCategory, moveCategory } from './actions';
import type { Category } from '@/types/db';

type CatRow = Category & { service_count: number };

export function CategoryRow({
  category,
  first,
  last,
}: {
  category: CatRow;
  first: boolean;
  last: boolean;
}) {
  return (
    <li className="border border-line bg-paper-raised">
      <details>
        <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-2.5">
          <div className="flex items-center gap-1">
            <form action={moveCategory}>
              <input type="hidden" name="id" value={category.id} />
              <input type="hidden" name="dir" value="up" />
              <button
                type="submit"
                title={first ? 'Already first' : 'Move up'}
                disabled={first}
                className="p-1 text-ink-faint transition-colors hover:text-ink disabled:opacity-30"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
            </form>
            <form action={moveCategory}>
              <input type="hidden" name="id" value={category.id} />
              <input type="hidden" name="dir" value="down" />
              <button
                type="submit"
                title={last ? 'Already last' : 'Move down'}
                disabled={last}
                className="p-1 text-ink-faint transition-colors hover:text-ink disabled:opacity-30"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>

          <span className={`font-serif text-base font-medium ${category.is_active ? '' : 'text-ink-faint'}`}>
            {category.name}
          </span>

          <span className="text-[10px] tracking-luxe uppercase text-ink-faint">
            {category.service_count} svc
          </span>

          {!category.is_active && (
            <span className="ml-auto text-[10px] tracking-luxe uppercase">Hidden</span>
          )}
          <span className="ml-auto flex items-center gap-1 text-[10px] tracking-luxe uppercase text-ink-soft">
            <Pencil className="h-3 w-3" /> Edit
          </span>
        </summary>

        <div className="border-t border-line px-3 py-3">
          <form action={updateCategory} className="space-y-3">
            <input type="hidden" name="id" value={category.id} />
            <label className="block">
              <span className="mb-1 block text-[10px] tracking-luxe uppercase text-ink-soft">Name</span>
              <input
                name="name"
                defaultValue={category.name}
                required
                maxLength={80}
                className="w-full border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-ink-strong"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] tracking-luxe uppercase text-ink-soft">Description</span>
              <input
                name="description"
                defaultValue={category.description ?? ''}
                maxLength={300}
                className="w-full border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-ink-strong"
              />
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-[11px] tracking-wide text-ink-soft">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={category.is_active}
                className="h-3.5 w-3.5 accent-black"
              />
              Shown on the customer menu
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                className="border border-ink bg-ink px-3 py-1.5 text-[11px] tracking-luxe uppercase text-paper transition-opacity hover:opacity-90"
              >
                Save changes
              </button>
            </div>
          </form>

          <div className="mt-3 border-t border-line pt-3">
            <form action={deleteCategory} className="flex justify-end">
              <input type="hidden" name="id" value={category.id} />
              <input type="hidden" name="serviceCount" value={category.service_count} />
              <ConfirmButton
                confirm={
                  category.service_count > 0
                    ? `“${category.name}” still contains ${category.service_count} service(s). Deletion is blocked — move or delete them first.`
                    : `Delete the empty category “${category.name}”?`
                }
                disabled={category.service_count > 0}
                title={category.service_count > 0 ? 'Blocked: move or delete the services first' : undefined}
                className="flex items-center gap-1 border border-line px-2.5 py-1 text-[10px] tracking-luxe uppercase text-ink-soft transition-colors hover:border-ink-strong hover:text-ink disabled:opacity-30"
              >
                <Trash2 className="h-3 w-3" /> Delete
                {category.service_count > 0 ? ` (${category.service_count} services inside)` : ''}
              </ConfirmButton>
            </form>
          </div>
        </div>
      </details>
    </li>
  );
}
