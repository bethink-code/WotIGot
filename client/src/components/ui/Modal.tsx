import { type ReactNode, useEffect, useState } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ open, onClose, children }: ModalProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      requestAnimationFrame(() => setAnimating(true));
    } else {
      setAnimating(false);
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-200 ${animating ? "opacity-50" : "opacity-0"}`}
        onClick={onClose}
      />
      {/* Content */}
      <div
        className={`relative bg-white rounded-2xl shadow-float w-full max-w-sm p-6 transition-all duration-300 ${
          animating
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

// ── Confirmation Modal ──

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <h3 className="font-poppins font-bold text-lg text-text-dark">{title}</h3>
      <p className="font-dm text-text-grey mt-2 text-sm">{message}</p>
      <div className="flex gap-3 mt-6">
        <button
          onClick={onClose}
          className="flex-1 py-3 rounded-pill border border-[var(--border-medium)] font-poppins font-semibold text-sm text-text-dark press-scale"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`flex-1 py-3 rounded-pill font-poppins font-semibold text-sm text-white press-scale disabled:opacity-50 ${
            danger ? "bg-danger" : "bg-text-dark"
          }`}
        >
          {loading ? "..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
