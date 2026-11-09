import { useMemo } from 'react';
import { useAtlas } from '../../store/atlas';
import { byId } from '../../domain/derive';
import { isClosed, STAGE_COLOR } from '../../domain/stages';
import { useFilters } from '../../lib/useFilters';

/** Remote roles get a strip instead of a fake spot on the map. */
export function RemoteTray() {
  const data = useAtlas((s) => s.data);
  const set = useAtlas((s) => s.set);
  const [filters] = useFilters();
  const companies = useMemo(() => byId(data.companies), [data.companies]);
  const remote = data.opportunities.filter((o) => o.remote && !isClosed(o.stage) && (filters.track === 'all' || o.track === filters.track));
  if (!remote.length) return null;
  return (
    <div className="max-w-[min(520px,60vw)] rounded-lg border border-line bg-panel/90 p-2 shadow-lg backdrop-blur">
      <div className="mb-1.5 px-0.5 text-[11px] font-medium text-muted">Remote · {remote.length}</div>
      <div className="flex gap-1.5 overflow-x-auto">
        {remote.map((o) => (
          <button
            key={o.id}
            onClick={() => set({ selectedOppId: o.id })}
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-line bg-panel-2 px-2 py-1 text-left text-[12px] hover:border-focus/60"
          >
            <span className="h-2 w-2 rounded-full" style={{ background: STAGE_COLOR[o.stage] }} aria-hidden />
            <span className="font-medium text-ink">{companies.get(o.company_id)?.name}</span>
            <span className="max-w-[160px] truncate text-muted">{o.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
