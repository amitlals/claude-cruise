import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * ASCII Logo Animation for Claude Code Autopilot
 *
 * Features:
 * - Animated gradient text
 * - Typing effect for tagline
 * - Pulse animation for status indicator
 * - Works in both terminal and VSCode integrated terminal
 */
import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Gradient from 'ink-gradient';
import { claudeTheme } from '../themes/index.js';
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
export const Logo = ({ variant = 'full', animate = true, showTagline = true, showVersion = true, theme = claudeTheme, }) => {
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
            }
            else {
                clearInterval(timer);
            }
        }, 50);
        return () => clearInterval(timer);
    }, [showTagline, animate]);
    // Pulse animation
    useEffect(() => {
        if (!animate)
            return;
        const timer = setInterval(() => {
            setPulseFrame((prev) => (prev + 1) % PULSE_FRAMES.length);
        }, 300);
        return () => clearInterval(timer);
    }, [animate]);
    if (!visible && animate) {
        return null;
    }
    const logoText = variant === 'icon' ? LOGO_ICON : LOGO_FRAMES[variant];
    return (_jsxs(Box, { flexDirection: "column", alignItems: "center", children: [_jsx(Gradient, { colors: theme.gradients.logo, children: _jsx(Text, { children: logoText }) }), variant === 'full' && (_jsx(Box, { marginTop: -1, children: _jsxs(Text, { color: theme.colors.textMuted, children: ['─'.repeat(20), " Claude Code ", '─'.repeat(20)] }) })), showTagline && variant !== 'mini' && variant !== 'icon' && (_jsxs(Box, { marginTop: 1, children: [_jsxs(Text, { color: theme.colors.primary, children: [PULSE_FRAMES[pulseFrame], ' '] }), _jsxs(Text, { color: theme.colors.text, italic: true, children: [taglineText, _jsx(Text, { color: theme.colors.textMuted, children: animate ? '▌' : '' })] })] })), showVersion && variant === 'full' && (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.colors.textSubtle, children: "v0.1.0" }) }))] }));
};
export const StartupAnimation = ({ onComplete, theme = claudeTheme, proxyReady = false, }) => {
    const [phase, setPhase] = useState('logo');
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
        if (phase !== 'connecting')
            return;
        const timer = setInterval(() => {
            setLoadingFrame((prev) => (prev + 1) % LOADING_FRAMES.length);
            setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
        }, 100);
        return () => clearInterval(timer);
    }, [phase]);
    return (_jsxs(Box, { flexDirection: "column", alignItems: "center", padding: 2, children: [_jsx(Logo, { variant: "full", animate: phase === 'logo', showTagline: phase !== 'logo', theme: theme }), phase === 'connecting' && (_jsx(Box, { marginTop: 2, children: _jsxs(Text, { color: theme.colors.info, children: [LOADING_FRAMES[loadingFrame], " Connecting to Claude Code", dots] }) })), phase === 'ready' && (_jsx(Box, { marginTop: 2, children: _jsx(Text, { color: theme.colors.success, children: "\u2713 Ready" }) }))] }));
};
export const StatusIndicator = ({ status, usage, timeLeft, cost, theme = claudeTheme, }) => {
    const [pulseFrame, setPulseFrame] = useState(0);
    useEffect(() => {
        if (status !== 'active')
            return;
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
    return (_jsxs(Box, { children: [_jsx(Text, { color: statusColors[status], children: statusIcons[status] }), _jsx(Text, { color: theme.colors.primary, children: " \u26A1 " }), usage !== undefined && (_jsxs(Text, { color: usage > 80 ? theme.colors.warning : theme.colors.text, children: [usage, "%"] })), timeLeft && (_jsxs(_Fragment, { children: [_jsx(Text, { color: theme.colors.textMuted, children: " \u2502 " }), _jsx(Text, { color: theme.colors.text, children: timeLeft })] })), cost && (_jsxs(_Fragment, { children: [_jsx(Text, { color: theme.colors.textMuted, children: " \u2502 " }), _jsx(Text, { color: theme.colors.cost, children: cost })] }))] }));
};
export const ModelBadge = ({ model, showFull = false, theme = claudeTheme, }) => {
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
    return (_jsxs(Text, { color: config.color, children: [config.icon, " ", showFull ? config.name : config.short] }));
};
export default Logo;
//# sourceMappingURL=Logo.js.map