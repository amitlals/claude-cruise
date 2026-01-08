/**
 * ASCII Logo Animation for Claude Code Autopilot
 * 
 * Features:
 * - Animated gradient text
 * - Typing effect for tagline
 * - Pulse animation for status indicator
 * - Works in both terminal and VSCode integrated terminal
 */

import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Gradient from 'ink-gradient';
import { claudeTheme, type Theme } from '../themes/index.js';

// ASCII Art Logo - Claude Cruise
const LOGO_FRAMES = {
  full: `
   ██████╗██████╗ ██╗   ██╗██╗███████╗███████╗
  ██╔════╝██╔══██╗██║   ██║██║██╔════╝██╔════╝
  ██║     ██████╔╝██║   ██║██║███████╗█████╗  
  ██║     ██╔══██╗██║   ██║██║╚════██║██╔══╝  
  ╚██████╗██║  ██║╚██████╔╝██║███████║███████╗
   ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝╚══════╝╚══════╝
`,
  compact: `
  ╔═╗╦═╗╦ ╦╦╔═╗╔═╗
  ║  ╠╦╝║ ║║╚═╗║╣ 
  ╚═╝╩╚═╚═╝╩╚═╝╚═╝
`,
  mini: `⚡ CRUISE`,
};

// Minimal "A" logo for status bar
const LOGO_ICON = `
  ╭─────╮
  │  ⚡  │
  ╰─────╯
`;

// Animation frames for loading
const LOADING_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const PULSE_FRAMES = ['●', '◉', '○', '◉'];

interface LogoProps {
  variant?: 'full' | 'compact' | 'mini' | 'icon';
  animate?: boolean;
  showTagline?: boolean;
  showVersion?: boolean;
  theme?: Theme;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  animate = true,
  showTagline = true,
  showVersion = true,
  theme = claudeTheme,
}) => {
  const [visible, setVisible] = useState(!animate);
  const [taglineText, setTaglineText] = useState('');
  const [pulseFrame, setPulseFrame] = useState(0);
  
  const tagline = 'Never hit a rate limit again.';
  
  // Fade in animation
  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [animate]);
  
  // Typing effect for tagline
  useEffect(() => {
    if (!showTagline || !animate) {
      setTaglineText(tagline);
      return;
    }
    
    let index = 0;
    const timer = setInterval(() => {
      if (index <= tagline.length) {
        setTaglineText(tagline.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 50);
    
    return () => clearInterval(timer);
  }, [showTagline, animate]);
  
  // Pulse animation
  useEffect(() => {
    if (!animate) return;
    
    const timer = setInterval(() => {
      setPulseFrame((prev) => (prev + 1) % PULSE_FRAMES.length);
    }, 300);
    
    return () => clearInterval(timer);
  }, [animate]);
  
  if (!visible && animate) {
    return null;
  }
  
  const logoText = variant === 'icon' ? LOGO_ICON : LOGO_FRAMES[variant];
  
  return (
    <Box flexDirection="column" alignItems="center">
      {/* Main Logo with Gradient */}
      <Gradient colors={theme.gradients.logo}>
        <Text>{logoText}</Text>
      </Gradient>
      
      {/* Subtitle line */}
      {variant === 'full' && (
        <Box marginTop={-1}>
          <Text color={theme.colors.textMuted}>
            {'─'.repeat(20)} Claude Code {'─'.repeat(20)}
          </Text>
        </Box>
      )}
      
      {/* Tagline with typing effect */}
      {showTagline && variant !== 'mini' && variant !== 'icon' && (
        <Box marginTop={1}>
          <Text color={theme.colors.primary}>
            {PULSE_FRAMES[pulseFrame]}{' '}
          </Text>
          <Text color={theme.colors.text} italic>
            {taglineText}
            <Text color={theme.colors.textMuted}>
              {animate ? '▌' : ''}
            </Text>
          </Text>
        </Box>
      )}
      
      {/* Version */}
      {showVersion && variant === 'full' && (
        <Box marginTop={1}>
          <Text color={theme.colors.textSubtle}>v0.1.0</Text>
        </Box>
      )}
    </Box>
  );
};

/**
 * Animated startup sequence
 */
interface StartupAnimationProps {
  onComplete?: () => void;
  theme?: Theme;
  proxyReady?: boolean;
}

export const StartupAnimation: React.FC<StartupAnimationProps> = ({
  onComplete,
  theme = claudeTheme,
  proxyReady = false,
}) => {
  const [phase, setPhase] = useState<'logo' | 'connecting' | 'ready'>('logo');
  const [loadingFrame, setLoadingFrame] = useState(0);
  const [dots, setDots] = useState('');
  
  // Progress through phases - now respects proxyReady
  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('connecting'), 500);
    
    return () => clearTimeout(timer1);
  }, []);
  
  // Transition to ready when proxy is actually ready
  useEffect(() => {
    if (proxyReady && phase === 'connecting') {
      setPhase('ready');
      const timer = setTimeout(() => onComplete?.(), 500);
      return () => clearTimeout(timer);
    }
  }, [proxyReady, phase, onComplete]);
  
  // Loading spinner
  useEffect(() => {
    if (phase !== 'connecting') return;
    
    const timer = setInterval(() => {
      setLoadingFrame((prev) => (prev + 1) % LOADING_FRAMES.length);
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 100);
    
    return () => clearInterval(timer);
  }, [phase]);
  
  return (
    <Box flexDirection="column" alignItems="center" padding={2}>
      <Logo 
        variant="full" 
        animate={phase === 'logo'}
        showTagline={phase !== 'logo'}
        theme={theme}
      />
      
      {phase === 'connecting' && (
        <Box marginTop={2}>
          <Text color={theme.colors.info}>
            {LOADING_FRAMES[loadingFrame]} Connecting to Claude Code{dots}
          </Text>
        </Box>
      )}
      
      {phase === 'ready' && (
        <Box marginTop={2}>
          <Text color={theme.colors.success}>
            ✓ Ready
          </Text>
        </Box>
      )}
    </Box>
  );
};

/**
 * Compact status indicator for tmux/status bars
 */
interface StatusIndicatorProps {
  status: 'active' | 'idle' | 'warning' | 'error';
  usage?: number;
  timeLeft?: string;
  cost?: string;
  theme?: Theme;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  usage,
  timeLeft,
  cost,
  theme = claudeTheme,
}) => {
  const [pulseFrame, setPulseFrame] = useState(0);
  
  useEffect(() => {
    if (status !== 'active') return;
    
    const timer = setInterval(() => {
      setPulseFrame((prev) => (prev + 1) % PULSE_FRAMES.length);
    }, 500);
    
    return () => clearInterval(timer);
  }, [status]);
  
  const statusColors = {
    active: theme.colors.success,
    idle: theme.colors.textMuted,
    warning: theme.colors.warning,
    error: theme.colors.error,
  };
  
  const statusIcons = {
    active: PULSE_FRAMES[pulseFrame],
    idle: '○',
    warning: '⚠',
    error: '✗',
  };
  
  return (
    <Box>
      <Text color={statusColors[status]}>
        {statusIcons[status]}
      </Text>
      <Text color={theme.colors.primary}> ⚡ </Text>
      {usage !== undefined && (
        <Text color={usage > 80 ? theme.colors.warning : theme.colors.text}>
          {usage}%
        </Text>
      )}
      {timeLeft && (
        <>
          <Text color={theme.colors.textMuted}> │ </Text>
          <Text color={theme.colors.text}>{timeLeft}</Text>
        </>
      )}
      {cost && (
        <>
          <Text color={theme.colors.textMuted}> │ </Text>
          <Text color={theme.colors.cost}>{cost}</Text>
        </>
      )}
    </Box>
  );
};

/**
 * Model badge with color coding
 */
interface ModelBadgeProps {
  model: 'sonnet' | 'haiku' | 'opus' | 'local' | 'openrouter';
  showFull?: boolean;
  theme?: Theme;
}

export const ModelBadge: React.FC<ModelBadgeProps> = ({
  model,
  showFull = false,
  theme = claudeTheme,
}) => {
  const modelConfig = {
    sonnet: { 
      color: theme.colors.modelSonnet, 
      icon: '◆', 
      name: 'Claude Sonnet 4',
      short: 'Sonnet',
    },
    haiku: { 
      color: theme.colors.modelHaiku, 
      icon: '◇', 
      name: 'Claude Haiku 3.5',
      short: 'Haiku',
    },
    opus: { 
      color: theme.colors.modelOpus, 
      icon: '◈', 
      name: 'Claude Opus 4',
      short: 'Opus',
    },
    local: { 
      color: theme.colors.modelLocal, 
      icon: '●', 
      name: 'Local (Ollama)',
      short: 'Local',
    },
    openrouter: { 
      color: theme.colors.modelOpenRouter, 
      icon: '◎', 
      name: 'OpenRouter',
      short: 'OR',
    },
  };
  
  const config = modelConfig[model];
  
  return (
    <Text color={config.color}>
      {config.icon} {showFull ? config.name : config.short}
    </Text>
  );
};

export default Logo;
