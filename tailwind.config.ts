import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        crussader: {
          DEFAULT: "#7c3aed", // morado principal
          light: "#a78bfa",   // tono más claro
          dark: "#5b21b6",    // tono más oscuro
        },
      },
      boxShadow: {
        glow: "0 10px 30px rgba(124,58,237,0.25)", // mismo efecto que en tu botón
      },
    },
  },
  plugins: [],
};

export default config;
