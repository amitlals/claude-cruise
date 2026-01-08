/**
 * Predictor Module
 *
 * Learns actual rate limits from 429 errors and predicts when limits will be hit
 * based on usage velocity and historical patterns.
 */
// ═══════════════════════════════════════════════════════════════════════════
// Default Limits (Conservative estimates, improved by learning)
// ═══════════════════════════════════════════════════════════════════════════
const DEFAULT_LIMITS = {
    'claude-sonnet-4-20250514': 5_000_000, // 5M tokens per 5 hours (conservative)
    'claude-3-5-sonnet-20241022': 5_000_000,
    'claude-3-5-haiku-20241022': 10_000_000, // Higher limit for Haiku
    'claude-opus-4-20250514': 2_000_000, // Lower for Opus (more conservative)
};
const DEFAULT_WINDOW_HOURS = 5; // Anthropic's rate limit window
// ═══════════════════════════════════════════════════════════════════════════
// Rate Limit Tracker
// ═══════════════════════════════════════════════════════════════════════════
export class RateLimitTracker {
    storage;
    learnedLimits;
    constructor(storage) {
        this.storage = storage;
        this.learnedLimits = new Map();
        this.loadLearnedLimits();
    }
    /**
     * Load previously learned limits from storage
     */
    loadLearnedLimits() {
        const events = this.storage.getRateLimitWindow(30 * 24); // Last 30 days
        // Group by model
        const eventsByModel = events.reduce((acc, event) => {
            if (!acc[event.model]) {
                acc[event.model] = [];
            }
            acc[event.model].push(event);
            return acc;
        }, {});
        // Calculate learned limits for each model
        for (const [model, modelEvents] of Object.entries(eventsByModel)) {
            if (modelEvents.length === 0)
                continue;
            // Average tokens used before limit hit
            const avgTokens = modelEvents.reduce((sum, e) => sum + e.tokensUsedBeforeLimit, 0) / modelEvents.length;
            this.learnedLimits.set(model, {
                model,
                tokenLimit: Math.floor(avgTokens * 0.95), // 5% safety margin
                windowHours: modelEvents[0].windowHours,
                confidence: Math.min(100, modelEvents.length * 20), // 20% confidence per data point
                lastUpdated: new Date(Math.max(...modelEvents.map((e) => e.timestamp.getTime()))),
                dataPoints: modelEvents.length,
            });
        }
    }
    /**
     * Record a rate limit event
     */
    recordRateLimit(event) {
        // Save to storage
        this.storage.addRateLimitEvent(event);
        // Update learned limit
        const existing = this.learnedLimits.get(event.model);
        if (existing) {
            // Running average with new data point
            const newDataPoints = existing.dataPoints + 1;
            const newTokenLimit = Math.floor((existing.tokenLimit * existing.dataPoints + event.tokensUsedBeforeLimit * 0.95) /
                newDataPoints);
            this.learnedLimits.set(event.model, {
                model: event.model,
                tokenLimit: newTokenLimit,
                windowHours: event.windowHours,
                confidence: Math.min(100, newDataPoints * 20),
                lastUpdated: new Date(),
                dataPoints: newDataPoints,
            });
        }
        else {
            // First data point for this model
            this.learnedLimits.set(event.model, {
                model: event.model,
                tokenLimit: Math.floor(event.tokensUsedBeforeLimit * 0.95),
                windowHours: event.windowHours,
                confidence: 20, // Low confidence with just one data point
                lastUpdated: new Date(),
                dataPoints: 1,
            });
        }
    }
    /**
     * Get learned limit for a model (or default if unknown)
     */
    getLearnedLimit(model) {
        const learned = this.learnedLimits.get(model);
        if (learned) {
            return learned;
        }
        // Return default conservative limit
        return {
            model,
            tokenLimit: DEFAULT_LIMITS[model] || DEFAULT_LIMITS['claude-sonnet-4-20250514'],
            windowHours: DEFAULT_WINDOW_HOURS,
            confidence: 0, // No confidence without data
            lastUpdated: new Date(),
            dataPoints: 0,
        };
    }
    /**
     * Get confidence level (0-100) for a model's limit
     */
    getConfidence(model) {
        const learned = this.learnedLimits.get(model);
        return learned ? learned.confidence : 0;
    }
    /**
     * Get all learned limits
     */
    getAllLearned() {
        return Array.from(this.learnedLimits.values());
    }
}
// ═══════════════════════════════════════════════════════════════════════════
// Velocity Calculator
// ═══════════════════════════════════════════════════════════════════════════
export class VelocityCalculator {
    /**
     * Calculate usage velocity over time window
     */
    calculate(logs, windowMinutes = 60) {
        if (logs.length === 0) {
            return {
                tokensPerHour: 0,
                tokensPerMinute: 0,
                trend: new Array(12).fill(0),
                acceleration: 0,
                pattern: 'steady',
            };
        }
        // Calculate total tokens in window
        const totalTokens = logs.reduce((sum, log) => sum + log.inputTokens + log.outputTokens, 0);
        // Calculate velocity
        const tokensPerMinute = totalTokens / windowMinutes;
        const tokensPerHour = tokensPerMinute * 60;
        // Calculate trend (12 data points, 5-minute intervals)
        const trend = this.calculateTrend(logs, 12);
        // Calculate acceleration (rate of change)
        const acceleration = this.calculateAcceleration(trend);
        // Detect pattern
        const pattern = this.detectPattern(trend, acceleration);
        return {
            tokensPerHour,
            tokensPerMinute,
            trend,
            acceleration,
            pattern,
        };
    }
    /**
     * Calculate trend sparkline data
     */
    calculateTrend(logs, points) {
        if (logs.length === 0)
            return new Array(points).fill(0);
        // Get time range
        const newest = Math.max(...logs.map((l) => l.timestamp.getTime()));
        const oldest = Math.min(...logs.map((l) => l.timestamp.getTime()));
        const range = newest - oldest;
        if (range === 0) {
            const avgTokens = logs.reduce((sum, l) => sum + l.inputTokens + l.outputTokens, 0) / logs.length;
            return new Array(points).fill(avgTokens);
        }
        // Divide into buckets
        const bucketSize = range / points;
        const buckets = new Array(points).fill(0);
        for (const log of logs) {
            const bucketIndex = Math.floor((log.timestamp.getTime() - oldest) / bucketSize);
            const safeIndex = Math.min(bucketIndex, points - 1);
            buckets[safeIndex] += log.inputTokens + log.outputTokens;
        }
        return buckets;
    }
    /**
     * Calculate acceleration (second derivative of usage)
     */
    calculateAcceleration(trend) {
        if (trend.length < 3)
            return 0;
        // Simple acceleration: difference between last 3 points
        const recent = trend.slice(-3);
        const velocity1 = recent[1] - recent[0];
        const velocity2 = recent[2] - recent[1];
        return velocity2 - velocity1;
    }
    /**
     * Detect usage pattern
     */
    detectPattern(trend, acceleration) {
        if (trend.length < 2)
            return 'steady';
        const avg = trend.reduce((sum, v) => sum + v, 0) / trend.length;
        const variance = trend.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / trend.length;
        const stdDev = Math.sqrt(variance);
        // High variance = burst pattern
        if (stdDev > avg * 0.5) {
            return 'burst';
        }
        // Negative acceleration = declining
        if (acceleration < -avg * 0.2) {
            return 'declining';
        }
        return 'steady';
    }
    /**
     * Predict future usage
     */
    predictUsage(currentVelocity, minutesAhead) {
        const { tokensPerMinute, acceleration, pattern } = currentVelocity;
        if (pattern === 'declining') {
            // Apply decay factor for declining pattern
            const decayFactor = Math.max(0, 1 - 0.1 * (minutesAhead / 60));
            return tokensPerMinute * minutesAhead * decayFactor;
        }
        if (pattern === 'burst') {
            // Add buffer for burst pattern
            const burstFactor = 1.2; // 20% buffer
            return tokensPerMinute * minutesAhead * burstFactor;
        }
        // Steady pattern: simple linear projection with acceleration
        const accelerationAdjustment = (acceleration / 2) * (minutesAhead / 60);
        return (tokensPerMinute + accelerationAdjustment) * minutesAhead;
    }
}
// ═══════════════════════════════════════════════════════════════════════════
// Prediction Engine
// ═══════════════════════════════════════════════════════════════════════════
export class PredictionEngine {
    storage;
    limitsTracker;
    velocityCalc;
    constructor(storage) {
        this.storage = storage;
        this.limitsTracker = new RateLimitTracker(storage);
        this.velocityCalc = new VelocityCalculator();
    }
    /**
     * Main prediction function
     */
    predict(windowHours = 5, model = 'claude-sonnet-4-20250514') {
        // Get logs from window
        const logs = this.storage.getWindowLogs(windowHours);
        // Get learned limit
        const learnedLimit = this.limitsTracker.getLearnedLimit(model);
        // Calculate current usage in window
        const currentUsage = logs.reduce((sum, log) => sum + log.inputTokens + log.outputTokens, 0);
        // Calculate velocity
        const velocity = this.velocityCalc.calculate(logs, windowHours * 60);
        // Calculate usage percentage
        const usagePercent = Math.min(100, (currentUsage / learnedLimit.tokenLimit) * 100);
        // Calculate tokens remaining
        const tokensRemaining = Math.max(0, learnedLimit.tokenLimit - currentUsage);
        // Predict time until limit (if velocity > 0)
        let minutesUntilLimit = Infinity;
        let estimatedLimitTime;
        if (velocity.tokensPerMinute > 0) {
            minutesUntilLimit = tokensRemaining / velocity.tokensPerMinute;
            estimatedLimitTime = new Date(Date.now() + minutesUntilLimit * 60 * 1000);
        }
        // Determine recommended action
        const recommendedAction = this.getRecommendedAction(usagePercent, minutesUntilLimit, velocity.pattern);
        // Calculate confidence (based on learned limit confidence and data quality)
        const dataQuality = Math.min(100, logs.length * 2); // More data = higher confidence
        const confidence = Math.floor((learnedLimit.confidence + dataQuality) / 2);
        return {
            usagePercent,
            minutesUntilLimit: Math.floor(minutesUntilLimit),
            tokensRemaining,
            confidence,
            velocity,
            recommendedAction,
            estimatedLimitTime,
        };
    }
    /**
     * Get recommended action based on prediction
     */
    getRecommendedAction(usagePercent, minutesUntilLimit, pattern) {
        // Critical: Less than 10 minutes or >95%
        if (minutesUntilLimit < 10 || usagePercent > 95) {
            return 'pause';
        }
        // High: 85-95% or burst pattern approaching limit
        if (usagePercent > 85 || (pattern === 'burst' && usagePercent > 70)) {
            return 'switch_provider';
        }
        // Medium: 70-85%
        if (usagePercent > 70) {
            return 'switch_model';
        }
        // Low: <70%
        return 'continue';
    }
    /**
     * Record rate limit event and update learning
     */
    recordRateLimit(event) {
        this.limitsTracker.recordRateLimit(event);
    }
    /**
     * Get prediction accuracy metrics
     */
    getPredictionAccuracy() {
        // This would compare historical predictions vs actual 429 events
        // For now, return empty array (can be implemented later)
        return [];
    }
    /**
     * Get all learned limits
     */
    getLearnedLimits() {
        return this.limitsTracker.getAllLearned();
    }
    /**
     * Get rate limit tracker
     */
    getRateLimitTracker() {
        return this.limitsTracker;
    }
}
// ═══════════════════════════════════════════════════════════════════════════
// Export singleton instance
// ═══════════════════════════════════════════════════════════════════════════
let instance = null;
export function getPredictionEngine(storage) {
    if (!instance) {
        instance = new PredictionEngine(storage);
    }
    return instance;
}
//# sourceMappingURL=index.js.map