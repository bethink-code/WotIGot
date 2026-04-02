import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ChevronDown, ChevronUp, RefreshCw, Trash2, Camera } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import SectionLabel from "@/components/ui/SectionLabel";
import { useImageUrl } from "@/hooks/useImageUrl";
import { useBulkCreateItems, useReEstimateFromKey } from "@/lib/mutations";
import { useRooms } from "@/lib/queries";

interface ProductGroup {
  id: number;
  brand: string;
  model: string;
  price: number;
  category: string;
  count: number;
  priceType: "AI" | "user";
  // Store originals for delta-aware re-estimation
  originalBrand: string;
  originalModel: string;
  originalCategory: string;
  originalPrice: number;
  originalCount: number;
}

type GroupedResult = { brand: string; model: string; price: number; category: string; count: number };

interface AiUsage { inputTokens: number; outputTokens: number; estimatedCostUsd: number }

interface ScanData {
  groups: GroupedResult[];
  usage?: AiUsage;
  roomId: string;
  imageKey: string;
  thumbnailKey: string;
  lat?: number;
  lng?: number;
}

export default function ReviewScan() {
  const [, navigate] = useLocation();
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [roomId, setRoomId] = useState("");
  const [imageKey, setImageKey] = useState("");
  const [thumbnailKey, setThumbnailKey] = useState("");
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  const [roomPreset, setRoomPreset] = useState(false);
  const [error, setError] = useState("");

  const previewUrl = useImageUrl(imageKey || null);
  const { data: rooms } = useRooms();
  const bulkCreate = useBulkCreateItems();
  const reEstimate = useReEstimateFromKey();

  // Load scan results from sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem("scanResults");
    if (!raw) {
      navigate("/");
      return;
    }

    let data: ScanData;
    try {
      data = JSON.parse(raw);
      if (!Array.isArray(data.groups)) {
        console.error("[ReviewScan] invalid scan data:", data);
        navigate("/");
        return;
      }
    } catch {
      console.error("[ReviewScan] failed to parse scanResults");
      navigate("/");
      return;
    }

    setGroups(
      data.groups.map((g, i) => ({
        ...g,
        id: i,
        priceType: "AI" as const,
        originalBrand: g.brand,
        originalModel: g.model,
        originalCategory: g.category,
        originalPrice: g.price,
        originalCount: g.count,
      }))
    );
    setRoomId(data.roomId);
    if (data.roomId) setRoomPreset(true);
    setImageKey(data.imageKey);
    setThumbnailKey(data.thumbnailKey);
    if (data.lat && data.lng) setGeo({ lat: data.lat, lng: data.lng });
    if (data.usage) setTotalCost(data.usage.estimatedCostUsd);

    // Auto-expand first group
    if (data.groups.length === 1) setExpandedId(0);
  }, []);

  const updateGroup = (id: number, changes: Partial<ProductGroup>) => {
    setGroups((prev) => prev.map((g) => {
      if (g.id !== id) return g;
      const updated = { ...g, ...changes };
      // If user changed price or count from AI values, mark as user-edited
      if (updated.price !== g.originalPrice || updated.count !== g.originalCount) {
        updated.priceType = "user";
      }
      return updated;
    }));
  };

  const deleteGroup = (id: number) => {
    setGroups((prev) => prev.filter((g) => g.id !== id));
  };

  const handleReEstimate = () => {
    reEstimate.mutate(
      { imageKey },
      {
        onSuccess: (result: any) => {
          const newGroups: GroupedResult[] = result.groups ?? [];
          setGroups(
            newGroups.map((g, i) => ({
              ...g,
              id: i,
              priceType: "AI" as const,
              originalBrand: g.brand,
              originalModel: g.model,
              originalCategory: g.category,
              originalPrice: g.price,
              originalCount: g.count,
            }))
          );
          if (result.usage) setTotalCost((prev) => prev + result.usage.estimatedCostUsd);
          setError("");
          setExpandedId(null);
        },
        onError: () => setError("Re-estimation failed. Please try again."),
      }
    );
  };

  const handleSaveAll = () => {
    if (!roomId || !Number(roomId) || groups.length === 0) return;
    setSaving(true);

    bulkCreate.mutate(
      {
        roomId: Number(roomId),
        imageKey,
        thumbnailKey,
        lat: geo?.lat,
        lng: geo?.lng,
        items: groups.map((g) => ({
          brand: g.brand,
          model: g.model,
          category: g.category,
          price: String(g.price),
          price_type: g.priceType,
          amount: g.count,
        })),
      },
      {
        onSuccess: () => {
          sessionStorage.removeItem("scanResults");
          navigate(`/room/${roomId}`);
        },
        onError: () => setError("Failed to save items. Please try again."),
        onSettled: () => setSaving(false),
      }
    );
  };

  const totalItems = groups.reduce((sum, g) => sum + g.count, 0);
  const totalValue = groups.reduce((sum, g) => sum + g.price * g.count, 0);

  if (groups.length === 0 && !sessionStorage.getItem("scanResults")) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <PageHeader
        title="Review Scan"
        subtitle={`${groups.length} product${groups.length !== 1 ? "s" : ""} detected`}
        color="orange"
        showBack
      />

      <div className="flex-1 px-4 py-4 space-y-4 animate-slideUp">
        {/* Scanned image */}
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Scanned items"
            className="w-full h-48 object-cover rounded-xl shadow-card"
          />
        )}

        {/* Empty state */}
        {groups.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-12">
            <p className="font-dm text-text-grey text-center">No items detected in this photo.</p>
            <Button
              variant="secondary"
              onClick={() => { sessionStorage.removeItem("scanResults"); navigate("/add-item"); }}
              icon={<Camera size={16} />}
            >
              Scan Again
            </Button>
          </div>
        )}

        {/* Room selector (when no room was preset from scan context) */}
        {!roomPreset && groups.length > 0 && (
          <div>
            <label className="block text-xs font-dm text-text-muted mb-1 pl-4">Save to room</label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full px-4 py-[14px] rounded-xl border border-[var(--border-light)] bg-white font-dm text-[15px] text-text-dark outline-none appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 1rem center", paddingRight: "2.5rem" }}
            >
              <option value="">Select room...</option>
              {rooms?.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Re-estimate all + cost indicator */}
        {groups.length > 0 && (
          <div className="flex items-center justify-between">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleReEstimate}
              disabled={reEstimate.isPending}
              icon={<RefreshCw size={14} className={reEstimate.isPending ? "animate-spin" : ""} />}
            >
              {reEstimate.isPending ? "Re-estimating..." : "Re-estimate All"}
            </Button>
            {totalCost > 0 && (
              <span className="font-dm text-[10px] text-text-muted">
                AI cost: ${totalCost.toFixed(4)}
              </span>
            )}
          </div>
        )}

        {/* Product group cards */}
        {groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            expanded={expandedId === group.id}
            onToggle={() => setExpandedId(expandedId === group.id ? null : group.id)}
            onUpdate={(changes) => updateGroup(group.id, changes)}
            onDelete={() => deleteGroup(group.id)}
          />
        ))}

        {/* Summary */}
        {groups.length > 0 && (
          <div className="bg-green-soft rounded-xl p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-dm text-xs text-green-dark">Total Inventory</p>
                <p className="font-poppins font-semibold text-sm text-green-dark">
                  {totalItems} item{totalItems !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="font-dm text-xs text-green-dark">Estimated Value</p>
                <p className="font-poppins font-bold text-xl text-green-dark">
                  R{totalValue.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error message + Save button */}
      {groups.length > 0 && (
        <div className="px-4 pb-24 space-y-2">
          {error && (
            <p className="font-dm text-xs text-danger text-center">{error}</p>
          )}
          <Button
            onClick={handleSaveAll}
            loading={saving}
            disabled={!roomId}
            color={roomId ? "orange" : undefined}
          >
            {!roomId ? "Select a room first" : `Save ${groups.length} Item${groups.length !== 1 ? "s" : ""}`}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Product Group Card ──

interface GroupCardProps {
  group: ProductGroup;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (changes: Partial<ProductGroup>) => void;
  onDelete: () => void;
}

function GroupCard({ group, expanded, onToggle, onUpdate, onDelete }: GroupCardProps) {
  const lineTotal = group.price * group.count;

  return (
    <div className="bg-white rounded-xl border border-[var(--border-light)] overflow-hidden shadow-card">
      {/* Collapsed header — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-4 text-left press-scale-subtle"
      >
        <div className="flex-1 min-w-0 space-y-1">
          <p className="font-poppins font-semibold text-sm text-text-dark truncate leading-relaxed">
            {group.brand} {group.model}
          </p>
          <p className="font-dm text-xs text-text-grey leading-relaxed">
            {group.category} &middot; R{group.price.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} &times; {group.count} = <span className="font-semibold text-green-dark">R{lineTotal.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </p>
        </div>
        <span className={`px-2 py-0.5 rounded-full font-dm text-[10px] font-medium shrink-0 ${
          group.priceType === "AI"
            ? "bg-green-soft text-green-dark"
            : "bg-yellow-soft text-yellow-dark"
        }`}>
          {group.priceType === "AI" ? "AI" : "Edited"}
        </span>
        {expanded ? <ChevronUp size={16} className="text-text-muted shrink-0" /> : <ChevronDown size={16} className="text-text-muted shrink-0" />}
      </button>

      {/* Expanded edit form */}
      {expanded && (
        <div className="px-4 pb-4 pt-3 border-t border-[var(--border-light)] animate-fadeIn">
          <div className="bg-[var(--grey-bg)] rounded-xl p-4 space-y-3">
            <SectionLabel>DETAILS</SectionLabel>
            <Input label="Brand" placeholder="Brand" value={group.brand} onChange={(e) => onUpdate({ brand: e.target.value })} />
            <Input label="Model" placeholder="Model" value={group.model} onChange={(e) => onUpdate({ model: e.target.value })} />
            <Input label="Category" placeholder="Category" value={group.category} onChange={(e) => onUpdate({ category: e.target.value })} />

            <SectionLabel className="pt-2">PRICING</SectionLabel>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input label="Price (ZAR)" placeholder="R 0.00" type="number" step="0.01" value={String(group.price)} onChange={(e) => onUpdate({ price: Number(e.target.value) || 0 })} />
              </div>
              <div className="w-24">
                <Input label="Qty" placeholder="1" type="number" value={String(group.count)} onChange={(e) => onUpdate({ count: Number(e.target.value) || 1 })} />
              </div>
            </div>
          </div>

          <div className="pt-3">
            <Button
              size="sm"
              variant="danger"
              onClick={onDelete}
              icon={<Trash2 size={14} />}
            >
              Remove
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
