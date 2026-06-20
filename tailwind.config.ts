import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Pitch-green accent for a football feel.
        pitch: {
          DEFAULT: "#0b8457",
          dark: "#0a6e49",
        },
      },
    },
  },
  plugins: [],
};

export default config;
