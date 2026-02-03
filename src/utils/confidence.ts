// ============================================================================
// TEMPORAL COGNITION MODULE - CONFIDENCE SCORING UTILITIES
// ============================================================================

import { TaskHistoryEntry, TaskCategory, TaskComplexity } from '../types';
import { MS_PER_DAY } from '../constants';

/**
 * Calculate confidence score based on historical accuracy
 */
export function calculateConfidence(
  history: TaskHistoryEntry[],
  category: TaskCategory,
  complexity: TaskComplexity,
  options: {
    minSamples?: number;
    decayDays?: number;
  } = {}
): number {
  const { minSamples = 3, decayDays = 30 } = options;
  
  // Filter relevant history
  const relevant = history.filter(
    h => h.category === category && h.complexity === complexity
  );
  
  if (relevant.length === 0) {
    return 0.3; // Low confidence with no data
  }
  
  if (relevant.length < minSamples) {
    return 0.3 + (relevant.length / minSamples) * 0.2; // 0.3-0.5 range
  }
  
  // Calculate weighted accuracy (recent samples weighted more)
  const now = Date.now();
  let weightedAccuracySum = 0;
  let weightSum = 0;
  
  for (const entry of relevant) {
    const ageDays = (now - entry.timestamp) / MS_PER_DAY;
    const weight = Math.exp(-ageDays / decayDays); // Exponential decay
    weightedAccuracySum += entry.accuracy * weight;
    weightSum += weight;
  }
  
  const weightedAccuracy = weightSum > 0 ? weightedAccuracySum / weightSum : 0.5;
  
  // Boost confidence with more samples (diminishing returns)
  const sampleBoost = Math.min(0.2, relevant.length * 0.02);
  
  return Math.min(0.95, 0.5 + weightedAccuracy * 0.3 + sampleBoost);
}

/**
 * Calculate accuracy of an estimate vs actual
 */
export function calculateAccuracy(estimatedMs: number, actualMs: number): number {
  if (actualMs === 0) return 0;
  
  const ratio = estimatedMs / actualMs;
  
  // Perfect accuracy is 1.0 (estimate == actual)
  // Accuracy decreases as ratio moves away from 1.0
  if (ratio >= 1) {
    // Overestimate
    return Math.max(0, 1 - (ratio - 1) * 0.5);
  } else {
    // Underestimate (penalize more heavily)
    return Math.max(0, ratio);
  }
}

/**
 * Apply Bayesian update to duration estimate based on actual result
 */
export function bayesianUpdate(
  priorMean: number,
  priorConfidence: number,
  observedValue: number,
  learningRate: number = 0.1
): { mean: number; confidence: number } {
  // Simple weighted average approach
  const weight = priorConfidence * (1 - learningRate);
  const newWeight = learningRate;
  
  const newMean = (priorMean * weight + observedValue * newWeight) / (weight + newWeight);
  
  // Confidence increases with observations (up to a limit)
  const newConfidence = Math.min(0.95, priorConfidence + learningRate * 0.1);
  
  return { mean: newMean, confidence: newConfidence };
}

/**
 * Calculate variance from history
 */
export function calculateVariance(history: TaskHistoryEntry[]): number {
  if (history.length < 2) return 0.5; // High variance with insufficient data
  
  const actuals = history.map(h => h.actualMs);
  const mean = actuals.reduce((a, b) => a + b, 0) / actuals.length;
  
  const squaredDiffs = actuals.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / actuals.length;
  
  // Return coefficient of variation (normalized variance)
  return Math.sqrt(variance) / mean;
}
