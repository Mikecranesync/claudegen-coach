/**
 * Prompt Construction Module
 *
 * Builds system and user prompts for Claude API calls.
 */

/**
 * Build system prompt with CLAUDE.md coding standards
 *
 * @param {string|null} claudeMd - CLAUDE.md content (null if not found)
 * @returns {string} - System prompt
 */
export function buildSystemPrompt(claudeMd) {
  const schemaDoc = `{
  "type": "object",
  "required": ["commit_title", "branch_name", "pr_description", "file_changes"],
  "properties": {
    "commit_title": {
      "type": "string",
      "maxLength": 72,
      "description": "Git commit title (format: 'type: Brief description')"
    },
    "branch_name": {
      "type": "string",
      "pattern": "^claude/fix-issue-[0-9]+$",
      "description": "Branch name (MUST include issue number)"
    },
    "pr_description": {
      "type": "string",
      "description": "Pull request description in Markdown"
    },
    "file_changes": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["path", "operation", "content"],
        "properties": {
          "path": { "type": "string" },
          "operation": { "enum": ["add", "modify", "delete"] },
          "content": { "type": "string", "description": "Full file content (UTF-8)" }
        }
      }
    }
  }
}`;

  let prompt = `You are an autonomous developer agent for the ClaudeGen Coach project.
Your task is to generate complete, working code fixes based on GitHub issue comments.

CRITICAL OUTPUT FORMAT:
You MUST respond with ONLY valid JSON matching this exact schema (no markdown, no explanations, just JSON):

${schemaDoc}

IMPORTANT JSON REQUIREMENTS:
- Output ONLY the JSON object, nothing else
- Do NOT wrap in markdown code blocks (\`\`\`json)
- Do NOT include any explanatory text before or after
- Ensure all strings are properly escaped
- The commit_title must follow conventional commits format (e.g., "fix: Update button padding")
- The branch_name MUST match pattern "claude/fix-issue-{number}"
- For file_changes, include the COMPLETE file content after modifications (not diffs)

`;

  // Add CLAUDE.md coding standards if available
  if (claudeMd) {
    prompt += `\n---\n\nPROJECT CODING STANDARDS (from CLAUDE.md):\n\n${claudeMd}\n\n---\n\n`;
    prompt += `CRITICAL: Follow ALL standards from CLAUDE.md strictly:\n`;
    prompt += `- Use TypeScript strict mode with explicit types\n`;
    prompt += `- Use path aliases (@/, @components/, etc.) for imports\n`;
    prompt += `- Follow React functional component patterns\n`;
    prompt += `- Use Zustand for state management\n`;
    prompt += `- Follow Tailwind CSS utility-first approach\n`;
    prompt += `- Include proper error handling (try-catch for async)\n`;
    prompt += `- Use naming conventions (camelCase, PascalCase as specified)\n`;
    prompt += `- Add JSDoc comments for exported functions\n`;
    prompt += `\n`;
  } else {
    prompt += `\nNOTE: CLAUDE.md not available - use general best practices.\n\n`;
  }

  prompt += `QUALITY REQUIREMENTS:
- Generate production-ready code (not pseudocode or placeholders)
- Include all necessary imports
- Follow existing code style and patterns
- Ensure TypeScript compiles without errors
- Add appropriate error handling
- Include helpful comments for complex logic
- Test code mentally before generating

REMEMBER: Output ONLY the JSON object. No other text.`;

  return prompt;
}

/**
 * Build user prompt with issue context and code
 *
 * @param {Object} context - Request context (repository, issue, comment)
 * @param {Array} relevantFiles - Array of {path, content, sha} objects
 * @returns {string} - User prompt
 */
export function buildUserPrompt(context, relevantFiles) {
  const { repository, issue, comment } = context;

  let prompt = `GITHUB ISSUE #${issue.number}: ${issue.title}\n\n`;

  // Add issue description if available
  if (issue.body && issue.body.trim()) {
    prompt += `Issue Description:\n${issue.body}\n\n`;
  }

  // Add user request from comment
  prompt += `User Request (from comment by @${comment.author}):\n${comment.body}\n\n`;

  // Add relevant code files
  if (relevantFiles && relevantFiles.length > 0) {
    prompt += `---\n\nRELEVANT CODE FILES:\n\n`;

    for (const file of relevantFiles) {
      const extension = file.path.split('.').pop() || '';
      const language = getLanguageForExtension(extension);

      prompt += `File: ${file.path}\n`;
      prompt += `\`\`\`${language}\n`;
      prompt += `${file.content}\n`;
      prompt += `\`\`\`\n\n`;
    }
  } else {
    prompt += `\nNOTE: No specific files provided. You may need to specify which files to modify in your response.\n\n`;
  }

  // Add task instructions
  prompt += `---\n\nTASK:\n`;
  prompt += `1. Analyze the user's request and the provided code\n`;
  prompt += `2. Generate the necessary code changes to address the issue\n`;
  prompt += `3. Ensure the branch_name includes the issue number: "claude/fix-issue-${issue.number}"\n`;
  prompt += `4. Output ONLY the JSON object (no markdown, no explanations)\n`;

  return prompt;
}

/**
 * Build retry prompt for failed JSON attempts
 *
 * @param {Object} previousResponse - Previous response that failed validation
 * @param {Array|string} validationError - Validation errors
 * @returns {string} - Retry prompt
 */
export function buildRetryPrompt(previousResponse, validationError) {
  let prompt = `Your previous response had validation errors.\n\n`;

  // Include specific errors
  if (Array.isArray(validationError)) {
    prompt += `Validation errors:\n`;
    validationError.forEach(err => {
      prompt += `- ${err}\n`;
    });
  } else {
    prompt += `Error: ${validationError}\n`;
  }

  // Show previous response (truncated if too long)
  let previousJson = 'N/A';
  try {
    previousJson = JSON.stringify(previousResponse, null, 2);
    if (previousJson.length > 1000) {
      previousJson = previousJson.substring(0, 1000) + '\n... (truncated)';
    }
  } catch (e) {
    previousJson = String(previousResponse).substring(0, 500);
  }

  prompt += `\nYour previous response:\n${previousJson}\n\n`;

  prompt += `---\n\nPlease generate a corrected response:\n`;
  prompt += `- Fix the validation errors listed above\n`;
  prompt += `- Ensure JSON is properly formatted\n`;
  prompt += `- Include all required fields: commit_title, branch_name, pr_description, file_changes\n`;
  prompt += `- Output ONLY valid JSON (no markdown code blocks, no extra text)\n`;

  return prompt;
}

/**
 * Get language identifier for syntax highlighting
 *
 * @param {string} extension - File extension
 * @returns {string} - Language identifier for code blocks
 */
function getLanguageForExtension(extension) {
  const languageMap = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    rb: 'ruby',
    java: 'java',
    go: 'go',
    rs: 'rust',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    php: 'php',
    html: 'html',
    css: 'css',
    scss: 'scss',
    json: 'json',
    md: 'markdown',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
    sh: 'bash',
    bash: 'bash',
    sql: 'sql',
  };

  return languageMap[extension] || extension;
}
