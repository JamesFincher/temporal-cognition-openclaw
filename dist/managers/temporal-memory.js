"use strict";
// ============================================================================
// TEMPORAL COGNITION MODULE - TEMPORAL MEMORY INTEGRATION
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
exports.TemporalMemoryIntegration = void 0;
const constants_1 = require("../constants");
const time_math_1 = require("../utils/time-math");
const crypto = __importStar(require("crypto"));
class TemporalMemoryIntegration {
    config;
    state;
    constructor(config, state) {
        this.config = {
            enabled: config?.enabled ?? true,
            decayHalfLifeDays: config?.decayHalfLifeDays ?? 7,
            relevanceBoostRecent: config?.relevanceBoostRecent ?? 1.5,
            includeTemporalContext: config?.includeTemporalContext ?? true,
        };
        this.state = state;
        // Initialize memory index if needed
        if (!this.state.memoryIndex) {
            this.state.memoryIndex = {};
        }
    }
    /**
     * Add a memory entry with temporal context
     */
    addEntry(content, context) {
        const now = Date.now();
        const id = crypto
            .createHash('md5')
            .update(content + now.toString())
            .digest('hex')
            .slice(0, 16);
        const entry = {
            id,
            content,
            timestamp: now,
            decayScore: 1.0,
            relevanceScore: 1.0,
            accessCount: 0,
            lastAccessedAt: now,
            temporalContext: this.config.includeTemporalContext ? context : undefined,
            associatedTasks: [],
        };
        this.state.memoryIndex[id] = entry;
        return entry;
    }
    /**
     * Search memories with temporal decay and relevance scoring
     */
    search(query, options = {}) {
        const { maxAgeDays, limit = 10, minRelevance = 0.1 } = options;
        const now = Date.now();
        const halfLifeMs = this.config.decayHalfLifeDays * constants_1.MS_PER_DAY;
        const cutoff = maxAgeDays ? now - maxAgeDays * constants_1.MS_PER_DAY : 0;
        // Get eligible entries
        let entries = Object.values(this.state.memoryIndex)
            .filter(e => e.timestamp >= cutoff);
        // Update decay scores based on age
        entries = entries.map(e => {
            const ageMs = now - e.timestamp;
            const decayScore = (0, time_math_1.exponentialDecay)(1.0, halfLifeMs, ageMs);
            return { ...e, decayScore };
        });
        // Calculate relevance based on query matching
        const queryTerms = this.tokenize(query);
        entries = entries.map(e => {
            const contentTerms = this.tokenize(e.content);
            // Calculate term overlap
            const matchCount = queryTerms.filter(qt => contentTerms.some(ct => ct.includes(qt) || qt.includes(ct))).length;
            const baseRelevance = queryTerms.length > 0
                ? matchCount / queryTerms.length
                : 0;
            // Apply recency boost
            const recencyBoost = e.decayScore > 0.8
                ? this.config.relevanceBoostRecent
                : 1.0;
            // Apply access frequency boost (frequently accessed = more important)
            const accessBoost = 1 + Math.min(0.2, e.accessCount * 0.02);
            // Combined relevance
            const relevanceScore = baseRelevance * recencyBoost * e.decayScore * accessBoost;
            return { ...e, relevanceScore };
        });
        // Filter by minimum relevance
        entries = entries.filter(e => e.relevanceScore >= minRelevance);
        // Sort by relevance
        entries.sort((a, b) => b.relevanceScore - a.relevanceScore);
        // Take top results
        const results = entries.slice(0, limit);
        // Record access for returned entries
        for (const result of results) {
            if (this.state.memoryIndex[result.id]) {
                this.state.memoryIndex[result.id].accessCount++;
                this.state.memoryIndex[result.id].lastAccessedAt = now;
            }
        }
        return results;
    }
    /**
     * Get a specific memory entry by ID
     */
    getEntry(id) {
        const entry = this.state.memoryIndex[id];
        if (entry) {
            entry.accessCount++;
            entry.lastAccessedAt = Date.now();
        }
        return entry || null;
    }
    /**
     * Update a memory entry
     */
    updateEntry(id, updates) {
        const entry = this.state.memoryIndex[id];
        if (!entry)
            return null;
        if (updates.content !== undefined) {
            entry.content = updates.content;
        }
        if (updates.associatedTasks !== undefined) {
            entry.associatedTasks = updates.associatedTasks;
        }
        return entry;
    }
    /**
     * Associate a task with a memory
     */
    associateTask(memoryId, taskId) {
        const entry = this.state.memoryIndex[memoryId];
        if (!entry)
            return false;
        if (!entry.associatedTasks.includes(taskId)) {
            entry.associatedTasks.push(taskId);
        }
        return true;
    }
    /**
     * Remove a memory entry
     */
    removeEntry(id) {
        if (this.state.memoryIndex[id]) {
            delete this.state.memoryIndex[id];
            return true;
        }
        return false;
    }
    /**
     * Prune old/unused memories
     */
    prune(options = {}) {
        const { maxAgeDays = 90, minAccessCount = 0 } = options;
        const cutoff = Date.now() - maxAgeDays * constants_1.MS_PER_DAY;
        const ids = Object.keys(this.state.memoryIndex);
        let pruned = 0;
        for (const id of ids) {
            const entry = this.state.memoryIndex[id];
            // Prune if:
            // 1. Entry is older than cutoff AND has low access count
            // 2. Entry has very low decay score AND low access count
            const shouldPrune = (entry.timestamp < cutoff && entry.accessCount <= minAccessCount) ||
                (entry.decayScore < 0.1 && entry.accessCount <= minAccessCount);
            if (shouldPrune) {
                delete this.state.memoryIndex[id];
                pruned++;
            }
        }
        return pruned;
    }
    /**
     * Get memories associated with a task
     */
    getMemoriesForTask(taskId) {
        return Object.values(this.state.memoryIndex)
            .filter(e => e.associatedTasks.includes(taskId));
    }
    /**
     * Get recent memories (by timestamp)
     */
    getRecentMemories(limit = 10) {
        return Object.values(this.state.memoryIndex)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }
    /**
     * Get memory statistics
     */
    getStatistics() {
        const entries = Object.values(this.state.memoryIndex);
        if (entries.length === 0) {
            return {
                totalEntries: 0,
                avgDecayScore: 0,
                avgAccessCount: 0,
                oldestEntry: null,
                newestEntry: null,
            };
        }
        const now = Date.now();
        const halfLifeMs = this.config.decayHalfLifeDays * constants_1.MS_PER_DAY;
        // Calculate current decay scores
        let decaySum = 0;
        let accessSum = 0;
        let oldest = Infinity;
        let newest = 0;
        for (const entry of entries) {
            const ageMs = now - entry.timestamp;
            decaySum += (0, time_math_1.exponentialDecay)(1.0, halfLifeMs, ageMs);
            accessSum += entry.accessCount;
            oldest = Math.min(oldest, entry.timestamp);
            newest = Math.max(newest, entry.timestamp);
        }
        return {
            totalEntries: entries.length,
            avgDecayScore: decaySum / entries.length,
            avgAccessCount: accessSum / entries.length,
            oldestEntry: oldest === Infinity ? null : oldest,
            newestEntry: newest === 0 ? null : newest,
        };
    }
    /**
     * Tokenize text for search
     */
    tokenize(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(t => t.length > 2);
    }
}
exports.TemporalMemoryIntegration = TemporalMemoryIntegration;
//# sourceMappingURL=temporal-memory.js.map