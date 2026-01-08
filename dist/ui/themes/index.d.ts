/**
 * Claude Cruise - Color Themes
 *
 * Primary theme: Claude (Anthropic branded)
 * Also supports: VSCode Dark+, Catppuccin, Tokyo Night
 */
export interface Theme {
    name: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        success: string;
        warning: string;
        error: string;
        info: string;
        bg: string;
        bgSurface: string;
        bgOverlay: string;
        bgHighlight: string;
        text: string;
        textMuted: string;
        textSubtle: string;
        border: string;
        borderMuted: string;
        savings: string;
        cost: string;
        velocity: string;
        prediction: string;
        modelSonnet: string;
        modelHaiku: string;
        modelOpus: string;
        modelLocal: string;
        modelOpenRouter: string;
    };
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
export declare const claudeTheme: Theme;
/**
 * VSCode Dark+ Theme - For seamless Claude Code VSCode integration
 */
export declare const vscodeDarkTheme: Theme;
/**
 * Catppuccin Mocha - Popular aesthetic theme
 */
export declare const catppuccinTheme: Theme;
export declare const themes: {
    readonly claude: Theme;
    readonly 'vscode-dark': Theme;
    readonly catppuccin: Theme;
};
export type ThemeName = keyof typeof themes;
export declare const defaultTheme: Theme;
export declare function getTheme(name: ThemeName): Theme;
export declare function hexToRgb(hex: string): {
    r: number;
    g: number;
    b: number;
};
export declare function rgbToAnsi256(r: number, g: number, b: number): number;
//# sourceMappingURL=index.d.ts.map