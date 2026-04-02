import { type InputHTMLAttributes, useState } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = "", onFocus, onBlur, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? "border-danger"
    : focused
      ? "border-green"
      : "border-[var(--border-light)]";

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-dm text-text-muted mb-1 pl-4">{label}</label>
      )}
      <input
        className={`w-full px-4 py-[14px] rounded-pill border ${borderColor} bg-white font-dm text-[15px] text-text-dark placeholder:text-text-muted outline-none transition-colors duration-150 ${className}`}
        onFocus={(e) => { setFocused(true); onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); onBlur?.(e); }}
        {...props}
      />
      {error && (
        <p className="text-danger text-xs mt-1 font-dm">{error}</p>
      )}
    </div>
  );
}
