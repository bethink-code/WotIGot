import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ImagePicker from "@/components/ui/ImagePicker";
import AddressVerification from "@/components/ui/AddressVerification";
import { useCreateHouse } from "@/lib/mutations";
import { useGetUploadUrls } from "@/lib/mutations";
import { compressImage, generateThumbnail } from "@/lib/utils";
import axios from "axios";

export default function AddProperty() {
  const [, navigate] = useLocation();
  const createHouse = useCreateHouse();
  const getUploadUrls = useGetUploadUrls();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);

    let imageKey: string | undefined;

    if (imageFile) {
      const compressed = await compressImage(imageFile);
      const fileName = `property_${Date.now()}.jpg`;
      const urls = await getUploadUrls.mutateAsync(fileName);
      await axios.put(urls.originalUrl, compressed, { headers: { "Content-Type": "image/jpeg" } });
      imageKey = urls.originalKey;
    }

    createHouse.mutate(
      {
        name: name.trim(),
        address: address.trim(),
        image: imageKey,
        location_lat: location?.lat,
        location_long: location?.lng,
      },
      {
        onSuccess: () => navigate("/"),
        onSettled: () => setSubmitting(false),
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PageHeader title="Add Property" subtitle="Capture key details" color="yellow" showBack />

      <div className="flex-1 px-4 py-4 space-y-4 animate-slideUp">
        <Input placeholder="Property name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />

        {address && (
          <AddressVerification
            address={address}
            onVerified={({ lat, lng }) => setLocation({ lat, lng })}
          />
        )}

        <ImagePicker
          value={imagePreview}
          onChange={handleImageChange}
          onRemove={() => handleImageChange(null)}
        />
      </div>

      <div className="px-4 pb-24">
        <Button
          onClick={handleSubmit}
          disabled={!name.trim()}
          loading={submitting}
          color={name.trim() ? "yellow" : undefined}
        >
          Create Property <ArrowRight size={18} />
        </Button>
      </div>
    </div>
  );
}
