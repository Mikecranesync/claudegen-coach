/**
 * Vitest Global Test Setup
 *
 * This file runs before all tests and provides global utilities.
 */

// Global test helpers
global.TEST_ENV = {
  WEBHOOK_SECRET: 'test-webhook-secret-for-testing',
  GITHUB_APP_ID: '2255796',
  // Mock private key for testing (NOT a real key)
  GITHUB_APP_PRIVATE_KEY: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7w+JDTesting
KeyForLocalTestingOnlyThisIsNotARealPrivateKeyDoNotUseInProd
-----END PRIVATE KEY-----`,
  ANTHROPIC_API_KEY: 'test-anthropic-api-key',
};

// Custom matchers (can be extended)
export function setupTestUtils() {
  // Add any global test utilities here
}
