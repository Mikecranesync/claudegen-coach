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
 * (To be implemented in Phase 3)
 *
 * @param {string} appId - GitHub App ID
 * @param {string} privateKey - GitHub App private key (PEM format)
 * @param {string} installationId - GitHub App installation ID
 * @returns {Object} - GitHub API client
 */
export function createGitHubClient(appId, privateKey, installationId) {
  // TODO: Implement in Phase 3
  // Will use @octokit/rest and jose for JWT authentication
  throw new Error('createGitHubClient not yet implemented (Phase 3)');
}

/**
 * Fetch file contents from GitHub repository
 * (To be implemented in Phase 3)
 *
 * @param {Object} client - GitHub API client
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} path - File path
 * @param {string} ref - Git ref (branch/commit SHA)
 * @returns {Promise<string>} - File contents (Base64 decoded)
 */
export async function fetchFileContent(client, owner, repo, path, ref = 'main') {
  // TODO: Implement in Phase 3
  throw new Error('fetchFileContent not yet implemented (Phase 3)');
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
