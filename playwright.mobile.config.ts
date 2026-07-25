import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '_mobile_smoke.spec.ts',
  timeout: 15000,
  use: {
    baseURL: 'http://localhost:9192',
  },
  projects: [
    { name: 'chromium-mobile', use: { ...devices['Pixel 7'] } },
  ],
});
