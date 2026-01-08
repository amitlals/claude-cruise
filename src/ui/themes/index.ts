/**
 * Claude Cruise - Color Themes
 * 
 * Primary theme: Claude (Anthropic branded)
 * Also supports: VSCode Dark+, Catppuccin, Tokyo Night
 */

export interface Theme {
  name: string;
  colors: {
    // Brand
    primary: string;
    secondary: string;
    accent: string;
    
    // Status
    success: string;
    warning: string;
    error: string;
    info: string;
    
    // Background
    bg: string;
    bgSurface: string;
    bgOverlay: string;
    bgHighlight: string;
    
    // Text
    text: string;
    textMuted: string;
    textSubtle: string;
    
    // Borders
    border: string;
    borderMuted: string;
    
    // Special
    savings: string;
    cost: string;
    velocity: string;
    prediction: string;
    
    // Model indicators
    modelSonnet: string;
    modelHaiku: string;
    modelOpus: string;
    modelLocal: string;
    modelOpenRouter: string;
  };
  
  // Gradient definitions for ASCII art
  gradients: {
    logo: string[];
    progress: string[];
    savings: string[];
  };
}

/**
 * Claude Theme - Official Anthropic/Claude Code colors
 * Derived from Claude.ai and Claude Code VSCode extension
 */
export const claudeTheme: Theme = {
  name: 'claude',
  colors: {
    // Brand - Claude's coral/terracotta + cream palette
    primary: '#D97757',      // Claude coral/orange
    secondary: '#C96442',    // Darker coral
    accent: '#E8997A',       // Light coral
    
    // Status
    success: '#6BCB77',      // Green for savings/success
    warning: '#FFD93D',      // Warm yellow
    error: '#FF6B6B',        // Soft red
    info: '#4D96FF',         // Blue info
    
    // Background - Dark mode inspired by Claude Code VSCode
    bg: '#1A1A1E',           // Deep charcoal
    bgSurface: '#242428',    // Elevated surface
    bgOverlay: '#2E2E33',    // Overlay/modal bg
    bgHighlight: '#3A3A40',  // Highlighted areas
    
    // Text
    text: '#F5F5F5',         // Primary text (cream white)
    textMuted: '#A0A0A5',    // Secondary text
    textSubtle: '#6B6B70',   // Tertiary/disabled
    
    // Borders
    border: '#3A3A40',       // Default border
    borderMuted: '#2E2E33',  // Subtle border
    
    // Special - Functional colors
    savings: '#6BCB77',      // Money saved (green)
    cost: '#D97757',         // Cost display (coral)
    velocity: '#4D96FF',     // Velocity charts (blue)
    prediction: '#9D7CD8',   // Prediction UI (purple)
    
    // Model indicators
    modelSonnet: '#D97757',  // Sonnet - Primary coral
    modelHaiku: '#6BCB77',   // Haiku - Green (cheaper)
    modelOpus: '#9D7CD8',    // Opus - Purple (premium)
    modelLocal: '#4D96FF',   // Local - Blue
    modelOpenRouter: '#FFD93D', // OpenRouter - Yellow
  },
  
  gradients: {
    logo: ['#D97757', '#E8997A', '#FFD93D'],  // Coral to gold
    progress: ['#6BCB77', '#FFD93D', '#FF6B6B'], // Green > Yellow > Red
    savings: ['#4D96FF', '#6BCB77'],  // Blue to green
  },
};

/**
 * VSCode Dark+ Theme - For seamless Claude Code VSCode integration
 */
export const vscodeDarkTheme: Theme = {
  name: 'vscode-dark',
  colors: {
    primary: '#569CD6',      // VSCode blue
    secondary: '#4EC9B0',    // Teal
    accent: '#CE9178',       // Orange string color
    
    success: '#6A9955',      // Comment green
    warning: '#DCDCAA',      // Function yellow
    error: '#F44747',        // Error red
    info: '#9CDCFE',         // Light blue
    
    bg: '#1E1E1E',           // VSCode dark bg
    bgSurface: '#252526',    // Sidebar bg
    bgOverlay: '#2D2D2D',    // Dropdown bg
    bgHighlight: '#264F78',  // Selection
    
    text: '#D4D4D4',         // Default text
    textMuted: '#808080',    // Comments
    textSubtle: '#5A5A5A',   // Disabled
    
    border: '#3C3C3C',
    borderMuted: '#2D2D2D',
    
    savings: '#6A9955',
    cost: '#CE9178',
    velocity: '#569CD6',
    prediction: '#C586C0',
    
    modelSonnet: '#569CD6',
    modelHaiku: '#6A9955',
    modelOpus: '#C586C0',
    modelLocal: '#4EC9B0',
    modelOpenRouter: '#DCDCAA',
  },
  
  gradients: {
    logo: ['#569CD6', '#4EC9B0', '#6A9955'],
    progress: ['#6A9955', '#DCDCAA', '#F44747'],
    savings: ['#569CD6', '#6A9955'],
  },
};

/**
 * Catppuccin Mocha - Popular aesthetic theme
 */
export const catppuccinTheme: Theme = {
  name: 'catppuccin',
  colors: {
    primary: '#CBA6F7',      // Mauve
    secondary: '#F5C2E7',    // Pink
    accent: '#89DCEB',       // Sky
    
    success: '#A6E3A1',      // Green
    warning: '#F9E2AF',      // Yellow
    error: '#F38BA8',        // Red
    info: '#89B4FA',         // Blue
    
    bg: '#1E1E2E',           // Base
    bgSurface: '#313244',    // Surface0
    bgOverlay: '#45475A',    // Surface1
    bgHighlight: '#585B70',  // Surface2
    
    text: '#CDD6F4',         // Text
    textMuted: '#A6ADC8',    // Subtext1
    textSubtle: '#6C7086',   // Overlay0
    
    border: '#45475A',
    borderMuted: '#313244',
    
    savings: '#A6E3A1',
    cost: '#FAB387',         // Peach
    velocity: '#89B4FA',
    prediction: '#CBA6F7',
    
    modelSonnet: '#CBA6F7',
    modelHaiku: '#A6E3A1',
    modelOpus: '#F5C2E7',
    modelLocal: '#89B4FA',
    modelOpenRouter: '#F9E2AF',
  },
  
  gradients: {
    logo: ['#CBA6F7', '#F5C2E7', '#FAB387'],
    progress: ['#A6E3A1', '#F9E2AF', '#F38BA8'],
    savings: ['#89B4FA', '#A6E3A1'],
  },
};

// All available themes
export const themes = {
  claude: claudeTheme,
  'vscode-dark': vscodeDarkTheme,
  catppuccin: catppuccinTheme,
} as const;

export type ThemeName = keyof typeof themes;

// Default theme
export const defaultTheme = claudeTheme;

// Get theme by name
export function getTheme(name: ThemeName): Theme {
  return themes[name] || defaultTheme;
}

// Color utility functions
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

export function rgbToAnsi256(r: number, g: number, b: number): number {
  // Convert RGB to ANSI 256 color
  if (r === g && g === b) {
    if (r < 8) return 16;
    if (r > 248) return 231;
    return Math.round(((r - 8) / 247) * 24) + 232;
  }
  return (
    16 +
    36 * Math.round((r / 255) * 5) +
    6 * Math.round((g / 255) * 5) +
    Math.round((b / 255) * 5)
  );
}
