import { useRef, type ChangeEvent } from "react";
import { Camera, Image as ImageIcon, X } from "lucide-react";

interface ImagePickerProps {
  value?: string | null;
  onChange: (file: File | null) => void;
  onRemove?: () => void;
  label?: string;
  sublabel?: string;
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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onChange(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  if (value) {
    return (
      <div className="relative inline-block">
        <img src={value} alt="Selected" className="w-20 h-20 rounded-xl object-cover" />
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

  if (variant === "card") {
    return (
      <div className="flex gap-4">
        <PickerCard
          icon={<Camera size={28} className="text-orange" />}
          title="Take Photo"
          subtitle="Use camera"
          onClick={() => inputRef.current?.click()}
        />
        <PickerCard
          icon={<ImageIcon size={28} className="text-orange" />}
          title="Upload Photo"
          subtitle="From library"
          onClick={() => inputRef.current?.click()}
        />
        <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center w-20 h-20 rounded-xl border border-dashed border-[var(--border-medium)] press-scale-subtle"
      >
        <Camera size={20} className="text-text-muted mb-1" />
        <span className="font-dm text-[10px] text-text-grey leading-tight text-center">{label}</span>
        <span className="font-dm text-[10px] text-text-muted">{sublabel}</span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
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
