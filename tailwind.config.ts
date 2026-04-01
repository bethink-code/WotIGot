import type { Config } from "tailwindcss";

export default {
  content: ["./client/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#FFFDF9",
        green: {
          DEFAULT: "#00B894",
          soft: "#E0F9F4",
          dark: "#009975",
        },
        yellow: {
          DEFAULT: "#F7B731",
          soft: "#FFF5D8",
          dark: "#D4981A",
        },
        orange: {
          DEFAULT: "#FA8231",
          soft: "#FFF0E6",
          dark: "#D4691A",
        },
        danger: {
          DEFAULT: "#FF7675",
          soft: "#FEF2F2",
        },
        text: {
          dark: "#2D3436",
          grey: "#636E72",
          muted: "#95A5A6",
        },
        card: "#FFFFFF",
        grey: {
          bg: "#F5F6FA",
        },
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        dm: ["DM Sans", "sans-serif"],
      },
      borderRadius: {
        xs: "10px",
        sm: "12px",
        md: "16px",
        lg: "18px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "32px",
        round: "44px",
        pill: "100px",
      },
      spacing: {
        xxs: "4px",
        xs: "8px",
        sm: "10px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "32px",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0, 0, 0, 0.06)",
        "card-soft": "0 1px 4px rgba(0, 0, 0, 0.04)",
        float: "0 4px 16px rgba(0, 0, 0, 0.1)",
        toolbar: "0 -2px 10px rgba(0, 0, 0, 0.05)",
        button: "0 2px 6px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
