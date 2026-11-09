import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';

// Runs against the Firestore emulator (GitHub Actions). The owner uid is read from the rules file itself.
const rules = readFileSync('firestore.rules', 'utf8');
const OWNER = rules.match(/uid in \['([^']+)'/)?.[1];
if (!OWNER) throw new Error('could not find owner uid list in firestore.rules');

let env: RulesTestEnvironment;
beforeAll(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-jobbot', firestore: { rules } });
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users', OWNER, 'companies', 'c1'), { name: 'Secret Co' });
  });
});
afterAll(() => env?.cleanup());

describe('firestore rules', () => {
  it('owner can read and write their own data', async () => {
    const db = env.authenticatedContext(OWNER).firestore();
    await assertSucceeds(getDoc(doc(db, 'users', OWNER, 'companies', 'c1')));
    await assertSucceeds(setDoc(doc(db, 'users', OWNER, 'opportunities', 'o1'), { title: 'SDR' }));
  });

  it('signed-out clients get nothing', async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'users', OWNER, 'companies', 'c1')));
    await assertFails(getDocs(collection(db, 'users', OWNER, 'companies')));
    await assertFails(setDoc(doc(db, 'users', OWNER, 'companies', 'c2'), { name: 'x' }));
  });

  it('another signed-in Google account gets nothing, even in its own space', async () => {
    const db = env.authenticatedContext('someone-else').firestore();
    await assertFails(getDoc(doc(db, 'users', OWNER, 'companies', 'c1')));
    await assertFails(setDoc(doc(db, 'users', 'someone-else', 'companies', 'c1'), { name: 'freeloader' }));
  });

  it('nothing outside users/{uid} is readable', async () => {
    const db = env.authenticatedContext(OWNER).firestore();
    await assertFails(getDoc(doc(db, 'public', 'anything')));
  });
});
