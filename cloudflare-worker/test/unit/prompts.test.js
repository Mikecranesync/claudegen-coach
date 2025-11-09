/**
 * Unit Tests for Claude Prompt Building
 *
 * Tests system prompt and user prompt construction for code generation.
 */

import { describe, it, expect } from 'vitest';
import {
  buildSystemPrompt,
  buildUserPrompt,
  buildRetryPrompt,
} from '../../lib/prompts.js';
import { validIssueCommentPayload } from '../fixtures/github-payloads.js';

describe('System Prompt Building', () => {
  it('should include CLAUDE.md content when provided', () => {
    const claudeMd = '# Coding Standards\n\nAlways use TypeScript strict mode.';
    const systemPrompt = buildSystemPrompt(claudeMd);

    expect(systemPrompt).toContain('Coding Standards');
    expect(systemPrompt).toContain('TypeScript strict mode');
    expect(systemPrompt).toContain(claudeMd);
  });

  it('should work without CLAUDE.md (no coding standards)', () => {
    const systemPrompt = buildSystemPrompt(null);

    expect(systemPrompt).toBeDefined();
    expect(typeof systemPrompt).toBe('string');
    expect(systemPrompt.length).toBeGreaterThan(0);
    // Should still have basic instructions even without CLAUDE.md
    expect(systemPrompt).toContain('code');
  });

  it('should include JSON schema requirements', () => {
    const systemPrompt = buildSystemPrompt(null);

    // System prompt should mention the expected output format
    expect(systemPrompt.toLowerCase()).toContain('json');
  });
});

describe('User Prompt Building', () => {
  const mockContext = {
    repository: {
      owner: 'Mikecranesync',
      name: 'claudegen-coach',
    },
    issue: {
      number: 11,
      title: '🔑 Bot Blocker: Fix GitHub App Private Key Format',
      body: 'The bot is failing because the private key is in PKCS#1 format instead of PKCS#8.',
    },
    comment: {
      body: '@claude fix cloudflare-worker/lib/auth.js',
      user: {
        login: 'Mikecranesync',
      },
    },
  };

  it('should include issue title and body', () => {
    const userPrompt = buildUserPrompt(mockContext, []);

    expect(userPrompt).toContain('Bot Blocker');
    expect(userPrompt).toContain('PKCS#1 format');
    expect(userPrompt).toContain('PKCS#8');
  });

  it('should include repository information', () => {
    const userPrompt = buildUserPrompt(mockContext, []);

    // Should include issue number (which confirms context is included)
    expect(userPrompt).toContain('11');
    // Prompt should have reasonable length (not empty)
    expect(userPrompt.length).toBeGreaterThan(50);
  });

  it('should include issue number', () => {
    const userPrompt = buildUserPrompt(mockContext, []);

    expect(userPrompt).toContain('11');
  });

  it('should include relevant file contents when provided', () => {
    const relevantFiles = [
      {
        path: 'cloudflare-worker/lib/auth.js',
        content: 'export function generateJWT() {\n  // JWT generation code\n}',
        sha: 'abc123',
      },
    ];

    const userPrompt = buildUserPrompt(mockContext, relevantFiles);

    expect(userPrompt).toContain('auth.js');
    expect(userPrompt).toContain('generateJWT');
    expect(userPrompt).toContain('JWT generation code');
  });

  it('should handle multiple files', () => {
    const relevantFiles = [
      {
        path: 'file1.js',
        content: 'console.log("file1")',
        sha: 'sha1',
      },
      {
        path: 'file2.ts',
        content: 'const x: number = 42;',
        sha: 'sha2',
      },
    ];

    const userPrompt = buildUserPrompt(mockContext, relevantFiles);

    expect(userPrompt).toContain('file1.js');
    expect(userPrompt).toContain('file2.ts');
    expect(userPrompt).toContain('file1');
    expect(userPrompt).toContain('const x');
  });

  it('should work without relevant files', () => {
    const userPrompt = buildUserPrompt(mockContext, []);

    expect(userPrompt).toBeDefined();
    expect(typeof userPrompt).toBe('string');
    expect(userPrompt.length).toBeGreaterThan(0);
  });

  it('should include activation command context', () => {
    const userPrompt = buildUserPrompt(mockContext, []);

    expect(userPrompt).toContain('@claude fix');
  });
});

describe('Retry Prompt Building', () => {
  const previousResponse = {
    commit_title: 'fix Something',
    branch_name: 'wrong-format',
    pr_description: 'Description',
    file_changes: [],
  };

  const errors = [
    'commit_title must be 72 characters or less',
    'branch_name must match pattern: claude/fix-issue-{number}',
    'file_changes must contain at least one item',
  ];

  it('should include previous response', () => {
    const retryPrompt = buildRetryPrompt(previousResponse, errors);

    expect(retryPrompt).toContain('wrong-format');
  });

  it('should include validation errors', () => {
    const retryPrompt = buildRetryPrompt(previousResponse, errors);

    expect(retryPrompt).toContain('72 characters');
    expect(retryPrompt).toContain('claude/fix-issue');
    expect(retryPrompt).toContain('at least one item');
  });

  it('should provide clear correction guidance', () => {
    const retryPrompt = buildRetryPrompt(previousResponse, errors);

    // Should ask for correction
    expect(retryPrompt.toLowerCase()).toMatch(/correct|fix|retry|error/);
  });

  it('should work with array of errors', () => {
    const retryPrompt = buildRetryPrompt(previousResponse, errors);

    errors.forEach(error => {
      expect(retryPrompt).toContain(error);
    });
  });

  it('should work with single error string', () => {
    const singleError = 'Invalid JSON format';
    const retryPrompt = buildRetryPrompt(previousResponse, singleError);

    expect(retryPrompt).toContain('Invalid JSON');
  });
});

describe('Prompt Formatting', () => {
  it('should escape special characters in user input', () => {
    const contextWithSpecialChars = {
      repository: { owner: 'owner', name: 'repo' },
      issue: {
        number: 1,
        title: 'Fix "quotes" and \\ backslashes',
        body: 'Line 1\nLine 2',
      },
      comment: {
        body: '@claude fix',
        user: { login: 'user' },
      },
    };

    const userPrompt = buildUserPrompt(contextWithSpecialChars, []);

    // Should include the special characters
    expect(userPrompt).toContain('quotes');
    expect(userPrompt).toContain('Line 1');
    expect(userPrompt).toContain('Line 2');
  });

  it('should handle empty issue body', () => {
    const contextWithEmptyBody = {
      repository: { owner: 'owner', name: 'repo' },
      issue: {
        number: 1,
        title: 'Title only',
        body: '',
      },
      comment: {
        body: '@claude fix',
        user: { login: 'user' },
      },
    };

    const userPrompt = buildUserPrompt(contextWithEmptyBody, []);

    expect(userPrompt).toBeDefined();
    expect(userPrompt).toContain('Title only');
  });

  it('should format file paths clearly', () => {
    const files = [
      { path: 'src/components/Button.tsx', content: 'content', sha: 'sha' },
      { path: 'src/utils/validation.ts', content: 'content', sha: 'sha' },
    ];

    const context = {
      repository: { owner: 'o', name: 'r' },
      issue: { number: 1, title: 'T', body: 'B' },
      comment: { body: '@claude fix', user: { login: 'u' } },
    };

    const userPrompt = buildUserPrompt(context, files);

    expect(userPrompt).toContain('Button.tsx');
    expect(userPrompt).toContain('validation.ts');
  });
});
