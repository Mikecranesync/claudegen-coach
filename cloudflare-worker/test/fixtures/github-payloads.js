/**
 * Mock GitHub Webhook Payloads for Testing
 *
 * Based on real GitHub webhook payloads for issue_comment events.
 * These fixtures allow testing webhook handling without hitting GitHub API.
 */

export const WEBHOOK_SECRET = 'test-webhook-secret-for-testing';

/**
 * Valid issue_comment.created webhook payload with @claude fix command
 */
export const validIssueCommentPayload = {
  action: 'created',
  issue: {
    number: 11,
    title: '🔑 Bot Blocker: Fix GitHub App Private Key Format for JWT Generation',
    body: 'The bot is failing to authenticate with GitHub App because the private key needs to be in PKCS#8 format.',
    state: 'open',
    user: {
      login: 'Mikecranesync',
      id: 1234567,
      type: 'User',
    },
    created_at: '2025-11-08T10:00:00Z',
    updated_at: '2025-11-08T15:30:00Z',
    html_url: 'https://github.com/Mikecranesync/claudegen-coach/issues/11',
  },
  comment: {
    id: 987654321,
    user: {
      login: 'Mikecranesync',
      id: 1234567,
      type: 'User',
    },
    body: '@claude fix cloudflare-worker/lib/auth.js',
    created_at: '2025-11-09T17:06:19Z',
    updated_at: '2025-11-09T17:06:19Z',
    html_url: 'https://github.com/Mikecranesync/claudegen-coach/issues/11#issuecomment-987654321',
  },
  repository: {
    id: 876543210,
    name: 'claudegen-coach',
    full_name: 'Mikecranesync/claudegen-coach',
    owner: {
      login: 'Mikecranesync',
      id: 1234567,
      type: 'User',
    },
    private: false,
    html_url: 'https://github.com/Mikecranesync/claudegen-coach',
    description: 'AI-powered coaching app for building web applications',
    default_branch: 'master',
  },
  sender: {
    login: 'Mikecranesync',
    id: 1234567,
    type: 'User',
  },
};

/**
 * Payload with different activation command format
 */
export const alternateCommandPayload = {
  ...validIssueCommentPayload,
  comment: {
    ...validIssueCommentPayload.comment,
    body: '/fix-issue src/components/Button.tsx src/components/Input.tsx',
  },
};

/**
 * Payload without activation command (should be ignored)
 */
export const nonActivationPayload = {
  ...validIssueCommentPayload,
  comment: {
    ...validIssueCommentPayload.comment,
    body: 'This is just a regular comment without the bot command',
  },
};

/**
 * Payload for issue_comment.edited event (should be ignored)
 */
export const editedCommentPayload = {
  ...validIssueCommentPayload,
  action: 'edited',
};

/**
 * Payload for different event type (should be ignored)
 */
export const pushEventPayload = {
  ref: 'refs/heads/master',
  before: 'abc123',
  after: 'def456',
  repository: validIssueCommentPayload.repository,
  pusher: {
    name: 'Mikecranesync',
    email: 'mike@example.com',
  },
};

/**
 * Valid HMAC-SHA256 signature for validIssueCommentPayload
 * Signature computed with WEBHOOK_SECRET
 */
export function generateValidSignature(payload) {
  // This would need actual crypto implementation in tests
  // For now, we'll use a placeholder
  return 'sha256=valid_test_signature_hash';
}

/**
 * Invalid signature (wrong hash)
 */
export const INVALID_SIGNATURE = 'sha256=definitely_wrong_hash_value';

/**
 * Mock GitHub API response for getContent (CLAUDE.md)
 */
export const claudeMdResponse = {
  type: 'file',
  encoding: 'base64',
  size: 3600,
  name: 'CLAUDE.md',
  path: 'CLAUDE.md',
  content: Buffer.from('# ClaudeGen Coach - AI Coding Standards\n\nThis is a mock CLAUDE.md file for testing.').toString('base64'),
  sha: 'abc123def456',
  url: 'https://api.github.com/repos/Mikecranesync/claudegen-coach/contents/CLAUDE.md',
  html_url: 'https://github.com/Mikecranesync/claudegen-coach/blob/master/CLAUDE.md',
  download_url: 'https://raw.githubusercontent.com/Mikecranesync/claudegen-coach/master/CLAUDE.md',
};

/**
 * Mock GitHub API response for getContent (file not found)
 */
export const fileNotFoundError = {
  status: 404,
  message: 'Not Found',
  documentation_url: 'https://docs.github.com/rest/repos/contents#get-repository-content',
};

/**
 * Mock file content response
 */
export const mockFileContent = {
  type: 'file',
  encoding: 'base64',
  size: 150,
  name: 'auth.js',
  path: 'cloudflare-worker/lib/auth.js',
  content: Buffer.from('export function generateJWT() {\n  // Mock function\n}').toString('base64'),
  sha: 'xyz789',
};

/**
 * Mock GitHub API ref response (for base commit)
 */
export const masterRefResponse = {
  ref: 'refs/heads/master',
  node_id: 'REF_kwDOABC',
  url: 'https://api.github.com/repos/Mikecranesync/claudegen-coach/git/refs/heads/master',
  object: {
    sha: 'abc123def456master',
    type: 'commit',
    url: 'https://api.github.com/repos/Mikecranesync/claudegen-coach/git/commits/abc123def456master',
  },
};

/**
 * Mock installation token response
 */
export const installationTokenResponse = {
  token: 'ghs_mock_installation_token_1234567890',
  expires_at: '2025-11-09T23:06:19Z',
  permissions: {
    contents: 'write',
    issues: 'write',
    pull_requests: 'write',
  },
  repository_selection: 'selected',
};
