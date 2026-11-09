/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Served from https://br0s1-cloud.github.io/jobbot/
export default defineConfig({
  base: '/jobbot/',
  plugins: [react(), tailwindcss()],
  build: { chunkSizeWarningLimit: 1200 },
  // Pre-bundle the lazily loaded libraries up front so the dev server doesn't re-optimize mid-session.
  optimizeDeps: { include: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'zod', 'maplibre-gl'] },
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/rules.test.ts'],
  },
});
