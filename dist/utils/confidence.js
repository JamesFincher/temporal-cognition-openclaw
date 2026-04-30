"use strict";
// ============================================================================
// TEMPORAL COGNITION MODULE - CONFIDENCE SCORING UTILITIES
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateConfidence = calculateConfidence;
exports.calculateAccuracy = calculateAccuracy;
exports.bayesianUpdate = bayesianUpdate;
exports.calculateVariance = calculateVariance;
const constants_1 = require("../constants");
/**
 * Calculate confidence score based on historical accuracy
 */
function calculateConfidence(history, category, complexity, options = {}) {
    const { minSamples = 3, decayDays = 30 } = options;
    // Filter relevant history
    const relevant = history.filter(h => h.category === category && h.complexity === complexity);
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
        const ageDays = (now - entry.timestamp) / constants_1.MS_PER_DAY;
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
function calculateAccuracy(estimatedMs, actualMs) {
    if (actualMs === 0)
        return 0;
    const ratio = estimatedMs / actualMs;
    // Perfect accuracy is 1.0 (estimate == actual)
    // Accuracy decreases as ratio moves away from 1.0
    if (ratio >= 1) {
        // Overestimate
        return Math.max(0, 1 - (ratio - 1) * 0.5);
    }
    else {
        // Underestimate (penalize more heavily)
        return Math.max(0, ratio);
    }
}
/**
 * Apply Bayesian update to duration estimate based on actual result
 */
function bayesianUpdate(priorMean, priorConfidence, observedValue, learningRate = 0.1) {
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
function calculateVariance(history) {
    if (history.length < 2)
        return 0.5; // High variance with insufficient data
    const actuals = history.map(h => h.actualMs);
    const mean = actuals.reduce((a, b) => a + b, 0) / actuals.length;
    const squaredDiffs = actuals.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / actuals.length;
    // Return coefficient of variation (normalized variance)
    return Math.sqrt(variance) / mean;
}
//# sourceMappingURL=confidence.js.map