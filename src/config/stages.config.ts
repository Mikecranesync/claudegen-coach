import type { ValidationGate } from '@/types/stage'

export const stageValidationGates: Record<number, ValidationGate> = {
  1: {
    stageId: 1,
    requirements: [
      {
        id: 'concept-defined',
        description: 'Core concept must be defined',
        validator: () => true, // Implement actual validation
        met: false,
      },
      {
        id: 'target-user-defined',
        description: 'Target user must be specified',
        validator: () => true,
        met: false,
      },
      {
        id: 'problem-defined',
        description: 'Problem statement must be clear',
        validator: () => true,
        met: false,
      },
    ],
    passed: false,
  },
  2: {
    stageId: 2,
    requirements: [
      {
        id: 'poc-generated',
        description: 'Proof of concept code must be generated',
        validator: () => true,
        met: false,
      },
      {
        id: 'viability-confirmed',
        description: 'Technical viability must be confirmed',
        validator: () => true,
        met: false,
      },
    ],
    passed: false,
  },
  3: {
    stageId: 3,
    requirements: [
      {
        id: 'features-defined',
        description: 'At least one feature must be defined',
        validator: () => true,
        met: false,
      },
      {
        id: 'stack-selected',
        description: 'Technology stack must be chosen',
        validator: () => true,
        met: false,
      },
    ],
    passed: false,
  },
  4: {
    stageId: 4,
    requirements: [
      {
        id: 'claude-connected',
        description: 'Claude CLI must be connected',
        validator: () => true,
        met: false,
      },
      {
        id: 'parameters-set',
        description: 'Generation parameters must be configured',
        validator: () => true,
        met: false,
      },
    ],
    passed: false,
  },
  5: {
    stageId: 5,
    requirements: [
      {
        id: 'code-generated',
        description: 'Code must be successfully generated',
        validator: () => true,
        met: false,
      },
      {
        id: 'qa-passed',
        description: 'QA checklist must be completed',
        validator: () => true,
        met: false,
      },
    ],
    passed: false,
  },
  6: {
    stageId: 6,
    requirements: [
      {
        id: 'workflow-created',
        description: 'n8n workflow must be generated',
        validator: () => true,
        met: false,
      },
      {
        id: 'readme-generated',
        description: 'README documentation must be created',
        validator: () => true,
        met: false,
      },
    ],
    passed: false,
  },
}
