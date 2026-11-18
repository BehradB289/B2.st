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
        neonPurple: "#6D28D9",
        emeraldStatus: "#10B981",
      },
      backgroundImage: {
        "acrylic-sheen":
          "linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 100%)",
        "mesh-dark":
          "radial-gradient(at 0% 0%, #6D28D9 0px, transparent 50%), radial-gradient(at 100% 100%, #090D16 0px, transparent 50%)",
      },
      animation: {
        "sheen-pass": "sheen-pass 2s ease-in-out infinite",
      },
      keyframes: {
        "sheen-pass": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;