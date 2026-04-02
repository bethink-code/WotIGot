import { useState, useEffect } from "react";
import { useParams } from "wouter";
import PageHeader from "@/components/ui/PageHeader";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import AddressVerification from "@/components/ui/AddressVerification";
import { useHouse } from "@/lib/queries";
import { useUpdateHouse } from "@/lib/mutations";

export default function EditHouse() {
  const { id } = useParams<{ id: string }>();
  const { data: house } = useHouse(Number(id));
  const updateHouse = useUpdateHouse();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (house) {
      setName(house.name);
      setAddress(house.address);
      if (house.location_lat && house.location_long) {
        setLocation({ lat: house.location_lat, lng: house.location_long });
      }
    }
  }, [house]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    updateHouse.mutate(
      {
        id: Number(id),
        name: name.trim(),
        address: address.trim(),
        location_lat: location?.lat,
        location_long: location?.lng,
      },
      { onSuccess: () => window.history.back() }
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PageHeader title="Edit Property" color="yellow" showBack />
      <div className="flex-1 px-4 py-4 space-y-4 animate-slideUp">
        <Input placeholder="Property name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Address" value={address} onChange={(e) => { setAddress(e.target.value); setLocation(null); }} />

        {address && (
          <AddressVerification
            address={address}
            onVerified={({ lat, lng }) => setLocation({ lat, lng })}
          />
        )}
      </div>
      <div className="px-4 pb-6">
        <Button onClick={handleSubmit} disabled={!name.trim()} loading={updateHouse.isPending} color="yellow">
          Save Changes
        </Button>
      </div>
    </div>
  );
}
