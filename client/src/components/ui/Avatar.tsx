import { useState } from "react";
import { useLocation } from "wouter";
import { getInitials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  navigateTo?: string;
  className?: string;
}

const sizeStyles = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
};

export default function Avatar({
  name,
  photoUrl,
  size = "md",
  onClick,
  navigateTo,
  className = "",
}: AvatarProps) {
  const [, navigate] = useLocation();
  const [imgError, setImgError] = useState(false);
  const showImage = photoUrl && !imgError;

  const handleClick = () => {
    if (onClick) return onClick();
    if (navigateTo) return navigate(navigateTo);
  };

  const isClickable = onClick || navigateTo;

  return (
    <div
      onClick={handleClick}
      role={isClickable ? "button" : undefined}
      className={`rounded-full shrink-0 overflow-hidden flex items-center justify-center ${sizeStyles[size]} ${
        isClickable ? "cursor-pointer press-scale" : ""
      } ${showImage ? "" : "bg-green-soft text-green font-poppins font-semibold"} ${className}`}
    >
      {showImage ? (
        <img
          src={photoUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}
