/**
 * Predictor Module
 *
 * Learns actual rate limits from 429 errors and predicts when limits will be hit
 * based on usage velocity and historical patterns.
 */
import { SQLiteAdapter, UsageLog, RateLimitEvent } from '../storage/database.js';
export interface VelocityStats {
    tokensPerHour: number;
    tokensPerMinute: number;
    trend: number[];
    acceleration: number;
    pattern: 'burst' | 'steady' | 'declining';
}
export interface Prediction {
    usagePercent: number;
    minutesUntilLimit: number;
    tokensRemaining: number;
    confidence: number;
    velocity: VelocityStats;
    recommendedAction: 'continue' | 'switch_model' | 'switch_provider' | 'pause';
    estimatedLimitTime?: Date;
}
export interface LearnedLimit {
    model: string;
    tokenLimit: number;
    windowHours: number;
    confidence: number;
    lastUpdated: Date;
    dataPoints: number;
}
export declare class RateLimitTracker {
    private storage;
    private learnedLimits;
    constructor(storage: SQLiteAdapter);
    /**
     * Load previously learned limits from storage
     */
    private loadLearnedLimits;
    /**
     * Record a rate limit event
     */
    recordRateLimit(event: Omit<RateLimitEvent, 'id'>): void;
    /**
     * Get learned limit for a model (or default if unknown)
     */
    getLearnedLimit(model: string): LearnedLimit;
    /**
     * Get confidence level (0-100) for a model's limit
     */
    getConfidence(model: string): number;
    /**
     * Get all learned limits
     */
    getAllLearned(): LearnedLimit[];
}
export declare class VelocityCalculator {
    /**
     * Calculate usage velocity over time window
     */
    calculate(logs: UsageLog[], windowMinutes?: number): VelocityStats;
    /**
     * Calculate trend sparkline data
     */
    private calculateTrend;
    /**
     * Calculate acceleration (second derivative of usage)
     */
    private calculateAcceleration;
    /**
     * Detect usage pattern
     */
    detectPattern(trend: number[], acceleration: number): 'burst' | 'steady' | 'declining';
    /**
     * Predict future usage
     */
    predictUsage(currentVelocity: VelocityStats, minutesAhead: number): number;
}
export declare class PredictionEngine {
    private storage;
    private limitsTracker;
    private velocityCalc;
    constructor(storage: SQLiteAdapter);
    /**
     * Main prediction function
     */
    predict(windowHours?: number, model?: string): Prediction;
    /**
     * Get recommended action based on prediction
     */
    private getRecommendedAction;
    /**
     * Record rate limit event and update learning
     */
    recordRateLimit(event: Omit<RateLimitEvent, 'id'>): void;
    /**
     * Get prediction accuracy metrics
     */
    getPredictionAccuracy(): {
        predicted: number;
        actual: number;
        accuracy: number;
    }[];
    /**
     * Get all learned limits
     */
    getLearnedLimits(): LearnedLimit[];
    /**
     * Get rate limit tracker
     */
    getRateLimitTracker(): RateLimitTracker;
}
export declare function getPredictionEngine(storage: SQLiteAdapter): PredictionEngine;
//# sourceMappingURL=index.d.ts.map