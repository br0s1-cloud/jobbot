import { inMarket } from './markets';
import { furthestStage, isClosed, STAGE_COLOR, CLOSED_COLOR } from './stages';
import type { Dataset, Opportunity, Office, Company, Stage, Track, Market, Interaction, StageChange } from './types';

const DAY = 86_400_000;

export function daysSince(iso: string, now = Date.now()): number {
  return Math.max(0, Math.floor((now - Date.parse(iso)) / DAY));
}

export type Filters = { market: string; track: Track | 'all'; officeId: string | null };
export const DEFAULT_FILTERS: Filters = { market: 'all', track: 'all', officeId: null };

export function byId<T extends { id: string }>(rows: T[]): Map<string, T> {
  return new Map(rows.map((r) => [r.id, r]));
}

/** Opportunities visible on the board for the current filters. Remote roles stay visible in every market. */
export function visibleOpportunities(data: Dataset, f: Filters): Opportunity[] {
  const offices = byId(data.offices);
  const market: Market | undefined = data.settings.markets.find((m) => m.id === f.market);
  return data.opportunities.filter((o) => {
    if (f.track !== 'all' && o.track !== f.track) return false;
    if (f.officeId && o.office_id !== f.officeId) return false;
    if (market && !o.remote) {
      const off = o.office_id ? offices.get(o.office_id) : undefined;
      if (!off || !inMarket(off, market)) return false;
    }
    return true;
  });
}

export type OfficePin = {
  id: string;
  lng: number;
  lat: number;
  company: string;
  label: string;
  openCount: number;
  totalCount: number;
  stage: Stage | null;
  color: string;
  nextStep: string;
};

/** One pin per office that has at least one (track-filtered) opportunity. Market doesn't hide pins; it moves the camera. */
export function officePins(data: Dataset, track: Filters['track']): OfficePin[] {
  const companies = byId(data.companies);
  const groups = new Map<string, Opportunity[]>();
  for (const o of data.opportunities) {
    if (o.remote || !o.office_id) continue;
    if (track !== 'all' && o.track !== track) continue;
    const g = groups.get(o.office_id) ?? [];
    g.push(o);
    groups.set(o.office_id, g);
  }
  const pins: OfficePin[] = [];
  for (const off of data.offices) {
    const opps = groups.get(off.id);
    if (!opps?.length) continue;
    const open = opps.filter((o) => !isClosed(o.stage));
    const stage = furthestStage(opps.map((o) => o.stage));
    const next = [...open]
      .filter((o) => o.next_step)
      .sort((a, b) => (a.next_step_due ?? '9999').localeCompare(b.next_step_due ?? '9999'))[0];
    pins.push({
      id: off.id,
      lng: off.lng,
      lat: off.lat,
      company: companies.get(off.company_id)?.name ?? 'Unknown company',
      label: off.label,
      openCount: open.length,
      totalCount: opps.length,
      stage,
      color: stage ? STAGE_COLOR[stage] : CLOSED_COLOR,
      nextStep: next?.next_step ?? '',
    });
  }
  return pins;
}

export type Staleness = 'fresh' | 'amber' | 'red';

/** Amber after 7 days in the same open stage with no logged interaction, red after 14. Saved/Offer/closed never go stale. */
export function staleness(o: Opportunity, interactions: Interaction[], now = Date.now()): Staleness {
  if (isClosed(o.stage) || o.stage === 'Saved' || o.stage === 'Offer') return 'fresh';
  let last = Date.parse(o.stage_changed_at);
  for (const i of interactions) {
    if (i.opportunity_id === o.id) last = Math.max(last, Date.parse(i.occurred_at));
  }
  const days = (now - last) / DAY;
  return days > 14 ? 'red' : days > 7 ? 'amber' : 'fresh';
}

export type TimelineItem =
  | { kind: 'stage'; at: string; change: StageChange }
  | { kind: 'interaction'; at: string; interaction: Interaction };

export function timelineFor(data: Dataset, oppId: string): TimelineItem[] {
  const items: TimelineItem[] = [
    ...data.stage_history.filter((s) => s.opportunity_id === oppId).map((change) => ({ kind: 'stage' as const, at: change.changed_at, change })),
    ...data.interactions.filter((i) => i.opportunity_id === oppId).map((interaction) => ({ kind: 'interaction' as const, at: interaction.occurred_at, interaction })),
  ];
  return items.sort((a, b) => b.at.localeCompare(a.at));
}

export function officeLabel(off: Office | undefined, company?: Company): string {
  if (!off) return 'Remote';
  return company ? `${company.name} · ${off.label}` : off.label;
}
