import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        space: "#101827",
        midnight: "#172A46",
        jade: "#2FBF9F",
        gold: "#F4C95D",
        coral: "#F47C6C",
        ivory: "#F7F4EA",
        "soft-gray": "#AAB4C3",
        mist: "#DCE7E5",
      },
    },
  },
  plugins: [],
} satisfies Config;
