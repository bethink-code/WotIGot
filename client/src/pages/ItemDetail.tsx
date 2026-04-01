import { useParams, useLocation } from "wouter";
import PageHeader from "@/components/ui/PageHeader";
import SectionLabel from "@/components/ui/SectionLabel";
import { ConfirmModal } from "@/components/ui/Modal";
import { useItem, useItemImages } from "@/lib/queries";
import { useDeleteItem, useDeleteItemImage, useSetPrimaryImage } from "@/lib/mutations";
import { formatRand } from "@/lib/utils";
import { useState } from "react";
import { Pencil, Trash2, Star, X } from "lucide-react";
import type { ItemImage } from "@shared/schema";

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const itemId = Number(id);
  const { data: item } = useItem(itemId);
  const { data: images } = useItemImages(itemId);
  const deleteItem = useDeleteItem();
  const deleteImage = useDeleteItemImage();
  const setPrimary = useSetPrimaryImage();
  const [showDelete, setShowDelete] = useState(false);

  const handleDelete = () => {
    deleteItem.mutate(itemId, { onSuccess: () => window.history.back() });
  };

  if (!item) return null;

  const primaryImage = images?.find((img) => img.is_primary);
  const otherImages = images?.filter((img) => !img.is_primary) ?? [];

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
        {primaryImage && (
          <img
            src={primaryImage.url}
            alt={item.brand}
            className="w-full h-56 object-cover rounded-xl shadow-card"
          />
        )}

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

        {/* Additional images */}
        {otherImages.length > 0 && (
          <div>
            <SectionLabel className="mb-3">PHOTOS</SectionLabel>
            <div className="grid grid-cols-3 gap-2">
              {otherImages.map((img) => (
                <ImageTile
                  key={img.id}
                  image={img}
                  onSetPrimary={() => setPrimary.mutate({ itemId, imageId: img.id })}
                  onDelete={() => deleteImage.mutate({ itemId, imageId: img.id })}
                />
              ))}
            </div>
          </div>
        )}
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="font-dm text-sm text-text-grey">{label}</span>
      <span className="font-dm text-sm font-medium text-text-dark text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}

function ImageTile({
  image,
  onSetPrimary,
  onDelete,
}: {
  image: ItemImage;
  onSetPrimary: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="relative group">
      <img
        src={image.thumbnail_url || image.url}
        alt=""
        className="w-full aspect-square object-cover rounded-lg"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
        <button onClick={onSetPrimary} className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
          <Star size={14} className="text-yellow" />
        </button>
        <button onClick={onDelete} className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
          <X size={14} className="text-danger" />
        </button>
      </div>
    </div>
  );
}
