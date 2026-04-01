import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { useGeocode } from "@/lib/mutations";

type VerificationStatus = "idle" | "verifying" | "verified" | "not_found";

interface AddressVerificationProps {
  address: string;
  onVerified: (result: { formattedAddress: string; lat: number; lng: number }) => void;
}

export default function AddressVerification({ address, onVerified }: AddressVerificationProps) {
  const [status, setStatus] = useState<VerificationStatus>("idle");
  const [formattedAddress, setFormattedAddress] = useState("");
  const geocode = useGeocode();

  const handleVerify = async () => {
    if (!address.trim()) return;
    setStatus("verifying");

    geocode.mutate(address, {
      onSuccess: (result) => {
        setFormattedAddress(result.formattedAddress);
        setStatus("verified");
        onVerified({
          formattedAddress: result.formattedAddress,
          lat: result.coordinates.lat,
          lng: result.coordinates.lng,
        });
      },
      onError: () => {
        setStatus("not_found");
      },
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <StatusIndicator status={status} />
        <StatusMessage status={status} />
      </div>

      {status !== "verified" && address.trim() && (
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 px-4 py-3 rounded-pill border border-[var(--border-light)] bg-white font-dm text-sm text-text-grey truncate">
            {formattedAddress || address}
          </div>
          <button
            onClick={handleVerify}
            disabled={status === "verifying"}
            className="flex items-center gap-1.5 px-4 py-3 rounded-pill border border-[var(--border-medium)] bg-white font-dm text-sm font-medium text-text-dark press-scale disabled:opacity-50"
          >
            {status === "verifying" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <MapPin size={14} />
            )}
            Verify
          </button>
        </div>
      )}

      {status === "verified" && (
        <p className="font-dm text-xs text-green mt-1">{formattedAddress}</p>
      )}
    </div>
  );
}

function StatusIndicator({ status }: { status: VerificationStatus }) {
  const colors: Record<VerificationStatus, string> = {
    idle: "text-text-muted",
    verifying: "text-yellow animate-shimmer",
    verified: "text-green",
    not_found: "text-danger",
  };

  return <MapPin size={14} className={colors[status]} />;
}

function StatusMessage({ status }: { status: VerificationStatus }) {
  const messages: Record<VerificationStatus, string> = {
    idle: "Needs verification",
    verifying: "Verifying...",
    verified: "Verified",
    not_found: "Not found",
  };

  const colors: Record<VerificationStatus, string> = {
    idle: "text-text-muted",
    verifying: "text-yellow-dark",
    verified: "text-green",
    not_found: "text-danger",
  };

  return (
    <span className={`font-dm text-xs font-medium ${colors[status]}`}>
      {messages[status]}
    </span>
  );
}
