/**
 * Centralized Design System Tokens — Sentinel GNN
 * Midnight Black (#050507), Pure White (#FFFFFF), and Lime Green (#A3E635 / #84CC16).
 */
export const DESIGN_TOKENS = {
  colors: {
    midnightBlack: "#050507",
    midnightRecess: "#020203",
    elevatedBlack: "#0C0D11",
    obsidianSlate: "#14161D",
    pureWhite: "#FFFFFF",
    neutralSilver: "#B4B8C2",
    limeGreen: "#A3E635",
    vividLime: "#84CC16",
    softLime: "#ECFCCB",
    deepMoss: "#1A2E05",
    zincSteel: "#71717A",
    roseAlert: "#FB7185",
    amberWarn: "#F59E0B",
  },
  motion: {
    easeOutExpo: "cubic-bezier(0.16, 1, 0.3, 1)",
    durationFastMs: 160,
    durationNormalMs: 240,
    durationSlowMs: 420,
  },
  typography: {
    display: '"Manrope", "DM Sans", ui-sans-serif, system-ui, sans-serif',
    sans: '"DM Sans", "Manrope", ui-sans-serif, system-ui, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  },
  layout: {
    maxContentWidth: 1520,
    topBarHeight: 64,
    sidebarWidth: 256,
    sidebarCollapsedWidth: 74,
  },
} as const;
