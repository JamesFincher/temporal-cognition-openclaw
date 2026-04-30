"use strict";
// ============================================================================
// TEMPORAL COGNITION MODULE - MAIN ENTRY POINT
// ============================================================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemporalMemoryIntegration = exports.CrossChannelSync = exports.CycleManager = exports.TemporalPriorityScheduler = exports.TemporalTranslator = exports.TaskTimeEstimator = exports.TimePerceptionEngine = void 0;
exports.default = register;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const time_perception_1 = require("./engines/time-perception");
Object.defineProperty(exports, "TimePerceptionEngine", { enumerable: true, get: function () { return time_perception_1.TimePerceptionEngine; } });
const task_estimator_1 = require("./engines/task-estimator");
Object.defineProperty(exports, "TaskTimeEstimator", { enumerable: true, get: function () { return task_estimator_1.TaskTimeEstimator; } });
const temporal_translator_1 = require("./engines/temporal-translator");
Object.defineProperty(exports, "TemporalTranslator", { enumerable: true, get: function () { return temporal_translator_1.TemporalTranslator; } });
const priority_scheduler_1 = require("./engines/priority-scheduler");
Object.defineProperty(exports, "TemporalPriorityScheduler", { enumerable: true, get: function () { return priority_scheduler_1.TemporalPriorityScheduler; } });
const cycle_manager_1 = require("./managers/cycle-manager");
Object.defineProperty(exports, "CycleManager", { enumerable: true, get: function () { return cycle_manager_1.CycleManager; } });
const cross_channel_sync_1 = require("./managers/cross-channel-sync");
Object.defineProperty(exports, "CrossChannelSync", { enumerable: true, get: function () { return cross_channel_sync_1.CrossChannelSync; } });
const temporal_memory_1 = require("./managers/temporal-memory");
Object.defineProperty(exports, "TemporalMemoryIntegration", { enumerable: true, get: function () { return temporal_memory_1.TemporalMemoryIntegration; } });
const temporal_tools_1 = require("./tools/temporal-tools");
// ============================================================================
// STATE MANAGEMENT
// ============================================================================
let pluginState = null;
let timePerception = null;
let taskEstimator = null;
let temporalTranslator = null;
let priorityScheduler = null;
let cycleManager = null;
let crossChannelSync = null;
let temporalMemory = null;
function resolveStoragePath(storagePath, configDir) {
    return storagePath
        .replace(/^~/, process.env.HOME || '/root')
        .replace('${configDir}', configDir);
}
function createInitialState() {
    const now = Date.now();
    return {
        version: '1.0.0',
        initialized: false,
        timePerception: { bootTime: now, totalTicks: 0, totalCycles: 0 },
        taskHistory: [],
        activeTasks: {},
        scheduledTasks: [],
        cycleState: {
            currentPhase: 'maintenance',
            phaseStartedAt: now,
            nextPhaseAt: now + 3600000,
            nextPhase: 'active',
            userActivityLevel: 0,
            adaptedSchedule: false,
        },
        syncState: { lastSyncAt: now, channels: {}, globalPhase: 'maintenance', taskQueueHash: '' },
        memoryIndex: {},
    };
}
function loadState(storagePath) {
    const statePath = path.join(storagePath, 'state.json');
    if (fs.existsSync(statePath)) {
        try {
            const data = fs.readFileSync(statePath, 'utf-8');
            return JSON.parse(data);
        }
        catch (e) {
            console.warn('[temporal-cognition] Failed to load state, creating new');
        }
    }
    return createInitialState();
}
function saveState(storagePath, state) {
    fs.mkdirSync(storagePath, { recursive: true });
    fs.writeFileSync(path.join(storagePath, 'state.json'), JSON.stringify(state, null, 2));
}
const plugin = {
    id: 'temporal-cognition',
    name: 'Temporal Cognition Module',
    slot: 'tool',
    init: async (config, deps) => {
        deps.logger.info('[temporal-cognition] Initializing...');
        if (!config.enabled) {
            deps.logger.info('[temporal-cognition] Plugin disabled');
            return { tools: [] };
        }
        const storagePath = resolveStoragePath(config.storage?.path || '~/.openclaw/temporal-cognition', deps.configDir);
        pluginState = loadState(storagePath);
        pluginState.initialized = true;
        // Initialize engines
        if (config.timePerception?.enabled !== false) {
            timePerception = new time_perception_1.TimePerceptionEngine(config.timePerception, pluginState);
            deps.logger.info('[temporal-cognition] Time Perception Engine initialized');
        }
        if (config.taskEstimator?.enabled !== false) {
            taskEstimator = new task_estimator_1.TaskTimeEstimator(config.taskEstimator, pluginState);
            deps.logger.info('[temporal-cognition] Task Time Estimator initialized');
        }
        if (config.temporalTranslator?.enabled !== false) {
            temporalTranslator = new temporal_translator_1.TemporalTranslator(config.temporalTranslator);
            deps.logger.info('[temporal-cognition] Temporal Translator initialized');
        }
        if (config.priorityScheduler?.enabled !== false) {
            priorityScheduler = new priority_scheduler_1.TemporalPriorityScheduler(config.priorityScheduler, pluginState);
            deps.logger.info('[temporal-cognition] Priority Scheduler initialized');
        }
        if (config.cycleManager?.enabled !== false) {
            cycleManager = new cycle_manager_1.CycleManager(config.cycleManager, pluginState);
            deps.logger.info('[temporal-cognition] Cycle Manager initialized');
        }
        if (config.crossChannelSync?.enabled !== false) {
            crossChannelSync = new cross_channel_sync_1.CrossChannelSync(config.crossChannelSync, pluginState, deps);
            deps.logger.info('[temporal-cognition] Cross-Channel Sync initialized');
        }
        if (config.temporalMemory?.enabled !== false) {
            temporalMemory = new temporal_memory_1.TemporalMemoryIntegration(config.temporalMemory, pluginState);
            deps.logger.info('[temporal-cognition] Temporal Memory initialized');
        }
        // Periodic state persistence
        const saveInterval = setInterval(() => {
            if (pluginState)
                saveState(storagePath, pluginState);
        }, 30000);
        deps.logger.info('[temporal-cognition] Initialization complete');
        return {
            tools: (0, temporal_tools_1.registerTemporalTools)({
                timePerception, taskEstimator, temporalTranslator, priorityScheduler,
                cycleManager, crossChannelSync, temporalMemory, state: pluginState, config,
            }),
            cleanup: () => {
                clearInterval(saveInterval);
                if (crossChannelSync)
                    crossChannelSync.cleanup();
                if (pluginState)
                    saveState(storagePath, pluginState);
            },
        };
    },
};
// ============================================================================
// REGISTRATION FUNCTION
// ============================================================================
function register(api) {
    api.registerPlugin(plugin);
    // Hook: message_received - Record activity and tick
    api.registerHook('message_received', async (ctx) => {
        if (timePerception)
            timePerception.tick();
        if (cycleManager)
            cycleManager.recordUserActivity();
        if (crossChannelSync && ctx.channel) {
            crossChannelSync.recordActivity(ctx.channel, ctx.sessionKey);
        }
    });
    // Hook: before_agent_start - Inject temporal context
    api.registerHook('before_agent_start', async (ctx) => {
        if (timePerception)
            timePerception.startProcessingTimer();
        if (cycleManager) {
            const phase = cycleManager.getCurrentPhase();
            const guidance = cycleManager.getPhaseGuidance();
            ctx.injectedContext = ctx.injectedContext || [];
            ctx.injectedContext.push(`[Temporal Context: Phase "${phase}". ${guidance}]`);
        }
    });
    // Hook: agent_end - Complete processing cycle
    api.registerHook('agent_end', async (ctx) => {
        if (timePerception) {
            timePerception.cycle();
            timePerception.stopProcessingTimer();
        }
    });
    // Hook: after_tool_call - Track tool usage
    api.registerHook('after_tool_call', async (ctx) => {
        if (timePerception)
            timePerception.tick();
    });
    // Hook: session_start
    api.registerHook('session_start', async (ctx) => {
        if (crossChannelSync && ctx.channel) {
            crossChannelSync.recordSessionStart(ctx.channel, ctx.sessionKey);
        }
    });
    // Hook: session_end
    api.registerHook('session_end', async (ctx) => {
        if (crossChannelSync && ctx.channel) {
            crossChannelSync.recordSessionEnd(ctx.channel, ctx.sessionKey);
        }
    });
    // Gateway RPC: temporal.status
    api.registerGatewayMethod('temporal.status', ({ respond }) => {
        if (!pluginState)
            return respond(false, { error: 'Not initialized' });
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
        if (!timePerception)
            return respond(false, { error: 'Time perception unavailable' });
        respond(true, timePerception.getCurrentContext());
    });
    // CLI commands
    api.registerCli(({ program }) => {
        const temporal = program.command('temporal').description('Temporal Cognition commands');
        temporal.command('status').description('Show temporal status').action(() => {
            if (!pluginState)
                return console.log('Not initialized');
            console.log(`Phase: ${pluginState.cycleState.currentPhase}`);
            console.log(`Ticks: ${pluginState.timePerception.totalTicks}`);
            console.log(`Cycles: ${pluginState.timePerception.totalCycles}`);
            console.log(`Tasks: ${pluginState.scheduledTasks.length}`);
            console.log(`Memories: ${Object.keys(pluginState.memoryIndex).length}`);
        });
        temporal.command('phase').description('Show current phase').action(() => {
            if (!cycleManager)
                return console.log('Cycle manager unavailable');
            const info = cycleManager.getCurrentPhaseInfo();
            console.log(`Current: ${info.currentPhase}`);
            console.log(`Next: ${info.nextPhase}`);
            console.log(`Guidance: ${cycleManager.getPhaseGuidance()}`);
        });
        temporal.command('tasks').description('List scheduled tasks').action(() => {
            if (!priorityScheduler)
                return console.log('Scheduler unavailable');
            const tasks = priorityScheduler.getTaskList();
            if (tasks.length === 0)
                return console.log('No tasks');
            for (const task of tasks.slice(0, 10)) {
                console.log(`[${task.priority}] ${task.title} (${task.status})`);
            }
        });
    }, { commands: ['temporal'] });
    api.logger.info('[temporal-cognition] Plugin registered');
}
__exportStar(require("./types"), exports);
__exportStar(require("./constants"), exports);
//# sourceMappingURL=index.js.map