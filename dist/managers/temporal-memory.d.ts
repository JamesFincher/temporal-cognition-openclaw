import { TemporalMemoryConfig, TemporalCognitionState, TemporalMemoryEntry, TemporalContext, MemorySearchOptions } from '../types';
export declare class TemporalMemoryIntegration {
    private config;
    private state;
    constructor(config: TemporalMemoryConfig | undefined, state: TemporalCognitionState);
    /**
     * Add a memory entry with temporal context
     */
    addEntry(content: string, context?: TemporalContext): TemporalMemoryEntry;
    /**
     * Search memories with temporal decay and relevance scoring
     */
    search(query: string, options?: MemorySearchOptions): TemporalMemoryEntry[];
    /**
     * Get a specific memory entry by ID
     */
    getEntry(id: string): TemporalMemoryEntry | null;
    /**
     * Update a memory entry
     */
    updateEntry(id: string, updates: Partial<Pick<TemporalMemoryEntry, 'content' | 'associatedTasks'>>): TemporalMemoryEntry | null;
    /**
     * Associate a task with a memory
     */
    associateTask(memoryId: string, taskId: string): boolean;
    /**
     * Remove a memory entry
     */
    removeEntry(id: string): boolean;
    /**
     * Prune old/unused memories
     */
    prune(options?: {
        maxAgeDays?: number;
        minAccessCount?: number;
    }): number;
    /**
     * Get memories associated with a task
     */
    getMemoriesForTask(taskId: string): TemporalMemoryEntry[];
    /**
     * Get recent memories (by timestamp)
     */
    getRecentMemories(limit?: number): TemporalMemoryEntry[];
    /**
     * Get memory statistics
     */
    getStatistics(): {
        totalEntries: number;
        avgDecayScore: number;
        avgAccessCount: number;
        oldestEntry: number | null;
        newestEntry: number | null;
    };
    /**
     * Tokenize text for search
     */
    private tokenize;
}
//# sourceMappingURL=temporal-memory.d.ts.map