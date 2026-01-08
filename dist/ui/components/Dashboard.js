import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
/**
 * Main Dashboard Component
 *
 * Full-featured terminal UI for Claude Code Autopilot
 * Works in standard terminal and VSCode integrated terminal
 */
import React, { useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import Gradient from 'ink-gradient';
import { claudeTheme } from '../themes/index.js';
import { ModelBadge } from '../animations/Logo.js';
const Panel = ({ title, icon = '', width, height, children, theme = claudeTheme, }) => {
    return (_jsxs(Box, { flexDirection: "column", width: width, height: height, borderStyle: "round", borderColor: theme.colors.border, paddingX: 1, children: [_jsx(Box, { marginBottom: 1, children: _jsxs(Text, { color: theme.colors.primary, bold: true, children: [icon, " ", title] }) }), children] }));
};
const ProgressBar = ({ percent, width = 20, showLabel = true, theme = claudeTheme, }) => {
    const filled = Math.round((percent / 100) * width);
    const empty = width - filled;
    // Color based on percentage
    let color = theme.colors.success;
    if (percent > 70)
        color = theme.colors.warning;
    if (percent > 90)
        color = theme.colors.error;
    return (_jsxs(Box, { children: [_jsx(Text, { color: color, children: '█'.repeat(filled) }), _jsx(Text, { color: theme.colors.bgHighlight, children: '░'.repeat(empty) }), showLabel && (_jsxs(Text, { color: theme.colors.textMuted, children: [' ', percent.toFixed(0), "%"] }))] }));
};
const Sparkline = ({ data, width = 12, theme = claudeTheme, }) => {
    const chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    // Normalize and take last `width` points
    const normalized = data.slice(-width).map((val) => {
        const index = Math.floor(((val - min) / range) * (chars.length - 1));
        return chars[index];
    });
    return (_jsx(Text, { color: theme.colors.velocity, children: normalized.join('') }));
};
const RoutingCascade = ({ current, cascade, theme = claudeTheme, }) => {
    return (_jsx(Box, { children: cascade.map((item, index) => (_jsxs(React.Fragment, { children: [_jsx(Box, { borderStyle: "round", borderColor: item.active ? theme.colors.primary : theme.colors.borderMuted, paddingX: 1, children: _jsxs(Box, { flexDirection: "column", alignItems: "center", children: [_jsx(Text, { color: item.active ? theme.colors.primary : theme.colors.textMuted, children: item.model }), _jsxs(Text, { color: theme.colors.textSubtle, dimColor: true, children: [item.active ? '●' : '○', " ", item.threshold] })] }) }), index < cascade.length - 1 && (_jsx(Text, { color: theme.colors.textMuted, children: " \u2500\u25B6 " }))] }, item.model))) }));
};
/**
 * Format number with K/M suffix
 */
function formatNumber(num) {
    if (num >= 1_000_000)
        return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000)
        return `${(num / 1_000).toFixed(0)}K`;
    return num.toString();
}
/**
 * Format currency
 */
function formatCost(amount) {
    return `$${amount.toFixed(2)}`;
}
/**
 * Format time remaining
 */
function formatTimeLeft(minutes) {
    if (minutes < 60)
        return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}
// ═══════════════════════════════════════════════════════════════════════════
// Main Dashboard
// ═══════════════════════════════════════════════════════════════════════════
export const Dashboard = ({ usage, prediction, routing, sessionDuration, theme = claudeTheme, }) => {
    const { exit } = useApp();
    const [showHelp, setShowHelp] = useState(false);
    // Keyboard shortcuts
    useInput((input, key) => {
        if (input === 'q')
            exit();
        if (input === '?')
            setShowHelp(!showHelp);
        if (input === 'h')
            setShowHelp(!showHelp);
    });
    // Routing cascade data
    const cascadeData = [
        { model: 'Sonnet', threshold: '0-70%', active: routing.currentModel === 'sonnet' },
        { model: 'Haiku', threshold: '70-85%', active: routing.currentModel === 'haiku' },
        { model: 'OpenRouter', threshold: '85-95%', active: routing.currentModel === 'openrouter' },
        { model: 'Local', threshold: '95%+', active: routing.currentModel === 'local' },
    ];
    return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsxs(Box, { justifyContent: "space-between", marginBottom: 1, children: [_jsx(Gradient, { colors: theme.gradients.logo, children: _jsx(Text, { bold: true, children: "\u26A1 CRUISE" }) }), _jsx(Text, { color: theme.colors.textMuted, children: "v0.1.0" })] }), _jsxs(Box, { marginBottom: 1, children: [_jsx(Panel, { title: "STATUS", icon: "\uD83C\uDFAF", width: 32, theme: theme, children: _jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { children: [_jsx(Text, { color: theme.colors.success, children: "\u25CF " }), _jsx(Text, { color: theme.colors.text, children: "ACTIVE" })] }), _jsxs(Box, { marginTop: 1, children: [_jsx(Text, { color: theme.colors.textMuted, children: "Model: " }), _jsx(ModelBadge, { model: routing.currentModel, showFull: true, theme: theme })] }), _jsxs(Box, { children: [_jsx(Text, { color: theme.colors.textMuted, children: "Session: " }), _jsx(Text, { color: theme.colors.text, children: sessionDuration })] }), _jsxs(Box, { marginTop: 1, children: [_jsx(Text, { color: theme.colors.textMuted, children: "\u2191 " }), _jsxs(Text, { color: theme.colors.text, children: [formatNumber(usage.inputTokens), " in"] })] }), _jsxs(Box, { children: [_jsx(Text, { color: theme.colors.textMuted, children: "\u2193 " }), _jsxs(Text, { color: theme.colors.text, children: [formatNumber(usage.outputTokens), " out"] })] })] }) }), _jsx(Box, { width: 1 }), _jsx(Panel, { title: "PREDICTION", icon: "\uD83D\uDD2E", width: 40, theme: theme, children: _jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { children: _jsx(Text, { color: theme.colors.textMuted, children: "Time until limit" }) }), _jsxs(Box, { marginY: 1, children: [_jsx(ProgressBar, { percent: prediction.usagePercent, width: 24, theme: theme }), _jsxs(Text, { color: theme.colors.text, children: [' ', formatTimeLeft(prediction.minutesUntilLimit)] })] }), _jsxs(Box, { children: [_jsx(Text, { color: theme.colors.textMuted, children: "Velocity " }), _jsx(Sparkline, { data: prediction.trend, theme: theme }), _jsxs(Text, { color: theme.colors.text, children: [" ", formatNumber(prediction.velocity), "/hr"] })] }), _jsxs(Box, { children: [_jsx(Text, { color: theme.colors.textMuted, children: "Confidence " }), _jsx(ProgressBar, { percent: prediction.confidence, width: 10, showLabel: true, theme: theme })] }), routing.nextSwitch && (_jsx(Box, { marginTop: 1, children: _jsxs(Text, { color: theme.colors.warning, children: ["\u26A1 Auto-switch to ", routing.nextSwitch.model, " in ~", routing.nextSwitch.estimatedMinutes, "m"] }) }))] }) })] }), _jsxs(Box, { marginBottom: 1, children: [_jsx(Panel, { title: "COST", icon: "\uD83D\uDCB0", width: 32, theme: theme, children: _jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { justifyContent: "space-between", width: 28, children: [_jsx(Text, { color: theme.colors.textMuted, children: "Session" }), _jsx(Text, { color: theme.colors.cost, children: formatCost(usage.sessionCost) })] }), _jsxs(Box, { justifyContent: "space-between", width: 28, children: [_jsx(Text, { color: theme.colors.textMuted, children: "Today" }), _jsx(Text, { color: theme.colors.cost, children: formatCost(usage.todayCost) })] }), _jsxs(Box, { justifyContent: "space-between", width: 28, children: [_jsx(Text, { color: theme.colors.textMuted, children: "This Week" }), _jsx(Text, { color: theme.colors.cost, children: formatCost(usage.weekCost) })] }), _jsxs(Box, { marginTop: 1, justifyContent: "space-between", width: 28, children: [_jsx(Text, { color: theme.colors.savings, children: "\uD83D\uDC9A Saved" }), _jsx(Text, { color: theme.colors.savings, children: formatCost(usage.savedByRouting) })] })] }) }), _jsx(Box, { width: 1 }), _jsx(Panel, { title: "TODAY'S USAGE", icon: "\uD83D\uDCCA", width: 40, theme: theme, children: _jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { children: _jsx(ProgressBar, { percent: prediction.usagePercent, width: 30, showLabel: true, theme: theme }) }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsxs(Text, { color: theme.colors.textMuted, children: ["08:00 ", _jsx(Sparkline, { data: [10, 15, 20], width: 3, theme: theme })] }), _jsxs(Text, { color: theme.colors.textMuted, children: ["10:00 ", _jsx(Sparkline, { data: [25, 40, 55, 60], width: 4, theme: theme })] }), _jsxs(Text, { color: theme.colors.textMuted, children: ["12:00 ", _jsx(Sparkline, { data: [60, 70, 65, 55, 45, 35, 25], width: 7, theme: theme })] }), _jsxs(Text, { color: theme.colors.text, children: ["14:00 ", _jsx(Sparkline, { data: [25, 35, 50, 65, 75, 85], width: 6, theme: theme }), _jsx(Text, { color: theme.colors.primary, children: " \u2190 Now" })] })] })] }) })] }), _jsx(Panel, { title: "ACTIVE ROUTING", icon: "\uD83D\uDD04", theme: theme, children: _jsxs(Box, { flexDirection: "column", children: [_jsx(RoutingCascade, { current: routing.currentModel, cascade: cascadeData, theme: theme }), _jsx(Box, { marginTop: 1, children: _jsxs(Text, { color: theme.colors.textMuted, children: ["Current: ", _jsx(Text, { color: theme.colors.text, children: routing.currentModel.charAt(0).toUpperCase() + routing.currentModel.slice(1) }), ' │ ', "Next trigger: ", _jsx(Text, { color: theme.colors.warning, children: "70%" }), routing.nextSwitch && (_jsxs(Text, { color: theme.colors.textMuted, children: [" (in ~", routing.nextSwitch.estimatedMinutes, " min)"] }))] }) })] }) }), _jsxs(Box, { marginTop: 1, justifyContent: "space-between", children: [_jsx(Text, { color: theme.colors.textSubtle, children: "[Q]uit  [R]efresh  [S]ettings  [H]istory  [E]xport" }), _jsxs(Text, { color: theme.colors.primary, children: ["\u26A1 Auto-mode: ", _jsx(Text, { color: routing.mode === 'full-auto' ? theme.colors.success : theme.colors.warning, children: routing.mode.toUpperCase() })] })] }), showHelp && (_jsxs(Box, { position: "absolute", flexDirection: "column", borderStyle: "round", borderColor: theme.colors.primary, padding: 2, marginTop: 5, marginLeft: 10, children: [_jsx(Text, { color: theme.colors.primary, bold: true, children: "Keyboard Shortcuts" }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { color: theme.colors.text, children: "q - Quit" }), _jsx(Text, { color: theme.colors.text, children: "r - Refresh data" }), _jsx(Text, { color: theme.colors.text, children: "s - Settings" }), _jsx(Text, { color: theme.colors.text, children: "h - History view" }), _jsx(Text, { color: theme.colors.text, children: "e - Export report" }), _jsx(Text, { color: theme.colors.text, children: "? - Toggle help" })] })] }))] }));
};
export default Dashboard;
//# sourceMappingURL=Dashboard.js.map