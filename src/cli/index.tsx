#!/usr/bin/env node
/**
 * Claude Cruise - CLI Entry Point
 *
 * Usage:
 *   npx claude-cruise        # Start proxy + dashboard
 *   npx claude-cruise start  # Same as above
 *   npx claude-cruise status # Show compact status
 *   npx claude-cruise report # Generate usage report
 */

import React, { useState, useEffect, useRef } from 'react';
import { render, Box, Text, useApp } from 'ink';
import meow from 'meow';
import { Logo, StartupAnimation, StatusIndicator } from '../ui/animations/Logo.js';
import { Dashboard } from '../ui/components/Dashboard.js';
import {
  claudeTheme,
  vscodeDarkTheme,
  catppuccinTheme,
  getTheme,
  type ThemeName,
} from '../ui/themes/index.js';
import { startProxy } from '../proxy/server.js';
import {
  getDataService,
  type UsageData,
  type PredictionData,
  type RoutingConfig,
} from '../services/data-service.js';
import { closeStorageAdapter } from '../storage/database.js';

// ═══════════════════════════════════════════════════════════════════════════
// CLI Definition
// ═══════════════════════════════════════════════════════════════════════════

const cli = meow(
  `
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
`,
  {
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
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// Default Data (used before first data fetch)
// ═══════════════════════════════════════════════════════════════════════════

const defaultUsageData: UsageData = {
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

const defaultPredictionData: PredictionData = {
  usagePercent: 0,
  minutesUntilLimit: 999,
  velocity: 0,
  confidence: 0,
  trend: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

const defaultRoutingConfig: RoutingConfig = {
  currentModel: 'sonnet',
  nextSwitch: null,
  mode: 'semi-auto',
};

// ═══════════════════════════════════════════════════════════════════════════
// Main App Component
// ═══════════════════════════════════════════════════════════════════════════

interface AppProps {
  command: string;
  theme: ThemeName;
  compact: boolean;
  port: number;
}

const App: React.FC<AppProps> = ({ command, theme: themeName, compact, port }) => {
  const { exit } = useApp();
  const [phase, setPhase] = useState<'startup' | 'dashboard'>('startup');
  const [usage, setUsage] = useState<UsageData>(defaultUsageData);
  const [prediction, setPrediction] = useState<PredictionData>(defaultPredictionData);
  const [routing, setRouting] = useState<RoutingConfig>(defaultRoutingConfig);
  const [sessionStart] = useState(Date.now());
  const [proxyStarted, setProxyStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serverRef = useRef<any>(null);
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
      } catch (err: any) {
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
    if (!proxyStarted) return;

    const fetchData = () => {
      try {
        const data = dataService.getDashboardData();
        setUsage(data.usage);
        setPrediction(data.prediction);
        setRouting(data.routing);
      } catch (err) {
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
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="red">Error: {error}</Text>
        <Text color="gray">Press Ctrl+C to exit</Text>
      </Box>
    );
  }

  // Show loading while proxy is starting
  if (!proxyStarted && phase === 'dashboard') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color={theme.colors.textMuted}>Starting proxy server...</Text>
      </Box>
    );
  }

  // Compact status view
  if (compact || command === 'status') {
    return (
      <StatusIndicator
        status={proxyStarted ? 'active' : 'idle'}
        usage={Math.round(prediction.usagePercent)}
        timeLeft={`${Math.floor(prediction.minutesUntilLimit / 60)}h ${prediction.minutesUntilLimit % 60}m`}
        cost={`$${usage.sessionCost.toFixed(2)}`}
        theme={theme}
      />
    );
  }

  // Full dashboard
  return (
    <Box flexDirection="column">
      {phase === 'startup' ? (
        <StartupAnimation 
          onComplete={handleStartupComplete} 
          theme={theme} 
          proxyReady={proxyStarted}
        />
      ) : (
        <Dashboard
          usage={usage}
          prediction={prediction}
          routing={routing}
          sessionDuration={sessionDuration}
          theme={theme}
        />
      )}
    </Box>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Entry Point
// ═══════════════════════════════════════════════════════════════════════════

const command = cli.input[0] || 'start';
const themeName = (cli.flags.theme as ThemeName) || 'claude';

// Detect VSCode terminal and auto-switch theme if not specified
const isVSCodeTerminal = process.env.TERM_PROGRAM === 'vscode';
const effectiveTheme =
  cli.flags.theme === 'claude' && isVSCodeTerminal ? 'vscode-dark' : themeName;

console.clear();

render(
  <App
    command={command}
    theme={effectiveTheme}
    compact={cli.flags.compact}
    port={cli.flags.port}
  />
);
