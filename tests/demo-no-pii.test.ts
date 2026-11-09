import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { generateDemo } from '../src/demo/generate';
import { COLLECTIONS } from '../src/domain/types';

// The public demo must never carry real (or invented) people. This test fails the build if it does.
const demo = generateDemo(Date.parse('2026-11-08T12:00:00Z'));
const text = JSON.stringify(demo).toLowerCase();

describe('demo dataset privacy', () => {
  it('every contact is a nameless role placeholder', () => {
    expect(demo.contacts.length).toBeGreaterThan(25);
    for (const c of demo.contacts) {
      expect(c.placeholder).toBe(true);
      // "Role · Company City": a role, never a personal name.
      expect(c.full_name).toMatch(/^.+ · .+$/);
      expect(c.full_name.startsWith(c.title)).toBe(true);
      expect(c.email).toBe('');
      expect(c.linkedin_url).toBe('');
    }
  });

  it('contains no email addresses, phone numbers or LinkedIn profile URLs', () => {
    expect(text).not.toMatch(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/);
    expect(text).not.toMatch(/\(?\d{3}\)?[-. ]\d{3}[-. ]\d{4}/);
    expect(text).not.toMatch(/linkedin\.com\/in\//);
  });

  it('contains nothing from the private denylist', () => {
    // private/denylist.txt is gitignored: one real name, email or phrase per line. CI has no file, so this checks locally.
    const path = 'private/denylist.txt';
    if (!existsSync(path)) return;
    const terms = readFileSync(path, 'utf8')
      .split('\n')
      .map((l) => l.trim().toLowerCase())
      .filter((l) => l && !l.startsWith('#'));
    for (const t of terms) expect(text, `demo data contains denylisted term "${t}"`).not.toContain(t);
  });

  it('is valid against the same schemas as live data', () => {
    for (const [name, schema] of Object.entries(COLLECTIONS)) {
      for (const row of demo[name as keyof typeof COLLECTIONS]) expect(schema.safeParse(row).success, `${name}/${(row as { id: string }).id}`).toBe(true);
    }
  });

  it('references only existing records', () => {
    const ids = (rows: { id: string }[]) => new Set(rows.map((r) => r.id));
    const companies = ids(demo.companies);
    const offices = ids(demo.offices);
    const opps = ids(demo.opportunities);
    const contacts = ids(demo.contacts);
    for (const o of demo.opportunities) {
      expect(companies.has(o.company_id)).toBe(true);
      if (o.office_id) expect(offices.has(o.office_id)).toBe(true);
      expect(o.remote || o.office_id).toBeTruthy();
    }
    for (const l of demo.contact_links) {
      expect(contacts.has(l.contact_id)).toBe(true);
      expect(opps.has(l.opportunity_id)).toBe(true);
    }
  });

  it('has the spread the demo needs', () => {
    const stages = new Set(demo.opportunities.map((o) => o.stage));
    for (const s of ['Saved', 'Applied', 'Recruiter Screen', 'Interviewing', 'Final Round', 'Offer', 'Rejected', 'Withdrawn', 'Ghosted']) expect(stages.has(s as never), s).toBe(true);
    expect(demo.companies.length).toBeGreaterThanOrEqual(25);
    expect(demo.opportunities.length).toBeGreaterThanOrEqual(30);
  });
});
