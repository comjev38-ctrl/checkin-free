import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
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
        // Palette de tuiles colorées (direction artistique du dashboard
        // de référence) : utilisée pour les cartes d'événements et les
        // médaillons d'icônes, en rotation. Distincte de amber/rose qui
        // gardent leur rôle sémantique (avertissement/erreur).
        violet: "#7B7FE0",
        orange: "#F5A623",
        bleu: "#4A9FE8",
        fuchsia: "#C15FD1",
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
