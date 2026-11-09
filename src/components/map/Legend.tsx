import { useState } from 'react';
import { ACTIVE_STAGES, STAGE_COLOR, CLOSED_COLOR } from '../../domain/stages';

export function Legend() {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-lg border border-line bg-panel/90 text-[11px] text-muted shadow-lg backdrop-blur">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-3 px-2.5 py-1.5 font-medium text-ink" aria-expanded={open}>
        Legend <span aria-hidden>{open ? '–' : '+'}</span>
      </button>
      {open && (
        <div className="space-y-1 px-2.5 pb-2">
          <div className="mb-1">Furthest stage at office</div>
          {ACTIVE_STAGES.map((s) => (
            <div key={s} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: STAGE_COLOR[s] }} aria-hidden />
              {s}
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: CLOSED_COLOR }} aria-hidden />
            All closed
          </div>
          <div className="mt-1.5 flex items-center gap-2 border-t border-line pt-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-muted" aria-hidden />
            <span className="h-3 w-3 rounded-full bg-muted" aria-hidden />
            Size = open roles
          </div>
        </div>
      )}
    </div>
  );
}
