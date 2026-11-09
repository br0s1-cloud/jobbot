import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, writeBatch, type Firestore } from 'firebase/firestore';
import { COLLECTIONS, Settings, type CollectionName, type Dataset } from '../domain/types';
import { DEFAULT_SETTINGS } from '../domain/markets';
import { useAtlas } from '../store/atlas';
import { newId, nowIso, stageTransition, type Repo } from '../store/repo';

// Everything lives under users/{uid}/… so the security rules are one simple ownership check.
const col = (db: Firestore, uid: string, c: CollectionName) => collection(db, 'users', uid, c);
const settingsRef = (db: Firestore, uid: string) => doc(db, 'users', uid, 'settings', 'profile');

/** Subscribes to every collection and mirrors it into the store. Returns an unsubscribe function. */
export function subscribeLive(db: Firestore, uid: string): () => void {
  const { set, setData } = useAtlas.getState();
  const names = Object.keys(COLLECTIONS) as CollectionName[];
  const pending = new Set<string>([...names, 'settings']);
  const markLoaded = (name: string) => {
    pending.delete(name);
    if (pending.size === 0) set({ status: 'ready' });
  };
  const onError = (e: { code?: string; message: string }) => set({ status: 'error', error: e.code ?? e.message });

  const unsubs = names.map((name) =>
    onSnapshot(
      col(db, uid, name),
      (snap) => {
        const schema = COLLECTIONS[name];
        const rows: unknown[] = [];
        for (const d of snap.docs) {
          const parsed = schema.safeParse({ ...d.data(), id: d.id });
          if (parsed.success) rows.push(parsed.data);
          else console.warn(`[jobbot] skipped invalid ${name}/${d.id}`, parsed.error.issues);
        }
        setData((data) => ({ ...data, [name]: rows }) as Dataset);
        markLoaded(name);
      },
      onError,
    ),
  );
  unsubs.push(
    onSnapshot(
      settingsRef(db, uid),
      (snap) => {
        const parsed = Settings.safeParse(snap.data());
        setData((data) => ({ ...data, settings: parsed.success ? parsed.data : DEFAULT_SETTINGS }));
        markLoaded('settings');
      },
      onError,
    ),
  );
  return () => unsubs.forEach((u) => u());
}

export function createLiveRepo(db: Firestore, uid: string): Repo {
  const data = () => useAtlas.getState().data;
  return {
    mode: 'live',
    async moveStage(oppId, to) {
      const opp = data().opportunities.find((o) => o.id === oppId);
      if (!opp || opp.stage === to) return '';
      const historyId = newId();
      const { opp: next, history } = stageTransition(opp, to, historyId);
      const batch = writeBatch(db);
      const { id: _oppId, ...oppFields } = next;
      batch.set(doc(col(db, uid, 'opportunities'), oppId), oppFields);
      const { id: _hId, ...historyFields } = history;
      batch.set(doc(col(db, uid, 'stage_history'), historyId), historyFields);
      // Firestore applies local writes to listeners immediately, so the UI updates before the server confirms.
      void batch.commit().catch((e) => useAtlas.getState().set({ error: `Couldn't save stage change: ${e.message}` }));
      return historyId;
    },
    async annotateStageChange(historyId, note) {
      await updateDoc(doc(col(db, uid, 'stage_history'), historyId), { note, updated_at: nowIso() });
    },
    async updateOpportunity(id, patch) {
      await updateDoc(doc(col(db, uid, 'opportunities'), id), { ...patch, updated_at: nowIso() });
    },
    async save(collectionName, input) {
      const { id: maybeId, ...rest } = input as { id?: string; created_at?: string };
      const id = maybeId ?? newId();
      const at = nowIso();
      const candidate = { ...rest, id, created_at: rest.created_at ?? at, updated_at: at };
      const parsed = COLLECTIONS[collectionName].parse(candidate); // throws with a readable message if invalid
      const { id: _drop, ...fields } = parsed as { id: string };
      await setDoc(doc(col(db, uid, collectionName), id), fields);
      return id;
    },
    async remove(collectionName, id) {
      await deleteDoc(doc(col(db, uid, collectionName), id));
    },
    async saveSettings(s) {
      await setDoc(settingsRef(db, uid), { ...Settings.parse(s), updated_at: nowIso() });
    },
  };
}
