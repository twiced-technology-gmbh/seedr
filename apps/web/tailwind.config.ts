import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    // Extension type colors - needed for dynamic class usage
    "text-pink-500",
    "text-amber-500",
    "text-purple-500",
    "text-blue-500",
    "text-teal-500",
    "text-orange-500",
    "text-indigo-500",
    "text-slate-400",
    "text-cyan-500",
    "text-gray-500",
    "text-emerald-500",
    "border-l-pink-500",
    "border-l-amber-500",
    "border-l-purple-500",
    "border-l-blue-500",
    "border-l-teal-500",
    "border-l-orange-500",
    "border-l-indigo-500",
    "border-l-slate-400",
    "border-l-cyan-500",
    "border-l-gray-500",
    "border-l-emerald-500",
  ],
  theme: {
    extend: {
      colors: {
        // Catppuccin Mocha palette (matching configr)
        base: "#030712",
        surface: "#181825",
        "surface-alt": "#313244",
        overlay: "#45475a",
        "overlay-hover": "#6c7086",
        "overlay-light": "#585b70",
        subtext: "#a6adc8",
        text: "#cdd6f4",
        "text-dim": "#6c7086",
        active: "#1e1e2e",

        // Type-specific accent colors (matching configr)
        skill: {
          DEFAULT: "#f472b6", // pink-400
          light: "#f9a8d4", // pink-300
          dark: "#ec4899", // pink-500
        },
        hook: {
          DEFAULT: "#c084fc", // purple-400
          light: "#d8b4fe", // purple-300
          dark: "#a855f7", // purple-500
        },
        agent: {
          DEFAULT: "#60a5fa", // blue-400
          light: "#93c5fd", // blue-300
          dark: "#3b82f6", // blue-500
        },
        plugin: {
          DEFAULT: "#818cf8", // indigo-400
          light: "#a5b4fc", // indigo-300
          dark: "#6366f1", // indigo-500
        },
        command: {
          DEFAULT: "#fbbf24", // amber-400
          light: "#fcd34d", // amber-300
          dark: "#f59e0b", // amber-500
        },
        settings: {
          DEFAULT: "#fb923c", // orange-400
          light: "#fdba74", // orange-300
          dark: "#f97316", // orange-500
        },
        mcp: {
          DEFAULT: "#14b8a6", // teal-500
          light: "#2dd4bf", // teal-400
          dark: "#0d9488", // teal-600
        },
        prompt: {
          DEFAULT: "#22d3ee", // cyan-400
          light: "#67e8f9", // cyan-300
          dark: "#06b6d4", // cyan-500
        },
        extension: {
          DEFAULT: "#34d399", // emerald-400
          light: "#6ee7b7", // emerald-300
          dark: "#10b981", // emerald-500
        },

        // Semantic colors
        accent: "#60a5fa", // blue-400
        success: "#4ade80", // green-400
        warning: "#fbbf24", // amber-400
        error: "#f87171", // red-400
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "Avenir",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "Consolas",
          "Monaco",
          "monospace",
        ],
      },
      height: {
        "input": "26px",
        "toggle": "24px",
        "badge-sm": "18px",
        "badge-md": "20px",
      },
    },
  },
  plugins: [],
} satisfies Config;
