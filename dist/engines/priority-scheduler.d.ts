import { PrioritySchedulerConfig, TemporalCognitionState, ScheduledTask, TaskStatus, AddTaskInput } from '../types';
export declare class TemporalPriorityScheduler {
    private config;
    private state;
    constructor(config: PrioritySchedulerConfig | undefined, state: TemporalCognitionState);
    /**
     * Calculate priority score for a task
     */
    private calculatePriority;
    /**
     * Add a new task to the scheduler
     */
    addTask(input: AddTaskInput): ScheduledTask;
    /**
     * Update task status
     */
    updateTaskStatus(taskId: string, status: TaskStatus): ScheduledTask | null;
    /**
     * Update task priority factors
     */
    updateTask(taskId: string, updates: Partial<Pick<ScheduledTask, 'urgency' | 'importance' | 'deadline' | 'title' | 'description' | 'tags'>>): ScheduledTask | null;
    /**
     * Get the next task to work on
     */
    getNextTask(): ScheduledTask | null;
    /**
     * Get all tasks sorted by priority
     */
    getTaskList(): ScheduledTask[];
    /**
     * Get tasks by status
     */
    getTasksByStatus(status: TaskStatus): ScheduledTask[];
    /**
     * Get overdue tasks
     */
    getOverdueTasks(): ScheduledTask[];
    /**
     * Remove a task
     */
    removeTask(taskId: string): boolean;
    /**
     * Clean up completed/cancelled tasks older than specified days
     */
    cleanupOldTasks(maxAgeDays?: number): number;
    /**
     * Refresh all task priorities (call periodically)
     */
    private refreshPriorities;
    /**
     * Sort tasks by priority
     */
    private sortTasks;
    /**
     * Get scheduler statistics
     */
    getStatistics(): {
        total: number;
        pending: number;
        inProgress: number;
        completed: number;
        overdue: number;
        avgPriority: number;
    };
}
//# sourceMappingURL=priority-scheduler.d.ts.map