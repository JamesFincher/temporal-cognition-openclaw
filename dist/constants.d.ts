import { CyclePhase, PhaseConfig, TaskCategory, TaskComplexity } from './types';
export declare const DEFAULT_TSF_BY_CATEGORY: Record<TaskCategory, number>;
export declare const COMPLEXITY_MULTIPLIERS: Record<TaskComplexity, number>;
export declare const BASE_DURATION_MS: Record<TaskCategory, number>;
export declare const DEFAULT_PHASES: Record<CyclePhase, PhaseConfig>;
export declare const PHASE_ORDER: CyclePhase[];
export declare const MS_PER_SECOND = 1000;
export declare const MS_PER_MINUTE = 60000;
export declare const MS_PER_HOUR = 3600000;
export declare const MS_PER_DAY = 86400000;
export declare const MS_PER_WEEK = 604800000;
export declare const DEFAULT_CONFIG: {
    timePerception: {
        enabled: boolean;
        subjectiveTimeRatio: number;
        timezone: string;
        trackProcessingTime: boolean;
    };
    taskEstimator: {
        enabled: boolean;
        learningRate: number;
        confidenceDecayDays: number;
        minSamplesForEstimate: number;
    };
    temporalTranslator: {
        enabled: boolean;
        humanFriendlyUnits: boolean;
        includeConfidenceInOutput: boolean;
        defaultBufferPercent: number;
    };
    priorityScheduler: {
        enabled: boolean;
        urgencyWeight: number;
        importanceWeight: number;
        effortWeight: number;
        deadlineProximityWeight: number;
    };
    cycleManager: {
        enabled: boolean;
        adaptToUserActivity: boolean;
    };
    crossChannelSync: {
        enabled: boolean;
        syncIntervalMs: number;
        channels: string[];
    };
    temporalMemory: {
        enabled: boolean;
        decayHalfLifeDays: number;
        relevanceBoostRecent: number;
        includeTemporalContext: boolean;
    };
    storage: {
        path: string;
    };
};
//# sourceMappingURL=constants.d.ts.map