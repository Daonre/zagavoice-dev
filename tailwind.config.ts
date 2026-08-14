import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#070B14",
        panel: "#0E1626",
        edge: "#1B2940",
        cyan: "#22D3EE",
        lime: "#A3E635",
        coral: "#FB7185",
        dim: "#8294B0"
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"]
      }
    }
  },
  plugins: []
};
export default config;
