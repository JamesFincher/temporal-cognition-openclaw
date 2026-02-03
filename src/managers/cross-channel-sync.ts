// ============================================================================
// TEMPORAL COGNITION MODULE - CROSS-CHANNEL TEMPORAL SYNC
// ============================================================================

import {
  CrossChannelSyncConfig,
  TemporalCognitionState,
  ChannelTemporalState,
  SyncState,
} from '../types';
import * as crypto from 'crypto';

// Simple logger interface (OpenClaw provides this)
interface Logger {
  info: (msg: string) => void;
  warn: (msg: string) => void;
  error: (msg: string) => void;
  debug: (msg: string) => void;
}

// Plugin deps interface
interface PluginDeps {
  logger: Logger;
  configDir: string;
}

export class CrossChannelSync {
  private config: Required<CrossChannelSyncConfig>;
  private state: TemporalCognitionState;
  private logger: Logger;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  
  constructor(
    config: CrossChannelSyncConfig | undefined, 
    state: TemporalCognitionState, 
    deps: PluginDeps
  ) {
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
  recordActivity(channel: string, sessionKey?: string): void {
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
  recordSessionStart(channel: string, sessionKey?: string): void {
    this.recordActivity(channel, sessionKey);
    this.state.syncState.channels[channel].sessionCount++;
    this.logger.debug(`[temporal-sync] Session started on ${channel}, count: ${this.state.syncState.channels[channel].sessionCount}`);
  }
  
  /**
   * Record session end on a channel
   */
  recordSessionEnd(channel: string, sessionKey?: string): void {
    const ch = this.state.syncState.channels[channel];
    if (ch && ch.sessionCount > 0) {
      ch.sessionCount--;
      this.logger.debug(`[temporal-sync] Session ended on ${channel}, count: ${ch.sessionCount}`);
    }
  }
  
  /**
   * Get sync status
   */
  getSyncStatus(): SyncState {
    return { ...this.state.syncState };
  }
  
  /**
   * Get state for a specific channel
   */
  getChannelState(channel: string): ChannelTemporalState | null {
    return this.state.syncState.channels[channel] || null;
  }
  
  /**
   * Get all active channels (with recent activity)
   */
  getActiveChannels(maxIdleMs: number = 300000): ChannelTemporalState[] {
    const now = Date.now();
    return Object.values(this.state.syncState.channels)
      .filter(ch => ch.lastActivity > 0 && (now - ch.lastActivity) < maxIdleMs);
  }
  
  /**
   * Get total active sessions across all channels
   */
  getTotalActiveSessions(): number {
    return Object.values(this.state.syncState.channels)
      .reduce((sum, ch) => sum + ch.sessionCount, 0);
  }
  
  /**
   * Broadcast a task to all channels (for cross-channel awareness)
   */
  broadcastTaskAdded(taskId: string, channel?: string): void {
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
  clearPendingEstimate(channel: string, taskId: string): void {
    const ch = this.state.syncState.channels[channel];
    if (ch) {
      ch.pendingEstimates = ch.pendingEstimates.filter(id => id !== taskId);
    }
  }
  
  /**
   * Perform sync operation
   */
  private sync(): void {
    const now = Date.now();
    this.state.syncState.lastSyncAt = now;
    this.state.syncState.globalPhase = this.state.cycleState?.currentPhase || 'active';
    
    // Compute task queue hash for change detection
    const taskData = JSON.stringify(
      this.state.scheduledTasks
        .map(t => `${t.id}:${t.status}:${t.priority}`)
        .sort()
    );
    this.state.syncState.taskQueueHash = crypto
      .createHash('md5')
      .update(taskData)
      .digest('hex')
      .slice(0, 8);
    
    // Update active task counts per channel
    for (const channel of Object.keys(this.state.syncState.channels)) {
      const channelTasks = this.state.scheduledTasks.filter(
        t => t.channel === channel && t.status === 'pending'
      );
      this.state.syncState.channels[channel].activeTaskCount = channelTasks.length;
    }
  }
  
  /**
   * Get cross-channel statistics
   */
  getStatistics(): {
    totalChannels: number;
    activeChannels: number;
    totalSessions: number;
    totalPendingTasks: number;
    lastSyncAgo: number;
  } {
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
  cleanup(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}
