import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#171B21",
        steel: {
          DEFAULT: "#2C4A63",
          light: "#4C7093",
          dark: "#1D3244",
        },
        amber: {
          DEFAULT: "#E8952F",
          soft: "#FBEBD3",
        },
        paper: "#F4F5F3",
        line: "#DEE1DC",
        danger: "#C4432B",
        good: "#3D7A4F",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        hazard:
          "repeating-linear-gradient(135deg, #E8952F, #E8952F 10px, #171B21 10px, #171B21 20px)",
      },
    },
  },
  plugins: [],
};

export default config;
