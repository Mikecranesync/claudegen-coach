/**
 * Claude API Client
 *
 * Handles interaction with the Anthropic Claude API for generating code fixes.
 */

import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, buildUserPrompt, buildRetryPrompt } from './prompts.js';

/**
 * Supported Claude models in priority order
 * Falls back to next model if current one returns 404
 */
const CLAUDE_MODELS = [
  'claude-3-5-sonnet-20241022',  // Sonnet 3.5 (Oct 2024) - Latest
  'claude-3-5-sonnet-20240620',  // Sonnet 3.5 (Jun 2024) - Stable
  'claude-3-7-sonnet-20250219',  // Sonnet 3.7 (Feb 2025) - Fallback (deprecated)
];

/**
 * JSON schema for Claude's structured output
 * Ensures responses contain all required fields for Git operations
 */
const CODE_FIX_SCHEMA = {
  type: 'object',
  required: ['commit_title', 'branch_name', 'pr_description', 'file_changes'],
  properties: {
    commit_title: {
      type: 'string',
      maxLength: 72,
      description: 'Git commit title (max 72 chars)',
    },
    branch_name: {
      type: 'string',
      pattern: '^claude/fix-issue-[0-9]+',
      description: 'Branch name (format: claude/fix-issue-123)',
    },
    pr_description: {
      type: 'string',
      description: 'Pull request description (Markdown)',
    },
    file_changes: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['path', 'operation', 'content'],
        properties: {
          path: {
            type: 'string',
            description: 'File path relative to repository root',
          },
          operation: {
            type: 'string',
            enum: ['add', 'modify', 'delete'],
            description: 'Type of file operation',
          },
          content: {
            type: 'string',
            description: 'File content (UTF-8 string, will be base64 encoded for Git)',
          },
        },
      },
    },
  },
};

/**
 * Create and configure Anthropic Claude client
 *
 * @param {string} apiKey - Anthropic API key
 * @returns {Anthropic} - Configured client instance
 */
export function createClaudeClient(apiKey) {
  if (!apiKey) {
    throw new Error('Anthropic API key is required');
  }

  return new Anthropic({
    apiKey: apiKey,
  });
}

/**
 * Generate code fix using Claude API
 *
 * @param {Anthropic} client - Anthropic client instance
 * @param {Object} context - Request context (repository, issue, comment)
 * @param {string} claudeMd - CLAUDE.md content (coding standards)
 * @param {Array} relevantFiles - Array of {path, content, sha} objects
 * @param {string} model - Claude model to use (defaults to first in CLAUDE_MODELS)
 * @returns {Promise<Object>} - Structured code fix response
 */
export async function generateCodeFix(client, context, claudeMd, relevantFiles, model = CLAUDE_MODELS[0]) {
  const systemPrompt = buildSystemPrompt(claudeMd);
  const userPrompt = buildUserPrompt(context, relevantFiles);

  console.log('📝 Prompts constructed:');
  console.log(`  System prompt: ${systemPrompt.length} chars`);
  console.log(`  User prompt: ${userPrompt.length} chars`);
  console.log(`  Model: ${model}`);

  try {
    // Call Claude API
    const response = await client.messages.create({
      model: model,
      max_tokens: 16000, // Allow for complex fixes
      temperature: 0.7, // Balance creativity and consistency
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // Extract response content
    const content = response.content[0].text;

    console.log('🤖 Claude responded:');
    console.log(`  Model: ${response.model}`);
    console.log(`  Tokens - Input: ${response.usage.input_tokens}, Output: ${response.usage.output_tokens}`);
    console.log(`  Stop reason: ${response.stop_reason}`);
    console.log(`  Content length: ${content.length} chars`);

    // Parse JSON response
    const parsedResponse = parseClaudeResponse(content);

    return {
      ...parsedResponse,
      _meta: {
        model: response.model,
        tokens: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
        },
      },
    };
  } catch (error) {
    console.error('❌ Claude API error:', error);
    throw new Error(`Claude API failed: ${error.message}`);
  }
}

/**
 * Generate code fix with retry logic for malformed JSON and model fallback
 *
 * @param {Anthropic} client - Anthropic client instance
 * @param {Object} context - Request context
 * @param {string} claudeMd - CLAUDE.md content
 * @param {Array} relevantFiles - Array of file objects
 * @param {number} maxAttempts - Maximum retry attempts (default: 3)
 * @returns {Promise<Object>} - Validated code fix response
 */
export async function generateCodeFixWithRetry(
  client,
  context,
  claudeMd,
  relevantFiles,
  maxAttempts = 3
) {
  let lastError = null;
  let lastResponse = null;
  let modelIndex = 0; // Track which model we're using

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`\n🔄 Attempt ${attempt}/${maxAttempts}`);

    try {
      // Select current model (fallback on 404 errors)
      const currentModel = CLAUDE_MODELS[modelIndex];

      // First attempt: use normal prompts
      if (attempt === 1) {
        const response = await generateCodeFix(client, context, claudeMd, relevantFiles, currentModel);

        // Validate response
        const validation = validateCodeFixResponse(response);
        if (validation.valid) {
          console.log(`✅ Valid response on attempt ${attempt}`);
          return response;
        }

        // Invalid but we'll retry
        lastError = validation.errors;
        lastResponse = response;
        console.warn(`⚠️ Validation failed: ${validation.errors.join(', ')}`);

      } else {
        // Retry attempts: enhance prompt with previous error
        const retryPrompt = buildRetryPrompt(lastResponse, lastError);

        const systemPrompt = buildSystemPrompt(claudeMd);
        console.log(`  Using model: ${currentModel}`);
        const response = await client.messages.create({
          model: currentModel,
          max_tokens: 16000,
          temperature: 0.7,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: retryPrompt,
            },
          ],
        });

        const content = response.content[0].text;
        const parsedResponse = parseClaudeResponse(content);

        const validation = validateCodeFixResponse(parsedResponse);
        if (validation.valid) {
          console.log(`✅ Valid response on attempt ${attempt}`);
          return {
            ...parsedResponse,
            _meta: {
              model: response.model,
              tokens: {
                input: response.usage.input_tokens,
                output: response.usage.output_tokens,
              },
              attempts: attempt,
            },
          };
        }

        lastError = validation.errors;
        lastResponse = parsedResponse;
        console.warn(`⚠️ Retry ${attempt} validation failed: ${validation.errors.join(', ')}`);
      }

    } catch (error) {
      console.error(`❌ Attempt ${attempt} error:`, error.message);
      lastError = error.message;

      // Check if it's a 404 model not found error
      const is404 = error.message && error.message.includes('404');
      const isModelNotFound = error.message && error.message.includes('not_found_error');

      if (is404 && isModelNotFound && modelIndex < CLAUDE_MODELS.length - 1) {
        // Try next model in fallback array
        modelIndex++;
        console.log(`⚠️ Model not found, falling back to: ${CLAUDE_MODELS[modelIndex]}`);
        // Don't count this as a failed attempt, retry with new model
        attempt--;
        continue;
      }

      if (attempt === maxAttempts) {
        throw error;
      }
    }
  }

  // All attempts exhausted
  throw new Error(
    `Failed to generate valid code fix after ${maxAttempts} attempts. ` +
    `Last error: ${Array.isArray(lastError) ? lastError.join(', ') : lastError}`
  );
}

/**
 * Parse Claude's response and extract JSON
 * Handles cases where Claude wraps JSON in markdown code blocks
 *
 * @param {string} content - Raw response content
 * @returns {Object} - Parsed JSON object
 */
function parseClaudeResponse(content) {
  if (!content || typeof content !== 'string') {
    throw new Error('Invalid response content');
  }

  // Remove markdown code fences if present
  let cleaned = content.trim();

  // Remove ```json or ``` markers
  cleaned = cleaned.replace(/^```json?\n?/i, '');
  cleaned = cleaned.replace(/\n?```$/, '');
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Failed to parse JSON:', error.message);
    console.error('Content preview:', cleaned.substring(0, 200));
    throw new Error(`Invalid JSON response: ${error.message}`);
  }
}

/**
 * Validate code fix response against JSON schema
 * Manual validation (Cloudflare Workers doesn't support AJV code generation)
 *
 * @param {Object} response - Parsed response object
 * @returns {Object} - {valid: boolean, errors: string[]}
 */
export function validateCodeFixResponse(response) {
  const errors = [];

  // Check required fields
  if (!response || typeof response !== 'object') {
    return { valid: false, errors: ['Response must be an object'] };
  }

  if (!response.commit_title || typeof response.commit_title !== 'string') {
    errors.push('commit_title is required and must be a string');
  } else if (response.commit_title.length > 72) {
    errors.push('commit_title must be 72 characters or less');
  }

  if (!response.branch_name || typeof response.branch_name !== 'string') {
    errors.push('branch_name is required and must be a string');
  } else if (!/^claude\/fix-issue-[0-9]+$/.test(response.branch_name)) {
    errors.push('branch_name must match pattern: claude/fix-issue-{number}');
  }

  if (!response.pr_description || typeof response.pr_description !== 'string') {
    errors.push('pr_description is required and must be a string');
  }

  if (!Array.isArray(response.file_changes)) {
    errors.push('file_changes is required and must be an array');
  } else if (response.file_changes.length === 0) {
    errors.push('file_changes must contain at least one item');
  } else {
    // Validate each file change
    response.file_changes.forEach((file, index) => {
      if (!file.path || typeof file.path !== 'string') {
        errors.push(`file_changes[${index}].path is required and must be a string`);
      }
      if (!['add', 'modify', 'delete'].includes(file.operation)) {
        errors.push(`file_changes[${index}].operation must be 'add', 'modify', or 'delete'`);
      }
      if (typeof file.content !== 'string') {
        errors.push(`file_changes[${index}].content must be a string`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors: errors,
  };
}
