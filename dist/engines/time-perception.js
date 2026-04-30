"use strict";
// ============================================================================
// TEMPORAL COGNITION MODULE - TIME PERCEPTION ENGINE
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimePerceptionEngine = void 0;
const time_math_1 = require("../utils/time-math");
class TimePerceptionEngine {
    config;
    state;
    processingStartTime = null;
    constructor(config, state) {
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
    tick() {
        this.state.timePerception.totalTicks++;
    }
    /**
     * Record a processing cycle completion
     */
    cycle() {
        this.state.timePerception.totalCycles++;
    }
    /**
     * Start tracking processing time for a request
     */
    startProcessingTimer() {
        if (this.config.trackProcessingTime) {
            this.processingStartTime = Date.now();
            this.state.timePerception.processingStartTime = this.processingStartTime;
        }
    }
    /**
     * Stop tracking processing time
     */
    stopProcessingTimer() {
        if (!this.processingStartTime)
            return 0;
        const elapsed = Date.now() - this.processingStartTime;
        this.processingStartTime = null;
        this.state.timePerception.processingStartTime = undefined;
        return elapsed;
    }
    /**
     * Get current wall clock time
     */
    getWallClock() {
        const now = new Date();
        return {
            timestamp: now.getTime(),
            timezone: this.config.timezone === 'auto'
                ? Intl.DateTimeFormat().resolvedOptions().timeZone
                : this.config.timezone,
            iso: now.toISOString(),
            dayOfWeek: (0, time_math_1.getDayOfWeek)(now),
            hourOfDay: now.getHours(),
        };
    }
    /**
     * Get subjective time (AI-perceived time)
     */
    getSubjectiveTime() {
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
    getCurrentContext() {
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
    getIdleDuration() {
        const lastActivity = this.state.syncState?.lastSyncAt || Date.now();
        return Date.now() - lastActivity;
    }
    /**
     * Check if system has been idle for specified duration
     */
    isIdle(thresholdMs) {
        return this.getIdleDuration() > thresholdMs;
    }
    /**
     * Get uptime in milliseconds
     */
    getUptime() {
        return Date.now() - this.state.timePerception.bootTime;
    }
    /**
     * Reset boot time (for session reset)
     */
    resetSession() {
        this.state.timePerception.bootTime = Date.now();
        this.state.timePerception.totalTicks = 0;
        this.state.timePerception.totalCycles = 0;
    }
}
exports.TimePerceptionEngine = TimePerceptionEngine;
//# sourceMappingURL=time-perception.js.map