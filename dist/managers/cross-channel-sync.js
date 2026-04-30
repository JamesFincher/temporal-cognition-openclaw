"use strict";
// ============================================================================
// TEMPORAL COGNITION MODULE - CROSS-CHANNEL TEMPORAL SYNC
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrossChannelSync = void 0;
const crypto = __importStar(require("crypto"));
class CrossChannelSync {
    config;
    state;
    logger;
    syncInterval = null;
    constructor(config, state, deps) {
        this.config = {
            enabled: config?.enabled ?? true,
            syncIntervalMs: config?.syncIntervalMs ?? 5000,
            channels: config?.channels ?? ['discord', 'telegram'],
        };
        this.state = state;
        this.logger = deps.logger;
        // Initialize sync state if needed
        if (!this.state.syncState) {
            this.state.syncState = {
                lastSyncAt: Date.now(),
                channels: {},
                globalPhase: this.state.cycleState?.currentPhase || 'active',
                taskQueueHash: '',
            };
        }
        // Initialize channel states
        for (const channel of this.config.channels) {
            if (!this.state.syncState.channels[channel]) {
                this.state.syncState.channels[channel] = {
                    channel,
                    lastActivity: 0,
                    sessionCount: 0,
                    activeTaskCount: 0,
                    pendingEstimates: [],
                };
            }
        }
        // Start sync interval
        if (this.config.syncIntervalMs > 0) {
            this.syncInterval = setInterval(() => this.sync(), this.config.syncIntervalMs);
        }
    }
    /**
     * Record activity on a channel
     */
    recordActivity(channel, sessionKey) {
        // Ensure channel exists
        if (!this.state.syncState.channels[channel]) {
            this.state.syncState.channels[channel] = {
                channel,
                lastActivity: Date.now(),
                sessionCount: 0,
                activeTaskCount: 0,
                pendingEstimates: [],
            };
        }
        this.state.syncState.channels[channel].lastActivity = Date.now();
        this.logger.debug(`[temporal-sync] Activity recorded on ${channel}`);
    }
    /**
     * Record session start on a channel
     */
    recordSessionStart(channel, sessionKey) {
        this.recordActivity(channel, sessionKey);
        this.state.syncState.channels[channel].sessionCount++;
        this.logger.debug(`[temporal-sync] Session started on ${channel}, count: ${this.state.syncState.channels[channel].sessionCount}`);
    }
    /**
     * Record session end on a channel
     */
    recordSessionEnd(channel, sessionKey) {
        const ch = this.state.syncState.channels[channel];
        if (ch && ch.sessionCount > 0) {
            ch.sessionCount--;
            this.logger.debug(`[temporal-sync] Session ended on ${channel}, count: ${ch.sessionCount}`);
        }
    }
    /**
     * Get sync status
     */
    getSyncStatus() {
        return { ...this.state.syncState };
    }
    /**
     * Get state for a specific channel
     */
    getChannelState(channel) {
        return this.state.syncState.channels[channel] || null;
    }
    /**
     * Get all active channels (with recent activity)
     */
    getActiveChannels(maxIdleMs = 300000) {
        const now = Date.now();
        return Object.values(this.state.syncState.channels)
            .filter(ch => ch.lastActivity > 0 && (now - ch.lastActivity) < maxIdleMs);
    }
    /**
     * Get total active sessions across all channels
     */
    getTotalActiveSessions() {
        return Object.values(this.state.syncState.channels)
            .reduce((sum, ch) => sum + ch.sessionCount, 0);
    }
    /**
     * Broadcast a task to all channels (for cross-channel awareness)
     */
    broadcastTaskAdded(taskId, channel) {
        // Add to pending estimates for all channels except originating
        for (const ch of Object.values(this.state.syncState.channels)) {
            if (ch.channel !== channel) {
                ch.pendingEstimates.push(taskId);
            }
        }
        this.logger.debug(`[temporal-sync] Task ${taskId} broadcast to channels`);
    }
    /**
     * Clear pending estimate notification for a channel
     */
    clearPendingEstimate(channel, taskId) {
        const ch = this.state.syncState.channels[channel];
        if (ch) {
            ch.pendingEstimates = ch.pendingEstimates.filter(id => id !== taskId);
        }
    }
    /**
     * Perform sync operation
     */
    sync() {
        const now = Date.now();
        this.state.syncState.lastSyncAt = now;
        this.state.syncState.globalPhase = this.state.cycleState?.currentPhase || 'active';
        // Compute task queue hash for change detection
        const taskData = JSON.stringify(this.state.scheduledTasks
            .map(t => `${t.id}:${t.status}:${t.priority}`)
            .sort());
        this.state.syncState.taskQueueHash = crypto
            .createHash('md5')
            .update(taskData)
            .digest('hex')
            .slice(0, 8);
        // Update active task counts per channel
        for (const channel of Object.keys(this.state.syncState.channels)) {
            const channelTasks = this.state.scheduledTasks.filter(t => t.channel === channel && t.status === 'pending');
            this.state.syncState.channels[channel].activeTaskCount = channelTasks.length;
        }
    }
    /**
     * Get cross-channel statistics
     */
    getStatistics() {
        const now = Date.now();
        const channels = Object.values(this.state.syncState.channels);
        return {
            totalChannels: channels.length,
            activeChannels: this.getActiveChannels().length,
            totalSessions: this.getTotalActiveSessions(),
            totalPendingTasks: channels.reduce((sum, ch) => sum + ch.activeTaskCount, 0),
            lastSyncAgo: now - this.state.syncState.lastSyncAt,
        };
    }
    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }
}
exports.CrossChannelSync = CrossChannelSync;
//# sourceMappingURL=cross-channel-sync.js.map