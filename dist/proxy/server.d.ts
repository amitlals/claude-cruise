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
import { type SQLiteAdapter } from '../storage/database.js';
interface ProxyConfig {
    port: number;
    anthropicApiKey?: string;
    providers: ProviderConfig[];
    routingRules: RoutingRule[];
}
interface ProviderConfig {
    name: string;
    type: 'anthropic' | 'openrouter' | 'ollama' | 'custom';
    endpoint: string;
    apiKey?: string;
    models: string[];
    priority: number;
}
interface RoutingRule {
    condition: {
        type: 'usage_percent' | 'time_until_limit' | 'task_complexity' | 'always';
        threshold?: number;
    };
    action: {
        type: 'route' | 'alert' | 'queue';
        provider?: string;
        model?: string;
    };
}
export declare function createProxy(config?: Partial<ProxyConfig>, storage?: SQLiteAdapter): {
    app: Hono<import("hono/types").BlankEnv, import("hono/types").BlankSchema, "/">;
    store: SQLiteAdapter;
    config: ProxyConfig;
};
export declare function startProxy(port?: number): Promise<{
    server: import("@hono/node-server").ServerType;
    store: SQLiteAdapter;
    config: ProxyConfig;
}>;
declare const _default: {
    createProxy: typeof createProxy;
    startProxy: typeof startProxy;
};
export default _default;
//# sourceMappingURL=server.d.ts.map