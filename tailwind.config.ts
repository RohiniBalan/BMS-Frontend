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
        navy: {
          950: "#050B18",
          900: "#080F1E",
          800: "#0C1426",
          700: "#0F1A30",
          600: "#111D33",
          500: "#162440",
        },
        "bms-green": "#00E676",
        "bms-green-dark": "#00C853",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        float: "float 4s ease-in-out infinite",
        "fade-in": "fadeIn 0.4s ease forwards",
        shimmer: "shimmer 2s infinite",
      },
    },
  },
  plugins: [],
};
export default config;
