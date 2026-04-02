import { type ButtonHTMLAttributes, type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "accent" | "danger" | "google";
type ButtonColor = "dark" | "green" | "yellow" | "orange";
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  icon?: ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-text-dark text-white shadow-button",
  secondary: "bg-white text-text-dark border border-[var(--border-medium)]",
  accent: "bg-green text-white shadow-button",
  danger: "bg-danger text-white shadow-button",
  google: "bg-white text-text-dark border border-[var(--border-medium)]",
};

const colorOverrides: Record<ButtonColor, string> = {
  dark: "bg-text-dark text-white",
  green: "bg-green text-white",
  yellow: "bg-yellow text-white",
  orange: "bg-orange text-white",
};

const sizeStyles: Record<ButtonSize, string> = {
  md: "font-poppins font-semibold text-[15px] rounded-pill px-6 py-[14px] gap-2",
  sm: "font-dm font-medium text-xs rounded-pill px-4 py-2 gap-1.5",
};

export default function Button({
  variant = "primary",
  color,
  size = "md",
  icon,
  fullWidth = true,
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const base = "flex items-center justify-center transition-transform duration-150 press-scale disabled:opacity-50 disabled:pointer-events-none";
  const style = color ? colorOverrides[color] : variantStyles[variant];
  const width = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${base} ${sizeStyles[size]} ${style} ${width} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner size={18} /> : icon}
      {children}
    </button>
  );
}

function Spinner({ size = 18 }: { size?: number }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
