import { useParams, useLocation } from "wouter";
import { createPortal } from "react-dom";
import { useRef, useState, type ChangeEvent } from "react";
import PageHeader from "@/components/ui/PageHeader";
import SectionLabel from "@/components/ui/SectionLabel";
import Modal, { ConfirmModal } from "@/components/ui/Modal";
import { useImageUrl } from "@/hooks/useImageUrl";
import { useItem, useItemImages } from "@/lib/queries";
import { useDeleteItem, useDeleteItemImage, useSetPrimaryImage, useAddItemImage, useGetUploadUrls, useReEstimate } from "@/lib/mutations";
import Button from "@/components/ui/Button";
import { formatRand, compressImage, generateThumbnail } from "@/lib/utils";
import { getCurrentPosition } from "@/hooks/useGeolocation";
import { Pencil, Trash2, Star, X, Plus, Camera, MapPin, RefreshCw } from "lucide-react";
import type { ItemImage } from "@shared/schema";
import axios from "axios";

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const itemId = Number(id);
  const { data: item } = useItem(itemId);
  const { data: images } = useItemImages(itemId);
  const deleteItem = useDeleteItem();
  const reEstimate = useReEstimate();
  const [showDelete, setShowDelete] = useState(false);
  const [estimating, setEstimating] = useState(false);

  const handleDelete = () => {
    deleteItem.mutate(itemId, { onSuccess: () => window.history.back() });
  };

  const handleReEstimate = () => {
    if (!item) return;
    setEstimating(true);
    reEstimate.mutate(
      { itemId, brand: item.brand, model: item.model, category: item.category },
      {
        onSuccess: (result: any) => {
          setEstimating(false);
          const params = new URLSearchParams({
            brand: result.brand || item.brand,
            model: result.model || item.model,
            category: result.category || item.category,
            price: result.price ? String(result.price) : item.price || "",
            amount: String(result.amount || item.amount),
            priceType: "AI",
          });
          navigate(`/edit-item/${itemId}?${params.toString()}`);
        },
        onError: () => setEstimating(false),
      }
    );
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
            {formatRand(Number(item.price || 0) * (item.amount || 1))}
          </p>
          <div className="flex items-center justify-between mt-1">
            <p className="font-dm text-xs text-text-muted">
              {item.price_type === "AI" ? "AI estimated" : item.price_type === "invoice" ? "From invoice" : "User entered"}
              {item.amount > 1 && ` \u2013 ${formatRand(item.price)} \u00d7 ${item.amount}`}
            </p>
            <Button
              size="sm"
              variant="secondary"
              fullWidth={false}
              onClick={handleReEstimate}
              disabled={estimating || (!item.image && !allImages.length)}
              icon={<RefreshCw size={12} className={estimating ? "animate-spin" : ""} />}
            >
              {estimating ? "Estimating..." : "New Estimate"}
            </Button>
          </div>
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
  const [selectedImage, setSelectedImage] = useState<ItemImage | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleAddPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    try {
      const [compressed, thumbnail, geoPos] = await Promise.all([
        compressImage(file, 1600, 0.8),
        generateThumbnail(file, 256, 0.7),
        getCurrentPosition(),
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
        location_lat: geoPos?.lat,
        location_long: geoPos?.lng,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = () => {
    if (!selectedImage) return;
    deleteImage.mutate(
      { itemId, imageId: selectedImage.id },
      { onSuccess: () => { setShowDeleteConfirm(false); setSelectedImage(null); } }
    );
  };

  const handleSetPrimary = () => {
    if (!selectedImage) return;
    setPrimary.mutate(
      { itemId, imageId: selectedImage.id },
      { onSuccess: () => setSelectedImage(null) }
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>{`PHOTOS (${images.length})`}</SectionLabel>
        <Button
          size="sm"
          variant="secondary"
          fullWidth={false}
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          icon={<Camera size={12} />}
        >
          {uploading ? "Uploading..." : "Add Photo"}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {images.map((img) => (
          <ImageTile key={img.id} image={img} onClick={() => setSelectedImage(img)} />
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

      {/* Photo detail modal */}
      {selectedImage && (
        <PhotoDetailModal
          image={selectedImage}
          open={!!selectedImage && !showDeleteConfirm}
          onClose={() => setSelectedImage(null)}
          onSetPrimary={handleSetPrimary}
          onDelete={() => setShowDeleteConfirm(true)}
        />
      )}

      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeletePhoto}
        title="Delete Photo"
        message="This photo will be permanently removed."
        confirmLabel="Delete"
        danger
        loading={deleteImage.isPending}
      />
    </div>
  );
}

// ── Photo Detail Modal (full-screen) ──

function PhotoDetailModal({
  image,
  open,
  onClose,
  onSetPrimary,
  onDelete,
}: {
  image: ItemImage;
  open: boolean;
  onClose: () => void;
  onSetPrimary: () => void;
  onDelete: () => void;
}) {
  const fullUrl = useImageUrl(image.url);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-black/65" onClick={onClose}>
      {/* Close button */}
      <div className="flex justify-end p-4">
        <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center press-scale">
          <X size={20} color="white" />
        </button>
      </div>

      {/* Image — takes up available space */}
      <div className="flex-1 flex items-center justify-center px-4 min-h-0" onClick={(e) => e.stopPropagation()}>
        {fullUrl ? (
          <img src={fullUrl} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
        ) : (
          <div className="w-64 h-64 rounded-lg bg-white/10 animate-pulse" />
        )}
      </div>

      {/* Bottom panel */}
      <div className="bg-white rounded-t-2xl p-4 mt-4 w-full max-w-[520px] mx-auto" onClick={(e) => e.stopPropagation()}>
        {/* Meta badges */}
        <div className="flex items-center gap-2 mb-2">
          {image.is_primary && (
            <span className="flex items-center gap-1 text-[10px] font-dm font-semibold text-yellow-dark bg-yellow-soft px-2 py-0.5 rounded-pill">
              <Star size={10} fill="currentColor" /> Primary
            </span>
          )}
          {image.location_lat ? (
            <span className="flex items-center gap-1 text-[10px] font-dm font-semibold text-green bg-green-soft px-2 py-0.5 rounded-pill">
              <MapPin size={10} /> Geolocated
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-dm font-semibold text-text-muted bg-grey-bg px-2 py-0.5 rounded-pill">
              <MapPin size={10} /> No location
            </span>
          )}
        </div>

        {image.location_lat && image.location_long && (
          <p className="font-dm text-[10px] text-text-muted">
            {image.location_lat.toFixed(6)}, {image.location_long.toFixed(6)}
          </p>
        )}
        <p className="font-dm text-[10px] text-text-muted mt-0.5">
          Captured {new Date(image.created_at).toLocaleString()}
        </p>

        {/* Actions */}
        <div className="flex gap-3 mt-3">
          {!image.is_primary && (
            <Button
              size="sm"
              color="yellow"
              icon={<Star size={12} />}
              onClick={onSetPrimary}
            >
              Set as Primary
            </Button>
          )}
          <Button
            size="sm"
            variant="danger"
            icon={<Trash2 size={12} />}
            onClick={onDelete}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>,
    document.body
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

function ImageTile({ image, onClick }: { image: ItemImage; onClick: () => void }) {
  const url = useImageUrl(image.thumbnail_url || image.url);

  return (
    <button onClick={onClick} className="relative press-scale-subtle">
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
      {image.location_lat && (
        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-green flex items-center justify-center">
          <MapPin size={10} color="white" />
        </div>
      )}
    </button>
  );
}
