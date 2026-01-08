/**
 * ASCII Logo Animation for Claude Code Autopilot
 *
 * Features:
 * - Animated gradient text
 * - Typing effect for tagline
 * - Pulse animation for status indicator
 * - Works in both terminal and VSCode integrated terminal
 */
import React from 'react';
import { type Theme } from '../themes/index.js';
interface LogoProps {
    variant?: 'full' | 'compact' | 'mini' | 'icon';
    animate?: boolean;
    showTagline?: boolean;
    showVersion?: boolean;
    theme?: Theme;
}
export declare const Logo: React.FC<LogoProps>;
/**
 * Animated startup sequence
 */
interface StartupAnimationProps {
    onComplete?: () => void;
    theme?: Theme;
    proxyReady?: boolean;
}
export declare const StartupAnimation: React.FC<StartupAnimationProps>;
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
export declare const StatusIndicator: React.FC<StatusIndicatorProps>;
/**
 * Model badge with color coding
 */
interface ModelBadgeProps {
    model: 'sonnet' | 'haiku' | 'opus' | 'local' | 'openrouter';
    showFull?: boolean;
    theme?: Theme;
}
export declare const ModelBadge: React.FC<ModelBadgeProps>;
export default Logo;
//# sourceMappingURL=Logo.d.ts.map