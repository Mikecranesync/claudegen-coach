/**
 * Autonomous GitHub Issue Fix Bot - Cloudflare Worker
 *
 * This worker listens for GitHub issue comment webhooks and automatically
 * creates Pull Requests with code fixes using Claude AI.
 *
 * Architecture: Serverless webhook-driven agent (Phase 2: Infrastructure)
 * Reference: Autonomous Claude GitHub Issue Fixes.pdf
 */

import { verifyWebhookSignature } from './lib/github.js';

/**
 * Main worker handler - responds to all HTTP requests
 */
export default {
  async fetch(request, env, ctx) {
    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Only handle webhook endpoint
    const url = new URL(request.url);
    if (url.pathname !== '/webhook') {
      return new Response('Not found', { status: 404 });
    }

    try {
      // Handle webhook
      return await handleWebhook(request, env);
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal server error', {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: error.message })
      });
    }
  }
};

/**
 * Handle incoming GitHub webhook
 */
async function handleWebhook(request, env) {
  const startTime = Date.now();

  // Step 1: Verify webhook signature
  const signature = request.headers.get('x-hub-signature-256');
  const event = request.headers.get('x-github-event');
  const delivery = request.headers.get('x-github-delivery');

  console.log(`[${delivery}] Received webhook: ${event}`);

  if (!signature) {
    console.error('Missing webhook signature');
    return new Response('Forbidden: Missing signature', { status: 403 });
  }

  // Read request body
  const body = await request.text();

  // Verify signature using webhook secret
  const isValid = await verifyWebhookSignature(
    body,
    signature,
    env.WEBHOOK_SECRET
  );

  if (!isValid) {
    console.error('Invalid webhook signature');
    return new Response('Forbidden: Invalid signature', { status: 403 });
  }

  console.log('✅ Signature validated');

  // Step 2: Parse payload
  let payload;
  try {
    payload = JSON.parse(body);
  } catch (error) {
    console.error('Failed to parse JSON payload:', error);
    return new Response('Bad request: Invalid JSON', { status: 400 });
  }

  // Step 3: Filter for issue_comment events only
  if (event !== 'issue_comment') {
    console.log(`Ignoring event type: ${event}`);
    return new Response('OK: Event ignored', { status: 200 });
  }

  // Step 4: Only process 'created' actions (ignore edited, deleted)
  if (payload.action !== 'created') {
    console.log(`Ignoring action: ${payload.action}`);
    return new Response('OK: Action ignored', { status: 200 });
  }

  // Step 5: Check for activation command
  const comment = payload.comment?.body || '';
  const hasActivationCommand = checkActivationCommand(comment);

  if (!hasActivationCommand) {
    console.log('No activation command found - early exit');
    return new Response('OK: No activation command', { status: 200 });
  }

  console.log('🤖 Activation command detected!');

  // Step 6: Extract context
  const context = {
    repository: {
      owner: payload.repository.owner.login,
      name: payload.repository.name,
      fullName: payload.repository.full_name,
    },
    issue: {
      number: payload.issue.number,
      title: payload.issue.title,
      body: payload.issue.body,
      url: payload.issue.html_url,
    },
    comment: {
      id: payload.comment.id,
      body: comment,
      author: payload.comment.user.login,
      url: payload.comment.html_url,
    },
  };

  console.log(`Repository: ${context.repository.fullName}`);
  console.log(`Issue #${context.issue.number}: ${context.issue.title}`);
  console.log(`Comment by: ${context.comment.author}`);

  // Step 7: Process the fix request (Phase 3)
  try {
    console.log('👀 Processing fix request...');

    // Import required modules
    const { getCachedClaudeMd, getRelevantFiles } = await import('./lib/github.js');
    const { createClaudeClient, generateCodeFixWithRetry } = await import('./lib/claude.js');
    const { createAuthenticatedGitHubClient } = await import('./lib/auth.js');
    const { createPullRequest } = await import('./lib/git-operations.js');

    // Initialize GitHub client with App authentication
    const octokit = await createAuthenticatedGitHubClient(
      env,
      context.repository.owner,
      context.repository.name
    );
    console.log('✅ GitHub client initialized with App authentication');

    // Fetch CLAUDE.md coding standards
    console.log('Fetching CLAUDE.md...');
    const claudeMd = await getCachedClaudeMd(
      env,
      octokit,
      context.repository.owner,
      context.repository.name
    );

    if (!claudeMd) {
      console.warn('⚠️ CLAUDE.md not found - proceeding without coding standards');
    } else {
      console.log(`✅ CLAUDE.md loaded (${claudeMd.length} chars)`);
    }

    // Get relevant files from user command
    console.log('Fetching relevant files...');
    const relevantFiles = await getRelevantFiles(context, octokit);
    console.log(`✅ Found ${relevantFiles.length} relevant file(s)`);

    // Initialize Claude client
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured. Set with: wrangler secret put ANTHROPIC_API_KEY');
    }

    const claudeClient = createClaudeClient(env.ANTHROPIC_API_KEY);
    console.log('✅ Claude client initialized');

    // Generate code fix with retry logic
    console.log('🧠 Calling Claude API...');
    const codeFixResponse = await generateCodeFixWithRetry(
      claudeClient,
      context,
      claudeMd,
      relevantFiles,
      3 // max 3 attempts
    );

    console.log('✅ Code fix generated successfully');
    console.log(`  Branch: ${codeFixResponse.branch_name}`);
    console.log(`  Commit: ${codeFixResponse.commit_title}`);
    console.log(`  Files changed: ${codeFixResponse.file_changes.length}`);
    if (codeFixResponse._meta) {
      console.log(`  Model: ${codeFixResponse._meta.model}`);
      console.log(`  Tokens: ${codeFixResponse._meta.tokens.input} in / ${codeFixResponse._meta.tokens.output} out`);
      if (codeFixResponse._meta.attempts > 1) {
        console.log(`  Attempts: ${codeFixResponse._meta.attempts}`);
      }
    }

    // Phase 4: Create Pull Request
    console.log('\n📝 Creating Pull Request...');
    const prResult = await createPullRequest(octokit, context, codeFixResponse);

    // Return success
    const duration = Date.now() - startTime;
    console.log(`\n✅ Phase 4 completed successfully in ${duration}ms`);

    return new Response(JSON.stringify({
      status: 'success',
      phase: 'phase-4-complete',
      message: `Pull request created successfully: #${prResult.pr_number}`,
      context: {
        repository: context.repository.fullName,
        issue: context.issue.number,
        pull_request: {
          number: prResult.pr_number,
          url: prResult.pr_url,
          branch: prResult.branch_name,
          commit_sha: prResult.commit_sha,
        },
        commit_title: codeFixResponse.commit_title,
        files_changed: codeFixResponse.file_changes.length,
        duration_ms: duration,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Processing failed:', error);
    console.error('Stack trace:', error.stack);

    // TODO Phase 5: Post error comment to issue
    console.log('\n📋 TODO Phase 5: Post error comment to GitHub issue');

    const duration = Date.now() - startTime;
    return new Response(JSON.stringify({
      status: 'error',
      phase: 'phase-4',
      message: error.message,
      duration_ms: duration,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Check if comment contains activation command
 *
 * Supported commands:
 * - @claude fix
 * - @claude fix <file_path>
 * - /fix-issue
 *
 * @param {string} comment - The comment body
 * @returns {boolean} - True if activation command found
 */
function checkActivationCommand(comment) {
  if (!comment) return false;

  const lowerComment = comment.toLowerCase();

  // Check for @claude fix command
  if (lowerComment.includes('@claude fix')) {
    return true;
  }

  // Check for /fix-issue slash command
  if (lowerComment.includes('/fix-issue')) {
    return true;
  }

  return false;
}
