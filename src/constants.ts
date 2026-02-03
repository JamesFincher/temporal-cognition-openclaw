// ============================================================================
// TEMPORAL COGNITION MODULE - CONSTANTS AND DEFAULTS
// ============================================================================

import { CyclePhase, PhaseConfig, TaskCategory, TaskComplexity } from './types';

// Default Time Scaling Factors by task category
export const DEFAULT_TSF_BY_CATEGORY: Record<TaskCategory, number> = {
  'research': 48,
  'coding': 80,
  'writing': 60,
  'analysis': 72,
  'communication': 120,
  'scheduling': 96,
  'file-operations': 180,
  'web-browsing': 36,
  'other': 48,
};

// Complexity multipliers for duration estimation
export const COMPLEXITY_MULTIPLIERS: Record<TaskComplexity, number> = {
  'trivial': 0.25,
  'simple': 0.5,
  'moderate': 1.0,
  'complex': 2.0,
  'highly-complex': 4.0,
};

// Base duration estimates in milliseconds by category
export const BASE_DURATION_MS: Record<TaskCategory, number> = {
  'research': 300000,      // 5 minutes
  'coding': 600000,        // 10 minutes
  'writing': 480000,       // 8 minutes
  'analysis': 420000,      // 7 minutes
  'communication': 60000,  // 1 minute
  'scheduling': 120000,    // 2 minutes
  'file-operations': 30000, // 30 seconds
  'web-browsing': 180000,  // 3 minutes
  'other': 300000,         // 5 minutes
};

// Default cycle phase configurations
export const DEFAULT_PHASES: Record<CyclePhase, PhaseConfig> = {
  active: {
    start: '08:00',
    end: '18:00',
    description: 'High engagement - immediate responses, full capabilities',
    capabilities: ['all', 'respond', 'schedule', 'batch', 'memory', 'cleanup', 'emergency'],
  },
  passive: {
    start: '18:00',
    end: '22:00',
    description: 'Responsive mode - reduced proactive actions, normal response time',
    capabilities: ['respond', 'schedule', 'emergency'],
  },
  autonomous: {
    start: '22:00',
    end: '02:00',
    description: 'Background processing - batch operations, scheduled tasks',
    capabilities: ['batch', 'scheduled', 'emergency'],
  },
  consolidation: {
    start: '02:00',
    end: '04:00',
    description: 'Memory consolidation - indexing, cleanup, learning',
    capabilities: ['memory', 'cleanup', 'emergency'],
  },
  maintenance: {
    start: '04:00',
    end: '08:00',
    description: 'Low activity - await user, emergency only',
    capabilities: ['emergency'],
  },
};

// Phase order for cycling
export const PHASE_ORDER: CyclePhase[] = [
  'active',
  'passive',
  'autonomous',
  'consolidation',
  'maintenance',
];

// Time formatting constants
export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = 60000;
export const MS_PER_HOUR = 3600000;
export const MS_PER_DAY = 86400000;
export const MS_PER_WEEK = 604800000;

// Default configuration values
export const DEFAULT_CONFIG = {
  timePerception: {
    enabled: true,
    subjectiveTimeRatio: 1.0,
    timezone: 'auto',
    trackProcessingTime: true,
  },
  taskEstimator: {
    enabled: true,
    learningRate: 0.1,
    confidenceDecayDays: 30,
    minSamplesForEstimate: 3,
  },
  temporalTranslator: {
    enabled: true,
    humanFriendlyUnits: true,
    includeConfidenceInOutput: true,
    defaultBufferPercent: 20,
  },
  priorityScheduler: {
    enabled: true,
    urgencyWeight: 0.4,
    importanceWeight: 0.3,
    effortWeight: 0.2,
    deadlineProximityWeight: 0.1,
  },
  cycleManager: {
    enabled: true,
    adaptToUserActivity: true,
  },
  crossChannelSync: {
    enabled: true,
    syncIntervalMs: 5000,
    channels: ['discord', 'telegram'],
  },
  temporalMemory: {
    enabled: true,
    decayHalfLifeDays: 7,
    relevanceBoostRecent: 1.5,
    includeTemporalContext: true,
  },
  storage: {
    path: '~/.openclaw/temporal-cognition',
  },
};
