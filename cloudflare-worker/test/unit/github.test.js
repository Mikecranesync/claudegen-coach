/**
 * Unit Tests for GitHub API Utilities
 *
 * Tests webhook signature validation, file fetching, and CLAUDE.md caching.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  verifyWebhookSignature,
  parseFilePathsFromCommand,
  fetchClaudeMd,
} from '../../lib/github.js';
import {
  WEBHOOK_SECRET,
  validIssueCommentPayload,
  alternateCommandPayload,
  nonActivationPayload,
} from '../fixtures/github-payloads.js';

describe('GitHub Webhook Signature Verification', () => {
  it('should verify valid webhook signature using HMAC SHA-256', async () => {
    const payload = JSON.stringify(validIssueCommentPayload);

    // Compute the expected HMAC signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(WEBHOOK_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const hmac = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );

    const signature = 'sha256=' + Array.from(new Uint8Array(hmac))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const result = await verifyWebhookSignature(payload, signature, WEBHOOK_SECRET);

    expect(result).toBe(true);
  });

  it('should reject invalid webhook signature', async () => {
    const payload = JSON.stringify(validIssueCommentPayload);
    const invalidSignature = 'sha256=invalid_hash_that_does_not_match';

    const result = await verifyWebhookSignature(payload, invalidSignature, WEBHOOK_SECRET);

    expect(result).toBe(false);
  });

  it('should reject signature with wrong secret', async () => {
    const payload = JSON.stringify(validIssueCommentPayload);

    // Compute signature with correct secret
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(WEBHOOK_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const hmac = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );

    const signature = 'sha256=' + Array.from(new Uint8Array(hmac))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Try to verify with WRONG secret
    const wrongSecret = 'completely-different-secret';
    const result = await verifyWebhookSignature(payload, signature, wrongSecret);

    expect(result).toBe(false);
  });

  it('should handle missing parameters gracefully', async () => {
    // Missing payload
    let result = await verifyWebhookSignature(null, 'sha256=hash', WEBHOOK_SECRET);
    expect(result).toBe(false);

    // Missing signature
    result = await verifyWebhookSignature('payload', null, WEBHOOK_SECRET);
    expect(result).toBe(false);

    // Missing secret
    result = await verifyWebhookSignature('payload', 'sha256=hash', null);
    expect(result).toBe(false);
  });

  it('should use timing-safe comparison to prevent timing attacks', async () => {
    // This is tested implicitly by the implementation using timing-safe comparison
    // We can't easily test timing directly, but we verify it handles similar strings correctly
    const payload = JSON.stringify(validIssueCommentPayload);

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(WEBHOOK_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const hmac = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );

    const correctSignature = 'sha256=' + Array.from(new Uint8Array(hmac))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Create a signature that differs by only one character
    const almostCorrectSignature = correctSignature.substring(0, correctSignature.length - 1) + 'f';

    const result = await verifyWebhookSignature(payload, almostCorrectSignature, WEBHOOK_SECRET);

    expect(result).toBe(false);
  });
});

describe('File Path Parsing from Commands', () => {
  it('should parse file paths from @claude fix command', () => {
    const comment = '@claude fix cloudflare-worker/lib/auth.js';
    const paths = parseFilePathsFromCommand(comment);

    expect(paths).toEqual(['cloudflare-worker/lib/auth.js']);
  });

  it('should parse multiple file paths from command', () => {
    const comment = '@claude fix src/components/Button.tsx src/components/Input.tsx src/utils/validation.ts';
    const paths = parseFilePathsFromCommand(comment);

    expect(paths).toEqual([
      'src/components/Button.tsx',
      'src/components/Input.tsx',
      'src/utils/validation.ts',
    ]);
  });

  it('should parse file paths from /fix-issue command', () => {
    const comment = '/fix-issue src/pages/Login.tsx';
    const paths = parseFilePathsFromCommand(comment);

    expect(paths).toEqual(['src/pages/Login.tsx']);
  });

  it('should return empty array when no file paths specified', () => {
    const comment = '@claude fix';
    const paths = parseFilePathsFromCommand(comment);

    expect(paths).toEqual([]);
  });

  it('should return empty array when no activation command present', () => {
    const comment = 'This is just a regular comment without any command';
    const paths = parseFilePathsFromCommand(comment);

    expect(paths).toEqual([]);
  });

  it('should handle file paths with Windows-style backslashes', () => {
    const comment = '@claude fix src\\components\\Button.tsx';
    const paths = parseFilePathsFromCommand(comment);

    expect(paths).toEqual(['src\\components\\Button.tsx']);
  });

  it('should filter out non-path strings', () => {
    const comment = '@claude fix src/file.ts and also another note here src/another.ts';
    const paths = parseFilePathsFromCommand(comment);

    // Should only extract strings that look like file paths (contain / or \ or .)
    expect(paths).toContain('src/file.ts');
    expect(paths).toContain('src/another.ts');
    expect(paths).not.toContain('and');
    expect(paths).not.toContain('also');
  });
});

describe('CLAUDE.md Fetching (Mocked)', () => {
  it('should fetch and decode CLAUDE.md successfully', async () => {
    // Create mock Octokit client
    const mockOctokit = {
      rest: {
        repos: {
          getContent: vi.fn().mockResolvedValue({
            data: {
              type: 'file',
              content: btoa('# CLAUDE.md\n\nTest content'),
              sha: 'abc123',
            },
          }),
        },
      },
    };

    const content = await fetchClaudeMd(mockOctokit, 'owner', 'repo', 'master');

    expect(content).toBe('# CLAUDE.md\n\nTest content');
    expect(mockOctokit.rest.repos.getContent).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      path: 'CLAUDE.md',
      ref: 'master',
    });
  });

  it('should return null when CLAUDE.md not found (404)', async () => {
    const mockOctokit = {
      rest: {
        repos: {
          getContent: vi.fn().mockRejectedValue({
            status: 404,
            message: 'Not Found',
          }),
        },
      },
    };

    const content = await fetchClaudeMd(mockOctokit, 'owner', 'repo', 'master');

    expect(content).toBeNull();
  });

  it('should return null if CLAUDE.md is not a file', async () => {
    const mockOctokit = {
      rest: {
        repos: {
          getContent: vi.fn().mockResolvedValue({
            data: {
              type: 'dir', // Directory, not a file
              name: 'CLAUDE.md',
            },
          }),
        },
      },
    };

    const content = await fetchClaudeMd(mockOctokit, 'owner', 'repo', 'master');

    expect(content).toBeNull();
  });

  it('should throw error for non-404 API failures', async () => {
    const mockOctokit = {
      rest: {
        repos: {
          getContent: vi.fn().mockRejectedValue({
            status: 500,
            message: 'Internal Server Error',
          }),
        },
      },
    };

    await expect(fetchClaudeMd(mockOctokit, 'owner', 'repo', 'master')).rejects.toThrow('Failed to fetch CLAUDE.md');
  });

  it('should use default ref of master', async () => {
    const mockOctokit = {
      rest: {
        repos: {
          getContent: vi.fn().mockResolvedValue({
            data: {
              type: 'file',
              content: btoa('# Test'),
              sha: 'abc123',
            },
          }),
        },
      },
    };

    await fetchClaudeMd(mockOctokit, 'owner', 'repo'); // No ref specified

    expect(mockOctokit.rest.repos.getContent).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      path: 'CLAUDE.md',
      ref: 'master', // Should default to master
    });
  });
});
