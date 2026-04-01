import { type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { useImageUrl } from "@/hooks/useImageUrl";

interface DenseCardProps {
  title: string;
  subtitle?: string;
  value?: string;
  badge?: string;
  thumbnail?: string | null;
  icon?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function DenseCard({
  title,
  subtitle,
  value,
  badge,
  thumbnail,
  icon,
  onClick,
  className = "",
}: DenseCardProps) {
  const resolvedThumbnail = useImageUrl(thumbnail);

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 bg-white rounded-xl shadow-card-soft press-scale-subtle text-left transition-transform duration-150 ${className}`}
    >
      {/* Thumbnail or icon */}
      {resolvedThumbnail ? (
        <img
          src={resolvedThumbnail}
          alt={title}
          className="w-12 h-12 rounded-lg object-cover shrink-0"
        />
      ) : icon ? (
        <div className="w-12 h-12 rounded-lg bg-grey-bg flex items-center justify-center shrink-0">
          {icon}
        </div>
      ) : null}

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <p className="font-poppins font-semibold text-sm text-text-dark truncate">{title}</p>
        {subtitle && (
          <p className="font-dm text-xs text-text-grey truncate">{subtitle}</p>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 shrink-0">
        {badge && (
          <span className="font-dm text-xs text-text-muted">{badge}</span>
        )}
        {value && (
          <span className="font-poppins font-semibold text-sm text-text-dark">{value}</span>
        )}
        <ChevronRight size={16} className="text-text-muted" />
      </div>
    </button>
  );
}
