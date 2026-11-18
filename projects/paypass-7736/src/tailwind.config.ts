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
        paypass: {
          bg: "#090D16",
          surface: "rgba(255, 255, 255, 0.03)",
          border: "rgba(255, 255, 255, 0.08)",
          cyan: "#00F2FE",
          violet: "#7928CA",
          accent: "#4FACFE",
        },
      },
      fontFamily: {
        sans: ["var(--font-vazirmatn)", "system-ui", "sans-serif"],
      },
      animation: {
        "glow-slow": "pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;