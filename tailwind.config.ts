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
        // Organic design system. Warm paper ground, forest ink, clay accent.
        paper: "#F5EAD8",
        surface: "#EBDDC5",
        cream: "#FFF9ED",
        ink: "#201E1D",
        forest: "#173F35",
        clay: "#C67139",
        sage: "#7A8A5E",

        neutral: {
          100: "#F9F4ED",
          200: "#EEE7DB",
          300: "#DCD3C4",
          400: "#C0B6A5",
          500: "#A19786",
          600: "#82796A",
          700: "#645C50",
          800: "#474238",
          900: "#2E2B25",
        },
        accent: {
          100: "#FFF2EB",
          200: "#FFE1D0",
          300: "#FFC6A5",
          400: "#F6A06B",
          500: "#D67F48",
          600: "#B2622D",
          700: "#8C491A",
          800: "#643312",
          900: "#402310",
        },
        leaf: {
          100: "#F0FAE1",
          200: "#E1EECC",
          300: "#CCDBB2",
          400: "#AEBF92",
          500: "#8FA073",
          600: "#728157",
          700: "#56633F",
          800: "#3D472B",
          900: "#272E1B",
        },
      },
      borderRadius: {
        sm: "8px",
        md: "16px",
        lg: "28px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(46,43,37,0.14)",
        md: "0 3px 10px rgba(46,43,37,0.16)",
        lg: "0 12px 32px rgba(46,43,37,0.22)",
      },
    },
  },
  plugins: [],
} satisfies Config;
