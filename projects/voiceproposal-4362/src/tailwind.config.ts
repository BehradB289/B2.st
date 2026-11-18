import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        mesh: {
          dark: "#090D16",
          purple: "#6D28D9",
          deep: "#0F172A",
          accent: "#8B5CF6",
          cyan: "#06B6D4",
        },
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "neon-purple": "0 0 35px -5px rgba(109, 40, 217, 0.6)",
        "neon-cyan": "0 0 30px -5px rgba(6, 182, 212, 0.5)",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "mesh-float": "meshFloat 18s ease-in-out infinite alternate",
        "glow-ping": "glowPing 2s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
      keyframes: {
        meshFloat: {
          "0%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(30px, -20px) scale(1.08)" },
          "100%": { transform: "translate(-20px, 20px) scale(0.95)" },
        },
        glowPing: {
          "75%, 100%": {
            transform: "scale(1.75)",
            opacity: "0",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;