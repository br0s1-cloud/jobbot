import type { CollectionName, Dataset, DocOf } from '../domain/types';
import { useAtlas } from './atlas';
import { newId, nowIso, stageTransition, type Repo } from './repo';

/** In-memory repo for the public demo: every change lives in this tab and disappears on reload. */
export function createDemoRepo(): Repo {
  const { setData } = useAtlas.getState();
  const data = () => useAtlas.getState().data;

  return {
    mode: 'demo',
    async moveStage(oppId, to) {
      const opp = data().opportunities.find((o) => o.id === oppId);
      if (!opp || opp.stage === to) return '';
      const { opp: next, history } = stageTransition(opp, to, newId('h-'));
      setData((d) => ({
        ...d,
        opportunities: d.opportunities.map((o) => (o.id === oppId ? next : o)),
        stage_history: [...d.stage_history, history],
      }));
      return history.id;
    },
    async annotateStageChange(historyId, note) {
      setData((d) => ({ ...d, stage_history: d.stage_history.map((h) => (h.id === historyId ? { ...h, note, updated_at: nowIso() } : h)) }));
    },
    async updateOpportunity(id, patch) {
      setData((d) => ({ ...d, opportunities: d.opportunities.map((o) => (o.id === id ? { ...o, ...patch, updated_at: nowIso() } : o)) }));
    },
    async save(collection, doc) {
      const id = doc.id ?? newId();
      const at = nowIso();
      const full = { ...doc, id, created_at: doc.created_at ?? at, updated_at: at } as unknown as DocOf<typeof collection>;
      setData((d) => {
        const rows = d[collection] as { id: string }[];
        const exists = rows.some((r) => r.id === id);
        return { ...d, [collection]: exists ? rows.map((r) => (r.id === id ? full : r)) : [...rows, full] } as Dataset;
      });
      return id;
    },
    async remove(collection: CollectionName, id) {
      setData((d) => ({ ...d, [collection]: (d[collection] as { id: string }[]).filter((r) => r.id !== id) }) as Dataset);
    },
    async saveSettings(s) {
      setData((d) => ({ ...d, settings: s }));
    },
  };
}
