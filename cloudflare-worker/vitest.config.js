/**
 * Vitest Configuration for Cloudflare Worker Testing
 *
 * Uses @cloudflare/vitest-pool-workers to simulate Workers runtime environment.
 * This allows testing Worker-specific APIs and behavior locally.
 */

import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    // Use Cloudflare Workers pool for realistic runtime simulation
    poolOptions: {
      workers: {
        // Simulate Workers environment variables
        wrangler: {
          configPath: './wrangler.toml',
        },
        miniflare: {
          // Mock secrets for testing (NOT real values)
          bindings: {
            WEBHOOK_SECRET: 'test-webhook-secret-for-testing',
            GITHUB_APP_ID: '2255796',
            GITHUB_APP_PRIVATE_KEY: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7w+JDTesting
KeyForLocalTestingOnlyThisIsNotARealPrivateKeyDoNotUseInProd
-----END PRIVATE KEY-----`,
            ANTHROPIC_API_KEY: 'test-anthropic-api-key',
          },
        },
      },
    },

    // Test file patterns
    include: ['test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.wrangler'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['lib/**/*.js', 'index.js'],
      exclude: [
        'test/**',
        '**/*.test.js',
        '**/*.spec.js',
        'test-pr.js',
        'test-webhook.{sh,ps1}',
      ],
      // Target 80%+ coverage
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },

    // Test environment
    globals: true, // Enable global test functions (describe, it, expect)
    // Note: environment is automatically set to Workers by the pool
    // Don't specify 'miniflare' here as the pool handles it

    // Timeouts
    testTimeout: 10000, // 10 seconds for API calls
    hookTimeout: 10000,

    // Reporting
    reporters: ['verbose'],

    // Bail on first failure in CI
    bail: process.env.CI ? 1 : 0,
  },
});
