import type { ClaudePrompt } from '@/types/claude'

// RAG Library: Best practices and templates for Claude CLI prompts

export const STAGE_PROMPTS: Record<number, Partial<ClaudePrompt>> = {
  1: {
    stage: 1,
    systemPrompt: `You are an expert product strategist and market analyst. Your role is to help users refine their product ideas, identify target users, validate market fit, and analyze competition. Provide structured, actionable insights.`,
    userPrompt: `Analyze the following product idea and provide comprehensive feedback:\n\nConcept: {concept}\nTarget User: {targetUser}\nProblem: {problem}\n\nPlease provide:\n1. Refined product concept\n2. Market analysis and competitive landscape\n3. Business objectives and success metrics\n4. Validation recommendations`,
  },
  2: {
    stage: 2,
    systemPrompt: `You are a technical architect specializing in rapid prototyping. Generate proof-of-concept code and technical feasibility reports. Focus on minimal viable implementations that demonstrate core functionality.`,
    userPrompt: `Create a proof of concept for:\n\nConcept: {concept}\nKey Features: {features}\nTech Stack: {stack}\n\nGenerate:\n1. Technical feasibility assessment\n2. Basic PoC code snippets\n3. Viability confirmation with recommendations`,
  },
  3: {
    stage: 3,
    systemPrompt: `You are a product manager and technical specifications writer. Help users define features using the MoSCoW method, create user stories, and specify technical requirements in a structured format.`,
    userPrompt: `Based on the validated concept, create detailed specifications:\n\nProject: {projectName}\nConcept: {concept}\nTarget Features: {targetFeatures}\n\nProvide:\n1. Prioritized feature list (MoSCoW method) in JSON format\n2. User stories with acceptance criteria\n3. UI/UX requirements\n4. Technical architecture recommendations`,
  },
  4: {
    stage: 4,
    systemPrompt: `You are a Claude CLI configuration expert. Guide users through optimal parameter selection for code generation based on project complexity and requirements.`,
    userPrompt: `Configure Claude CLI for optimal code generation:\n\nProject Type: {projectType}\nComplexity: {complexity}\nLanguage: {language}\n\nRecommend:\n1. Optimal model selection\n2. Temperature and token settings\n3. Prompt engineering strategies\n4. Quality assurance approaches`,
  },
  5: {
    stage: 5,
    systemPrompt: `You are a senior software engineer and code reviewer. Generate production-ready code based on specifications, including comprehensive test plans and QA checklists. Follow best practices and coding standards.`,
    userPrompt: `Generate complete, production-ready code for:\n\nSpecifications: {specifications}\nFeatures: {features}\nStack: {stack}\nParameters: {parameters}\n\nDeliver:\n1. Fully functional code files with proper structure\n2. Comprehensive QA/UAT test plan\n3. Known issues and risk assessment\n4. Implementation notes`,
  },
  6: {
    stage: 6,
    systemPrompt: `You are a workflow automation expert and technical documentation specialist. Create n8n workflow JSON configurations and comprehensive README documentation for project deployment and maintenance.`,
    userPrompt: `Create automation and documentation for:\n\nProject: {projectName}\nGenerated Code: {codeStructure}\nFeatures: {features}\n\nGenerate:\n1. n8n workflow JSON for common automation tasks\n2. Comprehensive README.md with setup instructions\n3. Project summary and license information\n4. Deployment preparation checklist`,
  },
}

// Template helpers
export const buildPromptFromTemplate = (
  stageId: number,
  variables: Record<string, string>
): string => {
  const template = STAGE_PROMPTS[stageId]
  if (!template?.userPrompt) return ''

  let prompt = template.userPrompt

  Object.entries(variables).forEach(([key, value]) => {
    prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
  })

  return prompt
}

export const getSystemPrompt = (stageId: number): string => {
  return STAGE_PROMPTS[stageId]?.systemPrompt || ''
}

// Knowledge base: Common patterns and best practices
export const BEST_PRACTICES = {
  codeGeneration: [
    'Always include error handling and validation',
    'Follow language-specific style guides',
    'Include comments for complex logic',
    'Ensure code is modular and reusable',
    'Add TypeScript types for type safety',
  ],
  testing: [
    'Write unit tests for critical functions',
    'Include integration test scenarios',
    'Document test coverage expectations',
    'Specify edge cases and error scenarios',
  ],
  documentation: [
    'Include clear setup instructions',
    'Document all environment variables',
    'Provide usage examples',
    'List dependencies and version requirements',
    'Include troubleshooting section',
  ],
}
