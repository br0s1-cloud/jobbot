# Roadmap

Status: **Phase 1 built and pushed; waiting on Luke's sign-off** (2026-11-08)

## Phase 1: done
- Vite + React + TS + Tailwind; GitHub Actions runs typecheck, unit tests, build (+ demo-bundle leak check), and Firestore rules tests on the emulator, then deploys to Pages.
- Demo dataset (generated at load): 26 real companies, 40 offices, 32 roles across every stage, nameless role-placeholder contacts, interactions, and stage history.
- Map: MapLibre + OpenFreeMap (dark by default, light toggle), metro clustering when zoomed out, pins sized by open roles and colored by furthest stage, hover popups, click a pin to filter the board to that office, hover a card to pulse its pin.
- Market switcher (All · DC · Austin · NYC · Seattle) and track filter, synced to the URL.
- Pipeline rail: drag between stages (desktop and touch), inline "log a note?", amber/red staleness, collapse to a stage-count bar, Closed drop zones.
- Detail drawer: Overview (stage, next step + due date, contacts) and Timeline.
- Phone: opens to the board with a Map tab; the map only downloads when that tab opens.
- Live `/atlas`: Google sign-in, an access-denied screen that shows your uid, Firestore sync with offline cache, add/edit company (with office lookup), role and contact, settings (home base, markets, theme, JSON export), designed empty state.
- Tests: 15 unit tests (demo privacy, pins, markets, staleness, stage transitions) plus a rules suite.

## Done since
- Owner uid is in `firestore.rules`, and the rules are published in the Firebase console (2026-11-08). The live app loads for Luke; CI rules tests pass against the real uid.

## Waiting on Luke
- [ ] Open the demo (https://br0s1-cloud.github.io/jobbot/) on your phone and laptop, drag a card, and watch the pin change. That's the Phase 1 sign-off.
- [ ] Back up `private/` (it isn't on GitHub).

## Known gaps / notes
- Lighthouse not yet measured on the deployed demo (target ≥90). The map chunk is ~293 KB gzipped and lazy-loaded.
- Home-screen icon is SVG only; iOS wants a PNG apple-touch-icon (Phase 6 polish).
- Company logos are monograms for now (Phase 6).

## Next: Phase 2 (after sign-off)
Gmail Apps Script + parsers → Firestore `ingestion_queue`; Inbox approval UI with j/k/a/e/r; Google Sheet CSV / Excel import into the Inbox with saved column mappings; demo Inbox items.

## Phases
1. Skeleton + demo data ✅ (awaiting sign-off)
2. Gmail ingestion + Inbox + Sheet/Excel import
3. Network layer + focus mode
4. Interviews + tasks
5. Browser-check support (`/atlas/agent`)
6. Portfolio polish
