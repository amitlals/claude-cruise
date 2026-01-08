/**
 * Cruise Proxy Server
 *
 * Transparent proxy for Claude Code that:
 * - Intercepts all API calls
 * - Logs usage data
 * - Routes to fallback providers
 * - Preserves streaming
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { stream } from 'hono/streaming';
import { serve } from '@hono/node-server';
import { getStorageAdapter } from '../storage/database.js';
import { getPredictionEngine } from '../predictor/index.js';
import { getRouter } from '../router/index.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
// Get current directory for serving static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// ═══════════════════════════════════════════════════════════════════════════
// Cost Calculation
// ═══════════════════════════════════════════════════════════════════════════
const MODEL_PRICING = {
    'claude-sonnet-4-20250514': { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
    'claude-3-5-sonnet-20241022': { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
    'claude-3-5-haiku-20241022': { input: 0.8, output: 4, cacheRead: 0.08, cacheWrite: 1 },
    'claude-opus-4-20250514': { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
    // Per million tokens
};
function calculateCost(model, inputTokens, outputTokens, cacheReadTokens = 0, cacheWriteTokens = 0) {
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['claude-sonnet-4-20250514'];
    const cost = ((inputTokens / 1_000_000) * pricing.input +
        (outputTokens / 1_000_000) * pricing.output +
        (cacheReadTokens / 1_000_000) * pricing.cacheRead +
        (cacheWriteTokens / 1_000_000) * pricing.cacheWrite);
    return cost;
}
// ═══════════════════════════════════════════════════════════════════════════
// Storage - Using SQLiteAdapter for persistence
// ═══════════════════════════════════════════════════════════════════════════
// Storage is now handled by SQLiteAdapter from ../storage/database.js
// This provides persistent storage across sessions and enables:
// - Rate limit learning from 429 errors
// - Historical usage tracking
// - Prediction engine integration
// ═══════════════════════════════════════════════════════════════════════════
// Proxy Server
// ═══════════════════════════════════════════════════════════════════════════
export function createProxy(config = {}, storage) {
    const app = new Hono();
    const store = storage || getStorageAdapter();
    const defaultConfig = {
        port: config.port || 4141,
        anthropicApiKey: config.anthropicApiKey || process.env.ANTHROPIC_API_KEY,
        providers: config.providers || [
            {
                name: 'anthropic',
                type: 'anthropic',
                endpoint: 'https://api.anthropic.com',
                apiKey: process.env.ANTHROPIC_API_KEY,
                models: ['claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022', 'claude-opus-4-20250514'],
                priority: 1,
            },
        ],
        routingRules: config.routingRules || [],
    };
    // Middleware
    app.use('*', cors());
    app.use('*', logger());
    // Dashboard UI - serve HTML at root
    app.get('/', (c) => {
        try {
            const dashboardPath = join(__dirname, 'dashboard.html');
            const html = readFileSync(dashboardPath, 'utf-8');
            return c.html(html);
        }
        catch (error) {
            return c.html(`
        <!DOCTYPE html>
        <html>
        <head><title>Claude Cruise</title></head>
        <body style="background:#1a1a2e;color:#eee;font-family:monospace;padding:40px;text-align:center;">
          <h1>⚡ Claude Cruise</h1>
          <p>Proxy running on port 4141</p>
          <p>Visit <a href="/stats" style="color:#e94560;">/stats</a> for JSON data</p>
          <p>Visit <a href="/health" style="color:#e94560;">/health</a> for health check</p>
        </body>
        </html>
      `);
        }
    });
    // Health check
    app.get('/health', (c) => {
        return c.json({ status: 'ok', version: '0.1.0' });
    });
    // Usage stats endpoint (for dashboard)
    app.get('/stats', (c) => {
        const sessionStats = store.getTotalUsage('session');
        const todayStats = store.getTotalUsage('today');
        const weekStats = store.getTotalUsage('week');
        const windowLogs = store.getWindowLogs(5);
        // Get prediction data
        const predictor = getPredictionEngine(store);
        const prediction = predictor.predict(5, 'claude-sonnet-4-20250514');
        // Get router status
        const router = getRouter(store);
        const routerStatus = router.getStatus();
        return c.json({
            usage: {
                inputTokens: sessionStats.inputTokens,
                outputTokens: sessionStats.outputTokens,
                cacheReadTokens: windowLogs.reduce((s, l) => s + l.cacheReadTokens, 0),
                cacheWriteTokens: windowLogs.reduce((s, l) => s + l.cacheWriteTokens, 0),
                sessionCost: sessionStats.totalCost,
                todayCost: todayStats.totalCost,
                weekCost: weekStats.totalCost,
                savedByRouting: store.getRoutingSavings('session'),
            },
            prediction: {
                usagePercent: prediction.usagePercent,
                minutesUntilLimit: isFinite(prediction.minutesUntilLimit) ? prediction.minutesUntilLimit : 999,
                velocity: prediction.velocity.tokensPerHour,
                confidence: prediction.confidence,
                trend: prediction.velocity.trend,
            },
            session: {
                requests: sessionStats.requestCount,
            },
            router: routerStatus,
        });
    });
    // Main proxy endpoint - Messages API
    app.post('/v1/messages', async (c) => {
        const startTime = Date.now();
        const body = await c.req.json();
        // Get API key from header or config
        const originalApiKey = c.req.header('x-api-key') || defaultConfig.anthropicApiKey;
        if (!originalApiKey) {
            return c.json({ error: 'No API key provided' }, 401);
        }
        // ═══════════════════════════════════════════════════════════════════════
        // Smart Router - Get routing decision
        // ═══════════════════════════════════════════════════════════════════════
        const router = getRouter(store);
        const routingDecision = router.route(body.model);
        // Determine which endpoint, API key, and model to use
        const targetEndpoint = routingDecision.targetEndpoint;
        const targetApiKey = routingDecision.targetApiKey || originalApiKey;
        const targetModel = routingDecision.targetModel;
        // Log routing decision if routed
        if (routingDecision.shouldRoute) {
            console.log(`\n🔀 AUTO-ROUTING:`);
            console.log(`   From: ${body.model} (Anthropic)`);
            console.log(`   To:   ${targetModel} (${routingDecision.targetProvider})`);
            console.log(`   Reason: ${routingDecision.reason}`);
            console.log(`   Est. Savings: $${routingDecision.estimatedSavings.toFixed(4)}\n`);
        }
        // Build request based on provider type
        let apiUrl;
        let headers;
        let requestBody;
        if (routingDecision.targetProvider === 'openrouter') {
            // OpenRouter API format
            apiUrl = `${targetEndpoint}/chat/completions`;
            headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${targetApiKey}`,
                'HTTP-Referer': 'https://claude-cruise.local',
                'X-Title': 'Claude Cruise Proxy',
            };
            // Convert Anthropic format to OpenRouter/OpenAI format
            requestBody = {
                model: targetModel,
                messages: body.messages.map(m => ({
                    role: m.role,
                    content: typeof m.content === 'string' ? m.content : m.content.map(c => c.text).join('\n'),
                })),
                max_tokens: body.max_tokens,
                stream: body.stream,
            };
            if (body.system) {
                requestBody.messages = [{ role: 'system', content: body.system }, ...requestBody.messages];
            }
        }
        else if (routingDecision.targetProvider === 'ollama') {
            // Ollama API format
            apiUrl = `${targetEndpoint}/api/chat`;
            headers = {
                'Content-Type': 'application/json',
            };
            requestBody = {
                model: targetModel,
                messages: body.messages.map(m => ({
                    role: m.role,
                    content: typeof m.content === 'string' ? m.content : m.content.map(c => c.text).join('\n'),
                })),
                stream: body.stream,
            };
            if (body.system) {
                requestBody.messages = [{ role: 'system', content: body.system }, ...requestBody.messages];
            }
        }
        else {
            // Anthropic API format (default)
            apiUrl = `${targetEndpoint}/v1/messages`;
            headers = {
                'Content-Type': 'application/json',
                'x-api-key': targetApiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-beta': c.req.header('anthropic-beta') || '',
            };
            // Use target model (might be different from original, e.g., Haiku instead of Sonnet)
            requestBody = { ...body, model: targetModel };
        }
        // Forward to target provider
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody),
        });
        const latencyMs = Date.now() - startTime;
        // Handle streaming responses
        if (body.stream) {
            // For streaming, we need to intercept and count tokens from the stream
            // This is a simplified version - full implementation would parse SSE events
            return stream(c, async (stream) => {
                const reader = response.body?.getReader();
                if (!reader)
                    return;
                let inputTokens = 0;
                let outputTokens = 0;
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done)
                            break;
                        // Forward chunk
                        await stream.write(value);
                        // Parse SSE to extract token counts (simplified)
                        const text = new TextDecoder().decode(value);
                        const usageMatch = text.match(/"input_tokens":(\d+).*?"output_tokens":(\d+)/);
                        if (usageMatch) {
                            inputTokens = parseInt(usageMatch[1], 10);
                            outputTokens = parseInt(usageMatch[2], 10);
                        }
                    }
                    // Log usage after stream completes
                    store.addLog({
                        timestamp: new Date(),
                        model: targetModel,
                        inputTokens,
                        outputTokens,
                        cacheReadTokens: 0,
                        cacheWriteTokens: 0,
                        costUsd: calculateCost(targetModel, inputTokens, outputTokens),
                        projectPath: process.cwd(),
                        provider: routingDecision.targetProvider,
                        latencyMs,
                        success: true,
                        routedFrom: routingDecision.shouldRoute ? body.model : undefined,
                        routingReason: routingDecision.shouldRoute ? routingDecision.reason : undefined,
                    });
                }
                catch (error) {
                    console.error('Stream error:', error);
                }
            });
        }
        // Non-streaming response
        const data = (await response.json());
        // Extract usage from response
        const usage = data.usage || { input_tokens: 0, output_tokens: 0 };
        // Log usage
        store.addLog({
            timestamp: new Date(),
            model: targetModel,
            inputTokens: usage.input_tokens,
            outputTokens: usage.output_tokens,
            cacheReadTokens: usage.cache_read_input_tokens || 0,
            cacheWriteTokens: usage.cache_creation_input_tokens || 0,
            costUsd: calculateCost(targetModel, usage.input_tokens, usage.output_tokens, usage.cache_read_input_tokens || 0, usage.cache_creation_input_tokens || 0),
            projectPath: process.cwd(),
            provider: routingDecision.targetProvider,
            latencyMs,
            success: response.ok,
            errorType: response.ok ? undefined : data.error?.type,
            routedFrom: routingDecision.shouldRoute ? body.model : undefined,
            routingReason: routingDecision.shouldRoute ? routingDecision.reason : undefined,
        });
        // Detect and record rate limit errors for learning AND trigger immediate fallback
        if (response.status === 429) {
            console.log('🚨 Rate limit detected! Activating auto-routing...');
            const windowLogs = store.getWindowLogs(5);
            const tokensUsed = windowLogs.reduce((sum, log) => sum + log.inputTokens + log.outputTokens, 0);
            const predictor = getPredictionEngine(store);
            predictor.recordRateLimit({
                timestamp: new Date(),
                model: body.model,
                errorType: 'rate_limit_exceeded',
                tokensUsedBeforeLimit: tokensUsed,
                windowHours: 5,
            });
            // Tell the router we hit a rate limit so it switches providers
            router.recordRateLimit();
        }
        return c.json(data, response.status);
    });
    // Catch-all for other Anthropic endpoints
    app.all('/v1/*', async (c) => {
        const apiKey = c.req.header('x-api-key') || defaultConfig.anthropicApiKey;
        const response = await fetch(`https://api.anthropic.com${c.req.path}`, {
            method: c.req.method,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey || '',
                'anthropic-version': '2023-06-01',
            },
            body: c.req.method !== 'GET' ? await c.req.text() : undefined,
        });
        const data = await response.json();
        return c.json(data, response.status);
    });
    return { app, store, config: defaultConfig };
}
// ═══════════════════════════════════════════════════════════════════════════
// Start Server
// ═══════════════════════════════════════════════════════════════════════════
export async function startProxy(port = 4141) {
    const { app, store, config } = createProxy({ port });
    console.log(`\n⚡ Cruise proxy starting on port ${port}...`);
    console.log(`\nTo use with Claude Code, set:`);
    console.log(`  export ANTHROPIC_BASE_URL=http://localhost:${port}`);
    console.log(`\nOr add to your shell config (~/.zshrc or ~/.bashrc)\n`);
    // Using @hono/node-server for Node.js compatibility
    const server = serve({
        fetch: app.fetch,
        port,
    });
    console.log(`✓ Cruise running at http://localhost:${port}`);
    return { server, store, config };
}
export default { createProxy, startProxy };
//# sourceMappingURL=server.js.map