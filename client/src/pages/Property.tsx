import { useParams, useLocation } from "wouter";
import PageHeader from "@/components/ui/PageHeader";
import DenseCard from "@/components/ui/DenseCard";
import EmptyState from "@/components/ui/EmptyState";
import { useHouse, useHouseRooms, useHouseTotals } from "@/lib/queries";
import { useDeleteHouse } from "@/lib/mutations";
import { ConfirmModal } from "@/components/ui/Modal";
import { formatRand } from "@/lib/utils";
import { useState } from "react";
import { Pencil, Trash2, FileSpreadsheet, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import { downloadBlob } from "@/lib/utils";

export default function Property() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const houseId = Number(id);
  const { data: house } = useHouse(houseId);
  const { data: rooms, isLoading } = useHouseRooms(houseId);
  const { data: totals } = useHouseTotals(houseId);
  const deleteHouse = useDeleteHouse();
  const [showDelete, setShowDelete] = useState(false);

  const handleExport = async () => {
    const res = await api.get(`/houses/${houseId}/xlsx`, { responseType: "blob" });
    downloadBlob(res.data, `${house?.name || "property"}.xlsx`);
  };

  const handleDelete = () => {
    deleteHouse.mutate(houseId, { onSuccess: () => navigate("/") });
  };

  if (!house) return null;

  return (
    <div className="min-h-screen pb-24">
      <PageHeader
        title={house.name}
        subtitle={`${totals?.total_items ?? 0} items - ${formatRand(totals?.total_price)}`}
        color="yellow"
        showBack
        right={
          <div className="flex gap-2">
            <HeaderAction icon={<FileSpreadsheet size={16} color="white" />} onClick={handleExport} />
            <HeaderAction icon={<Pencil size={16} color="white" />} onClick={() => navigate(`/edit-house/${houseId}`)} />
            <HeaderAction icon={<Trash2 size={16} color="white" />} onClick={() => setShowDelete(true)} />
          </div>
        }
      />

      {/* Address verification status */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-1.5">
          <MapPin size={12} className={house.location_lat ? "text-green" : "text-text-muted"} />
          <span className={`font-dm text-xs ${house.location_lat ? "text-green" : "text-text-muted"}`}>
            {house.location_lat ? "Verified address" : "Address not verified"}
          </span>
        </div>
        <p className="font-dm text-xs text-text-grey mt-0.5 ml-[18px]">{house.address}</p>
      </div>

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-16 bg-grey-bg rounded-xl" />)}
          </div>
        ) : rooms?.length ? (
          <div className="flex flex-col gap-3">
            {rooms.map((room, i) => (
              <div key={room.id} className="animate-slideUp" style={{ animationDelay: `${i * 50}ms` }}>
                <DenseCard
                  title={room.name}
                  value={formatRand(room.total_value)}
                  badge={`${room.total_items} items`}
                  thumbnail={room.image}
                  onClick={() => navigate(`/room/${room.id}`)}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No rooms yet" />
        )}
      </div>

      <ConfirmModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Property"
        message="This will permanently delete this property and all its rooms and items."
        confirmLabel="Delete"
        danger
        loading={deleteHouse.isPending}
      />
    </div>
  );
}

function HeaderAction({ icon, onClick }: { icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center press-scale"
    >
      {icon}
    </button>
  );
}
