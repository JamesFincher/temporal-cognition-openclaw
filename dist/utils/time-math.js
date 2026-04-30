"use strict";
// ============================================================================
// TEMPORAL COGNITION MODULE - TIME MATH UTILITIES
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDuration = formatDuration;
exports.formatDurationRange = formatDurationRange;
exports.parseRelativeTime = parseRelativeTime;
exports.timeUntilDeadline = timeUntilDeadline;
exports.getDayOfWeek = getDayOfWeek;
exports.isTimeInRange = isTimeInRange;
exports.getCurrentTimeString = getCurrentTimeString;
exports.exponentialDecay = exponentialDecay;
const constants_1 = require("../constants");
/**
 * Format milliseconds to human-readable duration
 */
function formatDuration(ms, options = {}) {
    const { precise = false } = options;
    if (ms < constants_1.MS_PER_SECOND) {
        return 'less than a second';
    }
    if (ms < constants_1.MS_PER_MINUTE) {
        const seconds = Math.round(ms / constants_1.MS_PER_SECOND);
        return precise ? `${seconds} second${seconds !== 1 ? 's' : ''}` : 'a few seconds';
    }
    if (ms < constants_1.MS_PER_HOUR) {
        const minutes = Math.round(ms / constants_1.MS_PER_MINUTE);
        if (!precise && minutes <= 2)
            return 'a couple of minutes';
        if (!precise && minutes <= 5)
            return 'a few minutes';
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    if (ms < constants_1.MS_PER_DAY) {
        const hours = Math.round(ms / constants_1.MS_PER_HOUR);
        if (!precise && hours === 1)
            return 'about an hour';
        if (!precise && hours <= 2)
            return 'a couple of hours';
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    if (ms < constants_1.MS_PER_WEEK) {
        const days = Math.round(ms / constants_1.MS_PER_DAY);
        if (!precise && days === 1)
            return 'about a day';
        return `${days} day${days !== 1 ? 's' : ''}`;
    }
    const weeks = Math.round(ms / constants_1.MS_PER_WEEK);
    if (!precise && weeks === 1)
        return 'about a week';
    return `${weeks} week${weeks !== 1 ? 's' : ''}`;
}
/**
 * Format duration range for estimates
 */
function formatDurationRange(minMs, expectedMs, maxMs) {
    const minFormatted = formatDuration(minMs, { precise: true });
    const maxFormatted = formatDuration(maxMs, { precise: true });
    // If min and max are similar, just show expected
    if (maxMs - minMs < expectedMs * 0.3) {
        return `about ${formatDuration(expectedMs)}`;
    }
    return `${minFormatted} to ${maxFormatted}`;
}
/**
 * Parse relative time string (e.g., "2h", "30m", "1d") to milliseconds
 */
function parseRelativeTime(timeStr) {
    const match = timeStr.match(/^(\d+(?:\.\d+)?)\s*(s|sec|second|seconds|m|min|minute|minutes|h|hr|hour|hours|d|day|days|w|week|weeks)$/i);
    if (!match)
        return null;
    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    const multipliers = {
        's': constants_1.MS_PER_SECOND,
        'sec': constants_1.MS_PER_SECOND,
        'second': constants_1.MS_PER_SECOND,
        'seconds': constants_1.MS_PER_SECOND,
        'm': constants_1.MS_PER_MINUTE,
        'min': constants_1.MS_PER_MINUTE,
        'minute': constants_1.MS_PER_MINUTE,
        'minutes': constants_1.MS_PER_MINUTE,
        'h': constants_1.MS_PER_HOUR,
        'hr': constants_1.MS_PER_HOUR,
        'hour': constants_1.MS_PER_HOUR,
        'hours': constants_1.MS_PER_HOUR,
        'd': constants_1.MS_PER_DAY,
        'day': constants_1.MS_PER_DAY,
        'days': constants_1.MS_PER_DAY,
        'w': constants_1.MS_PER_WEEK,
        'week': constants_1.MS_PER_WEEK,
        'weeks': constants_1.MS_PER_WEEK,
    };
    return value * (multipliers[unit] || constants_1.MS_PER_HOUR);
}
/**
 * Calculate time until deadline
 */
function timeUntilDeadline(deadlineMs) {
    const now = Date.now();
    const diff = deadlineMs - now;
    const isPast = diff < 0;
    const absDiff = Math.abs(diff);
    let urgencyLevel;
    if (isPast || diff < constants_1.MS_PER_HOUR) {
        urgencyLevel = 'critical';
    }
    else if (diff < constants_1.MS_PER_HOUR * 4) {
        urgencyLevel = 'high';
    }
    else if (diff < constants_1.MS_PER_DAY) {
        urgencyLevel = 'medium';
    }
    else {
        urgencyLevel = 'low';
    }
    const formatted = isPast
        ? `${formatDuration(absDiff)} overdue`
        : `${formatDuration(diff)} remaining`;
    return { ms: diff, formatted, isPast, urgencyLevel };
}
/**
 * Get day of week name
 */
function getDayOfWeek(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
}
/**
 * Check if time string is in range (handles overnight ranges)
 */
function isTimeInRange(current, start, end) {
    if (start <= end) {
        return current >= start && current < end;
    }
    // Overnight range (e.g., 22:00 to 02:00)
    return current >= start || current < end;
}
/**
 * Get current time as HH:MM string
 */
function getCurrentTimeString(timezone) {
    const now = new Date();
    // Simple implementation - could use date-fns-tz for proper timezone support
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}
/**
 * Calculate exponential decay
 */
function exponentialDecay(initialValue, halfLifeMs, elapsedMs) {
    return initialValue * Math.pow(0.5, elapsedMs / halfLifeMs);
}
//# sourceMappingURL=time-math.js.map