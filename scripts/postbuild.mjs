// 1) GitHub Pages SPA fallback: serve index.html for deep links like /jobbot/atlas.
// 2) Guard: the demo entry bundle must never contain Firebase code or config.
import { readFileSync, copyFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';
copyFileSync(join(dist, 'index.html'), join(dist, '404.html'));

const html = readFileSync(join(dist, 'index.html'), 'utf8');
const entry = html.match(/src="\/jobbot\/(assets\/[^"]+\.js)"/)?.[1];
if (!entry) throw new Error('postbuild: entry script not found in index.html');

// Entry chunk plus everything it statically imports (modulepreload links).
const preloads = [...html.matchAll(/href="\/jobbot\/(assets\/[^"]+\.js)"/g)].map((m) => m[1]);
const demoFiles = [entry, ...preloads];
const banned = [/firebase/i, /firestore/i, /AIza[0-9A-Za-z_-]{20,}/, /jobbot-dadb8/];
for (const f of demoFiles) {
  const src = readFileSync(join(dist, f), 'utf8');
  for (const re of banned) {
    if (re.test(src)) throw new Error(`postbuild: demo bundle ${f} matches ${re} — live code leaked into the demo path`);
  }
}
const all = readdirSync(join(dist, 'assets')).filter((f) => f.endsWith('.js'));
console.log(`postbuild: 404.html written; demo bundle clean (${demoFiles.length} files checked, ${all.length} chunks total)`);
