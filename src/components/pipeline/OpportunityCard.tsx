import { useRef, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useAtlas } from '../../store/atlas';
import { daysSince, staleness } from '../../domain/derive';
import type { Company, Office, Opportunity } from '../../domain/types';
import { Monogram } from '../ui/States';

const STALE_BORDER = { fresh: 'border-l-transparent', amber: 'border-l-accent', red: 'border-l-danger' } as const;

export function OpportunityCard({ opp, company, office }: { opp: Opportunity; company?: Company; office?: Office }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: opp.id });
  const set = useAtlas((s) => s.set);
  const interactions = useAtlas((s) => s.data.interactions);
  const selected = useAtlas((s) => s.selectedOppId === opp.id);
  const hoveredOffice = useAtlas((s) => s.hoveredOfficeId);
  const pending = useAtlas((s) => (s.pendingNote?.oppId === opp.id ? s.pendingNote : null));
  const stale = staleness(opp, interactions);

  return (
    <div className={pending ? 'card-drop' : ''}>
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        role="button"
        tabIndex={0}
        aria-label={`${company?.name ?? ''}: ${opp.title}, ${opp.stage}${stale !== 'fresh' ? `, stale (${stale})` : ''}`}
        onClick={() => set({ selectedOppId: opp.id })}
        onKeyDown={(e) => {
          if (e.key === 'Enter') set({ selectedOppId: opp.id });
        }}
        onMouseEnter={() => opp.office_id && set({ hoveredOfficeId: opp.office_id })}
        onMouseLeave={() => set({ hoveredOfficeId: null })}
        className={`cursor-grab touch-manipulation select-none rounded-lg border border-l-[3px] bg-panel-2 p-2.5 transition-colors active:cursor-grabbing ${STALE_BORDER[stale]} ${
          selected ? 'border-focus/70' : hoveredOffice && hoveredOffice === opp.office_id ? 'border-line bg-raised' : 'border-line hover:bg-raised'
        } ${isDragging ? 'opacity-30' : ''}`}
        title={stale === 'red' ? 'No activity for 14+ days' : stale === 'amber' ? 'No activity for 7+ days' : undefined}
      >
        <CardBody opp={opp} company={company} office={office} />
      </div>
      {pending && <NotePrompt historyId={pending.historyId} />}
    </div>
  );
}

export function CardBody({ opp, company, office }: { opp: Opportunity; company?: Company; office?: Office }) {
  const days = daysSince(opp.stage_changed_at);
  const due = opp.next_step_due ? Math.floor((Date.parse(opp.next_step_due) - Date.now()) / 86_400_000) : null;
  const overdue = due !== null && due < 0;
  const dueSoon = due !== null && due <= 1;
  return (
    <div className="flex gap-2.5">
      <Monogram name={company?.name ?? '?'} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium leading-tight text-ink">{opp.title}</div>
        <div className="mt-0.5 flex items-center gap-1.5 truncate text-[12px] text-muted">
          <span className="truncate">
            {company?.name ?? 'Unknown'} · {opp.remote ? 'Remote' : office?.city || office?.label || '—'}
          </span>
          {opp.track === 'internship' && <span className="shrink-0 rounded bg-raised px-1 text-[10px] uppercase tracking-wide text-muted">Intern</span>}
        </div>
        <div className="mt-1.5 flex items-center gap-2 text-[11px]">
          <span className="tnum text-faint">{days}d in stage</span>
          {opp.next_step && (
            <span
              className={`truncate rounded-full px-1.5 py-0.5 ${overdue || dueSoon ? 'bg-accent/15 text-accent' : 'bg-raised text-muted'}`}
              title={opp.next_step_due ? `Due ${new Date(opp.next_step_due).toLocaleDateString()}` : undefined}
            >
              {overdue ? 'Overdue: ' : ''}
              {opp.next_step}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function NotePrompt({ historyId }: { historyId: string }) {
  const repo = useAtlas((s) => s.repo);
  const set = useAtlas((s) => s.set);
  const [note, setNote] = useState('');
  const finished = useRef(false);
  const done = () => {
    finished.current = true;
    set({ pendingNote: null });
  };
  const save = async () => {
    if (finished.current) return;
    finished.current = true;
    if (note.trim() && repo) {
      try {
        await repo.annotateStageChange(historyId, note.trim());
      } catch (e) {
        set({ error: `Couldn't save note: ${e instanceof Error ? e.message : String(e)}` });
      }
    }
    done();
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="mt-1 flex items-center gap-1.5 px-0.5"
    >
      <input
        autoFocus
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && done()}
        // Clicking away saves what was typed, or quietly skips if nothing was.
        onBlur={() => void save()}
        placeholder="Log a note? Enter to save, Esc to skip"
        aria-label="Note about this stage change"
        className="min-w-0 flex-1 rounded-md border border-line bg-bg px-2 py-1 text-[12px] text-ink placeholder:text-faint"
      />
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={done} className="text-[11px] text-muted hover:text-ink">
        Skip
      </button>
    </form>
  );
}
