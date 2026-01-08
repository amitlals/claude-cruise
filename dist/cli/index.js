#!/usr/bin/env node
import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
/**
 * Claude Cruise - CLI Entry Point
 *
 * Usage:
 *   npx claude-cruise        # Start proxy + dashboard
 *   npx claude-cruise start  # Same as above
 *   npx claude-cruise status # Show compact status
 *   npx claude-cruise report # Generate usage report
 */
import { useState, useEffect, useRef } from 'react';
import { render, Box, Text, useApp } from 'ink';
import meow from 'meow';
import { StartupAnimation, StatusIndicator } from '../ui/animations/Logo.js';
import { Dashboard } from '../ui/components/Dashboard.js';
import { getTheme, } from '../ui/themes/index.js';
import { startProxy } from '../proxy/server.js';
import { getDataService, } from '../services/data-service.js';
import { closeStorageAdapter } from '../storage/database.js';
// ═══════════════════════════════════════════════════════════════════════════
// CLI Definition
// ═══════════════════════════════════════════════════════════════════════════
const cli = meow(`
  Usage
    $ cruise [command] [options]

  Commands
    start       Start the proxy and dashboard (default)
    status      Show compact status line
    report      Generate usage report
    config      Open configuration
    export      Export data to CSV/JSON

  Options
    --theme, -t     Theme: claude, vscode-dark, catppuccin (default: claude)
    --compact, -c   Use compact mode (for tmux/sidebars)
    --port, -p      Proxy port (default: 4141)
    --no-ui         Run proxy without dashboard UI
    --version       Show version
    --help          Show this help

  Examples
    $ cruise                       # Start with defaults
    $ cruise --theme vscode-dark
    $ cruise status --compact
    $ cruise report --period week
`, {
    importMeta: import.meta,
    flags: {
        theme: {
            type: 'string',
            shortFlag: 't',
            default: 'claude',
        },
        compact: {
            type: 'boolean',
            shortFlag: 'c',
            default: false,
        },
        port: {
            type: 'number',
            shortFlag: 'p',
            default: 4141,
        },
        noUi: {
            type: 'boolean',
            default: false,
        },
    },
});
// ═══════════════════════════════════════════════════════════════════════════
// Default Data (used before first data fetch)
// ═══════════════════════════════════════════════════════════════════════════
const defaultUsageData = {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    totalCost: 0,
    sessionCost: 0,
    todayCost: 0,
    weekCost: 0,
    savedByRouting: 0,
};
const defaultPredictionData = {
    usagePercent: 0,
    minutesUntilLimit: 999,
    velocity: 0,
    confidence: 0,
    trend: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};
const defaultRoutingConfig = {
    currentModel: 'sonnet',
    nextSwitch: null,
    mode: 'semi-auto',
};
const App = ({ command, theme: themeName, compact, port }) => {
    const { exit } = useApp();
    const [phase, setPhase] = useState('startup');
    const [usage, setUsage] = useState(defaultUsageData);
    const [prediction, setPrediction] = useState(defaultPredictionData);
    const [routing, setRouting] = useState(defaultRoutingConfig);
    const [sessionStart] = useState(Date.now());
    const [proxyStarted, setProxyStarted] = useState(false);
    const [error, setError] = useState(null);
    const serverRef = useRef(null);
    const theme = getTheme(themeName);
    const dataService = getDataService();
    // Start proxy server on mount
    useEffect(() => {
        let mounted = true;
        const initProxy = async () => {
            try {
                const { server } = await startProxy(port);
                if (mounted) {
                    serverRef.current = server;
                    setProxyStarted(true);
                }
            }
            catch (err) {
                if (mounted) {
                    setError(`Failed to start proxy: ${err.message}`);
                }
            }
        };
        initProxy();
        // Cleanup on unmount
        return () => {
            mounted = false;
            if (serverRef.current) {
                serverRef.current.stop();
            }
            closeStorageAdapter();
        };
    }, [port]);
    // Fetch real data periodically
    useEffect(() => {
        if (!proxyStarted)
            return;
        const fetchData = () => {
            try {
                const data = dataService.getDashboardData();
                setUsage(data.usage);
                setPrediction(data.prediction);
                setRouting(data.routing);
            }
            catch (err) {
                console.error('Failed to fetch data:', err);
            }
        };
        // Initial fetch
        fetchData();
        // Poll every 2 seconds
        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, [proxyStarted, dataService]);
    // Calculate session duration
    const sessionDuration = (() => {
        const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    })();
    // Handle startup animation completion
    const handleStartupComplete = () => {
        setPhase('dashboard');
    };
    // Show error if proxy failed to start
    if (error) {
        return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsxs(Text, { color: "red", children: ["Error: ", error] }), _jsx(Text, { color: "gray", children: "Press Ctrl+C to exit" })] }));
    }
    // Show loading while proxy is starting
    if (!proxyStarted && phase === 'dashboard') {
        return (_jsx(Box, { flexDirection: "column", padding: 1, children: _jsx(Text, { color: theme.colors.textMuted, children: "Starting proxy server..." }) }));
    }
    // Compact status view
    if (compact || command === 'status') {
        return (_jsx(StatusIndicator, { status: proxyStarted ? 'active' : 'idle', usage: Math.round(prediction.usagePercent), timeLeft: `${Math.floor(prediction.minutesUntilLimit / 60)}h ${prediction.minutesUntilLimit % 60}m`, cost: `$${usage.sessionCost.toFixed(2)}`, theme: theme }));
    }
    // Full dashboard
    return (_jsx(Box, { flexDirection: "column", children: phase === 'startup' ? (_jsx(StartupAnimation, { onComplete: handleStartupComplete, theme: theme, proxyReady: proxyStarted })) : (_jsx(Dashboard, { usage: usage, prediction: prediction, routing: routing, sessionDuration: sessionDuration, theme: theme })) }));
};
// ═══════════════════════════════════════════════════════════════════════════
// Entry Point
// ═══════════════════════════════════════════════════════════════════════════
const command = cli.input[0] || 'start';
const themeName = cli.flags.theme || 'claude';
// Detect VSCode terminal and auto-switch theme if not specified
const isVSCodeTerminal = process.env.TERM_PROGRAM === 'vscode';
const effectiveTheme = cli.flags.theme === 'claude' && isVSCodeTerminal ? 'vscode-dark' : themeName;
console.clear();
render(_jsx(App, { command: command, theme: effectiveTheme, compact: cli.flags.compact, port: cli.flags.port }));
//# sourceMappingURL=index.js.map