import { type ReactNode } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

type HeaderColor = "green" | "yellow" | "orange";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  color?: HeaderColor;
  onBack?: () => void;
  showBack?: boolean;
  right?: ReactNode;
  children?: ReactNode;
}

const colorStyles: Record<HeaderColor, string> = {
  green: "bg-green",
  yellow: "bg-yellow",
  orange: "bg-orange",
};

export default function PageHeader({
  title,
  subtitle,
  color = "green",
  onBack,
  showBack = false,
  right,
  children,
}: PageHeaderProps) {
  const [, navigate] = useLocation();

  const handleBack = onBack ?? (() => window.history.back());

  return (
    <div className={`${colorStyles[color]} px-5 pt-5 pb-6 rounded-b-2xl`}>
      <div className="flex items-center justify-between mb-2">
        {showBack ? (
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center press-scale"
          >
            <ArrowLeft size={20} color="white" />
          </button>
        ) : (
          <div />
        )}
        {right}
      </div>
      <h1 className="font-poppins font-bold text-xl text-white">{title}</h1>
      {subtitle && (
        <p className="font-dm text-sm text-white/80 mt-0.5">{subtitle}</p>
      )}
      {children}
    </div>
  );
}
