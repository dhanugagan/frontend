/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#020203", // Deepest Midnight recess
          900: "#050507", // Midnight Black
          850: "#0c0d11", // Elevated Midnight card
          800: "#14161d", // Obsidian surface
          750: "#1a2e05", // Deep Lime Moss surface
          700: "#232630", // Structural border
          600: "#313542",
          500: "#71717a",
        },
        brand: {
          200: "#ecfccb", // Crisp Lime Tint
          300: "#d9f99d",
          400: "#bef264",
          500: "#a3e635", // Primary Lime Green
          600: "#84cc16",
        },
        model: {
          200: "#ecfccb",
          300: "#d9f99d",
          400: "#bef264",
          500: "#84cc16", // Saturated Lime Green
          600: "#65a30d",
        },
        safe: {
          200: "#ecfccb",
          300: "#d9f99d",
          400: "#a3e635",
          500: "#84cc16",
          600: "#1a2e05",
        },
        cloud: "#ffffff", // Pure White
        silver: "#b4b8c2", // Crisp Neutral Silver
        steel: "#71717a", // Neutral Zinc Steel
        fraud: {
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
        },
        warn: {
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
        },
      },
      fontFamily: {
        display: ["Manrope", "DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["DM Sans", "Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Consolas", "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.06) inset, 0 14px 34px -16px rgba(0,0,0,0.92)",
        elevated: "0 1px 0 0 rgba(255,255,255,0.09) inset, 0 24px 54px -18px rgba(0,0,0,0.95)",
        lightCard: "0 16px 38px -14px rgba(0,0,0,0.42), 0 0 0 1px rgba(255,255,255,0.18)",
        glow: "0 0 0 1px rgba(163,230,53,0.45), 0 8px 24px -6px rgba(163,230,53,0.28)",
        violetGlow: "0 0 0 1px rgba(132,204,22,0.42), 0 8px 24px -6px rgba(132,204,22,0.26)",
      },
      keyframes: {
        fade: {
          from: { opacity: "0", transform: "translate3d(0, 8px, 0)" },
          to: { opacity: "1", transform: "translate3d(0, 0, 0)" },
        },
        pageEnter: {
          from: { opacity: "0", transform: "translate3d(0, 10px, 0) scale(0.995)" },
          to: { opacity: "1", transform: "translate3d(0, 0, 0) scale(1)" },
        },
        modalIn: {
          from: { opacity: "0", transform: "translate3d(0, 10px, 0) scale(0.97)" },
          to: { opacity: "1", transform: "translate3d(0, 0, 0) scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(0, -6px, 0)" },
        },
        orbDriftA: {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(38px, 24px, 0) scale(1.05)" },
        },
        orbDriftB: {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(-32px, -22px, 0) scale(1.06)" },
        },
        waveSlide: {
          "0%": { transform: "translate3d(-35%, 0, 0) rotate(-4deg)" },
          "50%": { transform: "translate3d(15%, 10px, 0) rotate(-2deg)" },
          "100%": { transform: "translate3d(-35%, 0, 0) rotate(-4deg)" },
        },
        particleFloat: {
          "0%, 100%": { opacity: "0.16", transform: "translate3d(0, 0, 0)" },
          "50%": { opacity: "0.55", transform: "translate3d(8px, -14px, 0)" },
        },
        rippleOut: {
          from: { opacity: "0.42", transform: "scale(0)" },
          to: { opacity: "0", transform: "scale(2.8)" },
        },
        borderSpin: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
      animation: {
        fade: "fade .24s cubic-bezier(0.16, 1, 0.3, 1)",
        pageEnter: "pageEnter .3s cubic-bezier(0.16, 1, 0.3, 1)",
        modalIn: "modalIn .2s cubic-bezier(0.16, 1, 0.3, 1)",
        floatSlow: "floatSlow 6.5s ease-in-out infinite",
        orbDriftA: "orbDriftA 20s ease-in-out infinite",
        orbDriftB: "orbDriftB 24s ease-in-out infinite",
        waveSlide: "waveSlide 18s ease-in-out infinite",
        rippleOut: "rippleOut .52s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        borderSpin: "borderSpin 8s ease infinite",
      },
    },
  },
  plugins: [],
};
