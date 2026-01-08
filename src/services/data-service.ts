/**
 * Data Service
 *
 * Bridges storage/predictor with CLI/Dashboard.
 * Provides unified interface for fetching usage data, predictions, and routing config.
 */

import { getStorageAdapter, type SQLiteAdapter } from '../storage/database.js';
import { getPredictionEngine, type PredictionEngine } from '../predictor/index.js';

// ═══════════════════════════════════════════════════════════════════════════
// Types (matching Dashboard expectations)
// ═══════════════════════════════════════════════════════════════════════════

export interface UsageData {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  totalCost: number;
  sessionCost: number;
  todayCost: number;
  weekCost: number;
  savedByRouting: number;
}

export interface PredictionData {
  usagePercent: number;
  minutesUntilLimit: number;
  velocity: number;
  confidence: number;
  trend: number[];
}

export interface RoutingConfig {
  currentModel: 'sonnet' | 'haiku' | 'opus' | 'local' | 'openrouter';
  nextSwitch: {
    model: string;
    triggerPercent: number;
    estimatedMinutes: number;
  } | null;
  mode: 'manual' | 'semi-auto' | 'full-auto';
}

// Default token limit assumption (will be learned from 429 errors)
const DEFAULT_TOKEN_LIMIT = 5_000_000;

// ═══════════════════════════════════════════════════════════════════════════
// Data Service Class
// ═══════════════════════════════════════════════════════════════════════════

export class DataService {
  private storage: SQLiteAdapter;
  private predictor: PredictionEngine;

  constructor(storage?: SQLiteAdapter) {
    this.storage = storage || getStorageAdapter();
    this.predictor = getPredictionEngine(this.storage);
  }

  /**
   * Get usage data for dashboard
   */
  getUsageData(): UsageData {
    const sessionStats = this.storage.getTotalUsage('session');
    const todayStats = this.storage.getTotalUsage('today');
    const weekStats = this.storage.getTotalUsage('week');
    const windowLogs = this.storage.getWindowLogs(5);

    const cacheReadTokens = windowLogs.reduce((sum, log) => sum + log.cacheReadTokens, 0);
    const cacheWriteTokens = windowLogs.reduce((sum, log) => sum + log.cacheWriteTokens, 0);

    return {
      inputTokens: sessionStats.inputTokens,
      outputTokens: sessionStats.outputTokens,
      cacheReadTokens,
      cacheWriteTokens,
      totalCost: weekStats.totalCost,
      sessionCost: sessionStats.totalCost,
      todayCost: todayStats.totalCost,
      weekCost: weekStats.totalCost,
      savedByRouting: this.storage.getRoutingSavings('session'),
    };
  }

  /**
   * Get prediction data for dashboard
   */
  getPredictionData(model: string = 'claude-sonnet-4-20250514'): PredictionData {
    const prediction = this.predictor.predict(5, model);

    return {
      usagePercent: prediction.usagePercent,
      minutesUntilLimit: isFinite(prediction.minutesUntilLimit)
        ? prediction.minutesUntilLimit
        : 999,
      velocity: prediction.velocity.tokensPerHour,
      confidence: prediction.confidence,
      trend: prediction.velocity.trend,
    };
  }

  /**
   * Get routing configuration based on current prediction
   */
  getRoutingConfig(prediction: PredictionData): RoutingConfig {
    // Determine current model based on usage percentage
    let currentModel: RoutingConfig['currentModel'] = 'sonnet';

    if (prediction.usagePercent >= 95) {
      currentModel = 'local';
    } else if (prediction.usagePercent >= 85) {
      currentModel = 'openrouter';
    } else if (prediction.usagePercent >= 70) {
      currentModel = 'haiku';
    }

    // Calculate next switch point
    let nextSwitch: RoutingConfig['nextSwitch'] = null;

    if (prediction.velocity > 0) {
      if (prediction.usagePercent < 70) {
        const tokensUntil70 = ((70 - prediction.usagePercent) / 100) * DEFAULT_TOKEN_LIMIT;
        const minutesUntil70 = tokensUntil70 / (prediction.velocity / 60);
        nextSwitch = {
          model: 'Haiku',
          triggerPercent: 70,
          estimatedMinutes: Math.floor(minutesUntil70),
        };
      } else if (prediction.usagePercent < 85) {
        const tokensUntil85 = ((85 - prediction.usagePercent) / 100) * DEFAULT_TOKEN_LIMIT;
        const minutesUntil85 = tokensUntil85 / (prediction.velocity / 60);
        nextSwitch = {
          model: 'OpenRouter',
          triggerPercent: 85,
          estimatedMinutes: Math.floor(minutesUntil85),
        };
      } else if (prediction.usagePercent < 95) {
        const tokensUntil95 = ((95 - prediction.usagePercent) / 100) * DEFAULT_TOKEN_LIMIT;
        const minutesUntil95 = tokensUntil95 / (prediction.velocity / 60);
        nextSwitch = {
          model: 'Local',
          triggerPercent: 95,
          estimatedMinutes: Math.floor(minutesUntil95),
        };
      }
    }

    return {
      currentModel,
      nextSwitch,
      mode: 'semi-auto', // TODO: Load from config file
    };
  }

  /**
   * Get all dashboard data in one call
   */
  getDashboardData(model?: string): {
    usage: UsageData;
    prediction: PredictionData;
    routing: RoutingConfig;
  } {
    const usage = this.getUsageData();
    const prediction = this.getPredictionData(model);
    const routing = this.getRoutingConfig(prediction);

    return { usage, prediction, routing };
  }

  /**
   * Get the underlying storage adapter
   */
  getStorage(): SQLiteAdapter {
    return this.storage;
  }

  /**
   * Get the underlying prediction engine
   */
  getPredictor(): PredictionEngine {
    return this.predictor;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Singleton
// ═══════════════════════════════════════════════════════════════════════════

let instance: DataService | null = null;

export function getDataService(storage?: SQLiteAdapter): DataService {
  if (!instance) {
    instance = new DataService(storage);
  }
  return instance;
}

export function resetDataService(): void {
  instance = null;
}
