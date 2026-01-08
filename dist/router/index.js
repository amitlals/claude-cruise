/**
 * Smart Router Module
 *
 * Automatically routes requests to the best available model/provider
 * based on usage levels, rate limits, and task complexity.
 */
import { getStorageAdapter } from '../storage/database.js';
import { getPredictionEngine } from '../predictor/index.js';
// ═══════════════════════════════════════════════════════════════════════════
// Model Pricing (per million tokens)
// ═══════════════════════════════════════════════════════════════════════════
const MODEL_COSTS = {
    // Anthropic
    'claude-sonnet-4-20250514': { input: 3, output: 15 },
    'claude-3-5-sonnet-20241022': { input: 3, output: 15 },
    'claude-3-5-haiku-20241022': { input: 0.8, output: 4 },
    'claude-opus-4-20250514': { input: 15, output: 75 },
    // OpenRouter (same models, slightly higher)
    'anthropic/claude-3.5-sonnet': { input: 3.5, output: 16 },
    'anthropic/claude-3.5-haiku': { input: 1, output: 5 },
    // Ollama (free, local)
    'qwen2.5-coder:32b': { input: 0, output: 0 },
    'deepseek-coder-v2:latest': { input: 0, output: 0 },
};
// ═══════════════════════════════════════════════════════════════════════════
// Smart Router
// ═══════════════════════════════════════════════════════════════════════════
export class SmartRouter {
    storage;
    config;
    currentModel = 'claude-sonnet-4-20250514';
    isRateLimited = false;
    rateLimitResetTime;
    constructor(storage, config) {
        this.storage = storage;
        this.config = {
            mode: config?.mode || 'full-auto',
            enabled: config?.enabled ?? true,
            thresholds: {
                switchToHaiku: config?.thresholds?.switchToHaiku || 70,
                switchToOpenRouter: config?.thresholds?.switchToOpenRouter || 85,
                switchToLocal: config?.thresholds?.switchToLocal || 95,
            },
            providers: config?.providers || this.getDefaultProviders(),
        };
    }
    /**
     * Get default provider configurations
     */
    getDefaultProviders() {
        return [
            {
                name: 'anthropic',
                type: 'anthropic',
                endpoint: 'https://api.anthropic.com',
                apiKey: process.env.ANTHROPIC_API_KEY,
                models: ['claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022', 'claude-opus-4-20250514'],
                enabled: true,
                priority: 1,
            },
            {
                name: 'openrouter',
                type: 'openrouter',
                endpoint: 'https://openrouter.ai/api/v1',
                apiKey: process.env.OPENROUTER_API_KEY,
                models: ['anthropic/claude-3.5-sonnet', 'anthropic/claude-3.5-haiku'],
                enabled: !!process.env.OPENROUTER_API_KEY,
                priority: 2,
            },
            {
                name: 'ollama',
                type: 'ollama',
                endpoint: process.env.OLLAMA_ENDPOINT || 'http://localhost:11434',
                models: ['qwen2.5-coder:32b', 'deepseek-coder-v2:latest'],
                enabled: !!process.env.OLLAMA_ENABLED,
                priority: 3,
            },
        ];
    }
    /**
     * Record that we hit a rate limit
     */
    recordRateLimit(resetTime) {
        this.isRateLimited = true;
        this.rateLimitResetTime = resetTime;
        console.log('🚨 Rate limit recorded! Auto-routing to fallback enabled.');
        // Auto-reset after window expires (default 5 hours)
        const resetMs = resetTime
            ? resetTime.getTime() - Date.now()
            : 5 * 60 * 60 * 1000;
        setTimeout(() => {
            this.isRateLimited = false;
            this.rateLimitResetTime = undefined;
            console.log('✅ Rate limit window reset. Returning to primary provider.');
        }, Math.max(resetMs, 60000)); // At least 1 minute
    }
    /**
     * Check if rate limit has reset
     */
    checkRateLimitReset() {
        if (this.rateLimitResetTime && new Date() > this.rateLimitResetTime) {
            this.isRateLimited = false;
            this.rateLimitResetTime = undefined;
        }
    }
    /**
     * Get the best model/provider for current conditions
     */
    route(requestedModel) {
        if (!this.config.enabled || this.config.mode === 'manual') {
            return this.noRouting(requestedModel);
        }
        this.checkRateLimitReset();
        // Get current usage prediction
        const predictor = getPredictionEngine(this.storage);
        const prediction = predictor.predict(5, requestedModel);
        const usagePercent = prediction.usagePercent;
        // If we're rate limited, immediately switch to fallback
        if (this.isRateLimited) {
            return this.routeToFallback(requestedModel, usagePercent, 'Rate limited - switching to fallback');
        }
        // Check thresholds and route accordingly
        const { switchToHaiku, switchToOpenRouter, switchToLocal } = this.config.thresholds;
        // >= 95%: Switch to local (Ollama)
        if (usagePercent >= switchToLocal) {
            const ollamaProvider = this.config.providers.find(p => p.name === 'ollama' && p.enabled);
            if (ollamaProvider && ollamaProvider.models.length > 0) {
                return this.createDecision(requestedModel, ollamaProvider, ollamaProvider.models[0], usagePercent, `Usage at ${usagePercent.toFixed(0)}% - switching to local model (free)`);
            }
        }
        // >= 85%: Switch to OpenRouter
        if (usagePercent >= switchToOpenRouter) {
            const openrouterProvider = this.config.providers.find(p => p.name === 'openrouter' && p.enabled);
            if (openrouterProvider && openrouterProvider.models.length > 0) {
                return this.createDecision(requestedModel, openrouterProvider, openrouterProvider.models[0], usagePercent, `Usage at ${usagePercent.toFixed(0)}% - switching to OpenRouter`);
            }
        }
        // >= 70%: Switch to Haiku (cheaper, still Anthropic)
        if (usagePercent >= switchToHaiku) {
            const anthropicProvider = this.config.providers.find(p => p.name === 'anthropic' && p.enabled);
            if (anthropicProvider) {
                return this.createDecision(requestedModel, anthropicProvider, 'claude-3-5-haiku-20241022', usagePercent, `Usage at ${usagePercent.toFixed(0)}% - switching to Haiku (73% cheaper)`);
            }
        }
        // Under thresholds - use requested model
        return this.noRouting(requestedModel, usagePercent);
    }
    /**
     * Route to the best available fallback
     */
    routeToFallback(requestedModel, usagePercent, reason) {
        // Try providers in priority order (skip anthropic if rate limited)
        const sortedProviders = [...this.config.providers]
            .filter(p => p.enabled && (this.isRateLimited ? p.name !== 'anthropic' : true))
            .sort((a, b) => a.priority - b.priority);
        for (const provider of sortedProviders) {
            if (provider.models.length > 0) {
                // For anthropic, use Haiku as fallback
                const model = provider.name === 'anthropic'
                    ? 'claude-3-5-haiku-20241022'
                    : provider.models[0];
                return this.createDecision(requestedModel, provider, model, usagePercent, reason);
            }
        }
        // No fallback available - return original (will likely fail)
        console.log('⚠️ No fallback providers available!');
        return this.noRouting(requestedModel, usagePercent);
    }
    /**
     * Create a routing decision
     */
    createDecision(originalModel, provider, targetModel, usagePercent, reason) {
        const originalCost = MODEL_COSTS[originalModel] || MODEL_COSTS['claude-sonnet-4-20250514'];
        const targetCost = MODEL_COSTS[targetModel] || { input: 0, output: 0 };
        // Estimate savings (assuming 10K tokens average request)
        const avgTokens = 10000;
        const originalEstimate = (avgTokens / 1_000_000) * (originalCost.input + originalCost.output);
        const targetEstimate = (avgTokens / 1_000_000) * (targetCost.input + targetCost.output);
        const savings = Math.max(0, originalEstimate - targetEstimate);
        this.currentModel = targetModel;
        return {
            shouldRoute: targetModel !== originalModel || provider.name !== 'anthropic',
            originalModel,
            targetProvider: provider.name,
            targetModel,
            targetEndpoint: provider.endpoint,
            targetApiKey: provider.apiKey,
            reason,
            estimatedSavings: savings,
            usagePercent,
        };
    }
    /**
     * No routing - use original model
     */
    noRouting(model, usagePercent = 0) {
        const anthropicProvider = this.config.providers.find(p => p.name === 'anthropic');
        this.currentModel = model;
        return {
            shouldRoute: false,
            originalModel: model,
            targetProvider: 'anthropic',
            targetModel: model,
            targetEndpoint: anthropicProvider?.endpoint || 'https://api.anthropic.com',
            targetApiKey: anthropicProvider?.apiKey,
            reason: 'Using requested model',
            estimatedSavings: 0,
            usagePercent,
        };
    }
    /**
     * Get current routing status for dashboard
     */
    getStatus() {
        return {
            mode: this.config.mode,
            enabled: this.config.enabled,
            currentModel: this.currentModel,
            isRateLimited: this.isRateLimited,
            rateLimitResetTime: this.rateLimitResetTime,
            providers: this.config.providers.map(p => ({
                name: p.name,
                enabled: p.enabled,
                hasApiKey: !!p.apiKey || p.type === 'ollama',
            })),
        };
    }
    /**
     * Update provider configuration
     */
    updateProvider(name, updates) {
        const provider = this.config.providers.find(p => p.name === name);
        if (provider) {
            Object.assign(provider, updates);
        }
    }
    /**
     * Set routing mode
     */
    setMode(mode) {
        this.config.mode = mode;
        console.log(`🔧 Routing mode set to: ${mode}`);
    }
    /**
     * Enable/disable routing
     */
    setEnabled(enabled) {
        this.config.enabled = enabled;
        console.log(`🔧 Auto-routing ${enabled ? 'enabled' : 'disabled'}`);
    }
}
// ═══════════════════════════════════════════════════════════════════════════
// Singleton
// ═══════════════════════════════════════════════════════════════════════════
let routerInstance = null;
export function getRouter(storage, config) {
    if (!routerInstance) {
        const store = storage || getStorageAdapter();
        routerInstance = new SmartRouter(store, config);
    }
    return routerInstance;
}
export function resetRouter() {
    routerInstance = null;
}
//# sourceMappingURL=index.js.map