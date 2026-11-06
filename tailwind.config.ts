import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Linear-grade charcoal slate & high-contrast WCAG AAA palette
        canvas: {
          DEFAULT: "#0c0d0e",
          subtle: "#101113",
        },
        surface: {
          DEFAULT: "#141517",
          elevated: "#181a1d",
          hover: "#1f2226",
          active: "#25282e",
        },
        border: {
          subtle: "#23262a",
          strong: "#34383e",
          focus: "#0090ff",
        },
        text: {
          primary: "#f4f5f6",
          secondary: "#9ba1a6",
          muted: "#6b7280",
        },
        semantic: {
          trap: {
            DEFAULT: "#e5484d",
            subtle: "rgba(229, 72, 77, 0.12)",
            border: "rgba(229, 72, 77, 0.35)",
          },
          gap: {
            DEFAULT: "#f76808",
            subtle: "rgba(247, 104, 8, 0.12)",
            border: "rgba(247, 104, 8, 0.35)",
          },
          verified: {
            DEFAULT: "#30a46c",
            subtle: "rgba(48, 164, 108, 0.12)",
            border: "rgba(48, 164, 108, 0.35)",
          },
          focus: {
            DEFAULT: "#0090ff",
            subtle: "rgba(0, 144, 255, 0.12)",
            border: "rgba(0, 144, 255, 0.35)",
          },
        },
        apple: {
          blue: "#0071e3",
          "blue-hover": "#0077ed",
          sky: "#0a84ff",
          green: "#30d158",
          orange: "#ff9f0a",
          red: "#ff453a",
          purple: "#bf5af2",
          gray: {
            1: "#86868b",
            2: "#6e6e73",
            3: "#424245",
            4: "#323236",
            5: "#1d1d1f",
            6: "#161618",
          },
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "Fira Code", "monospace"],
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
        "spring-bouncy": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      boxShadow: {
        "subtle-card": "0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)",
        "elevated-card": "0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)",
        "focus-ring": "0 0 0 2px #0c0d0e, 0 0 0 4px #0090ff",
      },
    },
  },
  plugins: [],
};
export default config;
