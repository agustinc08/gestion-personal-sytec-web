import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './qa',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173/gestion-personal-sytec/',
    browserName: 'chromium',
    viewport: { width: 1366, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm exec vite --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173/gestion-personal-sytec/',
    reuseExistingServer: false,
    timeout: 30_000,
    env: { VITE_API_URL: 'http://127.0.0.1:49999/' },
  },
});
