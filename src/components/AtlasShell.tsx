import { createContext, lazy, Suspense, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAtlas } from '../store/atlas';
import { TopBar } from './TopBar';
import { PipelineRail } from './pipeline/PipelineRail';
import { DetailDrawer } from './drawer/DetailDrawer';
import { Legend } from './map/Legend';
import { RemoteTray } from './map/RemoteTray';
import { ErrorBanner } from './ui/States';

const MapView = lazy(() => import('./map/MapView'));

/** Live-only editors (forms). The demo leaves these undefined, so edit buttons don't render. */
export type Editors = {
  company?: (id?: string) => void;
  opportunity?: (id?: string) => void;
  contact?: (id?: string, linkToOppId?: string) => void;
};
const EditorsContext = createContext<Editors>({});
export const useEditors = () => useContext(EditorsContext);

function useIsDesktop() {
  const q = '(min-width: 768px)';
  const [desk, setDesk] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setDesk(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return desk;
}

export function AtlasShell({ badge, actions, mapOverlay, editors = {} }: { badge?: ReactNode; actions?: ReactNode; mapOverlay?: ReactNode; editors?: Editors }) {
  const error = useAtlas((s) => s.error);
  const set = useAtlas((s) => s.set);
  const mobileTab = useAtlas((s) => s.mobileTab);
  const railCollapsed = useAtlas((s) => s.railCollapsed);
  const isDesktop = useIsDesktop();
  // On phones the map (the heaviest download) only loads once someone opens the Map tab.
  const [mapWanted, setMapWanted] = useState(isDesktop);
  useEffect(() => {
    if (isDesktop || mobileTab === 'map') setMapWanted(true);
  }, [isDesktop, mobileTab]);

  return (
    <EditorsContext.Provider value={editors}>
      <div className="flex h-full flex-col bg-bg text-ink" style={{ ['--rail-w' as string]: railCollapsed ? '48px' : '340px' }}>
        <TopBar badge={badge} actions={actions} />
        {error && <ErrorBanner message={error} onDismiss={() => set({ error: null })} />}
        <div className="relative flex min-h-0 flex-1">
          <main className={`relative min-w-0 flex-1 ${mobileTab === 'map' ? 'block' : 'hidden'} md:block`} aria-label="Territory map">
            {mapWanted && (
              <Suspense fallback={<MapPlaceholder text="Loading map…" />}>
                <MapView />
              </Suspense>
            )}
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3">
              <div className="pointer-events-auto self-center">{mapOverlay}</div>
              <div className="flex items-end justify-between gap-3">
                <div className="pointer-events-auto min-w-0">
                  <RemoteTray />
                </div>
                <div className="pointer-events-auto shrink-0">
                  <Legend />
                </div>
              </div>
            </div>
          </main>
          <aside
            className={`${mobileTab === 'board' ? 'flex' : 'hidden'} w-full shrink-0 flex-col border-line bg-panel md:flex md:w-[var(--rail-w)] md:border-l`}
            aria-label="Pipeline"
          >
            <PipelineRail />
          </aside>
          <DetailDrawer />
        </div>
        <nav className="flex border-t border-line bg-panel md:hidden" aria-label="View">
          {(['board', 'map'] as const).map((t) => (
            <button
              key={t}
              onClick={() => set({ mobileTab: t })}
              className={`flex-1 py-3 text-sm font-medium ${mobileTab === t ? 'text-ink' : 'text-muted'}`}
              aria-pressed={mobileTab === t}
            >
              {t === 'board' ? 'Board' : 'Map'}
            </button>
          ))}
        </nav>
      </div>
    </EditorsContext.Provider>
  );
}

export function MapPlaceholder({ text }: { text: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-panel-2 text-sm text-muted">
      <span>{text}</span>
    </div>
  );
}
