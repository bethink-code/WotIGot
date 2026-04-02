import { useState, useCallback } from "react";
import { Package, Camera, TrendingUp, ArrowRight } from "lucide-react";
// Camera still used in slide icons
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

export default function Onboarding({ onGetStarted, onLogin }: OnboardingProps) {
  const [phase, setPhase] = useState<"splash" | "slides">("splash");
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleLetsGo = useCallback(() => {
    setPhase("slides");
  }, []);

  const handleNext = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((s) => s + 1);
    } else {
      onGetStarted();
    }
  }, [currentSlide, onGetStarted]);

  if (phase === "splash") {
    return <SplashScreen onLetsGo={handleLetsGo} onLogin={onLogin} />;
  }

  return <SlideScreen slide={slides[currentSlide]} index={currentSlide} total={slides.length} onNext={handleNext} />;
}

// ── Splash Screen ──

function SplashScreen({ onLetsGo, onLogin }: { onLetsGo: () => void; onLogin: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-between py-12 px-6 animate-fadeIn">
      <Logo size="lg" className="mt-8" />

      <div className="w-64 h-64 rounded-3xl overflow-hidden shadow-card rotate-3 animate-float">
        <img src="/wotIgot_splash.png" alt="Inventory made easy" className="w-full h-full object-cover" />
      </div>

      <div className="flex flex-col items-center gap-4 w-full">
        <button
          onClick={onLetsGo}
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
    </div>
  );
}

// ── Slide Screen ──

function SlideScreen({
  slide,
  index,
  total,
  onNext,
}: {
  slide: Slide;
  index: number;
  total: number;
  onNext: () => void;
}) {
  const Icon = slide.icon;

  return (
    <div key={index} className="min-h-screen flex flex-col items-center justify-between py-12 px-6">
      <div />

      <div className="flex flex-col items-center animate-fadeIn" key={index}>
        {/* Icon circle */}
        <div className={`w-40 h-40 rounded-full ${slide.iconBg} flex items-center justify-center mb-8`}>
          <Icon size={56} className={slide.iconColor} />
        </div>

        {/* Title */}
        <h2 className="font-poppins font-bold text-2xl text-text-dark text-center">
          {slide.titleTop}
        </h2>
        <h2 className={`font-poppins font-bold text-2xl ${slide.titleColor} text-center`}>
          {slide.titleBottom}
        </h2>

        {/* Description */}
        <p className="font-dm text-sm text-text-grey text-center mt-3 max-w-xs">
          {slide.description}
        </p>
      </div>

      {/* Pagination + Next */}
      <div className="flex items-center justify-between w-full">
        <div className="flex gap-2">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === index ? "w-6 bg-text-dark" : "w-2 bg-text-muted/30"
              }`}
            />
          ))}
        </div>
        <button
          onClick={onNext}
          className="w-12 h-12 rounded-xl bg-text-dark flex items-center justify-center press-scale shadow-button"
        >
          <ArrowRight size={20} color="white" />
        </button>
      </div>
    </div>
  );
}
