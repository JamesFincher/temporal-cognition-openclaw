"use strict";
// ============================================================================
// TEMPORAL COGNITION MODULE - TEMPORAL TRANSLATOR
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemporalTranslator = void 0;
const time_math_1 = require("../utils/time-math");
class TemporalTranslator {
    config;
    constructor(config) {
        this.config = {
            enabled: config?.enabled ?? true,
            humanFriendlyUnits: config?.humanFriendlyUnits ?? true,
            includeConfidenceInOutput: config?.includeConfidenceInOutput ?? true,
            defaultBufferPercent: config?.defaultBufferPercent ?? 20,
        };
    }
    /**
     * Translate a duration estimate to human-readable format
     */
    translateDuration(estimate) {
        const { minimumMs, expectedMs, maximumMs, confidence } = estimate;
        // Main human-readable format
        const humanReadable = this.config.humanFriendlyUnits
            ? (0, time_math_1.formatDuration)(expectedMs)
            : (0, time_math_1.formatDuration)(expectedMs, { precise: true });
        // Range format
        const range = (0, time_math_1.formatDurationRange)(minimumMs, expectedMs, maximumMs);
        // With buffer
        const bufferMs = expectedMs * (this.config.defaultBufferPercent / 100);
        const withBufferMs = expectedMs + bufferMs;
        const withBuffer = `${(0, time_math_1.formatDuration)(withBufferMs)} (with ${this.config.defaultBufferPercent}% buffer)`;
        // Confidence description
        let confidenceDesc;
        if (confidence >= 0.8) {
            confidenceDesc = 'high confidence';
        }
        else if (confidence >= 0.6) {
            confidenceDesc = 'moderate confidence';
        }
        else if (confidence >= 0.4) {
            confidenceDesc = 'low confidence';
        }
        else {
            confidenceDesc = 'very low confidence (limited data)';
        }
        return {
            humanReadable,
            range,
            withBuffer,
            confidence: this.config.includeConfidenceInOutput
                ? `${confidenceDesc} (${Math.round(confidence * 100)}%)`
                : confidenceDesc,
        };
    }
    /**
     * Format deadline context with task estimate
     */
    formatDeadlineContext(deadlineMs, estimatedDurationMs) {
        const deadline = (0, time_math_1.timeUntilDeadline)(deadlineMs);
        // Calculate if we can complete before deadline
        const bufferMs = estimatedDurationMs * (this.config.defaultBufferPercent / 100);
        const requiredTime = estimatedDurationMs + bufferMs;
        const canComplete = !deadline.isPast && deadline.ms > requiredTime;
        // Generate recommendation
        let recommendation;
        if (deadline.isPast) {
            recommendation = 'Deadline has passed. Consider renegotiating or prioritizing immediately.';
        }
        else if (deadline.urgencyLevel === 'critical') {
            recommendation = canComplete
                ? 'Critical deadline - start immediately with no interruptions.'
                : 'Insufficient time remaining. Request deadline extension or reduce scope.';
        }
        else if (deadline.urgencyLevel === 'high') {
            recommendation = canComplete
                ? 'High priority - schedule focused work time soon.'
                : 'Tight timeline. Consider starting immediately or adjusting expectations.';
        }
        else if (deadline.urgencyLevel === 'medium') {
            recommendation = 'Comfortable timeline. Schedule when convenient but don\'t delay too long.';
        }
        else {
            recommendation = 'Plenty of time. Can be scheduled flexibly.';
        }
        return {
            timeRemaining: deadline.formatted,
            urgencyLevel: deadline.urgencyLevel,
            canComplete,
            recommendation,
        };
    }
    /**
     * Generate a natural language time summary
     */
    generateTimeSummary(options) {
        const parts = [];
        if (options.estimatedMs) {
            const duration = (0, time_math_1.formatDuration)(options.estimatedMs);
            parts.push(`This will take approximately ${duration}`);
        }
        if (options.deadlineMs) {
            const deadline = (0, time_math_1.timeUntilDeadline)(options.deadlineMs);
            if (deadline.isPast) {
                parts.push(`The deadline was ${deadline.formatted}`);
            }
            else {
                parts.push(`with ${deadline.formatted} until the deadline`);
            }
        }
        if (options.confidence !== undefined && this.config.includeConfidenceInOutput) {
            const confPercent = Math.round(options.confidence * 100);
            if (confPercent >= 70) {
                parts.push(`(${confPercent}% confidence based on past performance)`);
            }
            else {
                parts.push(`(${confPercent}% confidence - limited historical data)`);
            }
        }
        if (options.context) {
            parts.push(`[${options.context}]`);
        }
        return parts.join(' ');
    }
    /**
     * Format relative time for display
     */
    formatRelativeTime(ms) {
        if (ms < 0) {
            return `${(0, time_math_1.formatDuration)(Math.abs(ms))} ago`;
        }
        return `in ${(0, time_math_1.formatDuration)(ms)}`;
    }
    /**
     * Generate time comparison (AI vs human equivalent)
     */
    generateTimeComparison(aiMs, humanEquivalentMs) {
        const aiFormatted = (0, time_math_1.formatDuration)(aiMs);
        const humanFormatted = (0, time_math_1.formatDuration)(humanEquivalentMs);
        const speedup = Math.round(humanEquivalentMs / aiMs);
        return `${aiFormatted} (equivalent to ${humanFormatted} of human work - ${speedup}x faster)`;
    }
}
exports.TemporalTranslator = TemporalTranslator;
//# sourceMappingURL=temporal-translator.js.map