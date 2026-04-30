import { TimePerceptionEngine } from './engines/time-perception';
import { TaskTimeEstimator } from './engines/task-estimator';
import { TemporalTranslator } from './engines/temporal-translator';
import { TemporalPriorityScheduler } from './engines/priority-scheduler';
import { CycleManager } from './managers/cycle-manager';
import { CrossChannelSync } from './managers/cross-channel-sync';
import { TemporalMemoryIntegration } from './managers/temporal-memory';
interface PluginAPI {
    registerPlugin: (plugin: any) => void;
    registerHook: (hook: string, handler: (ctx: any) => Promise<void>) => void;
    registerGatewayMethod: (name: string, handler: (ctx: {
        respond: (ok: boolean, data: any) => void;
    }) => void) => void;
    registerCli: (handler: (ctx: {
        program: any;
    }) => void, opts: {
        commands: string[];
    }) => void;
    logger: {
        info: (m: string) => void;
    };
}
export default function register(api: PluginAPI): void;
export { TimePerceptionEngine, TaskTimeEstimator, TemporalTranslator, TemporalPriorityScheduler, CycleManager, CrossChannelSync, TemporalMemoryIntegration, };
export * from './types';
export * from './constants';
//# sourceMappingURL=index.d.ts.map