import { useState } from 'react';
import { useAtlas } from '../../store/atlas';
import type { Market } from '../../domain/types';
import { DEFAULT_MARKETS } from '../../domain/markets';
import { geocode } from '../../lib/geocode';
import { Modal, Field, inputCls, Button, FormError, errMsg } from './ui';

export function SettingsForm({ onClose, onSignOut, email }: { onClose: () => void; onSignOut: () => void; email: string }) {
  const data = useAtlas((s) => s.data);
  const repo = useAtlas((s) => s.repo)!;
  const theme = useAtlas((s) => s.theme);
  const setTheme = useAtlas((s) => s.setTheme);
  const [home, setHome] = useState(data.settings.home_base);
  const [homeQuery, setHomeQuery] = useState('');
  const [markets, setMarkets] = useState<Market[]>(data.settings.markets);
  const [newMarket, setNewMarket] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const locateHome = () =>
    run(async () => {
      const hit = await geocode(homeQuery);
      if (!hit) throw new Error(`Couldn't find "${homeQuery}".`);
      setHome({ label: homeQuery.trim(), lat: hit.lat, lng: hit.lng });
      setHomeQuery('');
    });

  const addMarket = () =>
    run(async () => {
      const hit = await geocode(newMarket);
      if (!hit) throw new Error(`Couldn't find "${newMarket}".`);
      const label = newMarket.split(',')[0]!.trim();
      setMarkets([...markets, { id: label.toLowerCase().replace(/[^a-z0-9]+/g, '-'), label, lat: hit.lat, lng: hit.lng, zoom: 9.8, radius_km: 40 }]);
      setNewMarket('');
    });

  const save = () =>
    run(async () => {
      await repo.saveSettings({ home_base: home, markets });
      onClose();
    });

  const exportAll = () => {
    const { settings, ...collections } = data;
    const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), settings, ...collections }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `jobbot-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <Modal
      title="Settings"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button kind="primary" onClick={save} disabled={busy}>
            Save
          </Button>
        </>
      }
    >
      <Field label="Home base" hint={`Relationship arcs start here. Now: ${home.label} (${home.lat.toFixed(3)}, ${home.lng.toFixed(3)})`}>
        <div className="flex gap-2">
          <input className={inputCls} value={homeQuery} onChange={(e) => setHomeQuery(e.target.value)} placeholder="City, State" />
          <Button onClick={locateHome} disabled={busy || !homeQuery.trim()}>
            Set
          </Button>
        </div>
      </Field>

      <div>
        <div className="mb-1 text-[12px] font-medium text-muted">Markets (top-bar switcher)</div>
        <ul className="mb-2 space-y-1">
          {markets.map((m, i) => (
            <li key={m.id} className="flex items-center gap-2 rounded-md border border-line bg-panel-2 px-2.5 py-1.5 text-[13px]">
              <input
                className="min-w-0 flex-1 bg-transparent"
                value={m.label}
                onChange={(e) => setMarkets(markets.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                aria-label="Market label"
              />
              <label className="flex items-center gap-1 text-[11px] text-muted">
                radius
                <input
                  type="number"
                  min={5}
                  max={300}
                  className="tnum w-14 rounded border border-line bg-bg px-1"
                  value={m.radius_km}
                  onChange={(e) => setMarkets(markets.map((x, j) => (j === i ? { ...x, radius_km: Number(e.target.value) || 40 } : x)))}
                />
                km
              </label>
              <button onClick={() => setMarkets(markets.filter((_, j) => j !== i))} className="text-[12px] text-muted hover:text-danger" aria-label={`Remove ${m.label}`}>
                ✕
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input className={inputCls} value={newMarket} onChange={(e) => setNewMarket(e.target.value)} placeholder="Add market: City, State" />
          <Button onClick={addMarket} disabled={busy || !newMarket.trim()}>
            Add
          </Button>
        </div>
        <button onClick={() => setMarkets(DEFAULT_MARKETS)} className="mt-1 text-[11px] text-muted hover:text-ink">
          Reset to DC · Austin · NYC · Seattle
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
        <Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? 'Light theme' : 'Dark theme'}</Button>
        <Button onClick={exportAll} title="Download everything as JSON (your backup; Firestore backups need a paid plan)">
          Export all (JSON)
        </Button>
        <span className="ml-auto text-[12px] text-muted">{email}</span>
        <Button kind="danger" onClick={onSignOut}>
          Sign out
        </Button>
      </div>
      <FormError error={error} />
    </Modal>
  );
}
