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

  // Step 7: Process the request (TODO: Phase 3)
  // For now, just log that we would process it
  console.log('TODO: Call processFixRequest() in Phase 3');
  console.log(`Extracted command: ${comment}`);

  // For Phase 2, return success without actually processing
  const duration = Date.now() - startTime;
  console.log(`✅ Webhook processed in ${duration}ms`);

  return new Response(JSON.stringify({
    status: 'received',
    message: 'Webhook validated and parsed successfully (Phase 2)',
    context: {
      repository: context.repository.fullName,
      issue: context.issue.number,
      command_detected: true,
    },
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
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
