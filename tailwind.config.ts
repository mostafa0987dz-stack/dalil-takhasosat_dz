import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["var(--font-cairo)", "system-ui", "sans-serif"] },
      colors: { brand: { 50: "#eff6ff", 100: "#dbeafe", 600: "#2563eb", 700: "#1d4ed8", 900: "#1e3a8a" } },
      boxShadow: { glass: "0 8px 32px -8px rgba(31, 41, 90, 0.12)" },
    },
  },
  plugins: [],
};
export default config;
