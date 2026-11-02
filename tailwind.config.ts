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
      fontSize: {
        "large-title": ["34px", { lineHeight: "41px", letterSpacing: "-0.022em" }],
        "title-1": ["28px", { lineHeight: "34px", letterSpacing: "-0.020em" }],
        "title-2": ["22px", { lineHeight: "28px", letterSpacing: "-0.017em" }],
        "title-3": ["20px", { lineHeight: "25px", letterSpacing: "-0.014em" }],
        headline: ["17px", { lineHeight: "22px", letterSpacing: "-0.015em", fontWeight: "600" }],
        body: ["17px", { lineHeight: "22px", letterSpacing: "-0.015em" }],
        callout: ["16px", { lineHeight: "21px", letterSpacing: "-0.010em" }],
        subheadline: ["15px", { lineHeight: "20px", letterSpacing: "-0.005em" }],
        footnote: ["13px", { lineHeight: "18px", letterSpacing: "+0.005em" }],
        "caption-1": ["12px", { lineHeight: "16px", letterSpacing: "+0.008em" }],
        "caption-2": ["11px", { lineHeight: "13px", letterSpacing: "+0.010em" }],
      },
      borderWidth: {
        "0.5": "0.5px",
        hairline: "0.5px",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
        "spring-bouncy": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
