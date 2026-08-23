import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Fond & neutres
        fond: "#F6F5FC",       // lavande très clair, fond de page
        surface: "#FFFFFF",     // cartes, panneaux
        encre: "#1E1B39",       // texte principal, quasi-noir violine
        sourdine: "#6B7280",    // texte secondaire
        ligne: "#E7E4F5",       // bordures discrètes

        // Accent principal
        indigo: "#5B5FEF",
        "indigo-clair": "#EEF0FF",

        // Liserés/catégories de carte (statuts, types d'événement)
        vert: "#22B07D",
        "vert-clair": "#E3F8EE",
        ambre: "#F5A623",
        "ambre-clair": "#FDF1DD",
        corail: "#F0576B",
        "corail-clair": "#FDE7EA",
        ciel: "#3AA0F0",
        "ciel-clair": "#E7F3FE",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        carte: "0 1px 2px rgba(30, 27, 57, 0.04), 0 8px 24px -12px rgba(30, 27, 57, 0.12)",
      },
    },
  },
  plugins: [],
};
export default config;
