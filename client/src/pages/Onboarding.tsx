import { useState, useCallback } from "react";
import { Package, Camera, TrendingUp, ArrowRight } from "lucide-react";
import Logo from "@/components/ui/Logo";

interface OnboardingProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

interface Slide {
  icon: typeof Package;
  iconColor: string;
  iconBg: string;
  titleTop: string;
  titleBottom: string;
  titleColor: string;
  description: string;
}

const slides: Slide[] = [
  {
    icon: Package,
    iconColor: "text-green",
    iconBg: "bg-green-soft",
    titleTop: "Always",
    titleBottom: "Accurate.",
    titleColor: "text-green",
    description: "Keep a living, detailed list of your belongings.",
  },
  {
    icon: Camera,
    iconColor: "text-orange",
    iconBg: "bg-orange-soft",
    titleTop: "Smart",
    titleBottom: "Capture.",
    titleColor: "text-orange",
    description: "Just point and shoot. AI builds your inventory.",
  },
  {
    icon: TrendingUp,
    iconColor: "text-yellow",
    iconBg: "bg-yellow-soft",
    titleTop: "Up to",
    titleBottom: "Value.",
    titleColor: "text-yellow",
    description: "Get real-time market estimates automatically.",
  },
];

// Phases: splash → transition → slide-0 → slide-1 → slide-2 → done
type Phase = "splash" | "transition" | "slide";

// Timing tokens
const SCALE_TRANSITION = "transform 400ms cubic-bezier(0.4, 0, 0.2, 1)";
const OPACITY_TRANSITION = "opacity 300ms ease";
const COMBINED = `${SCALE_TRANSITION}, ${OPACITY_TRANSITION}`;

export default function Onboarding({ onGetStarted, onLogin }: OnboardingProps) {
  const [phase, setPhase] = useState<Phase>("splash");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slidePhase, setSlidePhase] = useState<"entering" | "idle" | "exiting">("entering");

  const handleLetsGo = useCallback(() => {
    setPhase("transition");
    setTimeout(() => {
      setPhase("slide");
      setSlidePhase("entering");
      setTimeout(() => setSlidePhase("idle"), 50);
    }, 400);
  }, []);

  const handleNext = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setSlidePhase("exiting");
      setTimeout(() => {
        setCurrentSlide((s) => s + 1);
        setSlidePhase("entering");
        setTimeout(() => setSlidePhase("idle"), 50);
      }, 350);
    } else {
      onGetStarted();
    }
  }, [currentSlide, onGetStarted]);

  const isSplashVisible = phase === "splash";
  const isTransitioning = phase === "transition";
  const isSlideVisible = phase === "slide";
  const isSlideIdle = isSlideVisible && slidePhase === "idle";
  const isSlideExiting = isSlideVisible && slidePhase === "exiting";

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="min-h-screen flex flex-col items-center justify-between py-12 px-6 overflow-hidden">

      {/* ── Splash layer ── */}
      {/* Logo */}
      <div
        style={{
          transition: COMBINED,
          opacity: isSplashVisible ? 1 : 0,
          transform: isSplashVisible ? "scale(1)" : "scale(0.9)",
          pointerEvents: isSplashVisible ? "auto" : "none",
        }}
        className="mt-8"
      >
        <Logo size="lg" />
      </div>

      {/* Center area — shared by hero image and slide content */}
      <div className="relative w-full flex items-center justify-center" style={{ minHeight: 280 }}>
        {/* Hero image (splash) */}
        <div
          className="absolute"
          style={{
            transition: COMBINED,
            opacity: isSplashVisible ? 1 : 0,
            transform: isSplashVisible ? "scale(1) rotate(3deg)" : "scale(0.8) rotate(3deg)",
            pointerEvents: "none",
          }}
        >
          <div className="w-64 h-64 rounded-3xl overflow-hidden shadow-card animate-float">
            <img src="/wotIgot_splash.png" alt="Inventory made easy" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Slide content */}
        <div
          className="absolute flex flex-col items-center"
          style={{
            transition: COMBINED,
            opacity: isSlideIdle ? 1 : 0,
            transform: isSlideIdle ? "scale(1)" : isSlideExiting ? "scale(0.8)" : "scale(0.5)",
            pointerEvents: isSlideVisible ? "auto" : "none",
          }}
        >
          {/* Icon circle */}
          <div
            className={`w-40 h-40 rounded-full ${slide.iconBg} flex items-center justify-center mb-8`}
            style={{
              transition: `transform 400ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms ease`,
              opacity: isSlideIdle ? 1 : 0,
              transform: isSlideIdle ? "scale(1)" : "scale(0.5)",
            }}
          >
            <Icon size={56} className={slide.iconColor} />
          </div>

          {/* Title */}
          <div
            style={{
              transition: `transform 400ms cubic-bezier(0.4, 0, 0.2, 1) 150ms, opacity 300ms ease 150ms`,
              opacity: isSlideIdle ? 1 : 0,
              transform: isSlideIdle ? "translateY(0)" : "translateY(12px)",
            }}
          >
            <h2 className="font-poppins font-bold text-2xl text-text-dark text-center">
              {slide.titleTop}
            </h2>
            <h2 className={`font-poppins font-bold text-2xl ${slide.titleColor} text-center`}>
              {slide.titleBottom}
            </h2>
          </div>

          {/* Description */}
          <p
            className="font-dm text-sm text-text-grey text-center mt-3 max-w-xs"
            style={{
              transition: `transform 400ms cubic-bezier(0.4, 0, 0.2, 1) 250ms, opacity 300ms ease 250ms`,
              opacity: isSlideIdle ? 1 : 0,
              transform: isSlideIdle ? "translateY(0)" : "translateY(8px)",
            }}
          >
            {slide.description}
          </p>
        </div>
      </div>

      {/* ── Bottom area — CTA buttons (splash) or pagination (slides) ── */}
      <div className="w-full relative" style={{ minHeight: 56 }}>
        {/* Splash CTA */}
        <div
          className="absolute inset-0 flex flex-col items-center gap-4"
          style={{
            transition: COMBINED,
            opacity: isSplashVisible ? 1 : 0,
            transform: isSplashVisible ? "scale(1)" : "scale(0.95)",
            pointerEvents: isSplashVisible ? "auto" : "none",
          }}
        >
          <button
            onClick={handleLetsGo}
            className="flex items-center gap-2 px-8 py-3.5 bg-text-dark text-white rounded-pill font-poppins font-semibold text-[15px] press-scale shadow-button"
          >
            Let's Go <ArrowRight size={18} />
          </button>
          <div className="font-dm text-sm text-text-grey">
            Already have an account?{" "}
            <span onClick={onLogin} className="font-semibold text-text-dark underline cursor-pointer" role="button">
              Log In
            </span>
          </div>
        </div>

        {/* Slide pagination + next */}
        <div
          className="absolute inset-0 flex items-center justify-between"
          style={{
            transition: COMBINED,
            opacity: isSlideVisible ? 1 : 0,
            transform: isSlideVisible ? "scale(1)" : "scale(0.8)",
            pointerEvents: isSlideVisible ? "auto" : "none",
          }}
        >
          <div className="flex gap-2">
            {Array.from({ length: slides.length }).map((_, i) => (
              <div
                key={i}
                className="h-2 rounded-full"
                style={{
                  width: i === currentSlide ? 24 : 8,
                  backgroundColor: i === currentSlide ? "var(--text-dark)" : "rgba(149, 165, 166, 0.3)",
                  transition: "width 300ms cubic-bezier(0.2, 0, 0, 1), background-color 300ms ease",
                }}
              />
            ))}
          </div>
          <button
            onClick={handleNext}
            className="w-12 h-12 rounded-xl bg-text-dark flex items-center justify-center press-scale shadow-button"
          >
            <ArrowRight size={20} color="white" />
          </button>
        </div>
      </div>
    </div>
  );
}
