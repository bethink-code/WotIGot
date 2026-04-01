import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { ArrowRight } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ImagePicker from "@/components/ui/ImagePicker";
import { useCreateRoom, useGetUploadUrls } from "@/lib/mutations";
import { useHouses } from "@/lib/queries";
import { compressImage } from "@/lib/utils";
import axios from "axios";

export default function AddRoom() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preselectedHouseId = params.get("houseId");

  const { data: houses } = useHouses();
  const createRoom = useCreateRoom();
  const getUploadUrls = useGetUploadUrls();

  const [name, setName] = useState("");
  const [houseId, setHouseId] = useState(preselectedHouseId || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !houseId) return;
    setSubmitting(true);

    let imageKey: string | undefined;
    if (imageFile) {
      const compressed = await compressImage(imageFile);
      const fileName = `room_${Date.now()}.jpg`;
      const urls = await getUploadUrls.mutateAsync(fileName);
      await axios.put(urls.originalUrl, compressed, { headers: { "Content-Type": "image/jpeg" } });
      imageKey = urls.originalKey;
    }

    createRoom.mutate(
      { name: name.trim(), house_id: Number(houseId), image: imageKey },
      {
        onSuccess: () => window.history.back(),
        onSettled: () => setSubmitting(false),
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PageHeader title="Add Room" subtitle="Add a room to a property" color="orange" showBack />

      <div className="flex-1 px-4 py-4 space-y-4 animate-slideUp">
        <Input placeholder="Room name" value={name} onChange={(e) => setName(e.target.value)} />

        {!preselectedHouseId && (
          <select
            value={houseId}
            onChange={(e) => setHouseId(e.target.value)}
            className="w-full px-4 py-[14px] rounded-pill border border-[var(--border-light)] bg-white font-dm text-[15px] text-text-dark outline-none"
          >
            <option value="">Select property</option>
            {houses?.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        )}

        <ImagePicker
          value={imagePreview}
          onChange={handleImageChange}
          onRemove={() => handleImageChange(null)}
        />
      </div>

      <div className="px-4 pb-6">
        <Button
          onClick={handleSubmit}
          disabled={!name.trim() || !houseId}
          loading={submitting}
          color={name.trim() && houseId ? "orange" : undefined}
        >
          Create Room <ArrowRight size={18} />
        </Button>
      </div>
    </div>
  );
}
