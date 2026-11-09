import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DEFAULT_FILTERS, type Filters } from '../domain/derive';

/** Filters live in the URL (?market=nyc&track=internship&office=…) so any filtered view can be shared. */
export function useFilters(): [Filters, (patch: Partial<Filters>) => void] {
  const [params, setParams] = useSearchParams();
  const filters = useMemo<Filters>(() => {
    const track = params.get('track');
    return {
      market: params.get('market') ?? DEFAULT_FILTERS.market,
      track: track === 'full_time' || track === 'internship' ? track : 'all',
      officeId: params.get('office'),
    };
  }, [params]);

  const update = useCallback(
    (patch: Partial<Filters>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const merged = { ...filters, ...patch };
          const put = (k: string, v: string | null, def: string | null) => (v && v !== def ? next.set(k, v) : next.delete(k));
          put('market', merged.market, 'all');
          put('track', merged.track, 'all');
          put('office', merged.officeId, null);
          return next;
        },
        { replace: true },
      );
    },
    [filters, setParams],
  );
  return [filters, update];
}
