import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateProfile } from "@/lib/mutations";

export default function EditProfile() {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const [name, setName] = useState(user?.name || "");

  const handleSubmit = () => {
    if (!name.trim()) return;
    updateProfile.mutate(
      { name: name.trim() },
      { onSuccess: () => window.history.back() }
    );
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <PageHeader title="Edit Profile" color="green" showBack />

      <div className="flex-1 px-4 py-6 space-y-6 animate-slideUp">
        <div className="flex justify-center">
          <Avatar name={name || user.name} size="lg" />
        </div>
        <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="px-4 pb-6">
        <Button
          onClick={handleSubmit}
          disabled={!name.trim() || name.trim() === user.name}
          loading={updateProfile.isPending}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}
