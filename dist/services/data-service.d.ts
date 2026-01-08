/**
 * Data Service
 *
 * Bridges storage/predictor with CLI/Dashboard.
 * Provides unified interface for fetching usage data, predictions, and routing config.
 */
import { type SQLiteAdapter } from '../storage/database.js';
import { type PredictionEngine } from '../predictor/index.js';
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
export declare class DataService {
    private storage;
    private predictor;
    constructor(storage?: SQLiteAdapter);
    /**
     * Get usage data for dashboard
     */
    getUsageData(): UsageData;
    /**
     * Get prediction data for dashboard
     */
    getPredictionData(model?: string): PredictionData;
    /**
     * Get routing configuration based on current prediction
     */
    getRoutingConfig(prediction: PredictionData): RoutingConfig;
    /**
     * Get all dashboard data in one call
     */
    getDashboardData(model?: string): {
        usage: UsageData;
        prediction: PredictionData;
        routing: RoutingConfig;
    };
    /**
     * Get the underlying storage adapter
     */
    getStorage(): SQLiteAdapter;
    /**
     * Get the underlying prediction engine
     */
    getPredictor(): PredictionEngine;
}
export declare function getDataService(storage?: SQLiteAdapter): DataService;
export declare function resetDataService(): void;
//# sourceMappingURL=data-service.d.ts.map