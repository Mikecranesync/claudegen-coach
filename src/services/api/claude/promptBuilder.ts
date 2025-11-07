import type { Stage1Data, Stage2Data, Stage3Data } from '@/types/project'
import { getSystemPrompt, buildPromptFromTemplate } from '@config/prompts.config'

export class PromptBuilder {
  // Stage 1: Idea Management
  static buildStage1Prompt(data: Partial<Stage1Data>): string {
    const variables = {
      concept: data.concept || '',
      targetUser: data.targetUser || '',
      problem: data.problem || '',
    }

    return buildPromptFromTemplate(1, variables)
  }

  // Stage 2: Concept Validation
  static buildStage2Prompt(
    stage1Data: Partial<Stage1Data>,
    additionalContext?: string
  ): string {
    const variables = {
      concept: stage1Data.concept || '',
      features: additionalContext || '',
      stack: 'React, TypeScript', // Default or from context
    }

    return buildPromptFromTemplate(2, variables)
  }

  // Stage 3: Specification
  static buildStage3Prompt(
    stage1Data: Partial<Stage1Data>,
    targetFeatures?: string
  ): string {
    const variables = {
      projectName: 'New Project',
      concept: stage1Data.concept || '',
      targetFeatures: targetFeatures || '',
    }

    return buildPromptFromTemplate(3, variables)
  }

  // Stage 5: Code Generation (combines stages 1-3)
  static buildCodeGenerationPrompt(
    stage1Data: Partial<Stage1Data>,
    stage3Data: Partial<Stage3Data>
  ): string {
    const specifications = JSON.stringify({
      concept: stage1Data.concept,
      targetUser: stage1Data.targetUser,
      problem: stage1Data.problem,
      features: stage3Data.features,
      uiRequirements: stage3Data.uiRequirements,
      userStories: stage3Data.userStories,
    }, null, 2)

    const variables = {
      specifications,
      features: JSON.stringify(stage3Data.features, null, 2),
      stack: JSON.stringify(stage3Data.stack, null, 2),
      parameters: 'Standard configuration',
    }

    return buildPromptFromTemplate(5, variables)
  }

  // Stage 6: Automation & Documentation
  static buildAutomationPrompt(
    projectName: string,
    codeStructure: string,
    features: any[]
  ): string {
    const variables = {
      projectName,
      codeStructure,
      features: JSON.stringify(features, null, 2),
    }

    return buildPromptFromTemplate(6, variables)
  }

  // Get system prompt for a stage
  static getSystemPromptForStage(stageId: number): string {
    return getSystemPrompt(stageId)
  }

  // Concatenate context from multiple stages
  static buildContextualPrompt(
    stageId: number,
    allStageData: {
      stage1?: Partial<Stage1Data>
      stage2?: Partial<Stage2Data>
      stage3?: Partial<Stage3Data>
    }
  ): { systemPrompt: string; userPrompt: string } {
    const systemPrompt = this.getSystemPromptForStage(stageId)
    let userPrompt = ''

    // Build context from previous stages
    const context: string[] = []

    if (allStageData.stage1) {
      context.push(`**Project Concept:**\n${JSON.stringify(allStageData.stage1, null, 2)}`)
    }

    if (allStageData.stage2) {
      context.push(`**Validation Results:**\n${JSON.stringify(allStageData.stage2, null, 2)}`)
    }

    if (allStageData.stage3) {
      context.push(`**Specifications:**\n${JSON.stringify(allStageData.stage3, null, 2)}`)
    }

    userPrompt = context.join('\n\n')

    return { systemPrompt, userPrompt }
  }
}
