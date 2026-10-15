import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        courier: ["'Courier New'", "Courier", "monospace"],
        arial: ["Arial", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#bae0fd",
          300: "#7cc7fc",
          400: "#36aaf6",
          500: "#0b8fe3",
          600: "#0271c2",
          700: "#035a9d",
          800: "#074c82",
          900: "#0c406c",
          950: "#082947",
        },
      },
      animation: {
        "spin-slow": "spin 8s linear infinite",
        "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "1", filter: "drop-shadow(0 0 15px rgba(59, 130, 246, 0.5))" },
          "50%": { opacity: ".85", filter: "drop-shadow(0 0 25px rgba(59, 130, 246, 0.8))" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
