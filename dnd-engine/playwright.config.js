import { defineConfig } from '@playwright/test';

export default defineConfig({
  testMatch: '**/*.spec.js',
  testIgnore: ['**/node_modules/**', '**/dist/**'],
  timeout: 60_000,
  retries: 0,
  workers: 1, // specs share localStorage/BroadcastChannel state — keep them serial
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: 'PORT=3737 node server/index.js',
      url: 'http://localhost:3737',
      reuseExistingServer: true,
      timeout: 30_000,
    }
  ],
});
