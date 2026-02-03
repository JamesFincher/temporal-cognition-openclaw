// ============================================================================
// TEMPORAL COGNITION MODULE - TOOLS REGISTRATION
// ============================================================================

import { TimePerceptionEngine } from '../engines/time-perception';
import { TaskTimeEstimator } from '../engines/task-estimator';
import { TemporalTranslator } from '../engines/temporal-translator';
import { TemporalPriorityScheduler } from '../engines/priority-scheduler';
import { CycleManager } from '../managers/cycle-manager';
import { CrossChannelSync } from '../managers/cross-channel-sync';
import { TemporalMemoryIntegration } from '../managers/temporal-memory';
import { TemporalCognitionState, PluginConfig, TaskCategory, TaskComplexity } from '../types';
import { parseRelativeTime } from '../utils/time-math';

interface Tool {
  name: string;
  description: string;
  parameters: { type: string; properties: Record<string, any>; required: string[]; };
  execute: (params: any) => Promise<any>;
}

interface ToolContext {
  timePerception: TimePerceptionEngine | null;
  taskEstimator: TaskTimeEstimator | null;
  temporalTranslator: TemporalTranslator | null;
  priorityScheduler: TemporalPriorityScheduler | null;
  cycleManager: CycleManager | null;
  crossChannelSync: CrossChannelSync | null;
  temporalMemory: TemporalMemoryIntegration | null;
  state: TemporalCognitionState;
  config: PluginConfig;
}

const TASK_CATEGORIES: TaskCategory[] = ['research', 'coding', 'writing', 'analysis', 'communication', 'scheduling', 'file-operations', 'web-browsing', 'other'];
const TASK_COMPLEXITIES: TaskComplexity[] = ['trivial', 'simple', 'moderate', 'complex', 'highly-complex'];

export function registerTemporalTools(ctx: ToolContext): Tool[] {
  const tools: Tool[] = [];

  // temporal_now
  tools.push({
    name: 'temporal_now',
    description: 'Get current temporal context including wall-clock time, AI-subjective time, cycle phase, and session information',
    parameters: { type: 'object', properties: {}, required: [] },
    execute: async () => {
      if (!ctx.timePerception) return { error: 'Time perception not available' };
      return ctx.timePerception.getCurrentContext();
    },
  });

  // temporal_estimate
  tools.push({
    name: 'temporal_estimate',
    description: 'Estimate how long a task will take based on category and complexity',
    parameters: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: TASK_CATEGORIES },
        complexity: { type: 'string', enum: TASK_COMPLEXITIES },
      },
      required: ['category', 'complexity'],
    },
    execute: async ({ category, complexity }: { category: TaskCategory; complexity: TaskComplexity }) => {
      if (!ctx.taskEstimator) return { error: 'Task estimator not available' };
      const estimate = ctx.taskEstimator.estimate(category, complexity);
      if (ctx.temporalTranslator) {
        return { ...estimate, humanReadable: ctx.temporalTranslator.translateDuration(estimate) };
      }
      return estimate;
    },
  });

  // temporal_start_task
  tools.push({
    name: 'temporal_start_task',
    description: 'Start tracking a task for duration learning',
    parameters: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: TASK_CATEGORIES },
        complexity: { type: 'string', enum: TASK_COMPLEXITIES },
      },
      required: ['category', 'complexity'],
    },
    execute: async ({ category, complexity }: { category: TaskCategory; complexity: TaskComplexity }) => {
      if (!ctx.taskEstimator) return { error: 'Task estimator not available' };
      const taskId = ctx.taskEstimator.startTask(category, complexity);
      return { taskId, message: 'Task tracking started' };
    },
  });

  // temporal_complete_task
  tools.push({
    name: 'temporal_complete_task',
    description: 'Complete task tracking and record actual duration for learning',
    parameters: {
      type: 'object',
      properties: { taskId: { type: 'string' } },
      required: [],
    },
    execute: async ({ taskId }: { taskId?: string }) => {
      if (!ctx.taskEstimator) return { error: 'Task estimator not available' };
      const entry = ctx.taskEstimator.completeTask(taskId);
      if (!entry) return { error: 'No active task to complete' };
      return { ...entry, message: `Task completed. Accuracy: ${Math.round(entry.accuracy * 100)}%` };
    },
  });

  // temporal_schedule_task
  tools.push({
    name: 'temporal_schedule_task',
    description: 'Schedule a task with deadline and priority',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        deadline: { type: 'string' },
        category: { type: 'string', enum: TASK_CATEGORIES },
        complexity: { type: 'string', enum: TASK_COMPLEXITIES },
        urgency: { type: 'number', minimum: 0, maximum: 100 },
        importance: { type: 'number', minimum: 0, maximum: 100 },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['title', 'category', 'complexity'],
    },
    execute: async (params: any) => {
      if (!ctx.priorityScheduler || !ctx.taskEstimator) return { error: 'Scheduler not available' };
      const estimatedDuration = ctx.taskEstimator.estimate(params.category, params.complexity);
      let deadlineMs: number | undefined;
      if (params.deadline) {
        const relativeMs = parseRelativeTime(params.deadline);
        deadlineMs = relativeMs !== null ? Date.now() + relativeMs : new Date(params.deadline).getTime() || undefined;
      }
      const task = ctx.priorityScheduler.addTask({
        title: params.title, description: params.description, deadline: deadlineMs,
        estimatedDuration, urgency: params.urgency ?? 50, importance: params.importance ?? 50, tags: params.tags ?? [],
      });
      return { task, message: `Task scheduled with priority ${task.priority}/100` };
    },
  });

  // temporal_get_next_task
  tools.push({
    name: 'temporal_get_next_task',
    description: 'Get the next task to work on based on priority',
    parameters: { type: 'object', properties: {}, required: [] },
    execute: async () => {
      if (!ctx.priorityScheduler) return { error: 'Scheduler not available' };
      const task = ctx.priorityScheduler.getNextTask();
      if (!task) return { message: 'No pending tasks' };
      let result: any = { task };
      if (ctx.temporalTranslator && task.deadline) {
        result.deadlineContext = ctx.temporalTranslator.formatDeadlineContext(task.deadline, task.estimatedDuration.expectedMs);
      }
      return result;
    },
  });

  // temporal_list_tasks
  tools.push({
    name: 'temporal_list_tasks',
    description: 'List all scheduled tasks sorted by priority',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['pending', 'in-progress', 'completed', 'all'] },
        limit: { type: 'number' },
      },
      required: [],
    },
    execute: async ({ status, limit }: { status?: string; limit?: number }) => {
      if (!ctx.priorityScheduler) return { error: 'Scheduler not available' };
      let tasks = ctx.priorityScheduler.getTaskList();
      if (status && status !== 'all') tasks = tasks.filter(t => t.status === status);
      return { tasks: tasks.slice(0, limit || 10), total: tasks.length };
    },
  });

  // temporal_get_phase
  tools.push({
    name: 'temporal_get_phase',
    description: 'Get current 24/7 cycle phase with capabilities',
    parameters: { type: 'object', properties: {}, required: [] },
    execute: async () => {
      if (!ctx.cycleManager) return { error: 'Cycle manager not available' };
      return { ...ctx.cycleManager.getCurrentPhaseInfo(), recommendation: ctx.cycleManager.getRecommendedAction() };
    },
  });

  // temporal_translate
  tools.push({
    name: 'temporal_translate',
    description: 'Translate milliseconds to human-readable duration',
    parameters: {
      type: 'object',
      properties: { durationMs: { type: 'number' } },
      required: ['durationMs'],
    },
    execute: async ({ durationMs }: { durationMs: number }) => {
      if (!ctx.temporalTranslator) return { error: 'Translator not available' };
      const estimate = { minimumMs: durationMs * 0.8, expectedMs: durationMs, maximumMs: durationMs * 1.5, confidence: 0.7, basedOnSamples: 0, category: 'other' as TaskCategory, complexity: 'moderate' as TaskComplexity };
      return ctx.temporalTranslator.translateDuration(estimate);
    },
  });

  // temporal_sync_status
  tools.push({
    name: 'temporal_sync_status',
    description: 'Get cross-channel sync status (Discord, Telegram)',
    parameters: { type: 'object', properties: {}, required: [] },
    execute: async () => {
      if (!ctx.crossChannelSync) return { error: 'Cross-channel sync not available' };
      return { syncState: ctx.crossChannelSync.getSyncStatus(), statistics: ctx.crossChannelSync.getStatistics() };
    },
  });

  // temporal_memory_search
  tools.push({
    name: 'temporal_memory_search',
    description: 'Search memories with temporal decay scoring',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        maxAgeDays: { type: 'number' },
        limit: { type: 'number' },
      },
      required: ['query'],
    },
    execute: async ({ query, maxAgeDays, limit }: { query: string; maxAgeDays?: number; limit?: number }) => {
      if (!ctx.temporalMemory) return { error: 'Temporal memory not available' };
      return { results: ctx.temporalMemory.search(query, { maxAgeDays, limit: limit || 10 }), query };
    },
  });

  // temporal_memory_add
  tools.push({
    name: 'temporal_memory_add',
    description: 'Add a memory entry with temporal context',
    parameters: {
      type: 'object',
      properties: { content: { type: 'string' } },
      required: ['content'],
    },
    execute: async ({ content }: { content: string }) => {
      if (!ctx.temporalMemory) return { error: 'Temporal memory not available' };
      const context = ctx.timePerception?.getCurrentContext();
      return { entry: ctx.temporalMemory.addEntry(content, context), message: 'Memory added' };
    },
  });

  return tools;
}
