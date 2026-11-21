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
        brandRed: "#E60000",
        brandNavy: "#0B1B3D",
        brandBg: "#F4F6FA",
      },
    },
  },
  plugins: [],
};
export default config;
