import { TaskHistoryEntry, TaskCategory, TaskComplexity } from '../types';
/**
 * Calculate confidence score based on historical accuracy
 */
export declare function calculateConfidence(history: TaskHistoryEntry[], category: TaskCategory, complexity: TaskComplexity, options?: {
    minSamples?: number;
    decayDays?: number;
}): number;
/**
 * Calculate accuracy of an estimate vs actual
 */
export declare function calculateAccuracy(estimatedMs: number, actualMs: number): number;
/**
 * Apply Bayesian update to duration estimate based on actual result
 */
export declare function bayesianUpdate(priorMean: number, priorConfidence: number, observedValue: number, learningRate?: number): {
    mean: number;
    confidence: number;
};
/**
 * Calculate variance from history
 */
export declare function calculateVariance(history: TaskHistoryEntry[]): number;
//# sourceMappingURL=confidence.d.ts.map