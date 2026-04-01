import { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import Spinner from "@/components/ui/Spinner";
import FloatingToolbar from "@/components/ui/FloatingToolbar";
import AddMenu from "@/components/ui/AddMenu";

// Pages
import Onboarding from "@/pages/Onboarding";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Portfolio from "@/pages/Portfolio";
import Property from "@/pages/Property";
import RoomDetail from "@/pages/RoomDetail";
import ItemDetail from "@/pages/ItemDetail";
import Inventory from "@/pages/Inventory";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import EditProfile from "@/pages/EditProfile";
import ChangePassword from "@/pages/ChangePassword";
import AddProperty from "@/pages/AddProperty";
import AddRoom from "@/pages/AddRoom";
import ScanItem from "@/pages/ScanItem";
import EditItem from "@/pages/EditItem";
import EditHouse from "@/pages/EditHouse";
import EditRoom from "@/pages/EditRoom";
import GoogleCallback from "@/pages/GoogleCallback";

export default function App() {
  return <AppContent />;
}

// Routes that show the floating toolbar (main tabs + detail views)
const TOOLBAR_ROUTES = ["/", "/inventory", "/reports", "/settings", "/house/", "/room/", "/item/"];

function shouldShowToolbar(path: string): boolean {
  return TOOLBAR_ROUTES.some((route) =>
    route.endsWith("/") && route !== "/" ? path.startsWith(route) : path === route
  );
}

type AddMenuContext = { level: "portfolio" | "property" | "room" | "item"; houseId?: number; roomId?: number; itemId?: number };

function getAddMenuContext(path: string): AddMenuContext {
  const houseMatch = path.match(/^\/house\/(\d+)/);
  if (houseMatch) return { level: "property", houseId: Number(houseMatch[1]) };

  const roomMatch = path.match(/^\/room\/(\d+)/);
  if (roomMatch) return { level: "room", roomId: Number(roomMatch[1]) };

  const itemMatch = path.match(/^\/item\/(\d+)/);
  if (itemMatch) return { level: "item", itemId: Number(itemMatch[1]) };

  return { level: "portfolio" };
}

function AppContent() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();
  const showToolbar = shouldShowToolbar(location);

  // Handle Google OAuth callback before auth check
  if (location.startsWith("/auth/google/callback")) {
    return <GoogleCallback />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthFlow />;
  }

  return (
    <>
      <Switch>
        <Route path="/" component={Portfolio} />
        <Route path="/house/:id" component={Property} />
        <Route path="/room/:id" component={RoomDetail} />
        <Route path="/item/:id" component={ItemDetail} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/reports" component={Reports} />
        <Route path="/settings" component={Settings} />
        <Route path="/edit-profile" component={EditProfile} />
        <Route path="/change-password" component={ChangePassword} />
        <Route path="/add-house" component={AddProperty} />
        <Route path="/add-room" component={AddRoom} />
        <Route path="/add-item" component={ScanItem} />
        <Route path="/edit-item/:id" component={EditItem} />
        <Route path="/edit-house/:id" component={EditHouse} />
        <Route path="/edit-room/:id" component={EditRoom} />
        <Route>
          <div className="min-h-screen flex items-center justify-center">
            <p className="font-dm text-text-muted">Page not found</p>
          </div>
        </Route>
      </Switch>

      {showToolbar && (
        <>
          <FloatingToolbar onFabPress={() => setMenuOpen((o) => !o)} fabOpen={menuOpen} />
          <AddMenu open={menuOpen} onClose={() => setMenuOpen(false)} context={getAddMenuContext(location)} />
        </>
      )}
    </>
  );
}

function AuthFlow() {
  const [screen, setScreen] = useState<"onboarding" | "login" | "signup">("onboarding");

  switch (screen) {
    case "login":
      return <Login onClose={() => setScreen("onboarding")} onSignup={() => setScreen("signup")} />;
    case "signup":
      return <Signup onClose={() => setScreen("onboarding")} onLogin={() => setScreen("login")} />;
    default:
      return <Onboarding onGetStarted={() => setScreen("signup")} onLogin={() => setScreen("login")} />;
  }
}
