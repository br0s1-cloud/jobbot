import { z } from 'zod';
import { STAGES } from './stages';

// One schema per Firestore collection (and the bundled demo data, which uses the same shapes).
// Timestamps are ISO-8601 strings so demo and live data look identical.

export { STAGES };
export const Stage = z.enum(STAGES);
export type Stage = z.infer<typeof Stage>;

const iso = z.string().min(10);
const base = { id: z.string().min(1), created_at: iso, updated_at: iso };

export const Company = z.object({
  ...base,
  name: z.string().min(1),
  domain: z.string().default(''),
  logo_url: z.string().default(''),
  industry: z.string().default(''),
  tier: z.number().int().min(1).max(3).default(2),
  notes: z.string().default(''),
});
export type Company = z.infer<typeof Company>;

export const Office = z.object({
  ...base,
  company_id: z.string(),
  label: z.string().min(1),
  city: z.string().default(''),
  region: z.string().default(''),
  country: z.string().default('US'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  is_hq: z.boolean().default(false),
});
export type Office = z.infer<typeof Office>;

export const Track = z.enum(['full_time', 'internship']);
export type Track = z.infer<typeof Track>;
export const Source = z.enum(['linkedin', 'referral', 'company_site', 'handshake', 'other']);
export type Source = z.infer<typeof Source>;

export const Opportunity = z.object({
  ...base,
  company_id: z.string(),
  office_id: z.string().nullable().default(null),
  remote: z.boolean().default(false),
  title: z.string().min(1),
  track: Track.default('full_time'),
  source: Source.default('other'),
  url: z.string().default(''),
  stage: Stage.default('Saved'),
  stage_changed_at: iso,
  applied_at: iso.nullable().default(null),
  priority: z.number().int().min(1).max(3).default(2),
  comp_notes: z.string().default(''),
  next_step: z.string().default(''),
  next_step_due: iso.nullable().default(null),
});
export type Opportunity = z.infer<typeof Opportunity>;

export const ChangedBy = z.enum(['me', 'gmail', 'chrome_agent', 'import']);
export const StageChange = z.object({
  ...base,
  opportunity_id: z.string(),
  from_stage: Stage.nullable(),
  to_stage: Stage,
  changed_at: iso,
  changed_by: ChangedBy.default('me'),
  note: z.string().default(''),
});
export type StageChange = z.infer<typeof StageChange>;

export const Relationship = z.enum(['cold', 'warm', 'strong', 'champion']);
export type Relationship = z.infer<typeof Relationship>;

export const Contact = z.object({
  ...base,
  full_name: z.string().min(1),
  title: z.string().default(''),
  company_id: z.string().nullable().default(null),
  office_id: z.string().nullable().default(null),
  linkedin_url: z.string().default(''),
  email: z.string().default(''),
  how_met: z.string().default(''),
  relationship: Relationship.default('cold'),
  last_touch_at: iso.nullable().default(null),
  /** Demo-only: a nameless stand-in ("Recruiter · CrowdStrike Austin"), never a real or invented person. */
  placeholder: z.boolean().default(false),
});
export type Contact = z.infer<typeof Contact>;

export const LinkRole = z.enum(['referrer', 'recruiter', 'hiring_manager', 'interviewer', 'peer']);
export type LinkRole = z.infer<typeof LinkRole>;
export const ContactLink = z.object({
  ...base,
  contact_id: z.string(),
  opportunity_id: z.string(),
  role: LinkRole,
});
export type ContactLink = z.infer<typeof ContactLink>;

export const InteractionType = z.enum(['email', 'linkedin_msg', 'inmail', 'call', 'coffee_chat', 'event', 'note']);
export type InteractionType = z.infer<typeof InteractionType>;
export const Interaction = z.object({
  ...base,
  contact_id: z.string().nullable().default(null),
  opportunity_id: z.string().nullable().default(null),
  type: InteractionType,
  occurred_at: iso,
  summary: z.string().default(''),
  source_ref: z.string().default(''),
  inbound: z.boolean().default(false),
});
export type Interaction = z.infer<typeof Interaction>;

export const Market = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  lng: z.number(),
  lat: z.number(),
  zoom: z.number().default(9.5),
  radius_km: z.number().positive().default(40),
});
export type Market = z.infer<typeof Market>;

export const Settings = z.object({
  home_base: z.object({ label: z.string(), lat: z.number(), lng: z.number() }),
  markets: z.array(Market),
  updated_at: iso.optional(),
});
export type Settings = z.infer<typeof Settings>;

export const COLLECTIONS = {
  companies: Company,
  offices: Office,
  opportunities: Opportunity,
  stage_history: StageChange,
  contacts: Contact,
  contact_links: ContactLink,
  interactions: Interaction,
} as const;
export type CollectionName = keyof typeof COLLECTIONS;
export type DocOf<C extends CollectionName> = z.infer<(typeof COLLECTIONS)[C]>;

export type Dataset = { [C in CollectionName]: DocOf<C>[] } & { settings: Settings };
