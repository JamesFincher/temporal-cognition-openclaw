import { describe, expect, test } from 'bun:test';
import { TaskTimeEstimator } from '../src/engines/task-estimator';
import { BASE_DURATION_MS, COMPLEXITY_MULTIPLIERS } from '../src/constants';
import { TaskHistoryEntry, TemporalCognitionState } from '../src/types';

const now = Date.now();

function createState(taskHistory: TaskHistoryEntry[] = []): TemporalCognitionState {
  return {
    version: '1.1.0',
    initialized: true,
    timePerception: {
      bootTime: now,
      totalTicks: 0,
      totalCycles: 0,
    },
    taskHistory,
    activeTasks: {},
    scheduledTasks: [],
    cycleState: {
      currentPhase: 'active',
      phaseStartedAt: now,
      nextPhaseAt: now + 3600000,
      nextPhase: 'passive',
      userActivityLevel: 1,
      adaptedSchedule: false,
    },
    syncState: {
      lastSyncAt: now,
      channels: {},
      globalPhase: 'active',
      taskQueueHash: '',
    },
    memoryIndex: {},
  };
}

function createHistoryEntry(index: number, actualMs: number): TaskHistoryEntry {
  return {
    taskId: `history_${index}`,
    category: 'coding',
    complexity: 'simple',
    estimatedMs: actualMs,
    actualMs,
    accuracy: 1,
    timestamp: now - index * 60000,
    sessionId: 'test_session',
  };
}

describe('task time estimator', () => {
  test('keeps category and complexity-only estimates compatible with legacy baselines', () => {
    const estimator = new TaskTimeEstimator(undefined, createState());
    const estimate = estimator.estimate('coding', 'moderate');

    expect(estimate.expectedMs).toBe(BASE_DURATION_MS.coding * COMPLEXITY_MULTIPLIERS.moderate);
    expect(estimate.category).toBe('coding');
    expect(estimate.complexity).toBe('moderate');
    expect(estimate.minimumMs).toBeLessThanOrEqual(estimate.expectedMs);
    expect(estimate.maximumMs).toBeGreaterThanOrEqual(estimate.expectedMs);
    expect(estimate.baselineMetadata?.baselineSource).toBe('default-category');
  });

  test('estimates AI-agent implementation faster than human implementation for simple normal work', () => {
    const estimator = new TaskTimeEstimator(undefined, createState());
    const humanEstimate = estimator.estimate('coding', 'simple', {
      actorProfile: 'human',
      softwareTaskType: 'implementation',
      verificationLevel: 'normal',
      familiarity: 'mixed',
    });
    const agentEstimate = estimator.estimate('coding', 'simple', {
      actorProfile: 'ai-agent',
      softwareTaskType: 'implementation',
      verificationLevel: 'normal',
      familiarity: 'mixed',
    });

    expect(agentEstimate.expectedMs).toBeLessThan(humanEstimate.expectedMs);
    expect(agentEstimate.baselineMetadata?.actorProfile).toBe('ai-agent');
    expect(agentEstimate.baselineMetadata?.baselineSource).toBe('calibrated-software');
  });

  test('adds verification overhead to AI-agent software estimates', () => {
    const estimator = new TaskTimeEstimator(undefined, createState());
    const normalVerification = estimator.estimate('coding', 'simple', {
      actorProfile: 'ai-agent',
      softwareTaskType: 'implementation',
      verificationLevel: 'normal',
    });
    const thoroughVerification = estimator.estimate('coding', 'simple', {
      actorProfile: 'ai-agent',
      softwareTaskType: 'implementation',
      verificationLevel: 'thorough',
    });

    expect(thoroughVerification.expectedMs).toBeGreaterThan(normalVerification.expectedMs);
    expect(thoroughVerification.baselineMetadata?.adjustmentFactors?.verificationFactor)
      .toBeGreaterThan(normalVerification.baselineMetadata?.adjustmentFactors?.verificationFactor ?? 0);
  });

  test('uses learned baselines over calibrated software defaults when confidence is high enough', () => {
    const learnedMs = 123456;
    const taskHistory = Array.from({ length: 13 }, (_, index) =>
      createHistoryEntry(index, learnedMs)
    );
    const estimator = new TaskTimeEstimator(undefined, createState(taskHistory));
    const estimate = estimator.estimate('coding', 'simple', {
      actorProfile: 'ai-agent',
      softwareTaskType: 'implementation',
      verificationLevel: 'normal',
    });

    expect(estimate.expectedMs).toBe(learnedMs);
    expect(estimate.baselineMetadata?.baselineSource).toBe('learned-history');
    expect(estimate.baselineMetadata?.adjustmentFactors?.learnedConfidence).toBeGreaterThan(0.5);
  });
});
