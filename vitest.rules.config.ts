import { defineConfig } from 'vitest/config';

// Runs only inside `firebase emulators:exec` (GitHub Actions; needs Java).
export default defineConfig({
  test: { include: ['tests/rules.test.ts'], testTimeout: 20000 },
});
