export interface WallClockTime {
    timestamp: number;
    timezone: string;
    iso: string;
    dayOfWeek: string;
    hourOfDay: number;
}
export interface SubjectiveTime {
    aiTicks: number;
    processingCycles: number;
    attentionUnits: number;
    lastActivity: number;
    bootTime: number;
}
export interface TemporalContext {
    wallClock: WallClockTime;
    subjective: SubjectiveTime;
    phase: CyclePhase;
    sessionAge: number;
    idleDuration: number;
    humanReadable: string;
}
export type TaskCategory = "research" | "coding" | "writing" | "analysis" | "communication" | "scheduling" | "file-operations" | "web-browsing" | "other";
export type TaskComplexity = "trivial" | "simple" | "moderate" | "complex" | "highly-complex";
export interface DurationEstimate {
    minimumMs: number;
    expectedMs: number;
    maximumMs: number;
    confidence: number;
    basedOnSamples: number;
    category: TaskCategory;
    complexity: TaskComplexity;
    humanReadable?: {
        minimum: string;
        expected: string;
        maximum: string;
    };
}
export interface TaskHistoryEntry {
    taskId: string;
    category: TaskCategory;
    complexity: TaskComplexity;
    estimatedMs: number;
    actualMs: number;
    accuracy: number;
    timestamp: number;
    sessionId: string;
    channel?: string;
}
export interface ActiveTask {
    taskId: string;
    category: TaskCategory;
    complexity: TaskComplexity;
    startTime: number;
    estimatedMs: number;
}
export type TaskStatus = "pending" | "in-progress" | "completed" | "deferred" | "cancelled";
export interface ScheduledTask {
    id: string;
    title: string;
    description?: string;
    deadline?: number;
    estimatedDuration: DurationEstimate;
    priority: number;
    urgency: number;
    importance: number;
    status: TaskStatus;
    createdAt: number;
    updatedAt: number;
    completedAt?: number;
    channel?: string;
    sessionId?: string;
    tags: string[];
}
export interface AddTaskInput {
    title: string;
    description?: string;
    deadline?: number;
    estimatedDuration: DurationEstimate;
    urgency: number;
    importance: number;
    tags: string[];
    channel?: string;
    sessionId?: string;
}
export type CyclePhase = "active" | "passive" | "autonomous" | "consolidation" | "maintenance";
export interface PhaseConfig {
    start: string;
    end: string;
    description: string;
    capabilities: string[];
}
export interface CycleState {
    currentPhase: CyclePhase;
    phaseStartedAt: number;
    nextPhaseAt: number;
    nextPhase: CyclePhase;
    userActivityLevel: number;
    adaptedSchedule: boolean;
}
export interface PhaseInfo extends CycleState {
    config: PhaseConfig;
    timeInPhase: number;
    timeUntilNextPhase: number;
}
export interface ChannelTemporalState {
    channel: string;
    lastActivity: number;
    sessionCount: number;
    activeTaskCount: number;
    pendingEstimates: string[];
}
export interface SyncState {
    lastSyncAt: number;
    channels: Record<string, ChannelTemporalState>;
    globalPhase: CyclePhase;
    taskQueueHash: string;
}
export interface TemporalMemoryEntry {
    id: string;
    content: string;
    timestamp: number;
    decayScore: number;
    relevanceScore: number;
    accessCount: number;
    lastAccessedAt: number;
    temporalContext?: TemporalContext;
    associatedTasks: string[];
}
export interface MemorySearchOptions {
    maxAgeDays?: number;
    limit?: number;
    minRelevance?: number;
}
export interface TemporalCognitionState {
    version: string;
    initialized: boolean;
    timePerception: {
        bootTime: number;
        totalTicks: number;
        totalCycles: number;
        processingStartTime?: number;
    };
    taskHistory: TaskHistoryEntry[];
    activeTasks: Record<string, ActiveTask>;
    scheduledTasks: ScheduledTask[];
    cycleState: CycleState;
    syncState: SyncState;
    memoryIndex: Record<string, TemporalMemoryEntry>;
}
export interface TimePerceptionConfig {
    enabled?: boolean;
    subjectiveTimeRatio?: number;
    timezone?: string;
    trackProcessingTime?: boolean;
}
export interface TaskEstimatorConfig {
    enabled?: boolean;
    learningRate?: number;
    confidenceDecayDays?: number;
    minSamplesForEstimate?: number;
}
export interface TemporalTranslatorConfig {
    enabled?: boolean;
    humanFriendlyUnits?: boolean;
    includeConfidenceInOutput?: boolean;
    defaultBufferPercent?: number;
}
export interface PrioritySchedulerConfig {
    enabled?: boolean;
    urgencyWeight?: number;
    importanceWeight?: number;
    effortWeight?: number;
    deadlineProximityWeight?: number;
}
export interface CycleManagerConfig {
    enabled?: boolean;
    phases?: Partial<Record<CyclePhase, Partial<PhaseConfig>>>;
    adaptToUserActivity?: boolean;
}
export interface CrossChannelSyncConfig {
    enabled?: boolean;
    syncIntervalMs?: number;
    channels?: string[];
}
export interface TemporalMemoryConfig {
    enabled?: boolean;
    decayHalfLifeDays?: number;
    relevanceBoostRecent?: number;
    includeTemporalContext?: boolean;
}
export interface StorageConfig {
    path?: string;
}
export interface PluginConfig {
    enabled?: boolean;
    timePerception?: TimePerceptionConfig;
    taskEstimator?: TaskEstimatorConfig;
    temporalTranslator?: TemporalTranslatorConfig;
    priorityScheduler?: PrioritySchedulerConfig;
    cycleManager?: CycleManagerConfig;
    crossChannelSync?: CrossChannelSyncConfig;
    temporalMemory?: TemporalMemoryConfig;
    storage?: StorageConfig;
}
//# sourceMappingURL=types.d.ts.map