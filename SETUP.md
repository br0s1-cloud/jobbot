# Setup (for Luke)

Everything runs on GitHub and your Google account. Nothing here costs money.

## What already exists
| Piece | Where |
|---|---|
| Code | github.com/br0s1-cloud/jobbot (public), pushed over SSH with `~/.ssh/id_ed25519_github` |
| Hosting | GitHub Pages, deployed by GitHub Actions → `https://br0s1-cloud.github.io/jobbot/` |
| Database + sign-in | Firebase project `jobbot-dadb8` (Spark plan): Firestore `(default)` in nam5, Google sign-in |
| Firebase web config | `src/live/firebase.config.ts` (committed; public identifiers, not secrets. Firestore rules decide who can read what) |
| Private notes | `private/` (gitignored, only on this Mac). Back it up yourself. |

## Run it locally
Your global npm cache has root-owned files (from an old `sudo npm`), so use a separate cache for this project:
```bash
export NPM_CONFIG_CACHE=$HOME/.npm-cache-jobbot
```
```bash
npm install
```
```bash
npm run dev
```
Open http://localhost:5173/jobbot/ (demo) or http://localhost:5173/jobbot/atlas (live).

To fix the global cache for good, run this once in your own terminal (it asks for your password):
```bash
sudo chown -R $(id -u):$(id -g) ~/.npm
```

## Rebuild on a new machine
1. Clone the repo and run `npm install`.
2. Make a new SSH key and add its public half at github.com/settings/keys.
3. Restore `private/` from your backup.

## Coming in later phases
- **Phase 2:** Gmail Apps Script (script.google.com, under your account). It writes to Firestore as you, so there's no secret to manage.
- **Phase 5:** the daily browser check. The instructions are in `private/agent/`.

## Deploys
Every push to `main` runs GitHub Actions: typecheck, tests, build (with the demo-bundle leak check), and Firestore rules tests on the emulator. If all pass, it deploys to Pages.

## Firestore rules
`firestore.rules` is the source of truth. Until the owner uid is filled in, every client request is denied. Rules are published by pasting the file into Firebase console → Firestore → Rules.
