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
        background: "#090D16",
        surface: {
          light: "rgba(255, 255, 255, 0.05)",
          DEFAULT: "rgba(15, 23, 42, 0.65)",
          border: "rgba(255, 255, 255, 0.1)",
        },
        brand: {
          cyan: "#00F2FE",
          teal: "#4FACFE",
          violet: "#7928CA",
          purple: "#9333EA",
          pink: "#FF0080",
          amber: "#F59E0B",
          emerald: "#10B981"
        }
      },
      fontFamily: {
        sans: ["var(--font-vazirmatn)", "Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "glass-gradient": "linear-gradient(135deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.02) 100%)",
        "luxury-btn": "linear-gradient(135deg, #00F2FE 0%, #4FACFE 50%, #7928CA 100%)",
        "luxury-card": "linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(13, 19, 32, 0.7) 100%)",
      },
      boxShadow: {
        "neon-cyan": "0 0 35px -5px rgba(0, 242, 254, 0.35)",
        "neon-violet": "0 0 45px -5px rgba(121, 40, 202, 0.35)",
        "glass": "0 8px 32px 0 rgba(0, 0, 0, 0.5)",
      },
      animation: {
        "pulse-slow": "pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "ambient-drift": "ambientDrift 18s ease-in-out infinite alternate",
        "float": "float 5s ease-in-out infinite",
      },
      keyframes: {
        ambientDrift: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "50%": { transform: "translate(40px, -30px) scale(1.12)" },
          "100%": { transform: "translate(-30px, 20px) scale(0.95)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        }
      }
    },
  },
  plugins: [],
};
export default config;