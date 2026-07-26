import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

/**
 * Design system — a premium, editorial dark palette (Linear / Vercel register).
 * True-neutral greys, one restrained cobalt accent, semantic colours reserved
 * for real status. No gradients-as-decoration, no glow, no neon.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#0A0A0B",
        surface: "#141416",
        "surface-2": "#1B1B1F",
        "surface-3": "#232328",
        line: "#26262B",
        "line-strong": "#35353C",
        clinical: {
          DEFAULT: "#2FA79B",
          soft: "#5FC6BB",
          deep: "#1F847A",
        },
        agree: {
          DEFAULT: "#34D399",
          soft: "#6EE7B7",
        },
        caution: {
          DEFAULT: "#F5A623",
          soft: "#F8C572",
        },
        danger: {
          DEFAULT: "#FB5C4B",
          soft: "#FF8578",
        },
        ink: {
          DEFAULT: "#FAFAFA",
          muted: "#A1A1AA",
          faint: "#71717A",
        },
        savi: {
          cream: "#FAFAF9",
          paper: "#FFFFFF",
          ink: "#131417",
          muted: "#5B5F66",
          line: "#E9E9EA",
          accent: "#131417",
          "accent-deep": "#000000",
          "accent-soft": "#F1F1F2",
          trust: "#0E7C56",
          "trust-soft": "#E7F3EE",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "Cambria", "serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.03em",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.4), 0 12px 32px -20px rgba(0,0,0,0.9)",
        lift: "0 2px 6px rgba(0,0,0,0.45), 0 24px 48px -24px rgba(0,0,0,0.95)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        ecg: {
          "0%": { strokeDashoffset: "1400" },
          "100%": { strokeDashoffset: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.55s cubic-bezier(0.22,1,0.36,1) both",
        "pulse-soft": "pulseSoft 1.8s ease-in-out infinite",
        ecg: "ecg 3s cubic-bezier(0.65,0,0.35,1) forwards",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
