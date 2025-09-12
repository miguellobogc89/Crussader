import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";
import lineClamp from "@tailwindcss/line-clamp";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1240px",
      xl2: "1600px",
    },
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },

        /* Semánticos que faltaban: */
        success: { DEFAULT: "hsl(var(--success))", foreground: "hsl(var(--success-foreground))" },
        warning: { DEFAULT: "hsl(var(--warning))", foreground: "hsl(var(--warning-foreground))" },
        pending: { DEFAULT: "hsl(var(--pending))", foreground: "hsl(var(--pending-foreground))" },
        published: { DEFAULT: "hsl(var(--published))", foreground: "hsl(var(--published-foreground))" },
        draft: { DEFAULT: "hsl(var(--draft))", foreground: "hsl(var(--draft-foreground))" },

        /* Estrellas por si quieres usar como color utilitario */
        star: { filled: "hsl(var(--star-filled))", empty: "hsl(var(--star-empty))" },

        /* Marca opcional */
        crussader: { DEFAULT: "#7c3aed", light: "#a78bfa", dark: "#5b21b6" },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      boxShadow: {
        elegant: "0 1px 2px hsl(var(--foreground) / .06), 0 8px 24px hsl(var(--foreground) / .06)",
        card: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
        glow: "0 10px 30px rgba(124,58,237,0.25)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },

  /* Por si alguna clase semántica viene de strings dinámicos (evita purge) */
  safelist: [
    // semánticos básicos
    "text-success","bg-success","text-success-foreground","bg-success/10",
    "text-warning","bg-warning","text-warning-foreground","bg-warning/10",
    "text-destructive","bg-destructive","text-destructive-foreground","bg-destructive/10",
    "text-accent","bg-accent","text-secondary","bg-secondary",
    // helpers soft
    "bg-soft-primary","bg-soft-accent","bg-soft-success","bg-soft-warning","bg-soft-destructive","bg-soft-secondary",
    // estrellas
    "text-star-filled","text-star-empty",
  ],

  plugins: [animate, lineClamp],
};

export default config;
