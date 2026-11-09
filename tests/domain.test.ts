import { describe, expect, it } from 'vitest';
import { furthestStage, isClosed } from '../src/domain/stages';
import { officePins, staleness, visibleOpportunities, DEFAULT_FILTERS } from '../src/domain/derive';
import { distanceKm, inMarket, DEFAULT_MARKETS } from '../src/domain/markets';
import { stageTransition } from '../src/store/repo';
import { generateDemo } from '../src/demo/generate';
import type { Opportunity } from '../src/domain/types';

const NOW = Date.parse('2026-11-08T12:00:00Z');
const demo = generateDemo(NOW);

describe('stages', () => {
  it('furthest stage ignores closed stages', () => {
    expect(furthestStage(['Applied', 'Rejected', 'Interviewing'])).toBe('Interviewing');
    expect(furthestStage(['Rejected', 'Ghosted'])).toBeNull();
    expect(isClosed('Withdrawn')).toBe(true);
  });

  it('stage transition writes history and stamps applied_at once', () => {
    const opp = demo.opportunities.find((o) => o.stage === 'Saved')!;
    const { opp: next, history } = stageTransition(opp, 'Applied', 'h1', '2026-11-08T12:00:00.000Z');
    expect(next.stage).toBe('Applied');
    expect(next.applied_at).toBe('2026-11-08T12:00:00.000Z');
    expect(history).toMatchObject({ from_stage: 'Saved', to_stage: 'Applied', opportunity_id: opp.id });
    const again = stageTransition(next, 'Recruiter Screen', 'h2', '2026-11-09T12:00:00.000Z');
    expect(again.opp.applied_at).toBe('2026-11-08T12:00:00.000Z');
  });
});

describe('map pins', () => {
  it('one pin per office with roles; color follows furthest open stage', () => {
    const pins = officePins(demo, 'all');
    const ids = new Set(pins.map((p) => p.id));
    expect(ids.size).toBe(pins.length);
    const googleNyc = pins.find((p) => p.id === 'o-google-nyc')!;
    expect(googleNyc.stage).toBe('Offer');
  });

  it('moving a card changes the pin', () => {
    const opp = demo.opportunities.find((o) => o.office_id === 'o-crowdstrike-aus')!;
    const before = officePins(demo, 'all').find((p) => p.id === 'o-crowdstrike-aus')!;
    const moved = { ...demo, opportunities: demo.opportunities.map((o) => (o.id === opp.id ? stageTransition(o, 'Offer', 'h').opp : o)) };
    const after = officePins(moved, 'all').find((p) => p.id === 'o-crowdstrike-aus')!;
    expect(before.stage).not.toBe('Offer');
    expect(after.stage).toBe('Offer');
    expect(after.color).not.toBe(before.color);
  });
});

describe('markets and filters', () => {
  it('distance math is sane', () => {
    expect(distanceKm({ lat: 38.9072, lng: -77.0369 }, { lat: 40.7128, lng: -74.006 })).toBeGreaterThan(320);
    expect(distanceKm({ lat: 38.9072, lng: -77.0369 }, { lat: 40.7128, lng: -74.006 })).toBeLessThan(340);
  });

  it('every demo office falls in exactly one default market', () => {
    for (const o of demo.offices) {
      const hits = DEFAULT_MARKETS.filter((m) => inMarket(o, m));
      expect(hits.length, o.id).toBe(1);
    }
  });

  it('market filter keeps remote roles and drops other cities', () => {
    const nyc = visibleOpportunities(demo, { ...DEFAULT_FILTERS, market: 'nyc' });
    expect(nyc.some((o) => o.remote)).toBe(true);
    expect(nyc.every((o) => o.remote || o.office_id?.endsWith('-nyc'))).toBe(true);
  });

  it('track filter', () => {
    const interns = visibleOpportunities(demo, { ...DEFAULT_FILTERS, track: 'internship' });
    expect(interns.length).toBeGreaterThan(0);
    expect(interns.every((o) => o.track === 'internship')).toBe(true);
  });
});

describe('staleness', () => {
  const base = demo.opportunities[0]!;
  const opp = (days: number, stage: Opportunity['stage'] = 'Applied'): Opportunity => ({ ...base, id: 'x', stage, stage_changed_at: new Date(NOW - days * 86_400_000).toISOString() });
  it('amber after 7 days, red after 14, reset by an interaction', () => {
    expect(staleness(opp(3), [], NOW)).toBe('fresh');
    expect(staleness(opp(9), [], NOW)).toBe('amber');
    expect(staleness(opp(15), [], NOW)).toBe('red');
    const recent = { ...demo.interactions[0]!, opportunity_id: 'x', occurred_at: new Date(NOW - 86_400_000).toISOString() };
    expect(staleness(opp(15), [recent], NOW)).toBe('fresh');
    expect(staleness(opp(30, 'Rejected'), [], NOW)).toBe('fresh');
  });
});
