"use strict";
// ============================================================================
// TEMPORAL COGNITION MODULE - 24/7 CYCLE MANAGER
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.CycleManager = void 0;
const constants_1 = require("../constants");
const time_math_1 = require("../utils/time-math");
class CycleManager {
    config;
    state;
    phases;
    lastActivityTime = Date.now();
    constructor(config, state) {
        this.config = {
            enabled: config?.enabled ?? true,
            phases: config?.phases ?? {},
            adaptToUserActivity: config?.adaptToUserActivity ?? true,
        };
        this.state = state;
        // Merge custom phases with defaults
        this.phases = { ...constants_1.DEFAULT_PHASES };
        if (this.config.phases) {
            for (const [phase, phaseConfig] of Object.entries(this.config.phases)) {
                if (phaseConfig && this.phases[phase]) {
                    this.phases[phase] = {
                        ...this.phases[phase],
                        ...phaseConfig,
                    };
                }
            }
        }
        // Initialize cycle state if needed
        if (!this.state.cycleState) {
            const now = Date.now();
            this.state.cycleState = {
                currentPhase: 'maintenance',
                phaseStartedAt: now,
                nextPhaseAt: now + constants_1.MS_PER_HOUR,
                nextPhase: 'active',
                userActivityLevel: 0,
                adaptedSchedule: false,
            };
        }
        // Update phase on construction
        this.updatePhase();
    }
    /**
     * Get current cycle phase
     */
    getCurrentPhase() {
        this.updatePhase();
        return this.state.cycleState.currentPhase;
    }
    /**
     * Get current phase info with configuration
     */
    getCurrentPhaseInfo() {
        this.updatePhase();
        const now = Date.now();
        return {
            ...this.state.cycleState,
            config: this.phases[this.state.cycleState.currentPhase],
            timeInPhase: now - this.state.cycleState.phaseStartedAt,
            timeUntilNextPhase: Math.max(0, this.state.cycleState.nextPhaseAt - now),
        };
    }
    /**
     * Check if current phase has a specific capability
     */
    hasCapability(capability) {
        const phaseConfig = this.phases[this.state.cycleState.currentPhase];
        const capabilities = phaseConfig.capabilities || [];
        return capabilities.includes('all') || capabilities.includes(capability);
    }
    /**
     * Get guidance text for current phase
     */
    getPhaseGuidance() {
        const phase = this.phases[this.state.cycleState.currentPhase];
        return phase.description || `Currently in ${this.state.cycleState.currentPhase} phase`;
    }
    /**
     * Record user activity (for adaptive scheduling)
     */
    recordUserActivity() {
        this.lastActivityTime = Date.now();
        // Increase activity level (capped at 1.0)
        this.state.cycleState.userActivityLevel = Math.min(1.0, this.state.cycleState.userActivityLevel + 0.1);
        // Adapt schedule if enabled
        if (this.config.adaptToUserActivity) {
            this.adaptToActivity();
        }
    }
    /**
     * Decay activity level (call periodically)
     */
    decayActivityLevel(decayRate = 0.02) {
        this.state.cycleState.userActivityLevel = Math.max(0, this.state.cycleState.userActivityLevel - decayRate);
    }
    /**
     * Force phase transition (manual override)
     */
    forcePhase(phase) {
        const now = Date.now();
        this.state.cycleState.currentPhase = phase;
        this.state.cycleState.phaseStartedAt = now;
        this.state.cycleState.adaptedSchedule = true;
        this.calculateNextPhase(phase);
    }
    /**
     * Get all phase configurations
     */
    getPhaseConfigs() {
        return { ...this.phases };
    }
    /**
     * Update current phase based on time
     */
    updatePhase() {
        const currentTime = (0, time_math_1.getCurrentTimeString)();
        for (const phase of constants_1.PHASE_ORDER) {
            const config = this.phases[phase];
            if ((0, time_math_1.isTimeInRange)(currentTime, config.start, config.end)) {
                // Check if phase changed
                if (this.state.cycleState.currentPhase !== phase) {
                    this.state.cycleState.currentPhase = phase;
                    this.state.cycleState.phaseStartedAt = Date.now();
                    this.state.cycleState.adaptedSchedule = false;
                }
                this.calculateNextPhase(phase);
                break;
            }
        }
    }
    /**
     * Calculate next phase timing
     */
    calculateNextPhase(currentPhase) {
        const currentIdx = constants_1.PHASE_ORDER.indexOf(currentPhase);
        const nextIdx = (currentIdx + 1) % constants_1.PHASE_ORDER.length;
        const nextPhase = constants_1.PHASE_ORDER[nextIdx];
        this.state.cycleState.nextPhase = nextPhase;
        // Calculate when next phase starts
        const nextConfig = this.phases[nextPhase];
        const [hours, mins] = nextConfig.start.split(':').map(Number);
        const next = new Date();
        next.setHours(hours, mins, 0, 0);
        // If the time has passed today, it's tomorrow
        if (next.getTime() <= Date.now()) {
            next.setDate(next.getDate() + 1);
        }
        this.state.cycleState.nextPhaseAt = next.getTime();
    }
    /**
     * Adapt schedule based on user activity
     */
    adaptToActivity() {
        const activityLevel = this.state.cycleState.userActivityLevel;
        const currentPhase = this.state.cycleState.currentPhase;
        // If high activity during normally quiet phases, extend active capabilities
        if (activityLevel > 0.7 && ['passive', 'autonomous', 'maintenance'].includes(currentPhase)) {
            this.state.cycleState.adaptedSchedule = true;
            // Don't change phase, but note that we're adapting
        }
        // If low activity during active phase, note it
        if (activityLevel < 0.2 && currentPhase === 'active') {
            // System is in active phase but user is idle
            // Could trigger proactive behaviors
        }
    }
    /**
     * Check if user appears to be sleeping/away
     */
    isUserAway(thresholdMs = constants_1.MS_PER_HOUR) {
        const timeSinceActivity = Date.now() - this.lastActivityTime;
        return timeSinceActivity > thresholdMs && this.state.cycleState.userActivityLevel < 0.1;
    }
    /**
     * Get recommended action based on current phase
     */
    getRecommendedAction() {
        const phase = this.state.cycleState.currentPhase;
        const adapted = this.state.cycleState.adaptedSchedule;
        const recommendations = {
            active: 'Full engagement - handle requests immediately, be proactive',
            passive: adapted
                ? 'User still active - maintain responsive mode'
                : 'Reduced proactivity - respond when prompted',
            autonomous: adapted
                ? 'User activity detected - shift to responsive mode'
                : 'Background processing - run scheduled tasks, batch operations',
            consolidation: 'Memory consolidation - index, cleanup, optimize',
            maintenance: adapted
                ? 'Unexpected activity - respond but conserve resources'
                : 'Low activity mode - minimal processing, await morning',
        };
        return recommendations[phase];
    }
}
exports.CycleManager = CycleManager;
//# sourceMappingURL=cycle-manager.js.map