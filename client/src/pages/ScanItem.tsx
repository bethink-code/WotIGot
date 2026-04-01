import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Lightbulb } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import ImagePicker from "@/components/ui/ImagePicker";
import { useRecognizeItem } from "@/lib/mutations";

export default function ScanItem() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const roomId = params.get("roomId");

  const recognize = useRecognizeItem();

  const handleFileSelected = async (file: File | null) => {
    if (!file) return;

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
        });
        navigate(`/edit-item/new?${queryParams.toString()}`);
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PageHeader title="Scan Item" subtitle="Take or upload a photo" color="orange" showBack />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 animate-slideUp">
        {recognize.isPending ? (
          <AnalyzingState />
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

function AnalyzingState() {
  return (
    <div className="flex flex-col items-center gap-6 animate-fadeIn">
      {/* Scanner rings */}
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
        <p className="font-poppins font-semibold text-lg text-text-dark">Analyzing</p>
        <p className="font-dm text-sm text-text-grey mt-1">Identifying your item...</p>
      </div>
    </div>
  );
}
