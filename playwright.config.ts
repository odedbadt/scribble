import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    timeout: 15000,
    use: {
        baseURL: 'http://localhost:9191',
        viewport: { width: 1280, height: 720 },
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: 'python3 -m http.server 9191',
        url: 'http://localhost:9191',
        reuseExistingServer: true,
    },
});
