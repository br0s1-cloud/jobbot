# Build Prompt — "jobbot": Map-First Job Search CRM

> Project spec for jobbot. Every session starts by reading this, `ROADMAP.md`, and `DECISIONS.md`.

---

> **Public repo.** Nothing under `private/` is committed. The LinkedIn agent's instructions and risk notes live there only.

## 0. Your role

You're my senior full-stack engineer and product partner for the life of this project. I'm Luke Brosi, a GWU business student (Class of 2027) recruiting for growth, SDR, business development, and client-facing roles in the DC, Austin, NYC, and Seattle markets (plus Spring 2027 DC tech-policy internships). I'll be showing this app to recruiters as a portfolio piece, so it has to work every day and look sharp in a 3-minute screen share.

How we work:
- Build in the phases in §9. Don't start a phase until the one before it meets its acceptance criteria and I've signed off.
- At the start of every session, read `ROADMAP.md` and `DECISIONS.md`. Update both before the session ends. `DECISIONS.md` gets one line per real choice (what, why, what we rejected).
- When a requirement is vague or two of them conflict, ask me one specific question. Don't guess on anything that touches my data, my Gmail, or my LinkedIn account.
- Push back when I ask for something that hurts the product. Tell me the tradeoff in two sentences, then do what I decide.
- Explain anything new in one plain sentence the first time it comes up. I can read code, but I'm not a full-time engineer.

## 1. What we're building

A job search CRM where the main screen is a **live map**. Every company, office, role, and contact I'm working sits on it. My relationships are drawn as a network on top of the map, and my application pipeline is pinned down the right side. Gmail feeds it automatically. LinkedIn feeds it through Gmail notifications plus a daily browser agent. Nothing the automation finds goes in until I approve it.

The pitch I'll give recruiters: *"I run my job search the way an AE runs a territory. Here's my territory."*

## 2. Hard constraints (don't design around these, design for them)

1. **LinkedIn has no API we can use.** Its messaging, jobs, and profile APIs are partner-only. We won't scrape it from a server and we won't use unofficial third-party LinkedIn APIs. LinkedIn data comes in two ways: (a) LinkedIn's notification emails, which land in Gmail; (b) a once-a-day, read-only check in my own browser (§7).
2. **Gmail sync must not die every 7 days.** A Google Cloud OAuth app in "Testing" mode with Gmail scopes hands out refresh tokens that expire after 7 days, and publishing it means a restricted-scope verification we're not doing. So Gmail ingestion runs as a **Google Apps Script** bound to my own account (I already run one of these for my budget app). It reads mail and writes parsed proposals into Firestore. The web app itself only uses Google sign-in with basic profile scopes.
3. **No full email bodies stored.** Store sender, subject, date, a ≤300-character snippet, the parsed fields, and a deep link back to the Gmail thread. My inbox stays in Gmail.
4. **Two datasets.** `live` (mine, private, behind login; contacts are only ever real and logged, never invented) and `demo` (real companies and role types, public URL, static, edits reset on reload). Demo contacts are **role placeholders with no names**, e.g. "Recruiter · CrowdStrike Austin", and are labeled as sample data. Recruiters only ever see `demo`. No real names, emails, or notes can reach the demo path. Add a test that fails if they do.
5. **Free tier everywhere.** If something will cost money, flag it before you add it.

## 3. Stack (v2, 2026-11-08: only GitHub + Google + LinkedIn-via-Chrome)

Allowed services: **GitHub** (code, Pages hosting, Actions CI), **my Google account** (Firebase, Apps Script, Gmail), and **LinkedIn only through Claude in Chrome**. Nothing else needs an account.

- **Frontend:** Vite + React + TypeScript (strict) + Tailwind, built to static files and deployed to **GitHub Pages** by a GitHub Actions workflow. Public repo.
- **Demo (`/`):** fully static. Demo data is a JSON file bundled with the page; the demo bundle never loads the Firebase SDK and has no live config, so live data can't reach it. Edits (drags, approvals) stay in browser memory, and reloading resets them.
- **Live (`/atlas`):** Firebase Auth (Google sign-in) + **Cloud Firestore** on the free Spark plan. Security rules allow only my uid. Live starts blank; records are created in the app or imported from Google Sheet CSV or Excel files (→ Inbox for approval).
- **Map:** MapLibre GL JS + OpenFreeMap tiles (no key). deck.gl for clustered pins and arcs.
- **Network graph:** deck.gl `ArcLayer` on the map; d3-force (SVG) for the company ego graph.
- **Board:** dnd-kit.
- **Gmail ingestion:** Google Apps Script under my account writes proposals straight into Firestore `ingestion_queue` through the Firestore REST API, using my own OAuth token. No shared secret and no web endpoint.
- **Browser-check intake:** `/atlas/agent`, a signed-in page that accepts proposals. No secret is needed.
- **Notifications:** Apps Script emails me a one-line summary after the daily scan.
- **Geocoding:** Nominatim, called once when an office is added; results cached in Firestore and lat/lng stored on the office.
- **Home base:** the `settings/profile` doc (label, lat, lng), defaulting to Washington, DC and editable in the app.
- **Tests:** Vitest for app logic. Firestore rules tests run against the Firebase emulator in GitHub Actions, because the emulator needs Java, which isn't on my Mac.

## 4. Data model (Firestore)

Live data lives in Firestore collections with these names and fields. Every doc has `id`, `created_at`, `updated_at`. Security rules: read/write only for my uid. Demo data uses the same shapes in a bundled JSON file (no `dataset` column needed). Add a `settings` collection (home base, preferences).

- `companies` — name, domain, logo_url, industry, tier (1–3), notes
- `offices` — company_id, label, city, region, country, lat, lng, is_hq
- `opportunities` — company_id, office_id (nullable; `remote` flag), title, track (`full_time` | `internship`), source (`linkedin` | `referral` | `company_site` | `handshake` | `other`), url, stage, stage_changed_at, applied_at, priority (1–3), comp_notes, next_step, next_step_due
- `stage_history` — opportunity_id, from_stage, to_stage, changed_at, changed_by (`me` | `gmail` | `chrome_agent`)
- `contacts` — full_name, title, company_id, office_id, linkedin_url, email, how_met, relationship (`cold` | `warm` | `strong` | `champion`), last_touch_at
- `contact_links` — contact_id, opportunity_id, role (`referrer` | `recruiter` | `hiring_manager` | `interviewer` | `peer`)
- `interactions` — contact_id (nullable), opportunity_id (nullable), type (`email` | `linkedin_msg` | `inmail` | `call` | `coffee_chat` | `event`), occurred_at, summary, source_ref (Gmail thread URL or LinkedIn URL)
- `interviews` — opportunity_id, round_name, scheduled_at, format, interviewer contact_ids, prep_notes (markdown), debrief_notes (markdown), questions_asked (text[]), self_rating (1–5), thank_you_sent_at
- `tasks` — opportunity_id/contact_id, title, due_at, done_at, auto_generated bool
- `ingestion_queue` — source (`gmail` | `chrome_agent` | `import`), raw_ref, detected_type, proposed_change jsonb (a diff against current records), confidence (0–1), status (`pending` | `approved` | `edited` | `rejected`), reviewed_at
- `geocode_cache` — query, lat, lng

**Pipeline stages:** `Saved → Applied → Recruiter Screen → Interviewing → Final Round → Offer`, plus terminal `Rejected`, `Withdrawn`, `Ghosted` (auto-suggested after 21 days with no inbound contact; I confirm).

## 5. The interface

Desktop first (that's where I'll demo it), and usable on my iPhone as a home-screen PWA. **On phones it opens board-first** (pipeline list, quick stage changes) **with a Map tab**. **Dark map and UI by default**, with a light toggle.

### 5.1 Layout
```
┌───────────────────────────────────────────────┬──────────────┐
│ Top bar: search ⌘K · filters · Inbox (n) · ⚙ │              │
├───────────────────────────────────────────────┤  PIPELINE    │
│                                               │  (pinned,    │
│                MAP (≈72% width)               │  collapsible)│
│   pins = offices, sized by # opportunities,   │              │
│   colored by furthest stage reached           │  stage       │
│   arcs = relationships (toggle)               │  columns,    │
│                                               │  vertical,   │
│  [Remote tray]          [Legend] [Layers]     │  compact     │
├───────────────────────────────────────────────┤  cards       │
│ Detail drawer slides up from bottom on select │              │
└───────────────────────────────────────────────┴──────────────┘
```

### 5.2 Map + network, working as one view
- **Pins:** one per office. Size = open opportunities there. Color = most advanced stage at that office. Hover shows company, role count, and the next step.
- **Arcs (Network layer on):** from my home base (Washington, DC by default; stored as a setting so it can be changed later) out to every office where I have a contact. Thickness = relationship strength. Color = warm/cold. A dashed arc means a contact I know at another office who can refer me in, e.g. a Google contact in NYC linked to a Google role in Austin.
- **Focus mode:** click a company and the map flies to it while the other pins dim. A floating panel opens with that company's ego network (me → contacts → opportunities → interviewers) as a small force graph. Clicking a node opens its record in the drawer.
- **Market switcher** (All · DC · Austin · NYC · Seattle) in the top bar: one click flies the map to that market and filters the board; synced to the URL. Markets are editable in settings.
- **Filters,** synced to the URL so a filtered view can be shared: track, stage, tier, city, "has warm contact," "next step overdue."
- **Remote tray:** remote roles sit in a strip at the bottom-left instead of a fake location on the map.
- **Board ↔ map sync:** hover a board card and its pin pulses. Filter the map and the board filters with it.

### 5.3 Pipeline board (right rail)
- Vertical stage sections with compact cards (logo, title, city, days in stage, next-step chip).
- Drag a card to change its stage. That writes `stage_history` and asks "log a note?" inline, without opening a modal.
- Cards go amber after 7 days in the same stage with no logged interaction, red after 14.
- Collapses to a thin stage-count bar so the map can go full width for demos.

### 5.4 Detail drawer
Tabs: **Overview** (stage, next step, links, contacts) · **Timeline** (all interactions and stage changes, newest first, each with a link back to its source) · **Interviews** (one card per round: prep notes, debrief, questions asked, rating, and a "thank-you sent?" toggle that creates a 24-hour task when an interview ends) · **Notes** (markdown).

### 5.5 Inbox (approval queue)
- Every automated finding shows as a card: source icon, what was detected ("Application confirmation: CrowdStrike, Corporate Sales Development Rep"), the proposed change as a readable diff, a confidence score, and a source link.
- Actions: **Approve**, **Edit then approve**, **Reject**, plus **Approve all ≥0.9 confidence**.
- Keyboard: `j/k` to move, `a` approve, `e` edit, `r` reject.
- Nothing from automation touches the core tables until it's approved. No exceptions.

### 5.6 Dashboard strip (collapsible, above the map)
Four numbers: active opportunities, applications this week, response rate (applied → any reply), median days from Applied to Screen. Plus a sparkline of weekly applications. Use real data only, and show an empty state instead of zeros pretending to be a trend.

### 5.7 Design direction
- It should feel like a sales territory tool (dark-map option, dense but calm), not a student to-do app.
- One accent color for "action needed." Stage colors are a sequential ramp, not a rainbow.
- Inter or Geist for type. Tabular numbers in the stats.
- Motion only where it carries meaning: map fly-to, pin pulse, card drop.
- Every view needs a designed empty state, loading state, and error state.

## 6. Gmail ingestion (Apps Script)

- Runs on a time-driven trigger every 15 minutes. Searches only `newer_than:2d` plus a label filter, and marks processed message IDs in Script Properties so nothing gets ingested twice.
- Applies a Gmail label `CRM/ingested` to processed threads.
- **Parsers** are modular, one function per pattern, each returning `{detected_type, fields, confidence}`:
  - LinkedIn: application sent, application viewed, "your application was not selected," InMail received, message received, job alert digest (→ `Saved` suggestions, low priority), connection accepted.
  - ATS senders: Greenhouse, Lever, Workday, Ashby, iCIMS, SmartRecruiters. Application received, interview scheduling, rejection, offer.
  - Calendar invites with "interview," "screen," "chat," or "conversation" in the title → `interviews` proposal.
  - Replies from any `contacts.email` → `interactions` proposal plus a `last_touch_at` bump.
- Fuzzy-match company names to existing `companies` by domain first, then normalized name. Low-confidence matches go to the Inbox flagged "new company?"
- Writes proposals to Firestore `ingestion_queue` via the REST API with `ScriptApp.getOAuthToken()`. On failure it retries with backoff, then logs to a `Failures` sheet.
- Ship a `parsers.test.gs` that runs every parser against a folder of redacted sample emails (§9, Phase 2).

## 7. Daily browser check (LinkedIn)

A once-a-day, read-only check in my own Chrome feeds proposals into the Inbox through the signed-in `/atlas/agent` page. **The full instructions and risk notes are in `private/agent/linkedin-agent-spec.md` (gitignored, never committed).** Read that file before any Phase 5 work.

## 8. Quality bar

- TypeScript strict. Zod validation on every ingestion and import payload.
- Rules tested: a signed-out or non-owner client gets zero live docs; the demo bundle contains no Firebase config.
- Demo data generator: about 25 real companies hiring growth/SDR/BD/client-facing roles across DC, Austin, NYC, and Seattle; ~40 nameless role-placeholder contacts; ~30 opportunities spread across every stage; ~8 interviews with realistic notes; ~12 pending Inbox items so the approval flow demos well.
- Import: Google Sheet (CSV export) or Excel (.xlsx) outreach files at any time. Map the columns once and save the mapping as a preset; imported rows land in the Inbox for approval.
- Lighthouse ≥90 on performance and accessibility for the demo route. Map interaction stays smooth with 300 pins.
- No secrets in the repo. `.env.example` lists every variable.
- `README.md` written for a recruiter (what it is, a GIF, the live demo link, the architecture diagram, what I'd build next), with a separate `SETUP.md` for me.

## 9. Build phases (each ends with a demo to me)

**Phase 1: Skeleton + demo data.** Firestore data types + security rules, demo JSON generator, Vite shell, map with pins, pipeline rail with drag-to-change-stage, detail drawer (Overview + Timeline), Google sign-in, create/edit forms for companies, offices, opportunities and contacts (live starts blank), settings (home base). Deployed to GitHub Pages.
✅ *Done when:* I can open the public demo URL on my phone and laptop, drag a card, and watch the pin color change.

**Phase 2: Gmail ingestion + Inbox.** Apps Script, parsers, Firestore writes, approval queue UI, Google Sheet CSV and Excel import into the Inbox, keyboard shortcuts. I'll give you 15–20 redacted sample emails to test against.
✅ *Done when:* every sample email produces the right proposal, and approving one updates the map and board.

**Phase 3: Network layer + focus mode.** Arcs, relationship strength, dashed referral paths, company ego graph.
✅ *Done when:* I can click "Google" and see in one glance who can refer me into which role.

**Phase 4: Interviews + tasks.** Interview cards, prep/debrief templates, thank-you reminder, staleness colors, Ghosted suggestions.
✅ *Done when:* logging a full interview round takes under 60 seconds.

**Phase 5: Browser-check support.** Private instruction file, the `/atlas/agent` intake page, the email-notification hook, a dry-run mode that logs proposals without queuing them.
✅ *Done when:* a manual run of the agent fills the Inbox correctly and touches nothing on LinkedIn.

**Phase 6: Portfolio polish.** Dashboard strip, empty and error states, dark map, a "Demo tour" button that runs a 60-second guided walkthrough, recruiter README with GIF.
✅ *Done when:* someone who's never seen it understands what it does in 30 seconds without me talking.

## 10. Before you write any code

Reply with:
1. Any part of this spec you'd change, and why (keep it short).
2. The exact accounts and keys I need to create (GitHub, Firebase, Google Apps Script), in order, with one line each.
3. The Phase 1 file tree.

Then wait for my go.

---
**Confirmed (2026-11-08):** home base = Washington, DC (user-adjustable setting) · daily agent run = 7:40 AM ET · internships and full-time share one board with a track filter · app name = **jobbot**.

Where this spec and `DECISIONS.md` disagree, `DECISIONS.md` wins.
