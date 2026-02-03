// ============================================================================
// TEMPORAL COGNITION MODULE - MAIN ENTRY POINT
// ============================================================================

import * as fs from 'fs';
import * as path from 'path';
import { TimePerceptionEngine } from './engines/time-perception';
import { TaskTimeEstimator } from './engines/task-estimator';
import { TemporalTranslator } from './engines/temporal-translator';
import { TemporalPriorityScheduler } from './engines/priority-scheduler';
import { CycleManager } from './managers/cycle-manager';
import { CrossChannelSync } from './managers/cross-channel-sync';
import { TemporalMemoryIntegration } from './managers/temporal-memory';
import { registerTemporalTools } from './tools/temporal-tools';
import { TemporalCognitionState, PluginConfig, CyclePhase } from './types';

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

let pluginState: TemporalCognitionState | null = null;
let timePerception: TimePerceptionEngine | null = null;
let taskEstimator: TaskTimeEstimator | null = null;
let temporalTranslator: TemporalTranslator | null = null;
let priorityScheduler: TemporalPriorityScheduler | null = null;
let cycleManager: CycleManager | null = null;
let crossChannelSync: CrossChannelSync | null = null;
let temporalMemory: TemporalMemoryIntegration | null = null;

function resolveStoragePath(storagePath: string, configDir: string): string {
  return storagePath
    .replace(/^~/, process.env.HOME || '/root')
    .replace('${configDir}', configDir);
}

function createInitialState(): TemporalCognitionState {
  const now = Date.now();
  return {
    version: '1.0.0',
    initialized: false,
    timePerception: { bootTime: now, totalTicks: 0, totalCycles: 0 },
    taskHistory: [],
    activeTasks: {},
    scheduledTasks: [],
    cycleState: {
      currentPhase: 'maintenance' as CyclePhase,
      phaseStartedAt: now,
      nextPhaseAt: now + 3600000,
      nextPhase: 'active' as CyclePhase,
      userActivityLevel: 0,
      adaptedSchedule: false,
    },
    syncState: { lastSyncAt: now, channels: {}, globalPhase: 'maintenance' as CyclePhase, taskQueueHash: '' },
    memoryIndex: {},
  };
}

function loadState(storagePath: string): TemporalCognitionState {
  const statePath = path.join(storagePath, 'state.json');
  if (fs.existsSync(statePath)) {
    try {
      const data = fs.readFileSync(statePath, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      console.warn('[temporal-cognition] Failed to load state, creating new');
    }
  }
  return createInitialState();
}

function saveState(storagePath: string, state: TemporalCognitionState): void {
  fs.mkdirSync(storagePath, { recursive: true });
  fs.writeFileSync(path.join(storagePath, 'state.json'), JSON.stringify(state, null, 2));
}

// ============================================================================
// PLUGIN DEFINITION
// ============================================================================

interface PluginDeps {
  logger: { info: (m: string) => void; warn: (m: string) => void; error: (m: string) => void; debug: (m: string) => void; };
  configDir: string;
}

interface PluginAPI {
  registerPlugin: (plugin: any) => void;
  registerHook: (hook: string, handler: (ctx: any) => Promise<void>) => void;
  registerGatewayMethod: (name: string, handler: (ctx: { respond: (ok: boolean, data: any) => void }) => void) => void;
  registerCli: (handler: (ctx: { program: any }) => void, opts: { commands: string[] }) => void;
  logger: { info: (m: string) => void; };
}

const plugin = {
  id: 'temporal-cognition',
  name: 'Temporal Cognition Module',
  slot: 'tool' as const,

  init: async (config: PluginConfig, deps: PluginDeps) => {
    deps.logger.info('[temporal-cognition] Initializing...');
    
    if (!config.enabled) {
      deps.logger.info('[temporal-cognition] Plugin disabled');
      return { tools: [] };
    }

    const storagePath = resolveStoragePath(
      config.storage?.path || '~/.openclaw/temporal-cognition',
      deps.configDir
    );
    
    pluginState = loadState(storagePath);
    pluginState.initialized = true;

    // Initialize engines
    if (config.timePerception?.enabled !== false) {
      timePerception = new TimePerceptionEngine(config.timePerception, pluginState);
      deps.logger.info('[temporal-cognition] Time Perception Engine initialized');
    }
    
    if (config.taskEstimator?.enabled !== false) {
      taskEstimator = new TaskTimeEstimator(config.taskEstimator, pluginState);
      deps.logger.info('[temporal-cognition] Task Time Estimator initialized');
    }
    
    if (config.temporalTranslator?.enabled !== false) {
      temporalTranslator = new TemporalTranslator(config.temporalTranslator);
      deps.logger.info('[temporal-cognition] Temporal Translator initialized');
    }
    
    if (config.priorityScheduler?.enabled !== false) {
      priorityScheduler = new TemporalPriorityScheduler(config.priorityScheduler, pluginState);
      deps.logger.info('[temporal-cognition] Priority Scheduler initialized');
    }
    
    if (config.cycleManager?.enabled !== false) {
      cycleManager = new CycleManager(config.cycleManager, pluginState);
      deps.logger.info('[temporal-cognition] Cycle Manager initialized');
    }
    
    if (config.crossChannelSync?.enabled !== false) {
      crossChannelSync = new CrossChannelSync(config.crossChannelSync, pluginState, deps);
      deps.logger.info('[temporal-cognition] Cross-Channel Sync initialized');
    }
    
    if (config.temporalMemory?.enabled !== false) {
      temporalMemory = new TemporalMemoryIntegration(config.temporalMemory, pluginState);
      deps.logger.info('[temporal-cognition] Temporal Memory initialized');
    }

    // Periodic state persistence
    const saveInterval = setInterval(() => {
      if (pluginState) saveState(storagePath, pluginState);
    }, 30000);

    deps.logger.info('[temporal-cognition] Initialization complete');

    return {
      tools: registerTemporalTools({
        timePerception, taskEstimator, temporalTranslator, priorityScheduler,
        cycleManager, crossChannelSync, temporalMemory, state: pluginState, config,
      }),
      cleanup: () => {
        clearInterval(saveInterval);
        if (crossChannelSync) crossChannelSync.cleanup();
        if (pluginState) saveState(storagePath, pluginState);
      },
    };
  },
};

// ============================================================================
// REGISTRATION FUNCTION
// ============================================================================

export default function register(api: PluginAPI) {
  api.registerPlugin(plugin);

  // Hook: message_received - Record activity and tick
  api.registerHook('message_received', async (ctx: any) => {
    if (timePerception) timePerception.tick();
    if (cycleManager) cycleManager.recordUserActivity();
    if (crossChannelSync && ctx.channel) {
      crossChannelSync.recordActivity(ctx.channel, ctx.sessionKey);
    }
  });

  // Hook: before_agent_start - Inject temporal context
  api.registerHook('before_agent_start', async (ctx: any) => {
    if (timePerception) timePerception.startProcessingTimer();
    if (cycleManager) {
      const phase = cycleManager.getCurrentPhase();
      const guidance = cycleManager.getPhaseGuidance();
      ctx.injectedContext = ctx.injectedContext || [];
      ctx.injectedContext.push(`[Temporal Context: Phase "${phase}". ${guidance}]`);
    }
  });

  // Hook: agent_end - Complete processing cycle
  api.registerHook('agent_end', async (ctx: any) => {
    if (timePerception) {
      timePerception.cycle();
      timePerception.stopProcessingTimer();
    }
  });

  // Hook: after_tool_call - Track tool usage
  api.registerHook('after_tool_call', async (ctx: any) => {
    if (timePerception) timePerception.tick();
  });

  // Hook: session_start
  api.registerHook('session_start', async (ctx: any) => {
    if (crossChannelSync && ctx.channel) {
      crossChannelSync.recordSessionStart(ctx.channel, ctx.sessionKey);
    }
  });

  // Hook: session_end
  api.registerHook('session_end', async (ctx: any) => {
    if (crossChannelSync && ctx.channel) {
      crossChannelSync.recordSessionEnd(ctx.channel, ctx.sessionKey);
    }
  });

  // Gateway RPC: temporal.status
  api.registerGatewayMethod('temporal.status', ({ respond }) => {
    if (!pluginState) return respond(false, { error: 'Not initialized' });
    respond(true, {
      initialized: pluginState.initialized,
      currentPhase: pluginState.cycleState.currentPhase,
      totalTicks: pluginState.timePerception.totalTicks,
      totalCycles: pluginState.timePerception.totalCycles,
      taskCount: pluginState.scheduledTasks.length,
      memoryCount: Object.keys(pluginState.memoryIndex).length,
    });
  });

  // Gateway RPC: temporal.getContext
  api.registerGatewayMethod('temporal.getContext', ({ respond }) => {
    if (!timePerception) return respond(false, { error: 'Time perception unavailable' });
    respond(true, timePerception.getCurrentContext());
  });

  // CLI commands
  api.registerCli(({ program }) => {
    const temporal = program.command('temporal').description('Temporal Cognition commands');
    
    temporal.command('status').description('Show temporal status').action(() => {
      if (!pluginState) return console.log('Not initialized');
      console.log(`Phase: ${pluginState.cycleState.currentPhase}`);
      console.log(`Ticks: ${pluginState.timePerception.totalTicks}`);
      console.log(`Cycles: ${pluginState.timePerception.totalCycles}`);
      console.log(`Tasks: ${pluginState.scheduledTasks.length}`);
      console.log(`Memories: ${Object.keys(pluginState.memoryIndex).length}`);
    });
    
    temporal.command('phase').description('Show current phase').action(() => {
      if (!cycleManager) return console.log('Cycle manager unavailable');
      const info = cycleManager.getCurrentPhaseInfo();
      console.log(`Current: ${info.currentPhase}`);
      console.log(`Next: ${info.nextPhase}`);
      console.log(`Guidance: ${cycleManager.getPhaseGuidance()}`);
    });
    
    temporal.command('tasks').description('List scheduled tasks').action(() => {
      if (!priorityScheduler) return console.log('Scheduler unavailable');
      const tasks = priorityScheduler.getTaskList();
      if (tasks.length === 0) return console.log('No tasks');
      for (const task of tasks.slice(0, 10)) {
        console.log(`[${task.priority}] ${task.title} (${task.status})`);
      }
    });
  }, { commands: ['temporal'] });

  api.logger.info('[temporal-cognition] Plugin registered');
}

// Export components for direct usage
export {
  TimePerceptionEngine,
  TaskTimeEstimator,
  TemporalTranslator,
  TemporalPriorityScheduler,
  CycleManager,
  CrossChannelSync,
  TemporalMemoryIntegration,
};

export * from './types';
export * from './constants';
