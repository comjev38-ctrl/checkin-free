import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16213E",
        paper: "#FAFAF8",
        emerald: "#1B7A5B",
        amber: "#E8A33D",
        stone: "#6B7280",
        line: "#E3DFD5",
        rose: "#B3423C",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        perforation:
          "repeating-linear-gradient(to bottom, transparent 0 6px, #E3DFD5 6px 8px)",
      },
    },
  },
  plugins: [],
};
export default config;
