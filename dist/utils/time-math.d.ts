/**
 * Format milliseconds to human-readable duration
 */
export declare function formatDuration(ms: number, options?: {
    precise?: boolean;
}): string;
/**
 * Format duration range for estimates
 */
export declare function formatDurationRange(minMs: number, expectedMs: number, maxMs: number): string;
/**
 * Parse relative time string (e.g., "2h", "30m", "1d") to milliseconds
 */
export declare function parseRelativeTime(timeStr: string): number | null;
/**
 * Calculate time until deadline
 */
export declare function timeUntilDeadline(deadlineMs: number): {
    ms: number;
    formatted: string;
    isPast: boolean;
    urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
};
/**
 * Get day of week name
 */
export declare function getDayOfWeek(date: Date): string;
/**
 * Check if time string is in range (handles overnight ranges)
 */
export declare function isTimeInRange(current: string, start: string, end: string): boolean;
/**
 * Get current time as HH:MM string
 */
export declare function getCurrentTimeString(timezone?: string): string;
/**
 * Calculate exponential decay
 */
export declare function exponentialDecay(initialValue: number, halfLifeMs: number, elapsedMs: number): number;
//# sourceMappingURL=time-math.d.ts.map