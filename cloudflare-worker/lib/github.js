/**
 * GitHub API Utilities
 *
 * Handles webhook signature validation and GitHub API interactions.
 */

/**
 * Verify GitHub webhook signature using HMAC SHA-256
 *
 * GitHub signs webhooks with HMAC SHA-256 using the webhook secret.
 * The signature is sent in the X-Hub-Signature-256 header as "sha256=<hash>".
 *
 * @param {string} payload - The raw request body
 * @param {string} signature - The X-Hub-Signature-256 header value
 * @param {string} secret - The webhook secret
 * @returns {Promise<boolean>} - True if signature is valid
 */
export async function verifyWebhookSignature(payload, signature, secret) {
  if (!payload || !signature || !secret) {
    console.error('Missing required parameters for signature verification');
    return false;
  }

  try {
    // Remove 'sha256=' prefix from signature
    const expectedSignature = signature.replace(/^sha256=/, '');

    // Encode the secret as a CryptoKey
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Compute HMAC of the payload
    const hmac = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );

    // Convert to hex string
    const computedSignature = Array.from(new Uint8Array(hmac))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Compare signatures (constant-time comparison to prevent timing attacks)
    return timingSafeEqual(expectedSignature, computedSignature);
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Timing-safe string comparison to prevent timing attacks
 *
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} - True if strings are equal
 */
function timingSafeEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Create GitHub API client with authentication
 * (To be fully implemented in Phase 4 with App JWT auth)
 *
 * For Phase 3, using personal access token for testing.
 *
 * @param {string} token - GitHub personal access token (Phase 3) or App token (Phase 4)
 * @returns {Object} - GitHub API client (Octokit instance)
 */
export async function createGitHubClient(token) {
  const { Octokit } = await import('@octokit/rest');

  if (!token) {
    throw new Error('GitHub token is required');
  }

  return new Octokit({
    auth: token,
  });
}

/**
 * Fetch CLAUDE.md from repository root
 *
 * @param {Object} octokit - Octokit client instance
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} ref - Git ref (default: master)
 * @returns {Promise<string|null>} - CLAUDE.md content or null if not found
 */
export async function fetchClaudeMd(octokit, owner, repo, ref = 'master') {
  try {
    console.log(`Fetching CLAUDE.md from ${owner}/${repo}@${ref}`);

    const response = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: 'CLAUDE.md',
      ref,
    });

    // Check if response is a file (not a directory or submodule)
    if (response.data.type !== 'file') {
      console.warn('CLAUDE.md exists but is not a file');
      return null;
    }

    // Decode Base64 content (Cloudflare Workers-compatible)
    const content = atob(response.data.content);

    console.log(`✅ CLAUDE.md fetched successfully (${content.length} chars)`);
    return content;

  } catch (error) {
    if (error.status === 404) {
      console.warn('CLAUDE.md not found in repository - will proceed without coding standards');
      return null;
    }

    console.error('Error fetching CLAUDE.md:', error.message);
    throw new Error(`Failed to fetch CLAUDE.md: ${error.message}`);
  }
}

/**
 * Get CLAUDE.md with in-memory caching
 *
 * Caches content for 10 minutes to avoid excessive API calls.
 *
 * @param {Object} env - Worker environment (for future KV storage)
 * @param {Object} octokit - Octokit client instance
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<string|null>} - Cached or fresh CLAUDE.md content
 */
const claudeMdCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function getCachedClaudeMd(env, octokit, owner, repo) {
  const cacheKey = `${owner}/${repo}`;
  const now = Date.now();

  // Check cache
  const cached = claudeMdCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
    console.log('✅ CLAUDE.md cache hit');
    return cached.content;
  }

  // Cache miss or expired - fetch fresh
  console.log('Cache miss - fetching CLAUDE.md');
  const content = await fetchClaudeMd(octokit, owner, repo);

  // Store in cache
  claudeMdCache.set(cacheKey, {
    content,
    timestamp: now,
  });

  return content;
}

/**
 * Fetch file contents from GitHub repository
 *
 * @param {Object} octokit - Octokit client instance
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} path - File path
 * @param {string} ref - Git ref (branch/commit SHA)
 * @returns {Promise<Object>} - {path, content, sha}
 */
export async function fetchFileContent(octokit, owner, repo, path, ref = 'main') {
  try {
    console.log(`Fetching file: ${path}`);

    const response = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });

    // Check if it's a file
    if (response.data.type !== 'file') {
      throw new Error(`${path} is not a file (type: ${response.data.type})`);
    }

    // Decode Base64 content (Cloudflare Workers-compatible)
    const content = atob(response.data.content);

    return {
      path,
      content,
      sha: response.data.sha,
    };

  } catch (error) {
    if (error.status === 404) {
      console.warn(`File not found: ${path}`);
      throw new Error(`File not found: ${path}`);
    }

    console.error(`Error fetching ${path}:`, error.message);
    throw new Error(`Failed to fetch ${path}: ${error.message}`);
  }
}

/**
 * Fetch multiple files in parallel
 *
 * @param {Object} octokit - Octokit client instance
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {Array<string>} paths - Array of file paths
 * @param {string} ref - Git ref (default: main)
 * @returns {Promise<Array>} - Array of {path, content, sha} objects (skips files that fail)
 */
export async function fetchMultipleFiles(octokit, owner, repo, paths, ref = 'main') {
  if (!paths || paths.length === 0) {
    return [];
  }

  console.log(`Fetching ${paths.length} files in parallel...`);

  // Fetch all files in parallel
  const results = await Promise.allSettled(
    paths.map(path => fetchFileContent(octokit, owner, repo, path, ref))
  );

  // Filter successful results
  const files = results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value);

  // Log failed fetches
  const failed = results.filter(result => result.status === 'rejected');
  if (failed.length > 0) {
    console.warn(`⚠️ Failed to fetch ${failed.length} files:`);
    failed.forEach((result, idx) => {
      console.warn(`  - ${paths[idx]}: ${result.reason?.message}`);
    });
  }

  console.log(`✅ Successfully fetched ${files.length}/${paths.length} files`);

  return files;
}

/**
 * Parse file paths from activation command
 *
 * Extracts file paths from commands like:
 * - "@claude fix src/Button.tsx"
 * - "@claude fix src/Button.tsx src/styles/button.css"
 *
 * @param {string} comment - Comment body
 * @returns {Array<string>} - Array of file paths (empty if none specified)
 */
export function parseFilePathsFromCommand(comment) {
  if (!comment) return [];

  // Find the activation command
  const match = comment.match(/@claude\s+fix\s+(.+?)(?:\n|$)/i);
  if (!match) {
    // Try /fix-issue command
    const altMatch = comment.match(/\/fix-issue\s+(.+?)(?:\n|$)/i);
    if (!altMatch) return [];
    return parseFilePaths(altMatch[1]);
  }

  return parseFilePaths(match[1]);
}

/**
 * Parse file paths from a string
 *
 * @param {string} text - Text containing file paths
 * @returns {Array<string>} - Array of file paths
 */
function parseFilePaths(text) {
  if (!text) return [];

  // Split by whitespace and filter out empty strings
  const paths = text
    .trim()
    .split(/\s+/)
    .filter(p => {
      // Keep only strings that look like file paths
      return p.length > 0 &&
             (p.includes('/') || p.includes('\\') || p.includes('.'));
    });

  return paths;
}

/**
 * Get relevant files for code fix generation
 *
 * For Phase 3: Use user-specified files from command
 * For Future: Intelligent discovery from issue description
 *
 * @param {Object} context - Request context (repository, issue, comment)
 * @param {Object} octokit - Octokit client instance
 * @returns {Promise<Array>} - Array of {path, content, sha} objects
 */
export async function getRelevantFiles(context, octokit) {
  // Parse file paths from comment
  const paths = parseFilePathsFromCommand(context.comment.body);

  if (paths.length === 0) {
    console.log('No file paths specified in command - Claude will determine necessary files');
    return [];
  }

  console.log(`User specified ${paths.length} file(s):`, paths);

  // Fetch the files
  const files = await fetchMultipleFiles(
    octokit,
    context.repository.owner,
    context.repository.name,
    paths
  );

  return files;
}

/**
 * Post comment to GitHub issue
 * (To be implemented in Phase 5)
 *
 * @param {Object} client - GitHub API client
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} issueNumber - Issue number
 * @param {string} body - Comment body (Markdown)
 * @returns {Promise<Object>} - Comment data
 */
export async function postIssueComment(client, owner, repo, issueNumber, body) {
  // TODO: Implement in Phase 5
  throw new Error('postIssueComment not yet implemented (Phase 5)');
}

/**
 * Add reaction to GitHub issue comment
 * (To be implemented in Phase 5)
 *
 * @param {Object} client - GitHub API client
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} commentId - Comment ID
 * @param {string} reaction - Reaction type ('+1', '-1', 'laugh', 'confused', 'heart', 'hooray', 'rocket', 'eyes')
 * @returns {Promise<Object>} - Reaction data
 */
export async function addReaction(client, owner, repo, commentId, reaction) {
  // TODO: Implement in Phase 5
  throw new Error('addReaction not yet implemented (Phase 5)');
}
