import { useState, useEffect } from "react";
import { useParams } from "wouter";
import PageHeader from "@/components/ui/PageHeader";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useRoom } from "@/lib/queries";
import { useUpdateRoom } from "@/lib/mutations";

export default function EditRoom() {
  const { id } = useParams<{ id: string }>();
  const { data: room } = useRoom(Number(id));
  const updateRoom = useUpdateRoom();
  const [name, setName] = useState("");

  useEffect(() => {
    if (room) setName(room.name);
  }, [room]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    updateRoom.mutate(
      { id: Number(id), name: name.trim() },
      { onSuccess: () => window.history.back() }
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PageHeader title="Edit Room" color="orange" showBack />
      <div className="flex-1 px-4 py-4 space-y-4 animate-slideUp">
        <Input placeholder="Room name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="px-4 pb-6">
        <Button onClick={handleSubmit} disabled={!name.trim()} loading={updateRoom.isPending} color="orange">
          Save Changes
        </Button>
      </div>
    </div>
  );
}
