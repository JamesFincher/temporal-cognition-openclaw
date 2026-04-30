import { TimePerceptionConfig, TemporalCognitionState, TemporalContext, WallClockTime, SubjectiveTime } from '../types';
export declare class TimePerceptionEngine {
    private config;
    private state;
    private processingStartTime;
    constructor(config: TimePerceptionConfig | undefined, state: TemporalCognitionState);
    /**
     * Record a tick (unit of processing)
     */
    tick(): void;
    /**
     * Record a processing cycle completion
     */
    cycle(): void;
    /**
     * Start tracking processing time for a request
     */
    startProcessingTimer(): void;
    /**
     * Stop tracking processing time
     */
    stopProcessingTimer(): number;
    /**
     * Get current wall clock time
     */
    getWallClock(): WallClockTime;
    /**
     * Get subjective time (AI-perceived time)
     */
    getSubjectiveTime(): SubjectiveTime;
    /**
     * Get full temporal context
     */
    getCurrentContext(): TemporalContext;
    /**
     * Calculate time since last activity
     */
    getIdleDuration(): number;
    /**
     * Check if system has been idle for specified duration
     */
    isIdle(thresholdMs: number): boolean;
    /**
     * Get uptime in milliseconds
     */
    getUptime(): number;
    /**
     * Reset boot time (for session reset)
     */
    resetSession(): void;
}
//# sourceMappingURL=time-perception.d.ts.map