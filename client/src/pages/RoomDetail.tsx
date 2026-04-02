import { useParams, useLocation } from "wouter";
import PageHeader from "@/components/ui/PageHeader";
import DenseCard from "@/components/ui/DenseCard";
import EmptyState from "@/components/ui/EmptyState";
import { ConfirmModal } from "@/components/ui/Modal";
import { useRoom, useRoomItems, useRoomTotals } from "@/lib/queries";
import { useDeleteRoom } from "@/lib/mutations";
import { formatRand } from "@/lib/utils";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

export default function RoomDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const roomId = Number(id);
  const { data: room } = useRoom(roomId);
  const { data: items, isLoading } = useRoomItems(roomId);
  const { data: totals } = useRoomTotals(roomId);
  const deleteRoom = useDeleteRoom();
  const [showDelete, setShowDelete] = useState(false);

  const handleDelete = () => {
    deleteRoom.mutate(roomId, { onSuccess: () => window.history.back() });
  };

  if (!room) return null;

  return (
    <div className="min-h-screen pb-24">
      <PageHeader
        title={room.name}
        subtitle={`${totals?.total_items ?? 0} items - ${formatRand(totals?.total_price)}`}
        color="orange"
        showBack
        right={
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/edit-room/${roomId}`)}
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

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-16 bg-grey-bg rounded-xl" />)}
          </div>
        ) : items?.length ? (
          <div className="flex flex-col gap-3">
            {items.map((item, i) => (
              <div key={item.id} className="animate-slideUp" style={{ animationDelay: `${i * 50}ms` }}>
                <DenseCard
                  title={`${item.brand} ${item.model}`}
                  subtitle={item.category}
                  value={formatRand(Number(item.price || 0) * (item.amount || 1))}
                  badge={item.amount > 1 ? `x${item.amount}` : undefined}
                  thumbnail={item.image}
                  onClick={() => navigate(`/item/${item.id}`)}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No items yet" />
        )}
      </div>

      <ConfirmModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Room"
        message="This will permanently delete this room and all its items."
        confirmLabel="Delete"
        danger
        loading={deleteRoom.isPending}
      />
    </div>
  );
}
