// ============================================================================
// TEMPORAL COGNITION MODULE - TASK TIME ESTIMATOR
// ============================================================================

import {
  TaskEstimatorConfig,
  TemporalCognitionState,
  TaskCategory,
  TaskComplexity,
  DurationEstimate,
  TaskHistoryEntry,
  ActiveTask,
  SoftwareTaskDetail,
  DurationBaselineMetadata,
} from '../types';
import {
  BASE_DURATION_MS,
  COMPLEXITY_MULTIPLIERS,
  SOFTWARE_BASE_DURATION_MS,
  SOFTWARE_BASELINE_CALIBRATION,
} from '../constants';
import { calculateConfidence, calculateAccuracy, bayesianUpdate, calculateVariance } from '../utils/confidence';
import { formatDuration } from '../utils/time-math';

const VERIFICATION_FACTORS = {
  none: 0.8,
  light: 0.9,
  normal: 1.0,
  thorough: 1.35,
} as const;

const FAMILIARITY_FACTORS = {
  familiar: 0.85,
  mixed: 1.0,
  unfamiliar: 1.25,
} as const;

const COMPLEXITY_LINE_ANCHORS: Record<TaskComplexity, number> = {
  trivial: 10,
  simple: 50,
  moderate: 150,
  complex: 500,
  'highly-complex': 1500,
};

interface BaselineResult {
  durationMs: number;
  metadata: DurationBaselineMetadata;
}

export class TaskTimeEstimator {
  private config: Required<TaskEstimatorConfig>;
  private state: TemporalCognitionState;
  private learnedBaselines: Map<string, { mean: number; confidence: number }> = new Map();
  
  constructor(config: TaskEstimatorConfig | undefined, state: TemporalCognitionState) {
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
  private initializeBaselines(): void {
    for (const entry of this.state.taskHistory) {
      const key = `${entry.category}:${entry.complexity}`;
      const existing = this.learnedBaselines.get(key);
      
      if (existing) {
        const updated = bayesianUpdate(
          existing.mean,
          existing.confidence,
          entry.actualMs,
          this.config.learningRate
        );
        this.learnedBaselines.set(key, updated);
      } else {
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
  private getBaseline(
    category: TaskCategory,
    complexity: TaskComplexity,
    taskDetail?: SoftwareTaskDetail
  ): BaselineResult {
    const key = `${category}:${complexity}`;
    const learned = this.learnedBaselines.get(key);
    
    if (learned && learned.confidence > 0.5) {
      return {
        durationMs: learned.mean,
        metadata: {
          actorProfile: taskDetail?.actorProfile,
          baselineSource: 'learned-history',
          calibrationMethod: 'historical task completions for matching category and complexity',
          softwareTaskType: taskDetail?.softwareTaskType,
          adjustmentFactors: {
            learnedConfidence: learned.confidence,
          },
        },
      };
    }

    if (category === 'coding' && taskDetail?.softwareTaskType) {
      return this.getSoftwareBaseline(complexity, {
        ...taskDetail,
        softwareTaskType: taskDetail.softwareTaskType,
      });
    }
    
    // Fall back to default baseline
    const baseMs = BASE_DURATION_MS[category] || BASE_DURATION_MS.other;
    const multiplier = COMPLEXITY_MULTIPLIERS[complexity] || 1.0;
    
    return {
      durationMs: baseMs * multiplier,
      metadata: {
        baselineSource: 'default-category',
        calibrationMethod: 'legacy category baseline multiplied by task complexity',
        adjustmentFactors: {
          complexityMultiplier: multiplier,
        },
      },
    };
  }

  private getSoftwareBaseline(
    complexity: TaskComplexity,
    taskDetail: SoftwareTaskDetail & { softwareTaskType: NonNullable<SoftwareTaskDetail['softwareTaskType']> }
  ): BaselineResult {
    const actorProfile = taskDetail.actorProfile ?? 'human';
    const verificationLevel = taskDetail.verificationLevel ?? 'normal';
    const familiarity = taskDetail.familiarity ?? 'mixed';
    const baseMs = SOFTWARE_BASE_DURATION_MS[taskDetail.softwareTaskType][actorProfile][complexity];
    const expectedFiles = Math.max(0, taskDetail.expectedFiles ?? 0);
    const expectedLinesChanged = Math.max(0, taskDetail.expectedLinesChanged ?? 0);
    const fileFactor = expectedFiles > 1
      ? 1 + Math.min((expectedFiles - 1) * 0.08, 0.6)
      : 1;
    const lineAnchor = COMPLEXITY_LINE_ANCHORS[complexity];
    const lineFactor = expectedLinesChanged > lineAnchor
      ? 1 + Math.min(((expectedLinesChanged - lineAnchor) / lineAnchor) * 0.15, 0.75)
      : 1;
    const verificationFactor = VERIFICATION_FACTORS[verificationLevel];
    const familiarityFactor = FAMILIARITY_FACTORS[familiarity];
    const adjustedMs = baseMs * fileFactor * lineFactor * verificationFactor * familiarityFactor;

    return {
      durationMs: adjustedMs,
      metadata: {
        actorProfile,
        baselineSource: 'calibrated-software',
        calibrationMethod: SOFTWARE_BASELINE_CALIBRATION.method,
        softwareTaskType: taskDetail.softwareTaskType,
        adjustmentFactors: {
          fileFactor,
          lineFactor,
          verificationFactor,
          familiarityFactor,
        },
      },
    };
  }
  
  /**
   * Estimate duration for a task
   */
  estimate(
    category: TaskCategory,
    complexity: TaskComplexity,
    taskDetail?: SoftwareTaskDetail
  ): DurationEstimate {
    const relevantHistory = this.state.taskHistory.filter(
      h => h.category === category && h.complexity === complexity
    );
    
    // Get baseline estimate
    const baseline = this.getBaseline(category, complexity, taskDetail);
    
    // Calculate variance from history
    const variance = calculateVariance(relevantHistory);
    
    // Calculate confidence
    const confidence = calculateConfidence(
      relevantHistory,
      category,
      complexity,
      {
        minSamples: this.config.minSamplesForEstimate,
        decayDays: this.config.confidenceDecayDays,
      }
    );
    
    // Calculate min/max based on variance
    const varianceFactor = 1 + variance;
    const expectedMs = Math.round(baseline.durationMs);
    const minimumMs = Math.min(expectedMs, Math.round(baseline.durationMs / varianceFactor));
    const maximumMs = Math.max(expectedMs, Math.round(baseline.durationMs * varianceFactor));
    
    return {
      minimumMs,
      expectedMs,
      maximumMs,
      confidence,
      basedOnSamples: relevantHistory.length,
      category,
      complexity,
      humanReadable: {
        minimum: formatDuration(minimumMs, { precise: true }),
        expected: formatDuration(expectedMs, { precise: true }),
        maximum: formatDuration(maximumMs, { precise: true }),
      },
      baselineMetadata: baseline.metadata,
    };
  }
  
  /**
   * Start tracking a task
   */
  startTask(category: TaskCategory, complexity: TaskComplexity): string {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const estimate = this.estimate(category, complexity);
    
    const activeTask: ActiveTask = {
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
  completeTask(taskId?: string): TaskHistoryEntry | null {
    // Find the task to complete
    let task: ActiveTask | undefined;
    
    if (taskId && this.state.activeTasks?.[taskId]) {
      task = this.state.activeTasks[taskId];
      delete this.state.activeTasks[taskId];
    } else {
      // Complete the most recent task
      const tasks = Object.values(this.state.activeTasks || {});
      if (tasks.length > 0) {
        task = tasks[tasks.length - 1];
        delete this.state.activeTasks[task.taskId];
      }
    }
    
    if (!task) return null;
    
    const actualMs = Date.now() - task.startTime;
    const accuracy = calculateAccuracy(task.estimatedMs, actualMs);
    
    const entry: TaskHistoryEntry = {
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
    const updated = bayesianUpdate(
      existing.mean,
      existing.confidence,
      actualMs,
      this.config.learningRate
    );
    this.learnedBaselines.set(key, updated);
    
    return entry;
  }
  
  /**
   * Get current active tasks
   */
  getActiveTasks(): ActiveTask[] {
    return Object.values(this.state.activeTasks || {});
  }
  
  /**
   * Get task history statistics
   */
  getStatistics(): {
    totalTasks: number;
    averageAccuracy: number;
    categoryCounts: Record<TaskCategory, number>;
  } {
    const history = this.state.taskHistory;
    const totalTasks = history.length;
    
    const averageAccuracy = totalTasks > 0
      ? history.reduce((sum, h) => sum + h.accuracy, 0) / totalTasks
      : 0;
    
    const categoryCounts: Record<TaskCategory, number> = {
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
