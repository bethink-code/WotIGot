import { getInitials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
};

export default function Avatar({ name, size = "md", className = "" }: AvatarProps) {
  return (
    <div
      className={`rounded-full bg-green-soft text-green font-poppins font-semibold flex items-center justify-center shrink-0 ${sizeStyles[size]} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
