import { ACTIVE_STAGES, isClosed } from '../domain/stages';
import { DEFAULT_SETTINGS } from '../domain/markets';
import type { Company, Contact, ContactLink, Dataset, Interaction, InteractionType, LinkRole, Office, Opportunity, Relationship, Source, Stage, StageChange, Track } from '../domain/types';
import { CATALOG } from './catalog';

// The demo is generated at load time relative to "now", so days-in-stage and staleness always look current.
// Contacts are nameless role placeholders. Nothing here describes a real or invented person.

type Row = [company: string, office: string, title: string, track: Track, source: Source, stage: Stage, daysInStage: number, priority: 1 | 2 | 3, nextStep: string, dueInDays: number | null];

const ROWS: Row[] = [
  ['crowdstrike', 'aus', 'Sales Development Representative', 'full_time', 'linkedin', 'Interviewing', 4, 1, 'Panel with SDR team lead', 2],
  ['aws', 'arl', 'Business Development Representative, Public Sector', 'full_time', 'referral', 'Final Round', 3, 1, 'Final loop: mock discovery call', 1],
  ['aws', 'sea', 'Associate Account Manager', 'full_time', 'company_site', 'Applied', 5, 2, 'Follow up with campus recruiter', -1],
  ['palantir', 'dc', 'Business Development Associate, Government', 'full_time', 'referral', 'Recruiter Screen', 5, 1, 'Recruiter call Thursday', 3],
  ['palantir', 'nyc', 'Deployment Strategist (Commercial)', 'full_time', 'company_site', 'Rejected', 20, 2, '', null],
  ['anduril', 'dc', 'Growth Associate, Federal', 'full_time', 'linkedin', 'Applied', 12, 2, 'Ping alum on the BD team', 0],
  ['salesforce', 'nyc', 'Associate Account Executive (Future Force)', 'full_time', 'handshake', 'Interviewing', 6, 1, 'Prep 30-60-90 plan', 4],
  ['salesforce', 'dc', 'Business Development Representative, Public Sector', 'full_time', 'linkedin', 'Saved', 2, 2, 'Tailor resume to public sector', 5],
  ['microsoft', 'red', 'Customer Success Account Manager (MACH)', 'full_time', 'handshake', 'Recruiter Screen', 16, 2, 'Send availability', -2],
  ['microsoft', 'res', 'Federal Sales Associate', 'full_time', 'company_site', 'Ghosted', 30, 3, '', null],
  ['google', 'nyc', 'Google Cloud Associate Account Strategist', 'full_time', 'referral', 'Offer', 2, 1, 'Decide on offer by Friday', 4],
  ['google', 'aus', 'Business Development Associate', 'full_time', 'linkedin', 'Applied', 4, 2, 'Ask NYC contact for an Austin intro', 2],
  ['google', 'dc', 'Public Policy Intern (Spring 2027)', 'internship', 'company_site', 'Applied', 6, 1, 'Writing sample due', 6],
  ['datadog', 'nyc', 'Sales Development Representative', 'full_time', 'linkedin', 'Recruiter Screen', 3, 1, 'Recruiter screen Monday', 2],
  ['mongodb', 'nyc', 'Account Development Representative', 'full_time', 'linkedin', 'Withdrawn', 10, 3, '', null],
  ['mongodb', 'aus', 'Sales Development Representative', 'full_time', 'referral', 'Interviewing', 8, 2, 'Thank-you note to hiring manager', 0],
  ['snowflake', 'bel', 'Sales Development Representative', 'full_time', 'linkedin', 'Saved', 1, 3, '', null],
  ['tanium', 'kir', 'Business Development Representative', 'full_time', 'company_site', 'Applied', 15, 3, '', null],
  ['booz', 'mcl', 'Client Services Analyst', 'full_time', 'handshake', 'Recruiter Screen', 2, 2, 'Finish recorded video interview', 1],
  ['appian', 'mcl', 'Associate Sales Development Representative', 'full_time', 'handshake', 'Applied', 3, 2, '', null],
  ['rapid7', 'arl', 'Sales Development Representative', 'full_time', 'linkedin', 'Rejected', 14, 3, '', null],
  ['oracle', 'aus', 'Cloud Sales Representative (Class Of)', 'full_time', 'handshake', 'Interviewing', 2, 2, 'Case presentation Wednesday', 3],
  ['dell', 'rr', 'Inside Sales Representative', 'full_time', 'handshake', 'Ghosted', 25, 3, '', null],
  ['indeed', 'aus', 'Client Success Associate', 'full_time', 'company_site', 'Saved', 4, 3, '', null],
  ['atlassian', 'remote', 'Growth Marketing Associate', 'full_time', 'company_site', 'Applied', 5, 2, 'Ask an alum for a referral', 2],
  ['ramp', 'nyc', 'Account Executive, Emerging (Entry Level)', 'full_time', 'referral', 'Recruiter Screen', 1, 1, 'Prep for screen', 1],
  ['stripe', 'sea', 'Sales Development Representative', 'full_time', 'linkedin', 'Saved', 3, 2, '', null],
  ['zillow', 'remote', 'Partnerships Associate', 'full_time', 'linkedin', 'Rejected', 9, 3, '', null],
  ['databricks', 'nyc', 'Sales Development Representative', 'full_time', 'linkedin', 'Applied', 7, 2, '', null],
  ['wiz', 'nyc', 'Business Development Representative', 'full_time', 'referral', 'Interviewing', 5, 1, 'Meet the regional VP', 2],
  ['cdt', 'dc', 'Policy Intern (Spring 2027)', 'internship', 'company_site', 'Saved', 6, 1, 'Draft cover letter', 7],
  ['iti', 'dc', 'Government Affairs Intern (Spring 2027)', 'internship', 'handshake', 'Applied', 10, 2, '', null],
];

/** Where a closed opportunity was when it closed. */
const CLOSED_FROM: Partial<Record<string, Stage>> = {
  'palantir/nyc': 'Recruiter Screen',
  'microsoft/res': 'Applied',
  'mongodb/nyc': 'Recruiter Screen',
  'rapid7/arl': 'Interviewing',
  'dell/rr': 'Applied',
  'zillow/remote': 'Applied',
};

const DAY = 86_400_000;

export function generateDemo(now = Date.now()): Dataset {
  const at = (daysAgo: number, hour = 14) => {
    const d = new Date(now - daysAgo * DAY);
    d.setUTCHours(hour, 0, 0, 0);
    return d.toISOString();
  };
  const created = at(60);
  const stamp = { created_at: created, updated_at: created };

  const companies: Company[] = [];
  const offices: Office[] = [];
  for (const c of CATALOG) {
    companies.push({ id: `c-${c.key}`, name: c.name, domain: c.domain, logo_url: '', industry: c.industry, tier: c.tier, notes: '', ...stamp });
    for (const o of c.offices) {
      offices.push({ id: `o-${c.key}-${o.key}`, company_id: `c-${c.key}`, label: o.label, city: o.city, region: o.region, country: 'US', lat: o.lat, lng: o.lng, is_hq: !!o.hq, ...stamp });
    }
  }
  const companyName = new Map(companies.map((c) => [c.id, c.name]));
  const officeById = new Map(offices.map((o) => [o.id, o]));

  const opportunities: Opportunity[] = [];
  const stage_history: StageChange[] = [];
  const contacts: Contact[] = [];
  const contact_links: ContactLink[] = [];
  const interactions: Interaction[] = [];

  const shortCity = (officeId: string | null) => {
    const off = officeId ? officeById.get(officeId) : undefined;
    return off ? off.city.replace('New York', 'NYC').replace('Washington', 'DC') : 'Remote';
  };

  const addContact = (opts: {
    role: string; companyId: string; officeId: string | null; relationship: Relationship; howMet: string; lastTouchDaysAgo: number;
  }) => {
    const id = `p-${contacts.length + 1}`;
    contacts.push({
      id,
      full_name: `${opts.role} · ${companyName.get(opts.companyId)} ${shortCity(opts.officeId)}`,
      title: opts.role,
      company_id: opts.companyId,
      office_id: opts.officeId,
      linkedin_url: '',
      email: '',
      how_met: opts.howMet,
      relationship: opts.relationship,
      last_touch_at: at(opts.lastTouchDaysAgo),
      placeholder: true,
      ...stamp,
    });
    return id;
  };
  const link = (contactId: string, oppId: string, role: LinkRole) =>
    contact_links.push({ id: `l-${contact_links.length + 1}`, contact_id: contactId, opportunity_id: oppId, role, ...stamp });
  const interact = (oppId: string, contactId: string | null, type: InteractionType, daysAgo: number, summary: string, inbound = false) =>
    interactions.push({ id: `i-${interactions.length + 1}`, contact_id: contactId, opportunity_id: oppId, type, occurred_at: at(daysAgo, 15), summary, source_ref: '', inbound, ...stamp });

  ROWS.forEach(([ck, ok, title, track, source, stage, daysInStage, priority, nextStep, due], idx) => {
    const id = `opp-${idx + 1}`;
    const companyId = `c-${ck}`;
    const remote = ok === 'remote';
    const officeId = remote ? null : `o-${ck}-${ok}`;

    // Walk the path Saved → … → current stage backwards in time, 4 days per step.
    const lastOpen: Stage = isClosed(stage) ? CLOSED_FROM[`${ck}/${ok}`] ?? 'Applied' : stage;
    const path: Stage[] = [...ACTIVE_STAGES.slice(0, ACTIVE_STAGES.indexOf(lastOpen as (typeof ACTIVE_STAGES)[number]) + 1)];
    if (isClosed(stage)) path.push(stage);
    let t = daysInStage;
    const times: number[] = [];
    for (let i = path.length - 1; i >= 0; i--) {
      times[i] = t;
      t += 4 + ((idx + i) % 3);
    }
    path.forEach((s, i) => {
      stage_history.push({
        id: `h-${id}-${i}`, opportunity_id: id, from_stage: i === 0 ? null : path[i - 1]!, to_stage: s,
        changed_at: at(times[i]!, 13), changed_by: 'me', note: '', ...stamp,
      });
    });
    const appliedIdx = path.indexOf('Applied');

    opportunities.push({
      id, company_id: companyId, office_id: officeId, remote, title, track, source,
      url: '', stage, stage_changed_at: at(daysInStage, 13),
      applied_at: appliedIdx >= 0 ? at(times[appliedIdx]!, 13) : null,
      priority, comp_notes: '', next_step: nextStep, next_step_due: due === null ? null : at(-due, 21),
      ...stamp,
    });

    // Nameless placeholder contacts, tied to what stage the opportunity reached.
    const reached = (s: Stage) => path.includes(s);
    if (source === 'referral') {
      const c = addContact({ role: 'Account Executive (GWU alum)', companyId, officeId, relationship: 'strong', howMet: 'GWU alumni network', lastTouchDaysAgo: times[0]! - 1 });
      link(c, id, 'referrer');
      interact(id, c, 'coffee_chat', times[0]! + 2, 'Coffee chat about the team, then they offered to submit a referral.');
    }
    if (reached('Recruiter Screen')) {
      const c = addContact({ role: track === 'internship' ? 'University Recruiter' : 'Recruiter', companyId, officeId, relationship: 'warm', howMet: 'Inbound after application', lastTouchDaysAgo: times[path.indexOf('Recruiter Screen')]! });
      link(c, id, 'recruiter');
      interact(id, c, 'email', times[path.indexOf('Recruiter Screen')]! + 1, 'Recruiter reached out to schedule a 30-minute screen.', true);
    }
    if (reached('Interviewing')) {
      const c = addContact({ role: 'Sales Development Manager', companyId, officeId, relationship: 'warm', howMet: 'Interview loop', lastTouchDaysAgo: times[path.indexOf('Interviewing')]! });
      link(c, id, 'hiring_manager');
      interact(id, c, 'call', times[path.indexOf('Interviewing')]!, 'First-round interview: discovery role-play and questions about quota attainment.');
    }
  });

  // Extra warm peers and cross-office referral paths (Phase 3 draws these as dashed arcs).
  const peer = (oppIdx: number, role: string, officeKey: string | null, rel: Relationship, howMet: string, daysAgo: number, linkRole: LinkRole, summary: string) => {
    const row = ROWS[oppIdx]!;
    const companyId = `c-${row[0]}`;
    const officeId = officeKey ? `o-${row[0]}-${officeKey}` : null;
    const c = addContact({ role, companyId, officeId, relationship: rel, howMet, lastTouchDaysAgo: daysAgo });
    link(c, `opp-${oppIdx + 1}`, linkRole);
    interact(`opp-${oppIdx + 1}`, c, 'linkedin_msg', daysAgo, summary, true);
  };
  peer(11, 'Account Executive (GWU alum)', 'nyc', 'strong', 'Met at a GWU alumni panel', 3, 'referrer', 'NYC contact offered an intro to the Austin BD team.');
  peer(5, 'Business Development Rep (GWU alum)', 'dc', 'warm', 'GWU sales club', 20, 'peer', 'Shared what the federal growth team looks for.');
  peer(2, 'Solutions Architect', 'arl', 'warm', 'Career fair', 9, 'referrer', 'Arlington contact can refer into the Seattle AM team.');
  peer(24, 'Customer Success Manager (GWU alum)', null, 'warm', 'Alumni database outreach', 4, 'peer', 'Explained how the remote growth team runs experiments.');
  peer(15, 'Account Executive', 'aus', 'strong', 'Referral from a classmate', 2, 'peer', 'Mock-interview practice before the next round.');
  peer(29, 'Enterprise Account Executive', 'nyc', 'champion', 'Former internship manager', 3, 'referrer', 'Championing the application internally.');
  peer(0, 'Corporate Sales Development Rep', 'aus', 'warm', 'LinkedIn outreach', 6, 'peer', 'Walked through a day in the life on the SDR team.');
  peer(13, 'Account Executive', 'nyc', 'cold', 'Cold LinkedIn message', 11, 'peer', 'Replied with tips for the recruiter screen.');
  peer(3, 'Deployment Strategist', 'dc', 'strong', 'GWU sales club mixer', 7, 'peer', 'Explained the government BD org.');
  peer(12, 'Policy Analyst', 'dc', 'warm', 'GWU policy speaker series', 8, 'peer', 'Suggested what to cover in the writing sample.');
  peer(30, 'Policy Fellow', 'dc', 'warm', 'GWU policy speaker series', 10, 'peer', 'Shared what the spring internship cohort works on.');

  return { companies, offices, opportunities, stage_history, contacts, contact_links, interactions, settings: DEFAULT_SETTINGS };
}
