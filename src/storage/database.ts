/**
 * SQLite Storage Adapter
 *
 * Persistent storage for usage logs, rate limit events, and routing decisions.
 * Replaces in-memory storage for production use.
 */

import Database from 'better-sqlite3';
import { homedir } from 'os';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

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
  routedFrom?: string;       // Original model if routed
  routingReason?: string;    // Why it was routed
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

// ═══════════════════════════════════════════════════════════════════════════
// SQLite Adapter
// ═══════════════════════════════════════════════════════════════════════════

export class SQLiteAdapter {
  private db: Database.Database;
  private sessionId: string;
  private dbPath: string;

  constructor(dbPath?: string) {
    // Default to ~/.cruise/usage.db
    this.dbPath = dbPath || join(homedir(), '.cruise', 'usage.db');

    // Ensure directory exists
    const cruiseDir = join(homedir(), '.cruise');
    if (!existsSync(cruiseDir)) {
      mkdirSync(cruiseDir, { recursive: true });
    }

    // Open database with WAL mode for concurrent reads
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    // Initialize schema
    this.initSchema();

    // Create new session
    this.sessionId = `session_${Date.now()}`;
    this.createSession(process.cwd());
  }

  /**
   * Initialize database schema
   */
  private initSchema(): void {
    // Usage logs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS usage_logs (
        id TEXT PRIMARY KEY,
        timestamp INTEGER NOT NULL,
        session_id TEXT NOT NULL,
        model TEXT NOT NULL,
        provider TEXT NOT NULL,
        input_tokens INTEGER NOT NULL,
        output_tokens INTEGER NOT NULL,
        cache_read_tokens INTEGER DEFAULT 0,
        cache_write_tokens INTEGER DEFAULT 0,
        cost_usd REAL NOT NULL,
        latency_ms INTEGER NOT NULL,
        success INTEGER NOT NULL,
        error_type TEXT,
        project_path TEXT,
        routed_from TEXT,
        routing_reason TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON usage_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_usage_session ON usage_logs(session_id);
      CREATE INDEX IF NOT EXISTS idx_usage_model ON usage_logs(model);
    `);

    // Rate limit events table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS rate_limit_events (
        id TEXT PRIMARY KEY,
        timestamp INTEGER NOT NULL,
        model TEXT NOT NULL,
        error_type TEXT NOT NULL,
        reset_time INTEGER,
        tokens_used_before_limit INTEGER,
        window_hours INTEGER DEFAULT 5
      );

      CREATE INDEX IF NOT EXISTS idx_ratelimit_model_timestamp
        ON rate_limit_events(model, timestamp);
    `);

    // Routing decisions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS routing_decisions (
        id TEXT PRIMARY KEY,
        timestamp INTEGER NOT NULL,
        session_id TEXT NOT NULL,
        original_provider TEXT NOT NULL,
        routed_provider TEXT NOT NULL,
        routed_model TEXT NOT NULL,
        reason TEXT NOT NULL,
        estimated_savings REAL DEFAULT 0,
        task_type TEXT,
        task_complexity TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_routing_timestamp ON routing_decisions(timestamp);
    `);

    // Sessions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        started_at INTEGER NOT NULL,
        ended_at INTEGER,
        total_cost REAL DEFAULT 0,
        total_tokens INTEGER DEFAULT 0,
        project_path TEXT
      );
    `);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Usage Logs
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Add a usage log entry
   */
  addLog(log: Omit<UsageLog, 'id' | 'sessionId'>): UsageLog {
    const id = `log_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const fullLog: UsageLog = {
      ...log,
      id,
      sessionId: this.sessionId,
    };

    const stmt = this.db.prepare(`
      INSERT INTO usage_logs (
        id, timestamp, session_id, model, provider,
        input_tokens, output_tokens, cache_read_tokens, cache_write_tokens,
        cost_usd, latency_ms, success, error_type, project_path,
        routed_from, routing_reason
      ) VALUES (
        @id, @timestamp, @sessionId, @model, @provider,
        @inputTokens, @outputTokens, @cacheReadTokens, @cacheWriteTokens,
        @costUsd, @latencyMs, @success, @errorType, @projectPath,
        @routedFrom, @routingReason
      )
    `);

    stmt.run({
      id: fullLog.id,
      timestamp: fullLog.timestamp.getTime(),
      sessionId: fullLog.sessionId,
      model: fullLog.model,
      provider: fullLog.provider,
      inputTokens: fullLog.inputTokens,
      outputTokens: fullLog.outputTokens,
      cacheReadTokens: fullLog.cacheReadTokens,
      cacheWriteTokens: fullLog.cacheWriteTokens,
      costUsd: fullLog.costUsd,
      latencyMs: fullLog.latencyMs,
      success: fullLog.success ? 1 : 0,
      errorType: fullLog.errorType || null,
      projectPath: fullLog.projectPath || null,
      routedFrom: fullLog.routedFrom || null,
      routingReason: fullLog.routingReason || null,
    });

    // Update session totals
    this.updateSessionTotals();

    return fullLog;
  }

  /**
   * Get logs within a time window (in hours)
   */
  getWindowLogs(hours: number): UsageLog[] {
    const windowStart = Date.now() - hours * 60 * 60 * 1000;

    const stmt = this.db.prepare(`
      SELECT * FROM usage_logs
      WHERE timestamp >= ?
      ORDER BY timestamp DESC
    `);

    const rows = stmt.all(windowStart) as any[];
    return rows.map(this.rowToUsageLog);
  }

  /**
   * Get logs for current session
   */
  getSessionLogs(): UsageLog[] {
    const stmt = this.db.prepare(`
      SELECT * FROM usage_logs
      WHERE session_id = ?
      ORDER BY timestamp DESC
    `);

    const rows = stmt.all(this.sessionId) as any[];
    return rows.map(this.rowToUsageLog);
  }

  /**
   * Get logs for today
   */
  getTodayLogs(): UsageLog[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stmt = this.db.prepare(`
      SELECT * FROM usage_logs
      WHERE timestamp >= ?
      ORDER BY timestamp DESC
    `);

    const rows = stmt.all(today.getTime()) as any[];
    return rows.map(this.rowToUsageLog);
  }

  /**
   * Get total usage stats for a timeframe
   */
  getTotalUsage(timeframe: 'session' | 'today' | 'week'): UsageStats {
    let logs: UsageLog[];

    if (timeframe === 'session') {
      logs = this.getSessionLogs();
    } else if (timeframe === 'today') {
      logs = this.getTodayLogs();
    } else {
      logs = this.getWindowLogs(7 * 24); // 7 days
    }

    return logs.reduce(
      (acc, log) => ({
        inputTokens: acc.inputTokens + log.inputTokens,
        outputTokens: acc.outputTokens + log.outputTokens,
        totalCost: acc.totalCost + log.costUsd,
        requestCount: acc.requestCount + 1,
        avgLatency: (acc.avgLatency * acc.requestCount + log.latencyMs) / (acc.requestCount + 1),
      }),
      { inputTokens: 0, outputTokens: 0, totalCost: 0, requestCount: 0, avgLatency: 0 }
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Rate Limit Events
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Add a rate limit event
   */
  addRateLimitEvent(event: Omit<RateLimitEvent, 'id'>): void {
    const id = `ratelimit_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const stmt = this.db.prepare(`
      INSERT INTO rate_limit_events (
        id, timestamp, model, error_type, reset_time,
        tokens_used_before_limit, window_hours
      ) VALUES (
        @id, @timestamp, @model, @errorType, @resetTime,
        @tokensUsedBeforeLimit, @windowHours
      )
    `);

    stmt.run({
      id,
      timestamp: event.timestamp.getTime(),
      model: event.model,
      errorType: event.errorType,
      resetTime: event.resetTime ? event.resetTime.getTime() : null,
      tokensUsedBeforeLimit: event.tokensUsedBeforeLimit,
      windowHours: event.windowHours,
    });
  }

  /**
   * Get rate limit history for a model
   */
  getRateLimitHistory(model: string): RateLimitEvent[] {
    const stmt = this.db.prepare(`
      SELECT * FROM rate_limit_events
      WHERE model = ?
      ORDER BY timestamp DESC
    `);

    const rows = stmt.all(model) as any[];
    return rows.map(this.rowToRateLimitEvent);
  }

  /**
   * Get all rate limit events in time window
   */
  getRateLimitWindow(hours: number): RateLimitEvent[] {
    const windowStart = Date.now() - hours * 60 * 60 * 1000;

    const stmt = this.db.prepare(`
      SELECT * FROM rate_limit_events
      WHERE timestamp >= ?
      ORDER BY timestamp DESC
    `);

    const rows = stmt.all(windowStart) as any[];
    return rows.map(this.rowToRateLimitEvent);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Routing Decisions
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Add a routing decision
   */
  addRoutingDecision(decision: Omit<RoutingDecision, 'id' | 'sessionId'>): void {
    const id = `routing_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const stmt = this.db.prepare(`
      INSERT INTO routing_decisions (
        id, timestamp, session_id, original_provider, routed_provider,
        routed_model, reason, estimated_savings, task_type, task_complexity
      ) VALUES (
        @id, @timestamp, @sessionId, @originalProvider, @routedProvider,
        @routedModel, @reason, @estimatedSavings, @taskType, @taskComplexity
      )
    `);

    stmt.run({
      id,
      timestamp: decision.timestamp.getTime(),
      sessionId: this.sessionId,
      originalProvider: decision.originalProvider,
      routedProvider: decision.routedProvider,
      routedModel: decision.routedModel,
      reason: decision.reason,
      estimatedSavings: decision.estimatedSavings,
      taskType: decision.taskType || null,
      taskComplexity: decision.taskComplexity || null,
    });
  }

  /**
   * Get total savings from routing
   */
  getRoutingSavings(timeframe: 'session' | 'today' | 'week'): number {
    let timestamp: number;

    if (timeframe === 'session') {
      const session = this.getSession(this.sessionId);
      timestamp = session.startedAt.getTime();
    } else if (timeframe === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      timestamp = today.getTime();
    } else {
      timestamp = Date.now() - 7 * 24 * 60 * 60 * 1000;
    }

    const stmt = this.db.prepare(`
      SELECT SUM(estimated_savings) as total
      FROM routing_decisions
      WHERE timestamp >= ?
    `);

    const result = stmt.get(timestamp) as { total: number | null };
    return result.total || 0;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Sessions
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create a new session
   */
  private createSession(projectPath: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO sessions (session_id, started_at, project_path)
      VALUES (?, ?, ?)
    `);

    stmt.run(this.sessionId, Date.now(), projectPath);
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): Session {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE session_id = ?');
    const row = stmt.get(sessionId) as any;

    return {
      sessionId: row.session_id,
      startedAt: new Date(row.started_at),
      endedAt: row.ended_at ? new Date(row.ended_at) : undefined,
      totalCost: row.total_cost,
      totalTokens: row.total_tokens,
      projectPath: row.project_path,
    };
  }

  /**
   * Update session totals from logs
   */
  private updateSessionTotals(): void {
    const stmt = this.db.prepare(`
      UPDATE sessions
      SET
        total_cost = (SELECT SUM(cost_usd) FROM usage_logs WHERE session_id = ?),
        total_tokens = (SELECT SUM(input_tokens + output_tokens) FROM usage_logs WHERE session_id = ?)
      WHERE session_id = ?
    `);

    stmt.run(this.sessionId, this.sessionId, this.sessionId);
  }

  /**
   * End current session
   */
  endSession(): void {
    const stmt = this.db.prepare(`
      UPDATE sessions
      SET ended_at = ?
      WHERE session_id = ?
    `);

    stmt.run(Date.now(), this.sessionId);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Maintenance
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Clean up old logs (data retention)
   */
  cleanup(retentionDays: number = 30): number {
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

    const stmt = this.db.prepare('DELETE FROM usage_logs WHERE timestamp < ?');
    const result = stmt.run(cutoff);

    return result.changes;
  }

  /**
   * Vacuum database to reclaim space
   */
  vacuum(): void {
    this.db.exec('VACUUM');
  }

  /**
   * Close database connection
   */
  close(): void {
    this.endSession();
    this.db.close();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Helper Methods
  // ═══════════════════════════════════════════════════════════════════════════

  private rowToUsageLog(row: any): UsageLog {
    return {
      id: row.id,
      timestamp: new Date(row.timestamp),
      sessionId: row.session_id,
      model: row.model,
      provider: row.provider,
      inputTokens: row.input_tokens,
      outputTokens: row.output_tokens,
      cacheReadTokens: row.cache_read_tokens,
      cacheWriteTokens: row.cache_write_tokens,
      costUsd: row.cost_usd,
      latencyMs: row.latency_ms,
      success: row.success === 1,
      errorType: row.error_type,
      projectPath: row.project_path,
      routedFrom: row.routed_from,
      routingReason: row.routing_reason,
    };
  }

  private rowToRateLimitEvent(row: any): RateLimitEvent {
    return {
      id: row.id,
      timestamp: new Date(row.timestamp),
      model: row.model,
      errorType: row.error_type,
      resetTime: row.reset_time ? new Date(row.reset_time) : undefined,
      tokensUsedBeforeLimit: row.tokens_used_before_limit,
      windowHours: row.window_hours,
    };
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get database path
   */
  getDatabasePath(): string {
    return this.dbPath;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Export singleton instance
// ═══════════════════════════════════════════════════════════════════════════

let instance: SQLiteAdapter | null = null;

export function getStorageAdapter(dbPath?: string): SQLiteAdapter {
  if (!instance) {
    instance = new SQLiteAdapter(dbPath);
  }
  return instance;
}

export function closeStorageAdapter(): void {
  if (instance) {
    instance.close();
    instance = null;
  }
}
