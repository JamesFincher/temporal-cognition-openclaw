// ============================================================================
// TEMPORAL COGNITION MODULE - TIME PERCEPTION ENGINE
// ============================================================================

import { 
  TimePerceptionConfig, 
  TemporalCognitionState, 
  TemporalContext,
  WallClockTime,
  SubjectiveTime,
  CyclePhase
} from '../types';
import { getDayOfWeek } from '../utils/time-math';

export class TimePerceptionEngine {
  private config: Required<TimePerceptionConfig>;
  private state: TemporalCognitionState;
  private processingStartTime: number | null = null;
  
  constructor(config: TimePerceptionConfig | undefined, state: TemporalCognitionState) {
    this.config = {
      enabled: config?.enabled ?? true,
      subjectiveTimeRatio: config?.subjectiveTimeRatio ?? 1.0,
      timezone: config?.timezone ?? 'auto',
      trackProcessingTime: config?.trackProcessingTime ?? true,
    };
    this.state = state;
    
    // Initialize boot time if not set
    if (!this.state.timePerception.bootTime) {
      this.state.timePerception.bootTime = Date.now();
    }
  }
  
  /**
   * Record a tick (unit of processing)
   */
  tick(): void {
    this.state.timePerception.totalTicks++;
  }
  
  /**
   * Record a processing cycle completion
   */
  cycle(): void {
    this.state.timePerception.totalCycles++;
  }
  
  /**
   * Start tracking processing time for a request
   */
  startProcessingTimer(): void {
    if (this.config.trackProcessingTime) {
      this.processingStartTime = Date.now();
      this.state.timePerception.processingStartTime = this.processingStartTime;
    }
  }
  
  /**
   * Stop tracking processing time
   */
  stopProcessingTimer(): number {
    if (!this.processingStartTime) return 0;
    
    const elapsed = Date.now() - this.processingStartTime;
    this.processingStartTime = null;
    this.state.timePerception.processingStartTime = undefined;
    
    return elapsed;
  }
  
  /**
   * Get current wall clock time
   */
  getWallClock(): WallClockTime {
    const now = new Date();
    
    return {
      timestamp: now.getTime(),
      timezone: this.config.timezone === 'auto' 
        ? Intl.DateTimeFormat().resolvedOptions().timeZone 
        : this.config.timezone,
      iso: now.toISOString(),
      dayOfWeek: getDayOfWeek(now),
      hourOfDay: now.getHours(),
    };
  }
  
  /**
   * Get subjective time (AI-perceived time)
   */
  getSubjectiveTime(): SubjectiveTime {
    const now = Date.now();
    const uptime = now - this.state.timePerception.bootTime;
    
    // Calculate AI-subjective ticks based on ratio
    const subjectiveTicks = this.state.timePerception.totalTicks * this.config.subjectiveTimeRatio;
    
    return {
      aiTicks: subjectiveTicks,
      processingCycles: this.state.timePerception.totalCycles,
      attentionUnits: Math.floor(subjectiveTicks / 10), // 10 ticks = 1 attention unit
      lastActivity: this.state.syncState?.lastSyncAt || now,
      bootTime: this.state.timePerception.bootTime,
    };
  }
  
  /**
   * Get full temporal context
   */
  getCurrentContext(): TemporalContext {
    const wallClock = this.getWallClock();
    const subjective = this.getSubjectiveTime();
    const now = Date.now();
    
    const sessionAge = now - this.state.timePerception.bootTime;
    const lastActivity = this.state.syncState?.lastSyncAt || now;
    const idleDuration = now - lastActivity;
    
    // Generate human-readable summary
    const uptimeHours = Math.floor(sessionAge / 3600000);
    const uptimeMinutes = Math.floor((sessionAge % 3600000) / 60000);
    const humanReadable = `Session uptime: ${uptimeHours}h ${uptimeMinutes}m | ` +
      `${this.state.timePerception.totalCycles} cycles | ` +
      `${wallClock.dayOfWeek} ${wallClock.hourOfDay}:00`;
    
    return {
      wallClock,
      subjective,
      phase: this.state.cycleState?.currentPhase || 'active',
      sessionAge,
      idleDuration,
      humanReadable,
    };
  }
  
  /**
   * Calculate time since last activity
   */
  getIdleDuration(): number {
    const lastActivity = this.state.syncState?.lastSyncAt || Date.now();
    return Date.now() - lastActivity;
  }
  
  /**
   * Check if system has been idle for specified duration
   */
  isIdle(thresholdMs: number): boolean {
    return this.getIdleDuration() > thresholdMs;
  }
  
  /**
   * Get uptime in milliseconds
   */
  getUptime(): number {
    return Date.now() - this.state.timePerception.bootTime;
  }
  
  /**
   * Reset boot time (for session reset)
   */
  resetSession(): void {
    this.state.timePerception.bootTime = Date.now();
    this.state.timePerception.totalTicks = 0;
    this.state.timePerception.totalCycles = 0;
  }
}
