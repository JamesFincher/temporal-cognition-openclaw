import { describe, expect, test } from 'bun:test';
import { BASE_DURATION_MS, SOFTWARE_BASE_DURATION_MS } from '../src/constants';
import {
  ActorProfile,
  SoftwareTaskType,
  TaskCategory,
  TaskComplexity,
} from '../src/types';

const softwareTaskTypes: SoftwareTaskType[] = [
  'implementation',
  'testing',
  'debugging',
  'documentation',
  'review',
];

const actorProfiles: ActorProfile[] = [
  'human',
  'ai-assisted-human',
  'ai-agent',
];

const taskComplexities: TaskComplexity[] = [
  'trivial',
  'simple',
  'moderate',
  'complex',
  'highly-complex',
];

describe('software estimation baselines', () => {
  test('preserves legacy category baselines', () => {
    const taskCategories: TaskCategory[] = [
      'research',
      'coding',
      'writing',
      'analysis',
      'communication',
      'scheduling',
      'file-operations',
      'web-browsing',
      'other',
    ];

    for (const category of taskCategories) {
      expect(BASE_DURATION_MS[category]).toBeGreaterThan(0);
    }
  });

  test('defines positive baselines for every software task, actor, and complexity', () => {
    for (const taskType of softwareTaskTypes) {
      for (const actorProfile of actorProfiles) {
        for (const complexity of taskComplexities) {
          expect(SOFTWARE_BASE_DURATION_MS[taskType][actorProfile][complexity]).toBeGreaterThan(0);
        }
      }
    }
  });
});
