import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useChangePassword } from "@/lib/mutations";

export default function ChangePassword() {
  const changePassword = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = () => {
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => setSuccess(true),
        onError: (err: any) => setError(err.response?.data?.message || "Failed to change password"),
      }
    );
  };

  const isValid = currentPassword && newPassword && confirmPassword && newPassword === confirmPassword;

  return (
    <div className="min-h-screen flex flex-col">
      <PageHeader title="Change Password" color="green" showBack />

      <div className="flex-1 px-4 py-6 space-y-4 animate-slideUp">
        {error && (
          <div className="px-4 py-3 bg-danger-soft rounded-xl">
            <p className="font-dm text-sm text-danger">{error}</p>
          </div>
        )}
        {success && (
          <div className="px-4 py-3 bg-green-soft rounded-xl">
            <p className="font-dm text-sm text-green-dark">Password changed successfully</p>
          </div>
        )}
        <Input type="password" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        <Input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <Input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
      </div>

      <div className="px-4 pb-6">
        <Button onClick={handleSubmit} disabled={!isValid} loading={changePassword.isPending}>
          Change Password
        </Button>
      </div>
    </div>
  );
}
