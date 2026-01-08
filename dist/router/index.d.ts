/**
 * Smart Router Module
 *
 * Automatically routes requests to the best available model/provider
 * based on usage levels, rate limits, and task complexity.
 */
import { SQLiteAdapter } from '../storage/database.js';
export interface ProviderConfig {
    name: string;
    type: 'anthropic' | 'openrouter' | 'ollama';
    endpoint: string;
    apiKey?: string;
    models: string[];
    enabled: boolean;
    priority: number;
}
export interface RoutingDecision {
    shouldRoute: boolean;
    originalModel: string;
    targetProvider: string;
    targetModel: string;
    targetEndpoint: string;
    targetApiKey?: string;
    reason: string;
    estimatedSavings: number;
    usagePercent: number;
}
export interface RoutingConfig {
    mode: 'manual' | 'semi-auto' | 'full-auto';
    enabled: boolean;
    thresholds: {
        switchToHaiku: number;
        switchToOpenRouter: number;
        switchToLocal: number;
    };
    providers: ProviderConfig[];
}
export declare class SmartRouter {
    private storage;
    private config;
    private currentModel;
    private isRateLimited;
    private rateLimitResetTime?;
    constructor(storage: SQLiteAdapter, config?: Partial<RoutingConfig>);
    /**
     * Get default provider configurations
     */
    private getDefaultProviders;
    /**
     * Record that we hit a rate limit
     */
    recordRateLimit(resetTime?: Date): void;
    /**
     * Check if rate limit has reset
     */
    private checkRateLimitReset;
    /**
     * Get the best model/provider for current conditions
     */
    route(requestedModel: string): RoutingDecision;
    /**
     * Route to the best available fallback
     */
    private routeToFallback;
    /**
     * Create a routing decision
     */
    private createDecision;
    /**
     * No routing - use original model
     */
    private noRouting;
    /**
     * Get current routing status for dashboard
     */
    getStatus(): {
        mode: string;
        enabled: boolean;
        currentModel: string;
        isRateLimited: boolean;
        rateLimitResetTime?: Date;
        providers: Array<{
            name: string;
            enabled: boolean;
            hasApiKey: boolean;
        }>;
    };
    /**
     * Update provider configuration
     */
    updateProvider(name: string, updates: Partial<ProviderConfig>): void;
    /**
     * Set routing mode
     */
    setMode(mode: 'manual' | 'semi-auto' | 'full-auto'): void;
    /**
     * Enable/disable routing
     */
    setEnabled(enabled: boolean): void;
}
export declare function getRouter(storage?: SQLiteAdapter, config?: Partial<RoutingConfig>): SmartRouter;
export declare function resetRouter(): void;
//# sourceMappingURL=index.d.ts.map