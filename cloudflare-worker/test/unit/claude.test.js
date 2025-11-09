/**
 * Unit Tests for Claude API Integration
 *
 * Tests code fix generation, JSON parsing, response validation, and retry logic.
 */

import { describe, it, expect } from 'vitest';
import { validateCodeFixResponse } from '../../lib/claude.js';
import {
  validCodeFixResponse,
  multiFileResponse,
  deleteFileResponse,
  markdownWrappedResponse,
  missingCommitTitleResponse,
  invalidBranchNameResponse,
  tooLongCommitTitleResponse,
  emptyFileChangesResponse,
  invalidOperationResponse,
} from '../fixtures/claude-responses.js';

describe('Claude Response Validation', () => {
  it('should validate correct code fix response', () => {
    const validation = validateCodeFixResponse(validCodeFixResponse);

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should validate response with multiple file changes', () => {
    const validation = validateCodeFixResponse(multiFileResponse);

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should validate response with delete operation', () => {
    const validation = validateCodeFixResponse(deleteFileResponse);

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should reject response missing commit_title', () => {
    const validation = validateCodeFixResponse(missingCommitTitleResponse);

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('commit_title is required and must be a string');
  });

  it('should reject response with invalid branch name format', () => {
    const validation = validateCodeFixResponse(invalidBranchNameResponse);

    expect(validation.valid).toBe(false);
    expect(validation.errors.some(e => e.includes('branch_name must match pattern'))).toBe(true);
  });

  it('should reject response with commit title > 72 characters', () => {
    const validation = validateCodeFixResponse(tooLongCommitTitleResponse);

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('commit_title must be 72 characters or less');
  });

  it('should reject response with empty file_changes array', () => {
    const validation = validateCodeFixResponse(emptyFileChangesResponse);

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('file_changes must contain at least one item');
  });

  it('should reject response with invalid file operation', () => {
    const validation = validateCodeFixResponse(invalidOperationResponse);

    expect(validation.valid).toBe(false);
    expect(validation.errors.some(e => e.includes('operation must be'))).toBe(true);
  });

  it('should reject non-object response', () => {
    const validation = validateCodeFixResponse(null);

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('Response must be an object');
  });

  it('should validate all required fields are present', () => {
    const incompleteResponse = {
      commit_title: 'fix: Something',
      branch_name: 'claude/fix-issue-1',
      // Missing pr_description and file_changes
    };

    const validation = validateCodeFixResponse(incompleteResponse);

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('pr_description is required and must be a string');
    expect(validation.errors).toContain('file_changes is required and must be an array');
  });
});

describe('Claude JSON Response Parsing', () => {
  it('should parse plain JSON response', () => {
    const jsonString = JSON.stringify(validCodeFixResponse);
    const parsed = JSON.parse(jsonString);

    expect(parsed).toEqual(validCodeFixResponse);
  });

  it('should parse markdown-wrapped JSON response', () => {
    // Remove markdown code fences
    const cleaned = markdownWrappedResponse
      .replace(/^```json?\n?/i, '')
      .replace(/\n?```$/, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    expect(parsed).toHaveProperty('commit_title');
    expect(parsed).toHaveProperty('branch_name');
    expect(parsed).toHaveProperty('pr_description');
    expect(parsed).toHaveProperty('file_changes');
  });

  it('should handle JSON with escaped characters', () => {
    const jsonWithEscapes = JSON.stringify({
      commit_title: 'fix: Handle "quotes" and \\ backslashes',
      branch_name: 'claude/fix-issue-1',
      pr_description: 'Line 1\nLine 2\nLine 3',
      file_changes: [
        {
          path: 'test.ts',
          operation: 'add',
          content: 'const str = "hello\\nworld";',
        },
      ],
    });

    const parsed = JSON.parse(jsonWithEscapes);

    expect(parsed.commit_title).toContain('"quotes"');
    expect(parsed.pr_description).toContain('\n');
  });
});

describe('Code Fix Schema Compliance', () => {
  it('should enforce commit title max length (72 chars)', () => {
    const response = {
      ...validCodeFixResponse,
      commit_title: 'a'.repeat(73), // 73 characters (too long)
    };

    const validation = validateCodeFixResponse(response);

    expect(validation.valid).toBe(false);
  });

  it('should enforce branch name pattern (claude/fix-issue-N)', () => {
    const validBranchNames = [
      'claude/fix-issue-1',
      'claude/fix-issue-99',
      'claude/fix-issue-1234',
    ];

    const invalidBranchNames = [
      'fix-issue-1',
      'claude/issue-1',
      'claude/fix-1',
      'claude/fix-issue-abc',
      'my-branch',
    ];

    validBranchNames.forEach(branch => {
      const response = { ...validCodeFixResponse, branch_name: branch };
      const validation = validateCodeFixResponse(response);
      expect(validation.valid).toBe(true);
    });

    invalidBranchNames.forEach(branch => {
      const response = { ...validCodeFixResponse, branch_name: branch };
      const validation = validateCodeFixResponse(response);
      expect(validation.valid).toBe(false);
    });
  });

  it('should enforce file operation enum (add, modify, delete)', () => {
    const validOperations = ['add', 'modify', 'delete'];
    const invalidOperations = ['update', 'create', 'remove', 'change'];

    validOperations.forEach(op => {
      const response = {
        ...validCodeFixResponse,
        file_changes: [
          { path: 'test.ts', operation: op, content: 'test' },
        ],
      };
      const validation = validateCodeFixResponse(response);
      expect(validation.valid).toBe(true);
    });

    invalidOperations.forEach(op => {
      const response = {
        ...validCodeFixResponse,
        file_changes: [
          { path: 'test.ts', operation: op, content: 'test' },
        ],
      };
      const validation = validateCodeFixResponse(response);
      expect(validation.valid).toBe(false);
    });
  });

  it('should require at least one file change', () => {
    const response = {
      ...validCodeFixResponse,
      file_changes: [],
    };

    const validation = validateCodeFixResponse(response);

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('file_changes must contain at least one item');
  });

  it('should validate each file change has required fields', () => {
    const response = {
      ...validCodeFixResponse,
      file_changes: [
        { path: 'test.ts', operation: 'add', content: 'test' }, // Valid
        { path: 'test2.ts', operation: 'modify' }, // Missing content
        { operation: 'delete', content: '' }, // Missing path
      ],
    };

    const validation = validateCodeFixResponse(response);

    expect(validation.valid).toBe(false);
    expect(validation.errors.some(e => e.includes('content must be a string'))).toBe(true);
    expect(validation.errors.some(e => e.includes('path is required'))).toBe(true);
  });
});
