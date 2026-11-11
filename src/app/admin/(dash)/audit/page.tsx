import { requireAdmin } from '@/lib/supabase/server';
import { loadAuditPage } from '@/lib/admin-data';

export default async function AuditPage() {
  await requireAdmin();
  const logs = await loadAuditPage(50);

  return (
    <main className="px-4 pb-16 pt-6">
      <h1 className="font-serif text-2xl font-semibold">Audit log</h1>
      <p className="mt-1 text-xs text-ink-soft">
        Every change to the menu is recorded automatically — who, what, when, before/after.
      </p>

      <div className="mt-4 overflow-x-auto border border-line bg-paper-raised">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead>
            <tr className="border-b border-line text-[10px] tracking-luxe uppercase text-ink-faint">
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Table</th>
              <th className="px-3 py-2">Record</th>
              <th className="px-3 py-2">By</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-ink-soft">
                  No entries yet.
                </td>
              </tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id} className="border-b border-line last:border-0">
                  <td className="whitespace-nowrap px-3 py-2 text-ink-soft">
                    {new Date(l.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'medium' })}
                  </td>
                  <td className="px-3 py-2 font-medium">{l.action}</td>
                  <td className="px-3 py-2 text-ink-soft">{l.table_name}</td>
                  <td className="px-3 py-2 font-mono text-[10px] text-ink-faint">
                    {(l.record_id ?? '').slice(0, 8)}
                  </td>
                  <td className="px-3 py-2 text-ink-soft">{l.actor_email ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
