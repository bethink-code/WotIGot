import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Building2, DoorOpen, Camera } from "lucide-react";
import { useItem } from "@/lib/queries";

type ContextLevel = "portfolio" | "property" | "room" | "item";

interface AddMenuProps {
  open: boolean;
  onClose: () => void;
  context?: { level: ContextLevel; houseId?: number; roomId?: number; itemId?: number };
}

interface MenuAction {
  icon: typeof Building2;
  label: string;
  bgColor: string;
  path: string;
}

/**
 * Returns context-appropriate actions:
 * - Portfolio: Property, Room, Scan Item
 * - Property: Room (for this property), Scan Item
 * - Room: Scan Item (for this room)
 * - Item: no menu (FAB hidden on item detail)
 */
function getActions(context?: AddMenuProps["context"]): MenuAction[] {
  const level = context?.level ?? "portfolio";

  const property: MenuAction = {
    icon: Building2,
    label: "Property",
    bgColor: "bg-yellow",
    path: "/add-house",
  };

  const room: MenuAction = {
    icon: DoorOpen,
    label: "Room",
    bgColor: "bg-orange",
    path: context?.houseId ? `/add-room?houseId=${context.houseId}` : "/add-room",
  };

  const scanItem: MenuAction = {
    icon: Camera,
    label: "Scan Item",
    bgColor: "bg-green",
    path: context?.roomId ? `/add-item?roomId=${context.roomId}` : "/add-item",
  };

  switch (level) {
    case "property": return [room, scanItem];
    case "room": return [scanItem];
    case "item": return [scanItem];
    default: return [property, room, scanItem];
  }
}

export default function AddMenu({ open, onClose, context }: AddMenuProps) {
  const [, navigate] = useLocation();
  const [shouldRender, setShouldRender] = useState(false);
  const [animating, setAnimating] = useState(false);

  // When on item detail, look up the item's room_id so "Scan Item" targets the same room
  const { data: item } = useItem(context?.level === "item" ? context.itemId : undefined);
  const resolvedContext = context?.level === "item" && item
    ? { ...context, roomId: item.room_id }
    : context;

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      requestAnimationFrame(() => setAnimating(true));
    } else {
      setAnimating(false);
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const actions = getActions(resolvedContext);

  if (!shouldRender || actions.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${animating ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      <div
        className={`absolute bottom-24 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-float p-5 transition-all duration-300 ${
          animating ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-[0.15] translate-y-8"
        }`}
        style={{ transformOrigin: "bottom center" }}
      >
        <div className="w-8 h-1 bg-text-muted/30 rounded-full mx-auto mb-4" />

        <div className="flex gap-5">
          {actions.map((action, i) => (
            <ActionButton
              key={action.label}
              action={action}
              delay={i * 40}
              animating={animating}
              onClick={() => { onClose(); navigate(action.path); }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  action,
  delay,
  animating,
  onClick,
}: {
  action: MenuAction;
  delay: number;
  animating: boolean;
  onClick: () => void;
}) {
  const Icon = action.icon;

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 press-scale"
      style={{
        opacity: animating ? 1 : 0,
        transform: animating ? "scale(1)" : "scale(0.8)",
        transition: `opacity 150ms ease ${delay}ms, transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}ms`,
      }}
    >
      <div className={`w-14 h-14 rounded-xl ${action.bgColor} flex items-center justify-center`}>
        <Icon size={24} color="white" />
      </div>
      <span className="font-dm text-xs font-medium text-text-dark">{action.label}</span>
    </button>
  );
}
