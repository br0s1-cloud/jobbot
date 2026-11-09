import type { CollectionName, DocOf, Opportunity, Settings, Stage, StageChange } from '../domain/types';

/** The UI talks to data only through this interface. Demo = in-memory, live = Firestore. */
export interface Repo {
  mode: 'demo' | 'live';
  /** Moves an opportunity and records stage history. Resolves to the new history entry's id. */
  moveStage(oppId: string, to: Stage): Promise<string>;
  annotateStageChange(historyId: string, note: string): Promise<void>;
  updateOpportunity(id: string, patch: Partial<Omit<Opportunity, 'id' | 'created_at'>>): Promise<void>;
  /** Create (no id) or replace (id) a document. Resolves to its id. */
  save<C extends CollectionName>(collection: C, doc: Omit<DocOf<C>, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string }): Promise<string>;
  remove(collection: CollectionName, id: string): Promise<void>;
  saveSettings(s: Settings): Promise<void>;
}

export const nowIso = () => new Date().toISOString();

export function newId(prefix = ''): string {
  const rand = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().replace(/-/g, '').slice(0, 20) : Math.random().toString(36).slice(2, 14);
  return prefix + rand;
}

/** Pure stage transition shared by both repos. */
export function stageTransition(opp: Opportunity, to: Stage, historyId: string, at = nowIso()): { opp: Opportunity; history: StageChange } {
  return {
    opp: {
      ...opp,
      stage: to,
      stage_changed_at: at,
      applied_at: opp.applied_at ?? (to === 'Applied' ? at : null),
      updated_at: at,
    },
    history: {
      id: historyId,
      opportunity_id: opp.id,
      from_stage: opp.stage,
      to_stage: to,
      changed_at: at,
      changed_by: 'me',
      note: '',
      created_at: at,
      updated_at: at,
    },
  };
}
