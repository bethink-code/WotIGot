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

  return (
    <h1 className={`font-poppins font-bold ${sizeStyles[size]} ${textColor} ${className}`}>
      wot<span className="text-green">i</span>got<span className="text-orange">.</span>
    </h1>
  );
}
