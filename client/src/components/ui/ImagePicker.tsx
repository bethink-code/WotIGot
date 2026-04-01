import { useRef, type ChangeEvent } from "react";
import { Camera, Image as ImageIcon, X } from "lucide-react";
import { useImageUrl } from "@/hooks/useImageUrl";

interface ImagePickerProps {
  /** GCS key, full URL, or local object URL */
  value?: string | null;
  onChange: (file: File | null) => void;
  onRemove?: () => void;
  label?: string;
  sublabel?: string;
  /** "card" shows two large cards (Take Photo / Upload Photo), "compact" shows a small dashed box */
  variant?: "card" | "compact";
}

export default function ImagePicker({
  value,
  onChange,
  onRemove,
  label = "Add cover photo",
  sublabel = "Optional",
  variant = "compact",
}: ImagePickerProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const resolvedUrl = useImageUrl(value);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onChange(file);
    e.target.value = "";
  };

  // Show preview with remove button
  if (resolvedUrl) {
    return (
      <div className="relative inline-block">
        <img src={resolvedUrl} alt="Selected" className="w-20 h-20 rounded-xl object-cover" />
        {onRemove && (
          <button
            onClick={onRemove}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-text-dark flex items-center justify-center press-scale"
          >
            <X size={12} color="white" />
          </button>
        )}
      </div>
    );
  }

  // Two-card layout for scan flow
  if (variant === "card") {
    return (
      <>
        <div className="flex gap-4 w-full">
          <PickerCard
            icon={<Camera size={28} className="text-orange" />}
            title="Take Photo"
            subtitle="Use camera"
            onClick={() => cameraRef.current?.click()}
          />
          <PickerCard
            icon={<ImageIcon size={28} className="text-orange" />}
            title="Upload Photo"
            subtitle="From library"
            onClick={() => galleryRef.current?.click()}
          />
        </div>
        {/* Camera input — opens camera directly on mobile */}
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleChange} className="hidden" />
        {/* Gallery input — opens file picker / photo library */}
        <input ref={galleryRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
      </>
    );
  }

  // Compact dashed box for form fields
  return (
    <div>
      <button
        onClick={() => galleryRef.current?.click()}
        className="flex flex-col items-center justify-center w-20 h-20 rounded-xl border border-dashed border-[var(--border-medium)] press-scale-subtle"
      >
        <Camera size={20} className="text-text-muted mb-1" />
        <span className="font-dm text-[10px] text-text-grey leading-tight text-center">{label}</span>
        <span className="font-dm text-[10px] text-text-muted">{sublabel}</span>
      </button>
      <input ref={galleryRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
    </div>
  );
}

function PickerCard({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center justify-center py-6 bg-white rounded-xl border border-[var(--border-light)] press-scale-subtle"
    >
      {icon}
      <span className="font-poppins font-semibold text-sm text-text-dark mt-2">{title}</span>
      <span className="font-dm text-xs text-text-muted">{subtitle}</span>
    </button>
  );
}
