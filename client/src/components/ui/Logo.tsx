interface LogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "dark" | "white";
  className?: string;
}

const sizeStyles = {
  sm: "text-2xl",
  md: "text-4xl",
  lg: "text-5xl",
};

export default function Logo({ size = "md", variant = "dark", className = "" }: LogoProps) {
  const textColor = variant === "white" ? "text-white" : "text-text-dark";

  const dimmed = variant === "white" ? "opacity-60" : "";

  return (
    <h1 className={`font-poppins font-bold ${sizeStyles[size]} ${textColor} ${className}`}>
      <span className={dimmed}>wot</span>{variant === "dark" ? <span className="text-green">i</span> : "i"}<span className={dimmed}>got</span><span className="text-orange">.</span>
    </h1>
  );
}
