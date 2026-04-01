import { useState, useEffect } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import { ArrowRight } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import SectionLabel from "@/components/ui/SectionLabel";
import { useImageUrl } from "@/hooks/useImageUrl";
import { useItem } from "@/lib/queries";
import { useCreateItem, useUpdateItem, useAddItemImage } from "@/lib/mutations";
import { useRooms } from "@/lib/queries";

export default function EditItem() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const isNew = id === "new";

  // Image keys passed from ScanItem
  const imageKey = params.get("imageKey");
  const thumbnailKey = params.get("thumbnailKey");

  const { data: existingItem } = useItem(isNew ? undefined : Number(id));
  const { data: rooms } = useRooms();
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const addItemImage = useAddItemImage();

  const [brand, setBrand] = useState(params.get("brand") || "");
  const [model, setModel] = useState(params.get("model") || "");
  const [category, setCategory] = useState(params.get("category") || "");
  const [price, setPrice] = useState(params.get("price") || "");
  const [amount, setAmount] = useState(params.get("amount") || "1");
  const [priceType, setPriceType] = useState(params.get("priceType") || "user");
  const [description, setDescription] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [roomId, setRoomId] = useState(params.get("roomId") || "");
  const [submitting, setSubmitting] = useState(false);

  // Preview the scanned image
  const previewUrl = useImageUrl(imageKey);

  useEffect(() => {
    if (existingItem) {
      setBrand(existingItem.brand);
      setModel(existingItem.model);
      setCategory(existingItem.category);
      setPrice(existingItem.price ?? "");
      setAmount(String(existingItem.amount));
      setPriceType(existingItem.price_type);
      setDescription(existingItem.description || "");
      setSerialNumber(existingItem.serial_number || "");
      setRoomId(String(existingItem.room_id));
    }
  }, [existingItem]);

  const handleSubmit = async () => {
    if (!brand || !model || !category) return;
    setSubmitting(true);

    if (isNew) {
      createItem.mutate(
        {
          room_id: Number(roomId),
          brand, model, category,
          price: price || undefined,
          price_type: priceType,
          amount: Number(amount) || 1,
          description: description || undefined,
          serial_number: serialNumber || undefined,
          image: imageKey || undefined,
        },
        {
          onSuccess: (newItem) => {
            // Attach the scanned image as primary ItemImage
            if (imageKey) {
              addItemImage.mutate({
                itemId: newItem.id,
                url: imageKey,
                thumbnail_url: thumbnailKey || undefined,
                is_primary: true,
              });
            }
            navigate("/");
          },
          onSettled: () => setSubmitting(false),
        }
      );
    } else {
      updateItem.mutate(
        {
          id: Number(id),
          brand, model, category,
          price: price || undefined,
          price_type: priceType,
          amount: Number(amount) || 1,
          description: description || undefined,
          serial_number: serialNumber || undefined,
        },
        {
          onSuccess: () => window.history.back(),
          onSettled: () => setSubmitting(false),
        }
      );
    }
  };

  const isValid = brand && model && category && (isNew ? !!roomId : true);

  return (
    <div className="min-h-screen flex flex-col">
      <PageHeader
        title={isNew ? "Add Item" : "Edit Item"}
        subtitle={isNew ? "Review AI results" : "Update item details"}
        color="orange"
        showBack
      />

      <div className="flex-1 px-4 py-4 space-y-4 animate-slideUp">
        {/* Scanned image preview */}
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Scanned item"
            className="w-full h-48 object-cover rounded-xl shadow-card"
          />
        )}

        {/* AI price badge */}
        {priceType === "AI" && price && (
          <div className="bg-green-soft rounded-xl p-4 text-center">
            <p className="font-dm text-xs text-green-dark">AI Estimated Price</p>
            <p className="font-poppins font-bold text-2xl text-green-dark">R{price}</p>
          </div>
        )}

        {/* Room selector (only for new items without preset room) */}
        {isNew && !params.get("roomId") && (
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full px-4 py-[14px] rounded-pill border border-[var(--border-light)] bg-white font-dm text-[15px] text-text-dark outline-none"
          >
            <option value="">Select room</option>
            {rooms?.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        )}

        <SectionLabel>ITEM DETAILS</SectionLabel>
        <Input placeholder="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
        <Input placeholder="Model" value={model} onChange={(e) => setModel(e.target.value)} />
        <Input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
        <Input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />

        <SectionLabel>PRICING</SectionLabel>
        <Input placeholder="Price (ZAR)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        <Input placeholder="Quantity" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Input placeholder="Serial number (optional)" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
      </div>

      <div className="px-4 pb-24">
        <Button
          onClick={handleSubmit}
          disabled={!isValid}
          loading={submitting}
          color={isValid ? "orange" : undefined}
        >
          {isNew ? "Save Item" : "Update Item"} <ArrowRight size={18} />
        </Button>
      </div>
    </div>
  );
}
