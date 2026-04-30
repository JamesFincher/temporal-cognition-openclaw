import { CycleManagerConfig, TemporalCognitionState, CyclePhase, PhaseConfig, PhaseInfo } from '../types';
export declare class CycleManager {
    private config;
    private state;
    private phases;
    private lastActivityTime;
    constructor(config: CycleManagerConfig | undefined, state: TemporalCognitionState);
    /**
     * Get current cycle phase
     */
    getCurrentPhase(): CyclePhase;
    /**
     * Get current phase info with configuration
     */
    getCurrentPhaseInfo(): PhaseInfo;
    /**
     * Check if current phase has a specific capability
     */
    hasCapability(capability: string): boolean;
    /**
     * Get guidance text for current phase
     */
    getPhaseGuidance(): string;
    /**
     * Record user activity (for adaptive scheduling)
     */
    recordUserActivity(): void;
    /**
     * Decay activity level (call periodically)
     */
    decayActivityLevel(decayRate?: number): void;
    /**
     * Force phase transition (manual override)
     */
    forcePhase(phase: CyclePhase): void;
    /**
     * Get all phase configurations
     */
    getPhaseConfigs(): Record<CyclePhase, PhaseConfig>;
    /**
     * Update current phase based on time
     */
    private updatePhase;
    /**
     * Calculate next phase timing
     */
    private calculateNextPhase;
    /**
     * Adapt schedule based on user activity
     */
    private adaptToActivity;
    /**
     * Check if user appears to be sleeping/away
     */
    isUserAway(thresholdMs?: number): boolean;
    /**
     * Get recommended action based on current phase
     */
    getRecommendedAction(): string;
}
//# sourceMappingURL=cycle-manager.d.ts.map