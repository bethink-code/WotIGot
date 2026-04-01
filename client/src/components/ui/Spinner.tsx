interface SpinnerProps {
  size?: number;
  color?: string;
  className?: string;
}

export default function Spinner({ size = 24, color = "var(--green)", className = "" }: SpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.25" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}
