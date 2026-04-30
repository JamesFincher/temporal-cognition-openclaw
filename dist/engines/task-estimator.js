"use strict";
// ============================================================================
// TEMPORAL COGNITION MODULE - TASK TIME ESTIMATOR
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskTimeEstimator = void 0;
const constants_1 = require("../constants");
const confidence_1 = require("../utils/confidence");
const time_math_1 = require("../utils/time-math");
class TaskTimeEstimator {
    config;
    state;
    learnedBaselines = new Map();
    constructor(config, state) {
        this.config = {
            enabled: config?.enabled ?? true,
            learningRate: config?.learningRate ?? 0.1,
            confidenceDecayDays: config?.confidenceDecayDays ?? 30,
            minSamplesForEstimate: config?.minSamplesForEstimate ?? 3,
        };
        this.state = state;
        // Initialize learned baselines from history
        this.initializeBaselines();
    }
    /**
     * Initialize learned baselines from task history
     */
    initializeBaselines() {
        for (const entry of this.state.taskHistory) {
            const key = `${entry.category}:${entry.complexity}`;
            const existing = this.learnedBaselines.get(key);
            if (existing) {
                const updated = (0, confidence_1.bayesianUpdate)(existing.mean, existing.confidence, entry.actualMs, this.config.learningRate);
                this.learnedBaselines.set(key, updated);
            }
            else {
                this.learnedBaselines.set(key, {
                    mean: entry.actualMs,
                    confidence: 0.4,
                });
            }
        }
    }
    /**
     * Get baseline duration for a category/complexity combination
     */
    getBaseline(category, complexity) {
        const key = `${category}:${complexity}`;
        const learned = this.learnedBaselines.get(key);
        if (learned && learned.confidence > 0.5) {
            return learned.mean;
        }
        // Fall back to default baseline
        const baseMs = constants_1.BASE_DURATION_MS[category] || constants_1.BASE_DURATION_MS.other;
        const multiplier = constants_1.COMPLEXITY_MULTIPLIERS[complexity] || 1.0;
        return baseMs * multiplier;
    }
    /**
     * Estimate duration for a task
     */
    estimate(category, complexity) {
        const key = `${category}:${complexity}`;
        const relevantHistory = this.state.taskHistory.filter(h => h.category === category && h.complexity === complexity);
        // Get baseline estimate
        const baseline = this.getBaseline(category, complexity);
        // Calculate variance from history
        const variance = (0, confidence_1.calculateVariance)(relevantHistory);
        // Calculate confidence
        const confidence = (0, confidence_1.calculateConfidence)(relevantHistory, category, complexity, {
            minSamples: this.config.minSamplesForEstimate,
            decayDays: this.config.confidenceDecayDays,
        });
        // Calculate min/max based on variance
        const varianceFactor = 1 + variance;
        const minimumMs = Math.round(baseline / varianceFactor);
        const maximumMs = Math.round(baseline * varianceFactor);
        const expectedMs = Math.round(baseline);
        return {
            minimumMs,
            expectedMs,
            maximumMs,
            confidence,
            basedOnSamples: relevantHistory.length,
            category,
            complexity,
            humanReadable: {
                minimum: (0, time_math_1.formatDuration)(minimumMs, { precise: true }),
                expected: (0, time_math_1.formatDuration)(expectedMs, { precise: true }),
                maximum: (0, time_math_1.formatDuration)(maximumMs, { precise: true }),
            },
        };
    }
    /**
     * Start tracking a task
     */
    startTask(category, complexity) {
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const estimate = this.estimate(category, complexity);
        const activeTask = {
            taskId,
            category,
            complexity,
            startTime: Date.now(),
            estimatedMs: estimate.expectedMs,
        };
        this.state.activeTasks = this.state.activeTasks || {};
        this.state.activeTasks[taskId] = activeTask;
        return taskId;
    }
    /**
     * Complete a task and record for learning
     */
    completeTask(taskId) {
        // Find the task to complete
        let task;
        if (taskId && this.state.activeTasks?.[taskId]) {
            task = this.state.activeTasks[taskId];
            delete this.state.activeTasks[taskId];
        }
        else {
            // Complete the most recent task
            const tasks = Object.values(this.state.activeTasks || {});
            if (tasks.length > 0) {
                task = tasks[tasks.length - 1];
                delete this.state.activeTasks[task.taskId];
            }
        }
        if (!task)
            return null;
        const actualMs = Date.now() - task.startTime;
        const accuracy = (0, confidence_1.calculateAccuracy)(task.estimatedMs, actualMs);
        const entry = {
            taskId: task.taskId,
            category: task.category,
            complexity: task.complexity,
            estimatedMs: task.estimatedMs,
            actualMs,
            accuracy,
            timestamp: Date.now(),
            sessionId: `session_${this.state.timePerception.bootTime}`,
        };
        // Add to history
        this.state.taskHistory.push(entry);
        // Keep history bounded (last 1000 entries)
        if (this.state.taskHistory.length > 1000) {
            this.state.taskHistory = this.state.taskHistory.slice(-1000);
        }
        // Update learned baseline
        const key = `${task.category}:${task.complexity}`;
        const existing = this.learnedBaselines.get(key) || { mean: task.estimatedMs, confidence: 0.3 };
        const updated = (0, confidence_1.bayesianUpdate)(existing.mean, existing.confidence, actualMs, this.config.learningRate);
        this.learnedBaselines.set(key, updated);
        return entry;
    }
    /**
     * Get current active tasks
     */
    getActiveTasks() {
        return Object.values(this.state.activeTasks || {});
    }
    /**
     * Get task history statistics
     */
    getStatistics() {
        const history = this.state.taskHistory;
        const totalTasks = history.length;
        const averageAccuracy = totalTasks > 0
            ? history.reduce((sum, h) => sum + h.accuracy, 0) / totalTasks
            : 0;
        const categoryCounts = {
            research: 0,
            coding: 0,
            writing: 0,
            analysis: 0,
            communication: 0,
            scheduling: 0,
            'file-operations': 0,
            'web-browsing': 0,
            other: 0,
        };
        for (const entry of history) {
            categoryCounts[entry.category]++;
        }
        return { totalTasks, averageAccuracy, categoryCounts };
    }
}
exports.TaskTimeEstimator = TaskTimeEstimator;
//# sourceMappingURL=task-estimator.js.map