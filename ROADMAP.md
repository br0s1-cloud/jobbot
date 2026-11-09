# Roadmap

Status: **Setup done, Phase 1 ready to start** (2026-11-08)

## Done
- Spec (`CLAUDE.md`) on stack v2: GitHub + Google only. Product calls are recorded in `DECISIONS.md`.
- GitHub: public repo `br0s1-cloud/jobbot`, SSH push works from this Mac, Pages source is set to GitHub Actions.
- Firebase project `jobbot-dadb8` (Spark plan): web app `jobbot-web` registered, Google sign-in enabled, `br0s1-cloud.github.io` authorized, Firestore `(default)` created in nam5 (production mode: denies everything until our rules deploy).
- Local `.env.local` holds the Firebase web config (gitignored).
- LinkedIn agent spec and risk notes moved to `private/` (gitignored).

## Next: Phase 1
- [ ] Vite + React + TS + Tailwind scaffold; GitHub Actions workflow builds and deploys to Pages, and runs the Firestore rules tests on the emulator.
- [ ] Data types (Zod) for every collection; Firestore security rules locked to Luke's uid.
- [ ] Demo data generator (real companies, nameless role-placeholder contacts, DC/Austin/NYC/Seattle).
- [ ] Map (MapLibre + OpenFreeMap dark style) with office pins and market switcher.
- [ ] Pipeline rail with drag-to-change-stage plus inline "log a note?"; phone layout opens to the board with a Map tab.
- [ ] Detail drawer (Overview + Timeline).
- [ ] Live: Google sign-in, create/edit forms, home-base and markets settings, Export all (JSON).
- [ ] Tests: demo-PII test, rules test, stage logic.

## Luke to-dos
- After the first sign-in to the live app: give Claude your Firebase uid so the security rules can lock to it.
- Back up `private/` somewhere other than this repo (it isn't on GitHub).

## Phases
1. Skeleton + demo data
2. Gmail ingestion + Inbox + Sheet/Excel import
3. Network layer + focus mode
4. Interviews + tasks
5. Browser-check support (`/atlas/agent`)
6. Portfolio polish
