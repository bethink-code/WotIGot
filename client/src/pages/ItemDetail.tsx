import { useParams, useLocation } from "wouter";
import { useRef, useState, type ChangeEvent } from "react";
import PageHeader from "@/components/ui/PageHeader";
import SectionLabel from "@/components/ui/SectionLabel";
import { ConfirmModal } from "@/components/ui/Modal";
import { useImageUrl } from "@/hooks/useImageUrl";
import { useItem, useItemImages } from "@/lib/queries";
import { useDeleteItem, useDeleteItemImage, useSetPrimaryImage, useAddItemImage, useGetUploadUrls } from "@/lib/mutations";
import { formatRand, compressImage, generateThumbnail } from "@/lib/utils";
import { Pencil, Trash2, Star, X, Plus, Camera } from "lucide-react";
import type { ItemImage } from "@shared/schema";
import axios from "axios";

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const itemId = Number(id);
  const { data: item } = useItem(itemId);
  const { data: images } = useItemImages(itemId);
  const deleteItem = useDeleteItem();
  const [showDelete, setShowDelete] = useState(false);

  const handleDelete = () => {
    deleteItem.mutate(itemId, { onSuccess: () => window.history.back() });
  };

  if (!item) return null;

  const primaryImage = images?.find((img) => img.is_primary);
  const otherImages = images?.filter((img) => !img.is_primary) ?? [];
  const allImages = images ?? [];

  return (
    <div className="min-h-screen pb-24">
      <PageHeader
        title={`${item.brand} ${item.model}`}
        subtitle={item.category}
        color="orange"
        showBack
        right={
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/edit-item/${itemId}`)}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center press-scale"
            >
              <Pencil size={16} color="white" />
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center press-scale"
            >
              <Trash2 size={16} color="white" />
            </button>
          </div>
        }
      />

      <div className="px-4 py-4 space-y-6 animate-slideUp">
        {/* Primary image */}
        {primaryImage && <PrimaryImageDisplay image={primaryImage} alt={item.brand} />}

        {/* Value card */}
        <div className="bg-white rounded-xl shadow-card p-4">
          <SectionLabel className="mb-2">VALUE</SectionLabel>
          <p className="font-poppins font-bold text-3xl text-text-dark">
            {formatRand(item.price)}
          </p>
          <p className="font-dm text-xs text-text-muted mt-1">
            {item.price_type === "AI" ? "AI estimated" : item.price_type === "invoice" ? "From invoice" : "User entered"}
            {item.amount > 1 && ` - ${item.amount} items`}
          </p>
        </div>

        {/* Details */}
        <div className="bg-white rounded-xl shadow-card p-4 space-y-3">
          <SectionLabel>DETAILS</SectionLabel>
          <DetailRow label="Brand" value={item.brand} />
          <DetailRow label="Model" value={item.model} />
          <DetailRow label="Category" value={item.category} />
          {item.description && <DetailRow label="Description" value={item.description} />}
          {item.serial_number && <DetailRow label="Serial Number" value={item.serial_number} />}
          <DetailRow label="Quantity" value={String(item.amount)} />
        </div>

        {/* Photo gallery */}
        <ImageGallery itemId={itemId} images={allImages} />
      </div>

      <ConfirmModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Item"
        message="This will permanently delete this item and all its photos."
        confirmLabel="Delete"
        danger
        loading={deleteItem.isPending}
      />
    </div>
  );
}

// ── Primary Image ──

function PrimaryImageDisplay({ image, alt }: { image: ItemImage; alt: string }) {
  const url = useImageUrl(image.url);
  if (!url) return null;
  return <img src={url} alt={alt} className="w-full h-56 object-cover rounded-xl shadow-card" />;
}

// ── Image Gallery ──

function ImageGallery({ itemId, images }: { itemId: number; images: ItemImage[] }) {
  const deleteImage = useDeleteItemImage();
  const setPrimary = useSetPrimaryImage();
  const addImage = useAddItemImage();
  const getUploadUrls = useGetUploadUrls();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleAddPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    try {
      const [compressed, thumbnail] = await Promise.all([
        compressImage(file, 1600, 0.8),
        generateThumbnail(file, 256, 0.7),
      ]);

      const fileName = `photo_${Date.now()}.jpg`;
      const urls = await getUploadUrls.mutateAsync(fileName);

      await Promise.all([
        axios.put(urls.originalUrl, compressed, { headers: { "Content-Type": "image/jpeg" } }),
        axios.put(urls.thumbnailUrl, thumbnail, { headers: { "Content-Type": "image/jpeg" } }),
      ]);

      addImage.mutate({
        itemId,
        url: urls.originalKey,
        thumbnail_url: urls.thumbnailKey,
        is_primary: images.length === 0,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>{`PHOTOS (${images.length})`}</SectionLabel>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1 text-green font-dm text-xs font-medium press-scale disabled:opacity-50"
        >
          {uploading ? "Uploading..." : <><Camera size={14} /> Add Photo</>}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {images.map((img) => (
          <ImageTile
            key={img.id}
            image={img}
            onSetPrimary={() => setPrimary.mutate({ itemId, imageId: img.id })}
            onDelete={() => deleteImage.mutate({ itemId, imageId: img.id })}
          />
        ))}

        {/* Add photo tile */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="aspect-square rounded-lg border-2 border-dashed border-[var(--border-medium)] flex flex-col items-center justify-center gap-1 press-scale-subtle disabled:opacity-50"
        >
          <Plus size={20} className="text-text-muted" />
          <span className="font-dm text-[10px] text-text-muted">Add</span>
        </button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" onChange={handleAddPhoto} className="hidden" />
    </div>
  );
}

// ── Detail Row ──

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="font-dm text-sm text-text-grey">{label}</span>
      <span className="font-dm text-sm font-medium text-text-dark text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}

// ── Image Tile ──

function ImageTile({
  image,
  onSetPrimary,
  onDelete,
}: {
  image: ItemImage;
  onSetPrimary: () => void;
  onDelete: () => void;
}) {
  const url = useImageUrl(image.thumbnail_url || image.url);

  return (
    <div className="relative group">
      {url ? (
        <img src={url} alt="" className="w-full aspect-square object-cover rounded-lg" />
      ) : (
        <div className="w-full aspect-square rounded-lg bg-grey-bg animate-pulse" />
      )}
      {image.is_primary && (
        <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-yellow flex items-center justify-center">
          <Star size={10} color="white" fill="white" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
        {!image.is_primary && (
          <button onClick={onSetPrimary} className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
            <Star size={14} className="text-yellow" />
          </button>
        )}
        <button onClick={onDelete} className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
          <X size={14} className="text-danger" />
        </button>
      </div>
    </div>
  );
}
