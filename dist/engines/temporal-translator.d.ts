import { TemporalTranslatorConfig, DurationEstimate } from '../types';
export interface TranslatedDuration {
    humanReadable: string;
    range: string;
    withBuffer: string;
    confidence: string;
}
export interface DeadlineContext {
    timeRemaining: string;
    urgencyLevel: string;
    canComplete: boolean;
    recommendation: string;
}
export declare class TemporalTranslator {
    private config;
    constructor(config: TemporalTranslatorConfig | undefined);
    /**
     * Translate a duration estimate to human-readable format
     */
    translateDuration(estimate: DurationEstimate): TranslatedDuration;
    /**
     * Format deadline context with task estimate
     */
    formatDeadlineContext(deadlineMs: number, estimatedDurationMs: number): DeadlineContext;
    /**
     * Generate a natural language time summary
     */
    generateTimeSummary(options: {
        estimatedMs?: number;
        deadlineMs?: number;
        confidence?: number;
        context?: string;
    }): string;
    /**
     * Format relative time for display
     */
    formatRelativeTime(ms: number): string;
    /**
     * Generate time comparison (AI vs human equivalent)
     */
    generateTimeComparison(aiMs: number, humanEquivalentMs: number): string;
}
//# sourceMappingURL=temporal-translator.d.ts.map