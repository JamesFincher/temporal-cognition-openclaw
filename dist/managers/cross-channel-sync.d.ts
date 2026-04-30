import { CrossChannelSyncConfig, TemporalCognitionState, ChannelTemporalState, SyncState } from '../types';
interface Logger {
    info: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string) => void;
    debug: (msg: string) => void;
}
interface PluginDeps {
    logger: Logger;
    configDir: string;
}
export declare class CrossChannelSync {
    private config;
    private state;
    private logger;
    private syncInterval;
    constructor(config: CrossChannelSyncConfig | undefined, state: TemporalCognitionState, deps: PluginDeps);
    /**
     * Record activity on a channel
     */
    recordActivity(channel: string, sessionKey?: string): void;
    /**
     * Record session start on a channel
     */
    recordSessionStart(channel: string, sessionKey?: string): void;
    /**
     * Record session end on a channel
     */
    recordSessionEnd(channel: string, sessionKey?: string): void;
    /**
     * Get sync status
     */
    getSyncStatus(): SyncState;
    /**
     * Get state for a specific channel
     */
    getChannelState(channel: string): ChannelTemporalState | null;
    /**
     * Get all active channels (with recent activity)
     */
    getActiveChannels(maxIdleMs?: number): ChannelTemporalState[];
    /**
     * Get total active sessions across all channels
     */
    getTotalActiveSessions(): number;
    /**
     * Broadcast a task to all channels (for cross-channel awareness)
     */
    broadcastTaskAdded(taskId: string, channel?: string): void;
    /**
     * Clear pending estimate notification for a channel
     */
    clearPendingEstimate(channel: string, taskId: string): void;
    /**
     * Perform sync operation
     */
    private sync;
    /**
     * Get cross-channel statistics
     */
    getStatistics(): {
        totalChannels: number;
        activeChannels: number;
        totalSessions: number;
        totalPendingTasks: number;
        lastSyncAgo: number;
    };
    /**
     * Cleanup resources
     */
    cleanup(): void;
}
export {};
//# sourceMappingURL=cross-channel-sync.d.ts.map