// ============================================================================
// TEMPORAL COGNITION MODULE - TEMPORAL PRIORITY SCHEDULER
// ============================================================================

import {
  PrioritySchedulerConfig,
  TemporalCognitionState,
  ScheduledTask,
  TaskStatus,
  AddTaskInput,
  DurationEstimate,
} from '../types';
import { MS_PER_HOUR, MS_PER_DAY } from '../constants';

export class TemporalPriorityScheduler {
  private config: Required<PrioritySchedulerConfig>;
  private state: TemporalCognitionState;
  
  constructor(config: PrioritySchedulerConfig | undefined, state: TemporalCognitionState) {
    this.config = {
      enabled: config?.enabled ?? true,
      urgencyWeight: config?.urgencyWeight ?? 0.4,
      importanceWeight: config?.importanceWeight ?? 0.3,
      effortWeight: config?.effortWeight ?? 0.2,
      deadlineProximityWeight: config?.deadlineProximityWeight ?? 0.1,
    };
    this.state = state;
    
    // Initialize tasks array if needed
    if (!this.state.scheduledTasks) {
      this.state.scheduledTasks = [];
    }
  }
  
  /**
   * Calculate priority score for a task
   */
  private calculatePriority(task: Partial<ScheduledTask> & { 
    urgency: number; 
    importance: number; 
    estimatedDuration: DurationEstimate;
    deadline?: number;
  }): number {
    const { urgency, importance, estimatedDuration, deadline } = task;
    const now = Date.now();
    
    // Normalize urgency (0-100 to 0-1)
    const urgencyScore = urgency / 100;
    
    // Normalize importance (0-100 to 0-1)
    const importanceScore = importance / 100;
    
    // Effort score (inverse - shorter tasks get higher priority for quick wins)
    const maxDuration = MS_PER_DAY; // 1 day as max reference
    const effortScore = 1 - Math.min(1, estimatedDuration.expectedMs / maxDuration);
    
    // Deadline proximity score
    let deadlineScore = 0.5; // Default middle value if no deadline
    if (deadline) {
      const timeUntilDeadline = deadline - now;
      if (timeUntilDeadline <= 0) {
        deadlineScore = 1.0; // Overdue - maximum urgency
      } else if (timeUntilDeadline < estimatedDuration.expectedMs) {
        deadlineScore = 0.95; // Not enough time - critical
      } else if (timeUntilDeadline < MS_PER_HOUR) {
        deadlineScore = 0.9;
      } else if (timeUntilDeadline < MS_PER_HOUR * 4) {
        deadlineScore = 0.8;
      } else if (timeUntilDeadline < MS_PER_DAY) {
        deadlineScore = 0.6;
      } else {
        deadlineScore = 0.3;
      }
    }
    
    // Calculate weighted priority
    const priority = (
      urgencyScore * this.config.urgencyWeight +
      importanceScore * this.config.importanceWeight +
      effortScore * this.config.effortWeight +
      deadlineScore * this.config.deadlineProximityWeight
    ) * 100;
    
    return Math.round(Math.min(100, Math.max(0, priority)));
  }
  
  /**
   * Add a new task to the scheduler
   */
  addTask(input: AddTaskInput): ScheduledTask {
    const now = Date.now();
    const id = `sched_${now}_${Math.random().toString(36).substr(2, 9)}`;
    
    const task: ScheduledTask = {
      id,
      title: input.title,
      description: input.description,
      deadline: input.deadline,
      estimatedDuration: input.estimatedDuration,
      priority: 0, // Will be calculated
      urgency: input.urgency,
      importance: input.importance,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      channel: input.channel,
      sessionId: input.sessionId,
      tags: input.tags || [],
    };
    
    // Calculate priority
    task.priority = this.calculatePriority(task);
    
    // Add to state
    this.state.scheduledTasks.push(task);
    
    // Re-sort tasks by priority
    this.sortTasks();
    
    return task;
  }
  
  /**
   * Update task status
   */
  updateTaskStatus(taskId: string, status: TaskStatus): ScheduledTask | null {
    const task = this.state.scheduledTasks.find(t => t.id === taskId);
    if (!task) return null;
    
    task.status = status;
    task.updatedAt = Date.now();
    
    if (status === 'completed') {
      task.completedAt = Date.now();
    }
    
    return task;
  }
  
  /**
   * Update task priority factors
   */
  updateTask(taskId: string, updates: Partial<Pick<ScheduledTask, 'urgency' | 'importance' | 'deadline' | 'title' | 'description' | 'tags'>>): ScheduledTask | null {
    const task = this.state.scheduledTasks.find(t => t.id === taskId);
    if (!task) return null;
    
    Object.assign(task, updates);
    task.updatedAt = Date.now();
    task.priority = this.calculatePriority(task);
    
    this.sortTasks();
    
    return task;
  }
  
  /**
   * Get the next task to work on
   */
  getNextTask(): ScheduledTask | null {
    // Refresh priorities based on current time
    this.refreshPriorities();
    
    // Find highest priority pending task
    const pending = this.state.scheduledTasks
      .filter(t => t.status === 'pending')
      .sort((a, b) => b.priority - a.priority);
    
    return pending[0] || null;
  }
  
  /**
   * Get all tasks sorted by priority
   */
  getTaskList(): ScheduledTask[] {
    this.refreshPriorities();
    return [...this.state.scheduledTasks].sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Get tasks by status
   */
  getTasksByStatus(status: TaskStatus): ScheduledTask[] {
    return this.state.scheduledTasks
      .filter(t => t.status === status)
      .sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Get overdue tasks
   */
  getOverdueTasks(): ScheduledTask[] {
    const now = Date.now();
    return this.state.scheduledTasks
      .filter(t => t.deadline && t.deadline < now && t.status === 'pending')
      .sort((a, b) => (a.deadline || 0) - (b.deadline || 0));
  }
  
  /**
   * Remove a task
   */
  removeTask(taskId: string): boolean {
    const index = this.state.scheduledTasks.findIndex(t => t.id === taskId);
    if (index === -1) return false;
    
    this.state.scheduledTasks.splice(index, 1);
    return true;
  }
  
  /**
   * Clean up completed/cancelled tasks older than specified days
   */
  cleanupOldTasks(maxAgeDays: number = 30): number {
    const cutoff = Date.now() - maxAgeDays * MS_PER_DAY;
    const before = this.state.scheduledTasks.length;
    
    this.state.scheduledTasks = this.state.scheduledTasks.filter(t => {
      if (t.status === 'pending' || t.status === 'in-progress') return true;
      return t.updatedAt > cutoff;
    });
    
    return before - this.state.scheduledTasks.length;
  }
  
  /**
   * Refresh all task priorities (call periodically)
   */
  private refreshPriorities(): void {
    for (const task of this.state.scheduledTasks) {
      if (task.status === 'pending') {
        task.priority = this.calculatePriority(task);
      }
    }
    this.sortTasks();
  }
  
  /**
   * Sort tasks by priority
   */
  private sortTasks(): void {
    this.state.scheduledTasks.sort((a, b) => b.priority - a.priority);
  }
  
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
  } {
    const tasks = this.state.scheduledTasks;
    const now = Date.now();
    
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const overdue = tasks.filter(t => t.deadline && t.deadline < now && t.status === 'pending').length;
    
    const avgPriority = tasks.length > 0
      ? tasks.reduce((sum, t) => sum + t.priority, 0) / tasks.length
      : 0;
    
    return {
      total: tasks.length,
      pending,
      inProgress,
      completed,
      overdue,
      avgPriority: Math.round(avgPriority),
    };
  }
}
