import { useMemo, useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, TouchSensor, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { useAtlas } from '../../store/atlas';
import { useFilters } from '../../lib/useFilters';
import { visibleOpportunities, byId } from '../../domain/derive';
import { ACTIVE_STAGES, CLOSED_STAGES, STAGE_COLOR } from '../../domain/stages';
import type { Opportunity, Stage } from '../../domain/types';
import { OpportunityCard, CardBody } from './OpportunityCard';
import { SkeletonCards, EmptyState } from '../ui/States';
import { useEditors } from '../AtlasShell';

export function PipelineRail() {
  const data = useAtlas((s) => s.data);
  const status = useAtlas((s) => s.status);
  const repo = useAtlas((s) => s.repo);
  const set = useAtlas((s) => s.set);
  const collapsed = useAtlas((s) => s.railCollapsed);
  const [filters, setFilters] = useFilters();
  const editors = useEditors();
  const [dragging, setDragging] = useState<Opportunity | null>(null);
  const [showClosed, setShowClosed] = useState(false);

  const visible = useMemo(() => visibleOpportunities(data, filters), [data, filters]);
  const byStage = useMemo(() => {
    const m = new Map<Stage, Opportunity[]>();
    for (const o of visible) m.set(o.stage, [...(m.get(o.stage) ?? []), o]);
    for (const list of m.values()) list.sort((a, b) => a.priority - b.priority || b.stage_changed_at.localeCompare(a.stage_changed_at));
    return m;
  }, [visible]);
  const companies = useMemo(() => byId(data.companies), [data.companies]);
  const offices = useMemo(() => byId(data.offices), [data.offices]);
  const closedCount = CLOSED_STAGES.reduce((n, s) => n + (byStage.get(s)?.length ?? 0), 0);

  // Small movement threshold so a click still opens the card; long-press on touch so the list can scroll.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }));

  const onDragStart = (e: DragStartEvent) => setDragging(data.opportunities.find((o) => o.id === e.active.id) ?? null);
  const onDragEnd = async (e: DragEndEvent) => {
    setDragging(null);
    const to = e.over?.id as Stage | undefined;
    const opp = data.opportunities.find((o) => o.id === e.active.id);
    if (!repo || !opp || !to || opp.stage === to) return;
    try {
      const historyId = await repo.moveStage(opp.id, to);
      if (historyId) set({ pendingNote: { oppId: opp.id, historyId } });
    } catch (err) {
      set({ error: `Couldn't move that card: ${err instanceof Error ? err.message : String(err)}` });
    }
  };

  if (collapsed) {
    return (
      <div className="hidden h-full flex-col items-center gap-1 py-2 md:flex">
        <button onClick={() => set({ railCollapsed: false })} className="mb-2 rounded p-1.5 text-muted hover:bg-raised hover:text-ink" aria-label="Expand pipeline" title="Expand pipeline">
          «
        </button>
        {ACTIVE_STAGES.map((s) => (
          <div key={s} className="flex flex-col items-center py-1.5" title={s}>
            <span className="h-2 w-2 rounded-full" style={{ background: STAGE_COLOR[s] }} aria-hidden />
            <span className="tnum mt-1 text-[12px] font-medium text-ink">{byStage.get(s)?.length ?? 0}</span>
            <span className="sr-only">{s}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <div className="text-[13px] font-semibold">
          Pipeline <span className="tnum font-normal text-muted">· {visible.length - closedCount} open</span>
        </div>
        <div className="flex items-center gap-1">
          {editors.opportunity && (
            <button onClick={() => editors.opportunity!()} className="rounded-md px-2 py-1 text-[12px] text-muted hover:bg-raised hover:text-ink">
              + Role
            </button>
          )}
          <button onClick={() => set({ railCollapsed: true })} className="hidden rounded p-1 text-muted hover:bg-raised hover:text-ink md:block" aria-label="Collapse pipeline" title="Collapse pipeline">
            »
          </button>
        </div>
      </div>

      {status === 'loading' ? (
        <SkeletonCards n={6} />
      ) : (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-6">
            {visible.length === 0 && data.opportunities.length > 0 && (
              <div className="p-4">
                <EmptyState title="Nothing matches these filters" body="Try another market or role type.">
                  <button onClick={() => setFilters({ market: 'all', track: 'all', officeId: null })} className="rounded-md bg-raised px-3 py-1.5 text-[12px]">
                    Clear filters
                  </button>
                </EmptyState>
              </div>
            )}
            {ACTIVE_STAGES.map((s) => (
              <StageSection key={s} stage={s} count={byStage.get(s)?.length ?? 0}>
                {(byStage.get(s) ?? []).map((o) => (
                  <OpportunityCard key={o.id} opp={o} company={companies.get(o.company_id)} office={o.office_id ? offices.get(o.office_id) : undefined} />
                ))}
              </StageSection>
            ))}
            <div className="mt-3 border-t border-line pt-2">
              <button onClick={() => setShowClosed(!showClosed)} className="flex w-full items-center justify-between px-1 py-1 text-[12px] font-medium text-muted hover:text-ink" aria-expanded={showClosed}>
                <span>Closed · {closedCount}</span>
                <span aria-hidden>{showClosed ? '–' : '+'}</span>
              </button>
              <div className="mt-1 grid grid-cols-3 gap-1.5">
                {CLOSED_STAGES.map((s) => (
                  <ClosedDrop key={s} stage={s} count={byStage.get(s)?.length ?? 0} />
                ))}
              </div>
              {showClosed &&
                CLOSED_STAGES.map((s) =>
                  (byStage.get(s) ?? []).map((o) => <OpportunityCard key={o.id} opp={o} company={companies.get(o.company_id)} office={o.office_id ? offices.get(o.office_id) : undefined} />),
                )}
            </div>
          </div>
          <DragOverlay dropAnimation={null}>
            {dragging && (
              <div className="w-[316px] rotate-1 rounded-lg border border-focus/60 bg-panel-2 p-2.5 shadow-2xl">
                <CardBody opp={dragging} company={companies.get(dragging.company_id)} office={dragging.office_id ? offices.get(dragging.office_id) : undefined} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}

function StageSection({ stage, count, children }: { stage: Stage; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <section ref={setNodeRef} aria-label={`${stage}, ${count}`} className={`mt-2 rounded-lg p-1 transition-colors ${isOver ? 'bg-focus/10 ring-1 ring-focus/50' : ''}`}>
      <h3 className="sticky top-0 z-10 flex items-center gap-2 bg-panel px-1 py-1.5 text-[12px] font-medium text-muted">
        <span className="h-2 w-2 rounded-full" style={{ background: STAGE_COLOR[stage] }} aria-hidden />
        {stage}
        <span className="tnum text-faint">{count}</span>
      </h3>
      <div className="space-y-1.5">{children}</div>
      {count === 0 && <div className="rounded-md border border-dashed border-line px-2 py-2 text-center text-[11px] text-faint">Drop here</div>}
    </section>
  );
}

function ClosedDrop({ stage, count }: { stage: Stage; count: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div ref={setNodeRef} className={`rounded-md border border-dashed px-1 py-1.5 text-center text-[11px] ${isOver ? 'border-focus bg-focus/10 text-ink' : 'border-line text-faint'}`}>
      {stage} <span className="tnum">{count}</span>
    </div>
  );
}
