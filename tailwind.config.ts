import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

/**
 * Design system — a premium, editorial light palette (Linear / Vercel register).
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
        base: "#FAFAF9",
        surface: "#FFFFFF",
        "surface-2": "#F5F4F1",
        "surface-3": "#ECEBE6",
        line: "#E7E6E1",
        "line-strong": "#D3D1CA",
        clinical: {
          DEFAULT: "#2FA79B",
          soft: "#1F6F66",
          deep: "#12564F",
        },
        agree: {
          DEFAULT: "#34D399",
          soft: "#0E7C56",
        },
        caution: {
          DEFAULT: "#F5A623",
          soft: "#8A5A0F",
        },
        danger: {
          DEFAULT: "#FB5C4B",
          soft: "#B23324",
        },
        ink: {
          DEFAULT: "#131417",
          muted: "#5B5F66",
          faint: "#7A7D83",
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
        card: "0 1px 2px rgba(19,20,23,0.04), 0 10px 28px -18px rgba(19,20,23,0.14)",
        lift: "0 2px 8px rgba(19,20,23,0.06), 0 22px 44px -24px rgba(19,20,23,0.20)",
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
