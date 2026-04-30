import { TaskEstimatorConfig, TemporalCognitionState, TaskCategory, TaskComplexity, DurationEstimate, TaskHistoryEntry, ActiveTask } from '../types';
export declare class TaskTimeEstimator {
    private config;
    private state;
    private learnedBaselines;
    constructor(config: TaskEstimatorConfig | undefined, state: TemporalCognitionState);
    /**
     * Initialize learned baselines from task history
     */
    private initializeBaselines;
    /**
     * Get baseline duration for a category/complexity combination
     */
    private getBaseline;
    /**
     * Estimate duration for a task
     */
    estimate(category: TaskCategory, complexity: TaskComplexity): DurationEstimate;
    /**
     * Start tracking a task
     */
    startTask(category: TaskCategory, complexity: TaskComplexity): string;
    /**
     * Complete a task and record for learning
     */
    completeTask(taskId?: string): TaskHistoryEntry | null;
    /**
     * Get current active tasks
     */
    getActiveTasks(): ActiveTask[];
    /**
     * Get task history statistics
     */
    getStatistics(): {
        totalTasks: number;
        averageAccuracy: number;
        categoryCounts: Record<TaskCategory, number>;
    };
}
//# sourceMappingURL=task-estimator.d.ts.map