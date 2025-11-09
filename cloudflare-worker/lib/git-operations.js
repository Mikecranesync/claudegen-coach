/**
 * Git Data API Operations
 *
 * Implements the 5-step GitHub Git Data API choreography for creating
 * branches, commits, and pull requests programmatically.
 *
 * Reference: https://docs.github.com/en/rest/git
 */

/**
 * Get the SHA of the latest commit on a branch
 *
 * @param {Object} octokit - Authenticated Octokit client
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} branch - Branch name (default: 'main')
 * @returns {Promise<string>} - Commit SHA
 */
async function getBaseCommitSHA(octokit, owner, repo, branch = 'main') {
  try {
    console.log(`\n📍 Step 1: Getting base commit SHA from ${branch}...`);

    const { data: ref } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });

    const baseSHA = ref.object.sha;
    console.log(`✅ Base commit SHA: ${baseSHA}`);

    return baseSHA;

  } catch (error) {
    // Try 'master' if 'main' doesn't exist
    if (branch === 'main' && error.status === 404) {
      console.log(`⚠️ 'main' branch not found, trying 'master'...`);
      return getBaseCommitSHA(octokit, owner, repo, 'master');
    }

    console.error('❌ Failed to get base commit SHA:', error);
    throw new Error(`Failed to get base commit from ${branch}: ${error.message}`);
  }
}

/**
 * Create Git blobs for file changes
 *
 * Blobs are the Git object type for file contents. We create one blob
 * per file change.
 *
 * @param {Object} octokit - Authenticated Octokit client
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {Array} fileChanges - Array of {path, operation, content}
 * @returns {Promise<Array>} - Array of {path, sha, mode, operation}
 */
async function createBlobs(octokit, owner, repo, fileChanges) {
  console.log(`\n📦 Step 2: Creating ${fileChanges.length} blob(s)...`);

  const blobs = [];

  for (const file of fileChanges) {
    try {
      // Skip blob creation for delete operations
      if (file.operation === 'delete') {
        console.log(`  ⊖ ${file.path} (delete - no blob needed)`);
        blobs.push({
          path: file.path,
          sha: null, // null SHA means delete in tree
          mode: '100644',
          operation: 'delete',
        });
        continue;
      }

      // Create blob with Base64-encoded content
      const { data: blob } = await octokit.rest.git.createBlob({
        owner,
        repo,
        content: Buffer.from(file.content, 'utf-8').toString('base64'),
        encoding: 'base64',
      });

      const icon = file.operation === 'add' ? '⊕' : '⊙';
      console.log(`  ${icon} ${file.path} → ${blob.sha.substring(0, 7)}`);

      blobs.push({
        path: file.path,
        sha: blob.sha,
        mode: '100644', // Regular file (non-executable)
        operation: file.operation,
      });

    } catch (error) {
      console.error(`❌ Failed to create blob for ${file.path}:`, error.message);
      throw new Error(`Blob creation failed for ${file.path}: ${error.message}`);
    }
  }

  console.log(`✅ Created ${blobs.length} blob(s)`);
  return blobs;
}

/**
 * Create a Git tree from blobs
 *
 * A tree is the Git object that represents a directory structure.
 * It contains references to blobs (files) and other trees (subdirectories).
 *
 * @param {Object} octokit - Authenticated Octokit client
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} baseTreeSHA - SHA of the base tree (from base commit)
 * @param {Array} blobs - Array of {path, sha, mode}
 * @returns {Promise<string>} - Tree SHA
 */
async function createTree(octokit, owner, repo, baseTreeSHA, blobs) {
  try {
    console.log(`\n🌳 Step 3: Creating tree (base: ${baseTreeSHA.substring(0, 7)})...`);

    // Build tree structure
    const tree = blobs.map(blob => ({
      path: blob.path,
      mode: blob.mode,
      type: 'blob',
      sha: blob.sha, // null for deletions
    }));

    const { data: newTree } = await octokit.rest.git.createTree({
      owner,
      repo,
      base_tree: baseTreeSHA,
      tree: tree,
    });

    console.log(`✅ Tree created: ${newTree.sha}`);
    return newTree.sha;

  } catch (error) {
    console.error('❌ Failed to create tree:', error);
    throw new Error(`Tree creation failed: ${error.message}`);
  }
}

/**
 * Create a Git commit
 *
 * A commit is a snapshot of the repository at a point in time.
 * It references a tree and has parent commit(s).
 *
 * @param {Object} octokit - Authenticated Octokit client
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} message - Commit message
 * @param {string} treeSHA - SHA of the tree to commit
 * @param {string} parentSHA - SHA of the parent commit
 * @returns {Promise<string>} - Commit SHA
 */
async function createCommit(octokit, owner, repo, message, treeSHA, parentSHA) {
  try {
    console.log(`\n📝 Step 4: Creating commit...`);
    console.log(`  Message: "${message}"`);
    console.log(`  Tree: ${treeSHA.substring(0, 7)}`);
    console.log(`  Parent: ${parentSHA.substring(0, 7)}`);

    const { data: commit } = await octokit.rest.git.createCommit({
      owner,
      repo,
      message: message,
      tree: treeSHA,
      parents: [parentSHA],
    });

    console.log(`✅ Commit created: ${commit.sha}`);
    return commit.sha;

  } catch (error) {
    console.error('❌ Failed to create commit:', error);
    throw new Error(`Commit creation failed: ${error.message}`);
  }
}

/**
 * Create a branch and pull request
 *
 * @param {Object} octokit - Authenticated Octokit client
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} branchName - Name of the new branch
 * @param {string} commitSHA - SHA of the commit for the branch
 * @param {string} baseBranch - Base branch for the PR (default: 'main')
 * @param {Object} prDetails - {title, body}
 * @returns {Promise<Object>} - {pr_number, pr_url}
 */
async function createBranchAndPR(octokit, owner, repo, branchName, commitSHA, baseBranch, prDetails) {
  try {
    console.log(`\n🌿 Step 5: Creating branch and pull request...`);
    console.log(`  Branch: ${branchName}`);
    console.log(`  Commit: ${commitSHA.substring(0, 7)}`);

    // Create branch
    await octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: commitSHA,
    });

    console.log(`✅ Branch created: ${branchName}`);

    // Create pull request
    console.log(`  Creating PR: "${prDetails.title}"...`);

    const { data: pr } = await octokit.rest.pulls.create({
      owner,
      repo,
      title: prDetails.title,
      head: branchName,
      base: baseBranch,
      body: prDetails.body,
    });

    console.log(`✅ Pull request created: #${pr.number}`);
    console.log(`  URL: ${pr.html_url}`);

    return {
      pr_number: pr.number,
      pr_url: pr.html_url,
    };

  } catch (error) {
    console.error('❌ Failed to create branch or PR:', error);

    // If branch already exists, try to create PR anyway
    if (error.message && error.message.includes('Reference already exists')) {
      console.log('⚠️ Branch already exists - attempting to create PR anyway...');

      try {
        const { data: pr } = await octokit.rest.pulls.create({
          owner,
          repo,
          title: prDetails.title,
          head: branchName,
          base: baseBranch,
          body: prDetails.body,
        });

        console.log(`✅ Pull request created: #${pr.number}`);
        return {
          pr_number: pr.number,
          pr_url: pr.html_url,
        };
      } catch (prError) {
        throw new Error(`PR creation failed: ${prError.message}`);
      }
    }

    throw new Error(`Branch/PR creation failed: ${error.message}`);
  }
}

/**
 * Main function: Create a pull request with code changes
 *
 * This orchestrates all 5 steps of the Git Data API:
 * 1. Get base commit SHA
 * 2. Create blobs for file changes
 * 3. Create tree from blobs
 * 4. Create commit
 * 5. Create branch + PR
 *
 * @param {Object} octokit - Authenticated Octokit client
 * @param {Object} context - Request context (repository, issue)
 * @param {Object} codeFixResponse - Response from Claude API
 * @returns {Promise<Object>} - {pr_number, pr_url, commit_sha, branch_name}
 */
export async function createPullRequest(octokit, context, codeFixResponse) {
  const startTime = Date.now();

  console.log('\n' + '='.repeat(60));
  console.log('🚀 Starting Git Data API choreography...');
  console.log('='.repeat(60));

  const owner = context.repository.owner;
  const repo = context.repository.name;
  const baseBranch = 'main'; // TODO: Make this configurable

  try {
    // Validate input
    if (!codeFixResponse.file_changes || codeFixResponse.file_changes.length === 0) {
      throw new Error('No file changes provided');
    }

    // Step 1: Get base commit SHA
    const baseCommitSHA = await getBaseCommitSHA(octokit, owner, repo, baseBranch);

    // Step 2: Create blobs
    const blobs = await createBlobs(octokit, owner, repo, codeFixResponse.file_changes);

    // Step 3: Create tree
    const treeSHA = await createTree(octokit, owner, repo, baseCommitSHA, blobs);

    // Step 4: Create commit
    const commitSHA = await createCommit(
      octokit,
      owner,
      repo,
      codeFixResponse.commit_title,
      treeSHA,
      baseCommitSHA
    );

    // Step 5: Create branch + PR
    const prResult = await createBranchAndPR(
      octokit,
      owner,
      repo,
      codeFixResponse.branch_name,
      commitSHA,
      baseBranch,
      {
        title: codeFixResponse.commit_title,
        body: codeFixResponse.pr_description,
      }
    );

    const duration = Date.now() - startTime;

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Git choreography completed in ${duration}ms`);
    console.log('='.repeat(60));
    console.log(`  Branch: ${codeFixResponse.branch_name}`);
    console.log(`  Commit: ${commitSHA.substring(0, 7)}`);
    console.log(`  PR #${prResult.pr_number}: ${prResult.pr_url}`);
    console.log('='.repeat(60) + '\n');

    return {
      pr_number: prResult.pr_number,
      pr_url: prResult.pr_url,
      commit_sha: commitSHA,
      branch_name: codeFixResponse.branch_name,
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('\n' + '='.repeat(60));
    console.error(`❌ Git choreography failed after ${duration}ms`);
    console.error('='.repeat(60));
    console.error(`  Error: ${error.message}`);
    console.error('='.repeat(60) + '\n');

    throw error;
  }
}
