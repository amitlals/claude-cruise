/**
 * Main Dashboard Component
 * 
 * Full-featured terminal UI for Claude Code Autopilot
 * Works in standard terminal and VSCode integrated terminal
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import Gradient from 'ink-gradient';
import { claudeTheme, type Theme } from '../themes/index.js';
import { Logo, StatusIndicator, ModelBadge } from '../animations/Logo.js';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

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
  velocity: number; // tokens per hour
  confidence: number;
  trend: number[]; // sparkline data
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

// ═══════════════════════════════════════════════════════════════════════════
// Utility Components
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Box with styled border
 */
interface PanelProps {
  title: string;
  icon?: string;
  width?: number | string;
  height?: number;
  children: React.ReactNode;
  theme?: Theme;
}

const Panel: React.FC<PanelProps> = ({
  title,
  icon = '',
  width,
  height,
  children,
  theme = claudeTheme,
}) => {
  return (
    <Box
      flexDirection="column"
      width={width}
      height={height}
      borderStyle="round"
      borderColor={theme.colors.border}
      paddingX={1}
    >
      <Box marginBottom={1}>
        <Text color={theme.colors.primary} bold>
          {icon} {title}
        </Text>
      </Box>
      {children}
    </Box>
  );
};

/**
 * Progress bar with gradient colors
 */
interface ProgressBarProps {
  percent: number;
  width?: number;
  showLabel?: boolean;
  theme?: Theme;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  percent,
  width = 20,
  showLabel = true,
  theme = claudeTheme,
}) => {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  
  // Color based on percentage
  let color = theme.colors.success;
  if (percent > 70) color = theme.colors.warning;
  if (percent > 90) color = theme.colors.error;
  
  return (
    <Box>
      <Text color={color}>
        {'█'.repeat(filled)}
      </Text>
      <Text color={theme.colors.bgHighlight}>
        {'░'.repeat(empty)}
      </Text>
      {showLabel && (
        <Text color={theme.colors.textMuted}>
          {' '}{percent.toFixed(0)}%
        </Text>
      )}
    </Box>
  );
};

/**
 * Sparkline chart for velocity/trends
 */
interface SparklineProps {
  data: number[];
  width?: number;
  theme?: Theme;
}

const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 12,
  theme = claudeTheme,
}) => {
  const chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  // Normalize and take last `width` points
  const normalized = data.slice(-width).map((val) => {
    const index = Math.floor(((val - min) / range) * (chars.length - 1));
    return chars[index];
  });
  
  return (
    <Text color={theme.colors.velocity}>
      {normalized.join('')}
    </Text>
  );
};

/**
 * Routing cascade visualization
 */
interface RoutingCascadeProps {
  current: string;
  cascade: Array<{ model: string; threshold: string; active: boolean }>;
  theme?: Theme;
}

const RoutingCascade: React.FC<RoutingCascadeProps> = ({
  current,
  cascade,
  theme = claudeTheme,
}) => {
  return (
    <Box>
      {cascade.map((item, index) => (
        <React.Fragment key={item.model}>
          <Box
            borderStyle="round"
            borderColor={item.active ? theme.colors.primary : theme.colors.borderMuted}
            paddingX={1}
          >
            <Box flexDirection="column" alignItems="center">
              <Text color={item.active ? theme.colors.primary : theme.colors.textMuted}>
                {item.model}
              </Text>
              <Text color={theme.colors.textSubtle} dimColor>
                {item.active ? '●' : '○'} {item.threshold}
              </Text>
            </Box>
          </Box>
          {index < cascade.length - 1 && (
            <Text color={theme.colors.textMuted}> ─▶ </Text>
          )}
        </React.Fragment>
      ))}
    </Box>
  );
};

/**
 * Format number with K/M suffix
 */
function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
  return num.toString();
}

/**
 * Format currency
 */
function formatCost(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Format time remaining
 */
function formatTimeLeft(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Dashboard
// ═══════════════════════════════════════════════════════════════════════════

export const Dashboard: React.FC<DashboardProps> = ({
  usage,
  prediction,
  routing,
  sessionDuration,
  theme = claudeTheme,
}) => {
  const { exit } = useApp();
  const [showHelp, setShowHelp] = useState(false);
  
  // Keyboard shortcuts
  useInput((input, key) => {
    if (input === 'q') exit();
    if (input === '?') setShowHelp(!showHelp);
    if (input === 'h') setShowHelp(!showHelp);
  });
  
  // Routing cascade data
  const cascadeData = [
    { model: 'Sonnet', threshold: '0-70%', active: routing.currentModel === 'sonnet' },
    { model: 'Haiku', threshold: '70-85%', active: routing.currentModel === 'haiku' },
    { model: 'OpenRouter', threshold: '85-95%', active: routing.currentModel === 'openrouter' },
    { model: 'Local', threshold: '95%+', active: routing.currentModel === 'local' },
  ];

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box justifyContent="space-between" marginBottom={1}>
        <Gradient colors={theme.gradients.logo}>
          <Text bold>⚡ CRUISE</Text>
        </Gradient>
        <Text color={theme.colors.textMuted}>v0.1.0</Text>
      </Box>
      
      {/* Top Row: Status + Prediction */}
      <Box marginBottom={1}>
        {/* Status Panel */}
        <Panel title="STATUS" icon="🎯" width={32} theme={theme}>
          <Box flexDirection="column">
            <Box>
              <Text color={theme.colors.success}>● </Text>
              <Text color={theme.colors.text}>ACTIVE</Text>
            </Box>
            <Box marginTop={1}>
              <Text color={theme.colors.textMuted}>Model: </Text>
              <ModelBadge model={routing.currentModel} showFull theme={theme} />
            </Box>
            <Box>
              <Text color={theme.colors.textMuted}>Session: </Text>
              <Text color={theme.colors.text}>{sessionDuration}</Text>
            </Box>
            <Box marginTop={1}>
              <Text color={theme.colors.textMuted}>↑ </Text>
              <Text color={theme.colors.text}>{formatNumber(usage.inputTokens)} in</Text>
            </Box>
            <Box>
              <Text color={theme.colors.textMuted}>↓ </Text>
              <Text color={theme.colors.text}>{formatNumber(usage.outputTokens)} out</Text>
            </Box>
          </Box>
        </Panel>
        
        <Box width={1} />
        
        {/* Prediction Panel */}
        <Panel title="PREDICTION" icon="🔮" width={40} theme={theme}>
          <Box flexDirection="column">
            <Box>
              <Text color={theme.colors.textMuted}>Time until limit</Text>
            </Box>
            <Box marginY={1}>
              <ProgressBar 
                percent={prediction.usagePercent} 
                width={24} 
                theme={theme}
              />
              <Text color={theme.colors.text}>
                {' '}{formatTimeLeft(prediction.minutesUntilLimit)}
              </Text>
            </Box>
            <Box>
              <Text color={theme.colors.textMuted}>Velocity </Text>
              <Sparkline data={prediction.trend} theme={theme} />
              <Text color={theme.colors.text}> {formatNumber(prediction.velocity)}/hr</Text>
            </Box>
            <Box>
              <Text color={theme.colors.textMuted}>Confidence </Text>
              <ProgressBar 
                percent={prediction.confidence} 
                width={10} 
                showLabel 
                theme={theme}
              />
            </Box>
            {routing.nextSwitch && (
              <Box marginTop={1}>
                <Text color={theme.colors.warning}>
                  ⚡ Auto-switch to {routing.nextSwitch.model} in ~{routing.nextSwitch.estimatedMinutes}m
                </Text>
              </Box>
            )}
          </Box>
        </Panel>
      </Box>
      
      {/* Middle Row: Cost + Today's Usage */}
      <Box marginBottom={1}>
        {/* Cost Panel */}
        <Panel title="COST" icon="💰" width={32} theme={theme}>
          <Box flexDirection="column">
            <Box justifyContent="space-between" width={28}>
              <Text color={theme.colors.textMuted}>Session</Text>
              <Text color={theme.colors.cost}>{formatCost(usage.sessionCost)}</Text>
            </Box>
            <Box justifyContent="space-between" width={28}>
              <Text color={theme.colors.textMuted}>Today</Text>
              <Text color={theme.colors.cost}>{formatCost(usage.todayCost)}</Text>
            </Box>
            <Box justifyContent="space-between" width={28}>
              <Text color={theme.colors.textMuted}>This Week</Text>
              <Text color={theme.colors.cost}>{formatCost(usage.weekCost)}</Text>
            </Box>
            <Box marginTop={1} justifyContent="space-between" width={28}>
              <Text color={theme.colors.savings}>💚 Saved</Text>
              <Text color={theme.colors.savings}>{formatCost(usage.savedByRouting)}</Text>
            </Box>
          </Box>
        </Panel>
        
        <Box width={1} />
        
        {/* Usage Chart Panel */}
        <Panel title="TODAY'S USAGE" icon="📊" width={40} theme={theme}>
          <Box flexDirection="column">
            <Box>
              <ProgressBar 
                percent={prediction.usagePercent} 
                width={30} 
                showLabel 
                theme={theme}
              />
            </Box>
            <Box marginTop={1} flexDirection="column">
              <Text color={theme.colors.textMuted}>
                08:00 <Sparkline data={[10, 15, 20]} width={3} theme={theme} />
              </Text>
              <Text color={theme.colors.textMuted}>
                10:00 <Sparkline data={[25, 40, 55, 60]} width={4} theme={theme} />
              </Text>
              <Text color={theme.colors.textMuted}>
                12:00 <Sparkline data={[60, 70, 65, 55, 45, 35, 25]} width={7} theme={theme} />
              </Text>
              <Text color={theme.colors.text}>
                14:00 <Sparkline data={[25, 35, 50, 65, 75, 85]} width={6} theme={theme} />
                <Text color={theme.colors.primary}> ← Now</Text>
              </Text>
            </Box>
          </Box>
        </Panel>
      </Box>
      
      {/* Routing Panel */}
      <Panel title="ACTIVE ROUTING" icon="🔄" theme={theme}>
        <Box flexDirection="column">
          <RoutingCascade 
            current={routing.currentModel} 
            cascade={cascadeData}
            theme={theme}
          />
          <Box marginTop={1}>
            <Text color={theme.colors.textMuted}>
              Current: <Text color={theme.colors.text}>{routing.currentModel.charAt(0).toUpperCase() + routing.currentModel.slice(1)}</Text>
              {' │ '}
              Next trigger: <Text color={theme.colors.warning}>70%</Text>
              {routing.nextSwitch && (
                <Text color={theme.colors.textMuted}> (in ~{routing.nextSwitch.estimatedMinutes} min)</Text>
              )}
            </Text>
          </Box>
        </Box>
      </Panel>
      
      {/* Footer */}
      <Box marginTop={1} justifyContent="space-between">
        <Text color={theme.colors.textSubtle}>
          [Q]uit  [R]efresh  [S]ettings  [H]istory  [E]xport
        </Text>
        <Text color={theme.colors.primary}>
          ⚡ Auto-mode: <Text color={routing.mode === 'full-auto' ? theme.colors.success : theme.colors.warning}>
            {routing.mode.toUpperCase()}
          </Text>
        </Text>
      </Box>
      
      {/* Help overlay */}
      {showHelp && (
        <Box 
          position="absolute"
          flexDirection="column"
          borderStyle="round"
          borderColor={theme.colors.primary}
          padding={2}
          marginTop={5}
          marginLeft={10}
        >
          <Text color={theme.colors.primary} bold>Keyboard Shortcuts</Text>
          <Box marginTop={1} flexDirection="column">
            <Text color={theme.colors.text}>q - Quit</Text>
            <Text color={theme.colors.text}>r - Refresh data</Text>
            <Text color={theme.colors.text}>s - Settings</Text>
            <Text color={theme.colors.text}>h - History view</Text>
            <Text color={theme.colors.text}>e - Export report</Text>
            <Text color={theme.colors.text}>? - Toggle help</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;
