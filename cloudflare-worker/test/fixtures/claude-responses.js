/**
 * Mock Claude API Responses for Testing
 *
 * These fixtures represent various Claude API responses including:
 * - Valid structured outputs
 * - Invalid/malformed responses
 * - Markdown-wrapped JSON
 * - Error responses
 */

/**
 * Valid code fix response matching the JSON schema
 */
export const validCodeFixResponse = {
  commit_title: 'fix: Resolve GitHub App authentication issue',
  branch_name: 'claude/fix-issue-11',
  pr_description: `## Summary
- Fixed GitHub App private key format (PKCS#1 → PKCS#8)
- Updated JWT generation to use correct key format
- Added error handling for invalid key formats

## Changes
- Modified \`lib/auth.js\` to handle PKCS#8 keys properly

## Testing
- Tested JWT generation with new key format
- Verified installation token exchange works

Closes #11`,
  file_changes: [
    {
      path: 'cloudflare-worker/lib/auth.js',
      operation: 'modify',
      content: `/**
 * GitHub App Authentication
 */

import { SignJWT } from 'jose';

export async function generateJWT(appId, privateKey) {
  // Implementation fixed for PKCS#8 format
  const jwt = await new SignJWT({ iat: Math.floor(Date.now() / 1000) })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(appId)
    .setExpirationTime('10m')
    .sign(privateKey);

  return jwt;
}
`,
    },
  ],
};

/**
 * Valid response with multiple file changes
 */
export const multiFileResponse = {
  commit_title: 'feat: Add user authentication system',
  branch_name: 'claude/fix-issue-3',
  pr_description: '## Summary\nImplemented complete authentication flow\n\nCloses #3',
  file_changes: [
    {
      path: 'src/store/authStore.ts',
      operation: 'modify',
      content: '// Updated auth store code...',
    },
    {
      path: 'src/pages/Auth/Login.tsx',
      operation: 'modify',
      content: '// Updated login component...',
    },
    {
      path: 'src/hooks/useAuth.ts',
      operation: 'add',
      content: '// New auth hook...',
    },
  ],
};

/**
 * Response with delete operation
 */
export const deleteFileResponse = {
  commit_title: 'chore: Remove deprecated utilities',
  branch_name: 'claude/fix-issue-99',
  pr_description: '## Summary\nRemoved old utility files\n\nCloses #99',
  file_changes: [
    {
      path: 'src/utils/deprecated.ts',
      operation: 'delete',
      content: '',
    },
  ],
};

/**
 * Markdown-wrapped JSON response (common Claude behavior)
 */
export const markdownWrappedResponse = `\`\`\`json
{
  "commit_title": "fix: Correct validation logic",
  "branch_name": "claude/fix-issue-42",
  "pr_description": "## Summary\\nFixed email validation\\n\\nCloses #42",
  "file_changes": [
    {
      "path": "src/utils/validation.ts",
      "operation": "modify",
      "content": "export function validateEmail(email: string): boolean {\\n  return /^[^\\\\s@]+@[^\\\\s@]+\\\\.[^\\\\s@]+$/.test(email);\\n}"
    }
  ]
}
\`\`\``;

/**
 * Response missing required field (commit_title)
 */
export const missingCommitTitleResponse = {
  branch_name: 'claude/fix-issue-100',
  pr_description: 'Some description',
  file_changes: [
    {
      path: 'test.ts',
      operation: 'add',
      content: 'test',
    },
  ],
};

/**
 * Response with invalid branch name format
 */
export const invalidBranchNameResponse = {
  commit_title: 'fix: Something',
  branch_name: 'my-custom-branch', // Should be claude/fix-issue-{number}
  pr_description: 'Description',
  file_changes: [
    {
      path: 'test.ts',
      operation: 'add',
      content: 'test',
    },
  ],
};

/**
 * Response with commit title too long (>72 chars)
 */
export const tooLongCommitTitleResponse = {
  commit_title: 'fix: This is a very long commit title that exceeds the maximum length of seventy-two characters',
  branch_name: 'claude/fix-issue-101',
  pr_description: 'Description',
  file_changes: [
    {
      path: 'test.ts',
      operation: 'add',
      content: 'test',
    },
  ],
};

/**
 * Response with empty file_changes array
 */
export const emptyFileChangesResponse = {
  commit_title: 'fix: Something',
  branch_name: 'claude/fix-issue-102',
  pr_description: 'Description',
  file_changes: [],
};

/**
 * Response with invalid file operation
 */
export const invalidOperationResponse = {
  commit_title: 'fix: Something',
  branch_name: 'claude/fix-issue-103',
  pr_description: 'Description',
  file_changes: [
    {
      path: 'test.ts',
      operation: 'update', // Should be 'add', 'modify', or 'delete'
      content: 'test',
    },
  ],
};

/**
 * Mock Claude API error responses
 */
export const claudeApiError404 = {
  type: 'error',
  error: {
    type: 'not_found_error',
    message: 'model: claude-3-5-sonnet-20241022',
  },
};

export const claudeApiError503 = {
  type: 'error',
  error: {
    type: 'api_error',
    message: 'Service temporarily unavailable',
  },
};

export const claudeApiErrorRateLimit = {
  type: 'error',
  error: {
    type: 'rate_limit_error',
    message: 'Rate limit exceeded',
  },
};

/**
 * Mock Claude API successful message response
 */
export const claudeApiSuccessResponse = {
  id: 'msg_01ABC123',
  type: 'message',
  role: 'assistant',
  content: [
    {
      type: 'text',
      text: JSON.stringify(validCodeFixResponse),
    },
  ],
  model: 'claude-sonnet-4-5-20250929',
  stop_reason: 'end_turn',
  usage: {
    input_tokens: 1250,
    output_tokens: 850,
  },
};

/**
 * Claude response with markdown-wrapped content
 */
export const claudeApiMarkdownResponse = {
  ...claudeApiSuccessResponse,
  content: [
    {
      type: 'text',
      text: markdownWrappedResponse,
    },
  ],
};

/**
 * Malformed JSON response (for retry testing)
 */
export const malformedJsonResponse = `{
  "commit_title": "fix: Something",
  "branch_name": "claude/fix-issue-104",
  "pr_description": "Description",
  "file_changes": [
    {
      "path": "test.ts",
      "operation": "add",
      "content": "test"
    }
  // Missing closing bracket
}`;
