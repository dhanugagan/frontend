/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { 950: "#050a14", 900: "#0a1220", 850: "#0d1627", 800: "#111c30", 700: "#18253c", 600: "#22324d", 500: "#2f4263" },
        brand: { 300: "#67e8f9", 400: "#22d3ee", 500: "#06b6d4", 600: "#0891b2" },
        model: { 300: "#c4b5fd", 400: "#a78bfa", 500: "#8b5cf6" },
        fraud: { 300: "#fda4af", 400: "#fb7185", 500: "#f43f5e", 600: "#e11d48" },
        safe: { 300: "#86efac", 400: "#4ade80", 500: "#22c55e" },
        warn: { 300: "#fcd34d", 400: "#fbbf24", 500: "#f59e0b" },
      },
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"], mono: ["JetBrains Mono", "ui-monospace", "Consolas", "monospace"] },
      boxShadow: { card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)", glow: "0 0 0 1px rgba(34,211,238,0.25), 0 0 24px -6px rgba(34,211,238,0.35)" },
      keyframes: { fade: { from: { opacity: "0", transform: "translateY(4px)" }, to: { opacity: "1", transform: "none" } }, shimmer: { "100%": { transform: "translateX(100%)" } } },
      animation: { fade: "fade .25s ease-out", },
    },
  },
  plugins: [],
};
