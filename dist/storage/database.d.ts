/**
 * SQLite Storage Adapter
 *
 * Persistent storage for usage logs, rate limit events, and routing decisions.
 * Replaces in-memory storage for production use.
 */
export interface UsageLog {
    id: string;
    timestamp: Date;
    sessionId: string;
    model: string;
    provider: string;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    costUsd: number;
    latencyMs: number;
    success: boolean;
    errorType?: string;
    projectPath?: string;
    routedFrom?: string;
    routingReason?: string;
}
export interface RateLimitEvent {
    id: string;
    timestamp: Date;
    model: string;
    errorType: string;
    resetTime?: Date;
    tokensUsedBeforeLimit: number;
    windowHours: number;
}
export interface RoutingDecision {
    id: string;
    timestamp: Date;
    sessionId: string;
    originalProvider: string;
    routedProvider: string;
    routedModel: string;
    reason: string;
    estimatedSavings: number;
    taskType?: string;
    taskComplexity?: string;
}
export interface Session {
    sessionId: string;
    startedAt: Date;
    endedAt?: Date;
    totalCost: number;
    totalTokens: number;
    projectPath?: string;
}
export interface UsageStats {
    inputTokens: number;
    outputTokens: number;
    totalCost: number;
    requestCount: number;
    avgLatency: number;
}
export declare class SQLiteAdapter {
    private db;
    private sessionId;
    private dbPath;
    constructor(dbPath?: string);
    /**
     * Initialize database schema
     */
    private initSchema;
    /**
     * Add a usage log entry
     */
    addLog(log: Omit<UsageLog, 'id' | 'sessionId'>): UsageLog;
    /**
     * Get logs within a time window (in hours)
     */
    getWindowLogs(hours: number): UsageLog[];
    /**
     * Get logs for current session
     */
    getSessionLogs(): UsageLog[];
    /**
     * Get logs for today
     */
    getTodayLogs(): UsageLog[];
    /**
     * Get total usage stats for a timeframe
     */
    getTotalUsage(timeframe: 'session' | 'today' | 'week'): UsageStats;
    /**
     * Add a rate limit event
     */
    addRateLimitEvent(event: Omit<RateLimitEvent, 'id'>): void;
    /**
     * Get rate limit history for a model
     */
    getRateLimitHistory(model: string): RateLimitEvent[];
    /**
     * Get all rate limit events in time window
     */
    getRateLimitWindow(hours: number): RateLimitEvent[];
    /**
     * Add a routing decision
     */
    addRoutingDecision(decision: Omit<RoutingDecision, 'id' | 'sessionId'>): void;
    /**
     * Get total savings from routing
     */
    getRoutingSavings(timeframe: 'session' | 'today' | 'week'): number;
    /**
     * Create a new session
     */
    private createSession;
    /**
     * Get session by ID
     */
    getSession(sessionId: string): Session;
    /**
     * Update session totals from logs
     */
    private updateSessionTotals;
    /**
     * End current session
     */
    endSession(): void;
    /**
     * Clean up old logs (data retention)
     */
    cleanup(retentionDays?: number): number;
    /**
     * Vacuum database to reclaim space
     */
    vacuum(): void;
    /**
     * Close database connection
     */
    close(): void;
    private rowToUsageLog;
    private rowToRateLimitEvent;
    /**
     * Get current session ID
     */
    getCurrentSessionId(): string;
    /**
     * Get database path
     */
    getDatabasePath(): string;
}
export declare function getStorageAdapter(dbPath?: string): SQLiteAdapter;
export declare function closeStorageAdapter(): void;
//# sourceMappingURL=database.d.ts.map