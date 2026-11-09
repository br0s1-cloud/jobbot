# Setup (for Luke)

Everything runs on GitHub and your Google account (lukebrosil@gmail.com). Nothing here costs money.

## What already exists
| Piece | Where |
|---|---|
| Code | github.com/br0s1-cloud/jobbot (public), pushed over SSH with `~/.ssh/id_ed25519_github` |
| Hosting | GitHub Pages, deployed by GitHub Actions → `https://br0s1-cloud.github.io/jobbot/` |
| Database + sign-in | Firebase project `jobbot-dadb8` (Spark plan): Firestore `(default)` in nam5, Google sign-in |
| Firebase web config | `.env.local` (gitignored). These values are public identifiers, not secrets; Firestore rules decide who can read what. |
| Private notes | `private/` (gitignored, only on this Mac). Back it up yourself. |

## Run it locally
```bash
npm install
```
```bash
npm run dev
```

## Rebuild on a new machine
1. Clone the repo and copy `.env.example` to `.env.local`. Fill it in from Firebase console → Project settings → Your apps → jobbot-web.
2. Make a new SSH key and add its public half at github.com/settings/keys.
3. Restore `private/` from your backup.

## Coming in later phases
- **Phase 2:** Gmail Apps Script (script.google.com, under your account). It writes to Firestore as you, so there's no secret to manage.
- **Phase 5:** the daily browser check. The instructions are in `private/agent/`.
