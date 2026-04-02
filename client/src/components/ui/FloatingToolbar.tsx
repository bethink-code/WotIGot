import { useLocation } from "wouter";
import { Home, Box, BarChart3, Settings, Plus, X } from "lucide-react";
import { type ReactNode, useState } from "react";

interface NavItem {
  icon: ReactNode;
  path: string;
  label: string;
}

interface FloatingToolbarProps {
  onFabPress: () => void;
  fabOpen: boolean;
}

const navItems: NavItem[] = [
  { icon: <Home size={22} />, path: "/", label: "Portfolio" },
  { icon: <Box size={22} />, path: "/inventory", label: "Inventory" },
  // FAB goes in the middle
  { icon: <BarChart3 size={22} />, path: "/reports", label: "Reports" },
  { icon: <Settings size={22} />, path: "/settings", label: "Settings" },
];

export default function FloatingToolbar({ onFabPress, fabOpen }: FloatingToolbarProps) {
  const [location, navigate] = useLocation();

  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center pointer-events-none">
      <div className="bg-text-dark rounded-round px-4 py-2.5 flex items-center gap-1 shadow-toolbar mx-4 pointer-events-auto">
        {/* Left nav items */}
        {navItems.slice(0, 2).map((item) => (
          <NavIcon
            key={item.path}
            icon={item.icon}
            active={location === item.path}
            onClick={() => navigate(item.path)}
          />
        ))}

        {/* FAB */}
        <button
          onClick={onFabPress}
          className="w-[52px] h-[52px] rounded-full bg-orange flex items-center justify-center -mt-6 shadow-button press-scale transition-transform duration-200"
          style={{ transform: fabOpen ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          {fabOpen ? <X size={24} color="white" /> : <Plus size={24} color="white" />}
        </button>

        {/* Right nav items */}
        {navItems.slice(2).map((item) => (
          <NavIcon
            key={item.path}
            icon={item.icon}
            active={location === item.path}
            onClick={() => navigate(item.path)}
          />
        ))}
      </div>
    </div>
  );
}

function NavIcon({ icon, active, onClick }: { icon: ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-12 h-12 rounded-full flex items-center justify-center press-scale transition-colors duration-150 ${
        active ? "text-white" : "text-white/50"
      }`}
    >
      {icon}
    </button>
  );
}
