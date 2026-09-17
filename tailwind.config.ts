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
        background: "var(--background)",
        foreground: "var(--foreground)",
        gold: "#D4AF37",
        "labersa-dark": "#004C2F",
        "labersa": "#006B3F",
      },
    },
  },
  plugins: [],
  safelist: [
    {
      pattern: /bg-labersa/,
    },
  ],
};
export default config;
