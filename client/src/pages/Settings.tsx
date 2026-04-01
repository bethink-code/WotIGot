import { useLocation } from "wouter";
import { UserPen, HelpCircle, FileText, Shield, LogOut, ChevronRight } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Avatar from "@/components/ui/Avatar";
import SectionLabel from "@/components/ui/SectionLabel";
import { useAuth } from "@/hooks/useAuth";

export default function Settings() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen pb-24">
      <PageHeader title="Settings" color="green" />

      <div className="px-4 py-4 space-y-4 animate-slideUp">
        {/* Profile card */}
        <div className="flex items-center gap-3 bg-white rounded-xl shadow-card-soft p-4">
          <Avatar name={user.name} size="lg" />
          <div>
            <p className="font-poppins font-semibold text-base text-text-dark">{user.name}</p>
            <p className="font-dm text-sm text-text-grey">{user.user_name}</p>
            {user.has_google && (
              <p className="font-dm text-xs text-text-muted">Registered with Google</p>
            )}
          </div>
        </div>

        {/* Account section */}
        <SectionLabel>ACCOUNT</SectionLabel>
        <SettingsItem
          icon={<UserPen size={20} className="text-green" />}
          title="Edit Profile"
          subtitle="Update your name and details"
          onClick={() => navigate("/edit-profile")}
        />

        {/* Support section */}
        <SectionLabel>SUPPORT</SectionLabel>
        <SettingsItem icon={<HelpCircle size={20} className="text-text-grey" />} title="Help & FAQ" />
        <SettingsItem icon={<FileText size={20} className="text-text-grey" />} title="Privacy Policy" />
        <SettingsItem icon={<Shield size={20} className="text-text-grey" />} title="Terms of Service" />

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 p-4 bg-white rounded-xl shadow-card-soft press-scale-subtle"
        >
          <LogOut size={20} className="text-danger" />
          <span className="font-dm text-sm font-medium text-danger">Log Out</span>
        </button>
      </div>
    </div>
  );
}

function SettingsItem({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 bg-white rounded-xl shadow-card-soft press-scale-subtle text-left"
    >
      <div className="w-10 h-10 rounded-xl bg-grey-bg flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-dm text-sm font-medium text-text-dark">{title}</p>
        {subtitle && <p className="font-dm text-xs text-text-grey">{subtitle}</p>}
      </div>
      <ChevronRight size={16} className="text-text-muted shrink-0" />
    </button>
  );
}
