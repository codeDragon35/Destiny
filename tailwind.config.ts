import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        space: "#101827",
        midnight: "#172A46",
        jade: "#2FBF9F",
        gold: "#F4C95D",
        coral: "#F47C6C",
        ivory: "#F7F4EA",
        "soft-gray": "#AAB4C3",
        mist: "#DCE7E5",
        // Warmer surface tints so sections are not all one navy.
        ink: "#0B1220",
        dusk: "#1E3055",
        // Per-country accents, selected by motif.
        sakura: "#F2A2C0",
        saffron: "#F0913A",
        terracotta: "#E0654B",
      },
    },
  },
  plugins: [],
} satisfies Config;
