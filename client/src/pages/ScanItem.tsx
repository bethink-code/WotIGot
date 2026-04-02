import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Lightbulb } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import ImagePicker from "@/components/ui/ImagePicker";
import { useRecognizeItem, useGetUploadUrls } from "@/lib/mutations";
import { getCurrentPosition } from "@/hooks/useGeolocation";
import { compressImage, generateThumbnail } from "@/lib/utils";
import axios from "axios";

export default function ScanItem() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const roomId = params.get("roomId");

  const recognize = useRecognizeItem();
  const getUploadUrls = useGetUploadUrls();
  const [status, setStatus] = useState<"idle" | "uploading" | "analyzing">("idle");

  const handleFileSelected = async (file: File | null) => {
    if (!file) return;

    // 1. Compress, upload, and capture GPS in parallel
    setStatus("uploading");

    const [compressed, thumbnail, geoPos] = await Promise.all([
      compressImage(file, 1600, 0.8),
      generateThumbnail(file, 256, 0.7),
      getCurrentPosition(),
    ]);

    const fileName = `item_${Date.now()}.jpg`;
    const urls = await getUploadUrls.mutateAsync(fileName);

    // Upload original + thumbnail to GCS
    await Promise.all([
      axios.put(urls.originalUrl, compressed, { headers: { "Content-Type": "image/jpeg" } }),
      axios.put(urls.thumbnailUrl, thumbnail, { headers: { "Content-Type": "image/jpeg" } }),
    ]);

    // 2. Run AI recognition
    setStatus("analyzing");

    recognize.mutate(file, {
      onSuccess: (result) => {
        const queryParams = new URLSearchParams({
          roomId: roomId || "",
          brand: result.brand || "",
          model: result.model || "",
          category: result.category || "",
          price: String(result.price || ""),
          amount: String(result.amount || 1),
          priceType: "AI",
          imageKey: urls.originalKey,
          thumbnailKey: urls.thumbnailKey,
        });
        if (geoPos) {
          queryParams.set("lat", String(geoPos.lat));
          queryParams.set("lng", String(geoPos.lng));
        }
        navigate(`/edit-item/new?${queryParams.toString()}`);
      },
      onError: () => {
        setStatus("idle");
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PageHeader title="Scan Item" subtitle="Take or upload a photo" color="orange" showBack />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 animate-slideUp">
        {status !== "idle" ? (
          <AnalyzingState status={status} />
        ) : (
          <>
            <ImagePicker variant="card" onChange={handleFileSelected} />
            <p className="flex items-center gap-2 font-dm text-xs text-text-muted mt-6">
              <Lightbulb size={14} />
              AI will identify your item and estimate its value
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function AnalyzingState({ status }: { status: "uploading" | "analyzing" }) {
  return (
    <div className="flex flex-col items-center gap-6 animate-fadeIn">
      <div className="relative w-32 h-32">
        <div className="absolute inset-0 rounded-full border-2 border-green/30 animate-spin" style={{ animationDuration: "4s" }} />
        <div className="absolute inset-3 rounded-full border-2 border-green/50 animate-spin" style={{ animationDuration: "3s", animationDirection: "reverse" }} />
        <div className="absolute inset-6 rounded-full border-2 border-green/70 animate-spin" style={{ animationDuration: "2s" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-green/10 flex items-center justify-center animate-pulse">
            <div className="w-6 h-6 rounded-full bg-green" />
          </div>
        </div>
      </div>
      <div className="text-center">
        <p className="font-poppins font-semibold text-lg text-text-dark">
          {status === "uploading" ? "Uploading" : "Analyzing"}
        </p>
        <p className="font-dm text-sm text-text-grey mt-1">
          {status === "uploading" ? "Saving your photo..." : "Identifying your item..."}
        </p>
      </div>
    </div>
  );
}
