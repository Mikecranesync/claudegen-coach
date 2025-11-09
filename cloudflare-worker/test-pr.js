/**
 * Manual PR Creation Test
 *
 * Tests the Git Data API choreography independently of the webhook
 */

import { createAuthenticatedGitHubClient } from './lib/auth.js';
import { createPullRequest } from './lib/git-operations.js';

// Simulated environment (you'll need to pass real secrets)
const env = {
  GITHUB_APP_ID: process.env.GITHUB_APP_ID,
  GITHUB_APP_PRIVATE_KEY: process.env.GITHUB_APP_PRIVATE_KEY,
};

// Simulated context
const context = {
  repository: {
    owner: 'Mikecranesync',
    name: 'claudegen-coach',
    fullName: 'Mikecranesync/claudegen-coach',
  },
  issue: {
    number: 9,
    title: '[TEST] Manual PR Creation',
    body: 'Testing Git operations manually',
    url: 'https://github.com/Mikecranesync/claudegen-coach/issues/9',
  },
};

// Simulated code fix response
const codeFixResponse = {
  commit_title: 'test: Manual PR creation via test script',
  branch_name: 'claude/fix-issue-9-manual-test',
  pr_description: `# Manual PR Test

This PR was created manually using the test-pr.js script to verify:
- ✅ GitHub App authentication works
- ✅ Git Data API choreography works
- ✅ PR creation works

## Test Details
- Issue: #9
- Branch: claude/fix-issue-9-manual-test
- Files changed: 1

If you see this PR, the Git operations code is working correctly!

The issue is likely deployment/caching, not the code itself.`,
  file_changes: [
    {
      path: 'TEST-MANUAL-PR.md',
      operation: 'add',
      content: `# Manual PR Creation Test

This file was created by the test-pr.js script at ${new Date().toISOString()}.

If you see this file in a Pull Request, it means:
- ✅ GitHub App authentication is working
- ✅ Git Data API (blobs, trees, commits) is working
- ✅ Branch and PR creation is working

The problem is likely Cloudflare Workers deployment/caching, not the code.
`,
    },
  ],
};

async function test() {
  console.log('🧪 Manual PR Creation Test');
  console.log('=' .repeat(60));

  try {
    // Step 1: Authenticate
    console.log('\n1️⃣ Authenticating with GitHub App...');
    const octokit = await createAuthenticatedGitHubClient(
      env,
      context.repository.owner,
      context.repository.name
    );
    console.log('✅ Authenticated');

    // Step 2: Create PR
    console.log('\n2️⃣ Creating Pull Request...');
    const result = await createPullRequest(octokit, context, codeFixResponse);

    console.log('\n' + '=' .repeat(60));
    console.log('✅ SUCCESS!');
    console.log('=' .repeat(60));
    console.log(`PR #${result.pr_number}: ${result.pr_url}`);
    console.log(`Branch: ${result.branch_name}`);
    console.log(`Commit: ${result.commit_sha}`);
    console.log('=' .repeat(60));

    return result;
  } catch (error) {
    console.error('\n' + '=' .repeat(60));
    console.error('❌ TEST FAILED');
    console.error('=' .repeat(60));
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('=' .repeat(60));
    throw error;
  }
}

// Run test
test()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });
