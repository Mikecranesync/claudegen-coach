/**
 * GitHub App Authentication
 *
 * Handles JWT generation and installation token exchange for GitHub App authentication.
 * Implements token caching to minimize API calls.
 */

import { SignJWT, importPKCS8 } from 'jose';
import { Octokit } from '@octokit/rest';

/**
 * In-memory token cache
 * Format: { token: string, expiresAt: number }
 */
let tokenCache = null;

/**
 * Generate JWT for GitHub App authentication
 *
 * GitHub Apps use JWT for authentication. The JWT is signed with the App's
 * private key and includes the App ID and expiration time.
 *
 * @param {string} appId - GitHub App ID
 * @param {string} privateKey - Private key in PEM format
 * @returns {Promise<string>} - Signed JWT token
 */
async function generateJWT(appId, privateKey) {
  try {
    console.log('🔐 Generating JWT for GitHub App authentication...');

    // Ensure private key has proper formatting
    let formattedKey = privateKey.trim();

    // Add header/footer if missing
    if (!formattedKey.startsWith('-----BEGIN')) {
      formattedKey = `-----BEGIN PRIVATE KEY-----\n${formattedKey}\n-----END PRIVATE KEY-----`;
    }

    // Import private key
    const privateKeyObj = await importPKCS8(formattedKey, 'RS256');

    // Create JWT with 10-minute expiration (GitHub's maximum)
    const now = Math.floor(Date.now() / 1000);
    const jwt = await new SignJWT({})
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuedAt(now)
      .setExpirationTime(now + 600) // 10 minutes
      .setIssuer(appId)
      .sign(privateKeyObj);

    console.log('✅ JWT generated successfully');
    return jwt;

  } catch (error) {
    console.error('❌ Failed to generate JWT:', error);
    throw new Error(`JWT generation failed: ${error.message}`);
  }
}

/**
 * Get installation ID for a repository
 *
 * @param {Octokit} octokit - Octokit client authenticated with JWT
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<number>} - Installation ID
 */
async function getInstallationId(octokit, owner, repo) {
  try {
    console.log(`🔍 Getting installation ID for ${owner}/${repo}...`);

    const { data: installation } = await octokit.rest.apps.getRepoInstallation({
      owner,
      repo,
    });

    console.log(`✅ Installation ID: ${installation.id}`);
    return installation.id;

  } catch (error) {
    console.error('❌ Failed to get installation ID:', error);
    throw new Error(`Installation not found for ${owner}/${repo}: ${error.message}`);
  }
}

/**
 * Exchange JWT for installation access token
 *
 * Installation tokens are scoped to a specific repository installation
 * and expire after 1 hour.
 *
 * @param {string} jwt - GitHub App JWT
 * @param {number} installationId - Installation ID
 * @returns {Promise<string>} - Installation access token
 */
async function getInstallationToken(jwt, installationId) {
  try {
    console.log(`🔑 Exchanging JWT for installation token (ID: ${installationId})...`);

    // Create temporary Octokit client with JWT
    const octokitWithJWT = new Octokit({
      auth: jwt,
    });

    // Exchange JWT for installation token
    const { data } = await octokitWithJWT.rest.apps.createInstallationAccessToken({
      installation_id: installationId,
    });

    console.log(`✅ Installation token acquired (expires: ${data.expires_at})`);

    return {
      token: data.token,
      expiresAt: new Date(data.expires_at).getTime(),
    };

  } catch (error) {
    console.error('❌ Failed to get installation token:', error);
    throw new Error(`Installation token exchange failed: ${error.message}`);
  }
}

/**
 * Get GitHub App installation token with caching
 *
 * This is the main function to call for authentication. It handles:
 * 1. Token caching (to avoid excessive API calls)
 * 2. JWT generation
 * 3. Installation ID lookup
 * 4. Token exchange
 *
 * @param {Object} env - Worker environment variables
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<string>} - Installation access token
 */
export async function getGitHubAppToken(env, owner, repo) {
  // Validate required environment variables
  if (!env.GITHUB_APP_ID) {
    throw new Error('GITHUB_APP_ID not configured. Set with: wrangler secret put GITHUB_APP_ID');
  }
  if (!env.GITHUB_APP_PRIVATE_KEY) {
    throw new Error('GITHUB_APP_PRIVATE_KEY not configured. Set with: wrangler secret put GITHUB_APP_PRIVATE_KEY');
  }

  // Check cache (with 5-minute buffer before expiration)
  const now = Date.now();
  const BUFFER_MS = 5 * 60 * 1000; // 5 minutes

  if (tokenCache && tokenCache.expiresAt > (now + BUFFER_MS)) {
    console.log('✅ Using cached installation token');
    return tokenCache.token;
  }

  console.log('🔄 Cache miss or expired - fetching new installation token');

  // Generate JWT
  const jwt = await generateJWT(env.GITHUB_APP_ID, env.GITHUB_APP_PRIVATE_KEY);

  // Get installation ID
  const octokitWithJWT = new Octokit({ auth: jwt });
  const installationId = await getInstallationId(octokitWithJWT, owner, repo);

  // Exchange JWT for installation token
  const tokenData = await getInstallationToken(jwt, installationId);

  // Cache the token
  tokenCache = tokenData;

  return tokenData.token;
}

/**
 * Create authenticated GitHub API client
 *
 * This is a convenience wrapper that:
 * 1. Gets an installation token
 * 2. Creates an Octokit client with that token
 *
 * @param {Object} env - Worker environment variables
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<Octokit>} - Authenticated Octokit client
 */
export async function createAuthenticatedGitHubClient(env, owner, repo) {
  console.log('🔧 Creating authenticated GitHub client...');

  const token = await getGitHubAppToken(env, owner, repo);

  const octokit = new Octokit({
    auth: token,
  });

  console.log('✅ GitHub client created with installation token');

  return octokit;
}

/**
 * Clear token cache (for testing purposes)
 */
export function clearTokenCache() {
  tokenCache = null;
  console.log('🗑️ Token cache cleared');
}
