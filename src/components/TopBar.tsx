import type { ReactNode } from 'react';
import { useAtlas } from '../store/atlas';
import { useFilters } from '../lib/useFilters';
import { byId } from '../domain/derive';
import { Logo } from './ui/States';

export function TopBar({ badge, actions }: { badge?: ReactNode; actions?: ReactNode }) {
  const [filters, setFilters] = useFilters();
  const markets = useAtlas((s) => s.data.settings.markets);
  const offices = useAtlas((s) => s.data.offices);
  const companies = useAtlas((s) => s.data.companies);
  const theme = useAtlas((s) => s.theme);
  const setTheme = useAtlas((s) => s.setTheme);

  const office = filters.officeId ? offices.find((o) => o.id === filters.officeId) : undefined;
  const officeCompany = office ? byId(companies).get(office.company_id) : undefined;

  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line bg-panel px-3 py-2 md:flex-nowrap">
      <div className="flex items-center gap-2">
        <Logo />
        <span className="text-[15px] font-semibold tracking-tight">jobbot</span>
      </div>

      <div className="order-last -mx-1 flex w-full items-center gap-2 overflow-x-auto px-1 md:order-none md:w-auto" role="group" aria-label="Market">
        <div className="flex shrink-0 rounded-lg border border-line bg-panel-2 p-0.5">
          {[{ id: 'all', label: 'All' }, ...markets].map((m) => (
            <button
              key={m.id}
              onClick={() => setFilters({ market: m.id, officeId: null })}
              aria-pressed={filters.market === m.id}
              className={`rounded-md px-2.5 py-1 text-[13px] font-medium transition-colors ${
                filters.market === m.id ? 'bg-raised text-ink shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor="track-filter">
          Track
        </label>
        <select
          id="track-filter"
          value={filters.track}
          onChange={(e) => setFilters({ track: e.target.value as typeof filters.track })}
          className="shrink-0 rounded-lg border border-line bg-panel-2 px-2 py-1.5 text-[13px] text-ink"
        >
          <option value="all">All roles</option>
          <option value="full_time">Full-time</option>
          <option value="internship">Internships</option>
        </select>
        {office && (
          <button
            onClick={() => setFilters({ officeId: null })}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-focus/50 bg-focus/10 px-2.5 py-1 text-[12px] text-ink"
            title="Clear office filter"
          >
            {officeCompany?.name} · {office.label}
            <span aria-hidden className="text-muted">
              ✕
            </span>
            <span className="sr-only">Clear office filter</span>
          </button>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {badge}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-md p-1.5 text-muted hover:bg-raised hover:text-ink"
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title="Toggle theme"
        >
          {theme === 'dark' ? (
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
              <path d="M10 15a5 5 0 100-10 5 5 0 000 10zM10 0a1 1 0 011 1v1a1 1 0 11-2 0V1a1 1 0 011-1zm0 17a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM20 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM3 10a1 1 0 01-1 1H1a1 1 0 110-2h1a1 1 0 011 1z" />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
              <path d="M17.3 13.3A8 8 0 016.7 2.7 8 8 0 1017.3 13.3z" />
            </svg>
          )}
        </button>
        {actions}
      </div>
    </header>
  );
}
