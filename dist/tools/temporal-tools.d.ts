import { TimePerceptionEngine } from '../engines/time-perception';
import { TaskTimeEstimator } from '../engines/task-estimator';
import { TemporalTranslator } from '../engines/temporal-translator';
import { TemporalPriorityScheduler } from '../engines/priority-scheduler';
import { CycleManager } from '../managers/cycle-manager';
import { CrossChannelSync } from '../managers/cross-channel-sync';
import { TemporalMemoryIntegration } from '../managers/temporal-memory';
import { TemporalCognitionState, PluginConfig } from '../types';
interface Tool {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: Record<string, any>;
        required: string[];
    };
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
export declare function registerTemporalTools(ctx: ToolContext): Tool[];
export {};
//# sourceMappingURL=temporal-tools.d.ts.map