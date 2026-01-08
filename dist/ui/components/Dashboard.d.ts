/**
 * Main Dashboard Component
 *
 * Full-featured terminal UI for Claude Code Autopilot
 * Works in standard terminal and VSCode integrated terminal
 */
import React from 'react';
import { type Theme } from '../themes/index.js';
interface UsageData {
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
interface PredictionData {
    usagePercent: number;
    minutesUntilLimit: number;
    velocity: number;
    confidence: number;
    trend: number[];
}
interface RoutingConfig {
    currentModel: 'sonnet' | 'haiku' | 'opus' | 'local' | 'openrouter';
    nextSwitch: {
        model: string;
        triggerPercent: number;
        estimatedMinutes: number;
    } | null;
    mode: 'manual' | 'semi-auto' | 'full-auto';
}
interface DashboardProps {
    usage: UsageData;
    prediction: PredictionData;
    routing: RoutingConfig;
    sessionDuration: string;
    theme?: Theme;
}
export declare const Dashboard: React.FC<DashboardProps>;
export default Dashboard;
//# sourceMappingURL=Dashboard.d.ts.map