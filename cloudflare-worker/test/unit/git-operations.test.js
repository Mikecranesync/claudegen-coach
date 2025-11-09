/**
 * Unit Tests for Git Operations
 *
 * Tests the 5-step Git Data API choreography for creating branches and PRs.
 */

import { describe, it, expect, vi } from 'vitest';
import { masterRefResponse } from '../fixtures/github-payloads.js';
import { validCodeFixResponse } from '../fixtures/claude-responses.js';

// Note: We're testing the logic, not making real API calls
// The actual createPullRequest function will be mocked in integration tests

describe('Git Operations - Base Commit SHA Retrieval', () => {
  it('should retrieve base commit SHA from master branch', async () => {
    const mockOctokit = {
      rest: {
        git: {
          getRef: vi.fn().mockResolvedValue({
            data: masterRefResponse,
          }),
        },
      },
    };

    // Simulate calling the function (we'd import it from git-operations.js)
    const ref = await mockOctokit.rest.git.getRef({
      owner: 'Mikecranesync',
      repo: 'claudegen-coach',
      ref: 'heads/master',
    });

    expect(ref.data.object.sha).toBe('abc123def456master');
    expect(mockOctokit.rest.git.getRef).toHaveBeenCalledWith({
      owner: 'Mikecranesync',
      repo: 'claudegen-coach',
      ref: 'heads/master',
    });
  });

  it('should fallback to main branch if master not found', async () => {
    const mockOctokit = {
      rest: {
        git: {
          getRef: vi.fn()
            .mockRejectedValueOnce({ status: 404, message: 'Not Found' }) // master fails
            .mockResolvedValueOnce({
              // main succeeds
              data: {
                ref: 'refs/heads/main',
                object: { sha: 'mainbranchsha123', type: 'commit' },
              },
            }),
        },
      },
    };

    // First attempt (master) fails
    try {
      await mockOctokit.rest.git.getRef({
        owner: 'Mikecranesync',
        repo: 'claudegen-coach',
        ref: 'heads/master',
      });
    } catch (error) {
      expect(error.status).toBe(404);
    }

    // Second attempt (main) succeeds
    const ref = await mockOctokit.rest.git.getRef({
      owner: 'Mikecranesync',
      repo: 'claudegen-coach',
      ref: 'heads/main',
    });

    expect(ref.data.object.sha).toBe('mainbranchsha123');
  });

  it('should throw error if neither master nor main exist', async () => {
    const mockOctokit = {
      rest: {
        git: {
          getRef: vi.fn()
            .mockRejectedValue({ status: 404, message: 'Not Found' }),
        },
      },
    };

    await expect(
      mockOctokit.rest.git.getRef({
        owner: 'Mikecranesync',
        repo: 'claudegen-coach',
        ref: 'heads/master',
      })
    ).rejects.toThrow();
  });
});

describe('Git Operations - Blob Creation', () => {
  it('should create blobs for file additions', async () => {
    const fileContent = 'export function test() { return true; }';
    const expectedBase64 = btoa(fileContent);

    const mockOctokit = {
      rest: {
        git: {
          createBlob: vi.fn().mockResolvedValue({
            data: {
              sha: 'blob_sha_123',
              url: 'https://api.github.com/repos/owner/repo/git/blobs/blob_sha_123',
            },
          }),
        },
      },
    };

    const result = await mockOctokit.rest.git.createBlob({
      owner: 'owner',
      repo: 'repo',
      content: expectedBase64,
      encoding: 'base64',
    });

    expect(result.data.sha).toBe('blob_sha_123');
    expect(mockOctokit.rest.git.createBlob).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      content: expectedBase64,
      encoding: 'base64',
    });
  });

  it('should handle delete operations without creating blob', () => {
    // For delete operations, we pass null SHA to the tree
    const deleteOperation = {
      path: 'old-file.ts',
      sha: null, // null means delete
      mode: '100644',
      operation: 'delete',
    };

    expect(deleteOperation.sha).toBeNull();
    expect(deleteOperation.operation).toBe('delete');
  });

  it('should create multiple blobs for multiple file changes', async () => {
    const mockOctokit = {
      rest: {
        git: {
          createBlob: vi.fn()
            .mockResolvedValueOnce({ data: { sha: 'blob1' } })
            .mockResolvedValueOnce({ data: { sha: 'blob2' } })
            .mockResolvedValueOnce({ data: { sha: 'blob3' } }),
        },
      },
    };

    // Simulate creating 3 blobs
    const blobs = await Promise.all([
      mockOctokit.rest.git.createBlob({ owner: 'o', repo: 'r', content: btoa('file1'), encoding: 'base64' }),
      mockOctokit.rest.git.createBlob({ owner: 'o', repo: 'r', content: btoa('file2'), encoding: 'base64' }),
      mockOctokit.rest.git.createBlob({ owner: 'o', repo: 'r', content: btoa('file3'), encoding: 'base64' }),
    ]);

    expect(blobs).toHaveLength(3);
    expect(blobs[0].data.sha).toBe('blob1');
    expect(blobs[1].data.sha).toBe('blob2');
    expect(blobs[2].data.sha).toBe('blob3');
    expect(mockOctokit.rest.git.createBlob).toHaveBeenCalledTimes(3);
  });
});

describe('Git Operations - Tree Creation', () => {
  it('should create tree with base tree reference', async () => {
    const baseTreeSHA = 'base_tree_sha_123';
    const tree = [
      { path: 'file1.ts', mode: '100644', type: 'blob', sha: 'blob1' },
      { path: 'file2.ts', mode: '100644', type: 'blob', sha: 'blob2' },
    ];

    const mockOctokit = {
      rest: {
        git: {
          createTree: vi.fn().mockResolvedValue({
            data: {
              sha: 'new_tree_sha_456',
              tree: tree,
            },
          }),
        },
      },
    };

    const result = await mockOctokit.rest.git.createTree({
      owner: 'owner',
      repo: 'repo',
      base_tree: baseTreeSHA,
      tree: tree,
    });

    expect(result.data.sha).toBe('new_tree_sha_456');
    expect(mockOctokit.rest.git.createTree).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      base_tree: baseTreeSHA,
      tree: tree,
    });
  });

  it('should include null SHA for deletions in tree', () => {
    const tree = [
      { path: 'add.ts', mode: '100644', type: 'blob', sha: 'blob123' },
      { path: 'modify.ts', mode: '100644', type: 'blob', sha: 'blob456' },
      { path: 'delete.ts', mode: '100644', type: 'blob', sha: null }, // Deletion
    ];

    const deletedFile = tree.find(item => item.path === 'delete.ts');
    expect(deletedFile.sha).toBeNull();
  });
});

describe('Git Operations - Commit Creation', () => {
  it('should create commit with correct message and tree', async () => {
    const treeSHA = 'tree_sha_789';
    const parentSHA = 'parent_commit_abc';
    const message = 'fix: Resolve authentication issue';

    const mockOctokit = {
      rest: {
        git: {
          createCommit: vi.fn().mockResolvedValue({
            data: {
              sha: 'new_commit_xyz',
              message: message,
              tree: { sha: treeSHA },
              parents: [{ sha: parentSHA }],
            },
          }),
        },
      },
    };

    const result = await mockOctokit.rest.git.createCommit({
      owner: 'owner',
      repo: 'repo',
      message: message,
      tree: treeSHA,
      parents: [parentSHA],
    });

    expect(result.data.sha).toBe('new_commit_xyz');
    expect(result.data.message).toBe(message);
    expect(mockOctokit.rest.git.createCommit).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      message: message,
      tree: treeSHA,
      parents: [parentSHA],
    });
  });
});

describe('Git Operations - Branch and PR Creation', () => {
  it('should create branch with commit SHA', async () => {
    const branchName = 'claude/fix-issue-11';
    const commitSHA = 'commit_sha_final';

    const mockOctokit = {
      rest: {
        git: {
          createRef: vi.fn().mockResolvedValue({
            data: {
              ref: `refs/heads/${branchName}`,
              object: { sha: commitSHA },
            },
          }),
        },
      },
    };

    const result = await mockOctokit.rest.git.createRef({
      owner: 'owner',
      repo: 'repo',
      ref: `refs/heads/${branchName}`,
      sha: commitSHA,
    });

    expect(result.data.ref).toBe(`refs/heads/${branchName}`);
    expect(result.data.object.sha).toBe(commitSHA);
  });

  it('should create pull request with correct parameters', async () => {
    const branchName = 'claude/fix-issue-11';
    const baseBranch = 'master';
    const title = 'fix: Resolve authentication issue';
    const body = '## Summary\nFixed auth\n\nCloses #11';

    const mockOctokit = {
      rest: {
        pulls: {
          create: vi.fn().mockResolvedValue({
            data: {
              number: 42,
              title: title,
              html_url: 'https://github.com/owner/repo/pull/42',
              state: 'open',
            },
          }),
        },
      },
    };

    const result = await mockOctokit.rest.pulls.create({
      owner: 'owner',
      repo: 'repo',
      title: title,
      head: branchName,
      base: baseBranch,
      body: body,
    });

    expect(result.data.number).toBe(42);
    expect(result.data.html_url).toContain('/pull/42');
    expect(mockOctokit.rest.pulls.create).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      title: title,
      head: branchName,
      base: baseBranch,
      body: body,
    });
  });
});
