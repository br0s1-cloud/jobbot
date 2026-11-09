# Decisions

One line per real choice: what · why · what we rejected.

## Confirmed by Luke (2026-11-08)
- App name is **jobbot** · Luke's call · rejected "Pipeline Atlas".
- Home base defaults to Washington, DC and lives in `settings/profile` (label, lat, lng), editable in the app · arcs need an origin that can change later · rejected hard-coding it.
- Daily LinkedIn agent runs at 7:40 AM ET · Luke's call.
- One board for internships and full-time roles, with a `track` filter · simpler to demo · rejected two boards.
- **Only GitHub, Luke's Google account, and LinkedIn-via-Chrome are allowed** · Luke can't use other accounts · rejected Supabase, Vercel, ntfy.sh.
- Live database is Cloud Firestore in a free Firebase (Spark) project on Luke's Google account · real database with Google sign-in, security rules, and live updates for map↔board sync · rejected Google Sheets + Apps Script (slow, no live updates).
- Public GitHub repo, hosted on GitHub Pages · free hosting, and recruiters can read the code · rejected a private repo (Pages would need GitHub Pro).
- Live starts blank; records are created in the app or imported from CSV/JSON, and imports land in the Inbox for approval (`source: import`) · reuses the approval flow and keeps bad imports out · rejected a direct-write importer.
- Scan notifications are an email to Luke from Apps Script · Gmail push already reaches his iPhone · rejected desktop-only notifications.

## Product calls (2026-11-08)
- Target roles are growth, SDR, BD and client-facing, in DC, Austin, NYC and Seattle, with a one-click market switcher (All plus the 4 markets, editable) · matches the real search · rejected the old enterprise-sales/cyber framing and the Bay Area.
- Contacts are never invented. Live contacts are logged by hand, imported, or approved from the Inbox. Demo contacts are nameless role placeholders ("Recruiter · CrowdStrike Austin") labeled as sample data · Luke's call · rejected fictional people and an anonymized copy of live data.
- Imports read Google Sheet CSV exports and Excel .xlsx; a column-mapping preset is saved after the first import, and rows go to the Inbox · that's where Luke's outreach files live · rejected Apollo, LinkedIn and Handshake parsers for now.
- On phones, jobbot opens to the board with a Map tab; desktop stays map-first · quick updates on the go · rejected map-first with a bottom sheet.
- Dark map and UI by default, with a light toggle · territory-tool feel, readable pins and arcs in a screen share · rejected light-only and following the system setting.
- Public repo: code, README, CLAUDE.md, DECISIONS.md and ROADMAP.md are public; the LinkedIn agent's instructions and risk notes live only in the gitignored `private/` folder · keeps the portfolio clean · rejected publishing everything and making the repo code-only.
- No Firestore scheduled backups (they need the paid Blaze plan). The app gets an "Export all (JSON)" button in Settings instead · free tier only · rejected upgrading.
- Firebase Analytics was turned on when the project was created, but the app never loads the Analytics SDK · no tracking of demo visitors · rejected adding analytics.

## Architecture v2 (follows from the above)
- Vite + React SPA instead of Next.js · GitHub Pages serves only static files, so Next's server features would go unused, and Vite ships a smaller bundle for the Lighthouse target · rejected Next.js static export.
- Demo is a static JSON bundle that never loads the Firebase SDK; edits live in memory and reset on reload · live data can't leak into a page that has no way to reach it, and no nightly reset job is needed · rejected demo rows in the shared database.
- Apps Script writes to Firestore through the REST API with Luke's own OAuth token · no public endpoint and no shared secret to leak · rejected an Apps Script web-app endpoint with a secret.
- The Chrome agent submits through the signed-in `/atlas/agent` page · the agent never holds a credential · rejected a secret in the agent's instruction file.
- Firestore rules tests run in GitHub Actions (Firebase emulator) · the emulator needs Java, which this Mac doesn't have · rejected installing a JDK locally.
- Map tiles from OpenFreeMap; logos stored in the repo with letter-monogram fallbacks · free, no key · rejected Mapbox (token) and the Clearbit logo API (shut down).
- d3-force (SVG) for the ego graph · ~20 nodes; keeps the bundle small · rejected react-force-graph.
- Interviewers stored as their own `interview_participants` records · keeps the contact links valid · rejected an array of contact IDs.
- Demo PII test: every demo email ends in `@example.com`, no demo name or email matches the gitignored `private/denylist.txt`, and the demo build contains no Firebase config · makes "no real data in demo" enforceable · rejected manual review.
- Firebase web config (apiKey, projectId) ships in the live bundle · it's a public identifier by design; access is enforced by security rules and authorized domains · rejected treating it as a secret.

## Phase 1 build (2026-11-08)
- Firebase web config is committed in `src/live/firebase.config.ts` · it's a public identifier that ships in the live JavaScript anyway, and data is protected by Firestore rules plus Auth's authorized domains · Luke's call; rejected a GitHub Actions variable (Claude can't enter API keys into forms) and the earlier "keep it out of the repo" plan.
- Live data lives at `users/{uid}/<collection>/<id>`; rules allow only uids in an owner list (currently a placeholder, so everything is denied until Luke's first sign-in) · one simple ownership check, and strangers who sign in get nothing · rejected per-collection rules.
- Map pins use MapLibre's own GeoJSON circle layers with metro clustering (bubble = open roles, color = furthest stage); deck.gl is deferred to Phase 3 for arcs · native layers are smaller and handle 300 pins easily · rejected loading deck.gl for pins alone.
- The demo dataset is generated at page load relative to today · days-in-stage, due dates and staleness always look current · rejected a static JSON snapshot that would age.
- The validation library (zod) is kept out of the demo bundle, and the map is lazy-loaded (on phones only when the Map tab opens) · demo entry is ~111 KB gzipped · rejected one big bundle.
- MapLibre 6's worker is loaded through Vite's `?worker&url` import · MapLibre can't locate its own worker once bundled · rejected copying a 520 KB file into `public/`.
- Geocoding results are cached in the browser (localStorage), and lat/lng is stored on each office, so nothing geocodes at render time · rejected a Firestore `geocode_cache` collection (more rules and writes for no real benefit at this volume).
- Staleness colors (amber >7d, red >14d) shipped in Phase 1 rather than Phase 4 · days-in-stage was already on every card, so it was nearly free.
- Demo interviews and Inbox items arrive with their phases (4 and 2) · no UI for them yet.
- Firestore offline cache is on · the phone PWA opens instantly and survives bad signal.
- Stage-change notes are stored on the `stage_history` entry (`note`) · the inline "log a note?" belongs to that specific move.
