// ============================================================================
// TEMPORAL COGNITION MODULE - TIME MATH UTILITIES
// ============================================================================

import { MS_PER_SECOND, MS_PER_MINUTE, MS_PER_HOUR, MS_PER_DAY, MS_PER_WEEK } from '../constants';

/**
 * Format milliseconds to human-readable duration
 */
export function formatDuration(ms: number, options: { precise?: boolean } = {}): string {
  const { precise = false } = options;
  
  if (ms < MS_PER_SECOND) {
    return 'less than a second';
  }
  
  if (ms < MS_PER_MINUTE) {
    const seconds = Math.round(ms / MS_PER_SECOND);
    return precise ? `${seconds} second${seconds !== 1 ? 's' : ''}` : 'a few seconds';
  }
  
  if (ms < MS_PER_HOUR) {
    const minutes = Math.round(ms / MS_PER_MINUTE);
    if (!precise && minutes <= 2) return 'a couple of minutes';
    if (!precise && minutes <= 5) return 'a few minutes';
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  if (ms < MS_PER_DAY) {
    const hours = Math.round(ms / MS_PER_HOUR);
    if (!precise && hours === 1) return 'about an hour';
    if (!precise && hours <= 2) return 'a couple of hours';
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  if (ms < MS_PER_WEEK) {
    const days = Math.round(ms / MS_PER_DAY);
    if (!precise && days === 1) return 'about a day';
    return `${days} day${days !== 1 ? 's' : ''}`;
  }
  
  const weeks = Math.round(ms / MS_PER_WEEK);
  if (!precise && weeks === 1) return 'about a week';
  return `${weeks} week${weeks !== 1 ? 's' : ''}`;
}

/**
 * Format duration range for estimates
 */
export function formatDurationRange(minMs: number, expectedMs: number, maxMs: number): string {
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
export function parseRelativeTime(timeStr: string): number | null {
  const match = timeStr.match(/^(\d+(?:\.\d+)?)\s*(s|sec|second|seconds|m|min|minute|minutes|h|hr|hour|hours|d|day|days|w|week|weeks)$/i);
  
  if (!match) return null;
  
  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  
  const multipliers: Record<string, number> = {
    's': MS_PER_SECOND,
    'sec': MS_PER_SECOND,
    'second': MS_PER_SECOND,
    'seconds': MS_PER_SECOND,
    'm': MS_PER_MINUTE,
    'min': MS_PER_MINUTE,
    'minute': MS_PER_MINUTE,
    'minutes': MS_PER_MINUTE,
    'h': MS_PER_HOUR,
    'hr': MS_PER_HOUR,
    'hour': MS_PER_HOUR,
    'hours': MS_PER_HOUR,
    'd': MS_PER_DAY,
    'day': MS_PER_DAY,
    'days': MS_PER_DAY,
    'w': MS_PER_WEEK,
    'week': MS_PER_WEEK,
    'weeks': MS_PER_WEEK,
  };
  
  return value * (multipliers[unit] || MS_PER_HOUR);
}

/**
 * Calculate time until deadline
 */
export function timeUntilDeadline(deadlineMs: number): {
  ms: number;
  formatted: string;
  isPast: boolean;
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
} {
  const now = Date.now();
  const diff = deadlineMs - now;
  const isPast = diff < 0;
  const absDiff = Math.abs(diff);
  
  let urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
  if (isPast || diff < MS_PER_HOUR) {
    urgencyLevel = 'critical';
  } else if (diff < MS_PER_HOUR * 4) {
    urgencyLevel = 'high';
  } else if (diff < MS_PER_DAY) {
    urgencyLevel = 'medium';
  } else {
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
export function getDayOfWeek(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

/**
 * Check if time string is in range (handles overnight ranges)
 */
export function isTimeInRange(current: string, start: string, end: string): boolean {
  if (start <= end) {
    return current >= start && current < end;
  }
  // Overnight range (e.g., 22:00 to 02:00)
  return current >= start || current < end;
}

/**
 * Get current time as HH:MM string
 */
export function getCurrentTimeString(timezone?: string): string {
  const now = new Date();
  // Simple implementation - could use date-fns-tz for proper timezone support
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * Calculate exponential decay
 */
export function exponentialDecay(initialValue: number, halfLifeMs: number, elapsedMs: number): number {
  return initialValue * Math.pow(0.5, elapsedMs / halfLifeMs);
}
