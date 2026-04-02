import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/ui/PageHeader";
import SectionLabel from "@/components/ui/SectionLabel";
import Spinner from "@/components/ui/Spinner";
import {
  Users, ScrollText, Mail, Bell, ShieldCheck, Cpu,
  Plus, Trash2, Check, X, Crown, RefreshCw,
} from "lucide-react";
import Button from "@/components/ui/Button";

type Tab = "users" | "audit" | "invites" | "requests" | "security" | "ai";

const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
  { key: "users", label: "Users", icon: Users },
  { key: "audit", label: "Audit Log", icon: ScrollText },
  { key: "invites", label: "Invites", icon: Mail },
  { key: "requests", label: "Requests", icon: Bell },
  { key: "security", label: "Security", icon: ShieldCheck },
  { key: "ai", label: "AI Costs", icon: Cpu },
];

export default function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("users");

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen pb-24">
      <PageHeader title="Admin Console" color="green" showBack />

      {/* Tab bar */}
      <div className="px-4 pt-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-pill text-xs font-dm font-medium transition-colors ${
                  isActive
                    ? "bg-text-dark text-white"
                    : "bg-grey-bg text-text-grey"
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-4">
        {activeTab === "users" && <UsersTab />}
        {activeTab === "audit" && <AuditTab />}
        {activeTab === "invites" && <InvitesTab />}
        {activeTab === "requests" && <RequestsTab />}
        {activeTab === "security" && <SecurityTab />}
        {activeTab === "ai" && <AiCostsTab />}
      </div>
    </div>
  );
}

// ── Users Tab ──

function UsersTab() {
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery<any[]>({
    queryKey: ["/admin/users"],
    queryFn: () => api.get("/users").then((r) => r.data),
  });

  const toggleAdmin = useMutation({
    mutationFn: (id: number) => api.patch(`/admin/users/${id}/admin`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/users"] });
    },
  });

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-2">
      <SectionLabel>ALL USERS ({users?.length ?? 0})</SectionLabel>
      {users?.map((u: any) => (
        <div key={u.id} className="flex items-center gap-3 bg-white rounded-xl shadow-card-soft p-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-dm text-sm font-medium text-text-dark truncate">{u.name}</p>
              {u.role === "admin" && (
                <span className="text-[10px] font-dm font-semibold text-orange bg-orange-soft px-1.5 py-0.5 rounded-pill">
                  ADMIN
                </span>
              )}
            </div>
            <p className="font-dm text-xs text-text-grey truncate">{u.email || u.user_name}</p>
            <p className="font-dm text-[10px] text-text-muted">
              Joined {new Date(u.created_at).toLocaleDateString()}
            </p>
          </div>
          {u.id !== me?.id && (
            <button
              onClick={() => toggleAdmin.mutate(u.id)}
              className="w-8 h-8 rounded-lg bg-grey-bg flex items-center justify-center press-scale"
              title={u.role === "admin" ? "Remove admin" : "Make admin"}
            >
              <Crown size={14} className={u.role === "admin" ? "text-orange" : "text-text-muted"} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Audit Log Tab ──

function AuditTab() {
  const [offset, setOffset] = useState(0);
  const limit = 30;

  const { data, isLoading, refetch, isFetching } = useQuery<{ rows: any[]; total: number }>({
    queryKey: ["/admin/audit-logs", offset],
    queryFn: () => api.get(`/admin/audit-logs?limit=${limit}&offset=${offset}`).then((r) => r.data),
  });

  if (isLoading) return <Loading />;

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const hasNext = offset + limit < total;
  const hasPrev = offset > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionLabel>AUDIT LOG ({total})</SectionLabel>
        <button onClick={() => refetch()} className="press-scale" disabled={isFetching}>
          <RefreshCw size={14} className={`text-text-muted ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>
      {rows.map((log: any) => (
        <div key={log.id} className="bg-white rounded-xl shadow-card-soft p-3">
          <div className="flex items-center justify-between">
            <span className="font-dm text-xs font-medium text-text-dark">{log.action}</span>
            <span className={`text-[10px] font-dm font-semibold px-1.5 py-0.5 rounded-pill ${
              log.outcome === "success"
                ? "text-green bg-green-soft"
                : log.outcome === "denied"
                  ? "text-danger bg-danger-soft"
                  : "text-text-muted bg-grey-bg"
            }`}>
              {log.outcome}
            </span>
          </div>
          <p className="font-dm text-[10px] text-text-grey mt-0.5">
            {log.user_email || "system"} &middot; {new Date(log.created_at).toLocaleString()}
          </p>
          {log.detail && (
            <p className="font-dm text-[10px] text-text-muted mt-0.5">{log.detail}</p>
          )}
        </div>
      ))}
      {rows.length === 0 && <EmptyMessage>No audit logs yet</EmptyMessage>}
      {(hasPrev || hasNext) && (
        <div className="flex justify-between pt-2">
          <button
            onClick={() => setOffset((o) => Math.max(0, o - limit))}
            disabled={!hasPrev}
            className="font-dm text-xs text-text-grey disabled:opacity-30"
          >
            Previous
          </button>
          <button
            onClick={() => setOffset((o) => o + limit)}
            disabled={!hasNext}
            className="font-dm text-xs text-text-grey disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

// ── Invites Tab ──

function InvitesTab() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");

  const { data: invites, isLoading } = useQuery<any[]>({
    queryKey: ["/admin/invites"],
    queryFn: () => api.get("/admin/invites").then((r) => r.data),
  });

  const addInvite = useMutation({
    mutationFn: (email: string) => api.post("/admin/invites", { email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/invites"] });
      setEmail("");
    },
  });

  const removeInvite = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/invites/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/admin/invites"] }),
  });

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-3">
      <SectionLabel>INVITED EMAILS ({invites?.length ?? 0})</SectionLabel>

      {/* Add invite */}
      <div className="flex gap-2">
        <input
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && email.trim() && addInvite.mutate(email.trim())}
          className="flex-1 px-3 py-2.5 bg-white rounded-xl shadow-card-soft font-dm text-sm text-text-dark placeholder:text-text-muted outline-none"
        />
        <button
          onClick={() => email.trim() && addInvite.mutate(email.trim())}
          disabled={!email.trim() || addInvite.isPending}
          className="w-10 h-10 rounded-xl bg-green flex items-center justify-center press-scale disabled:opacity-50"
        >
          <Plus size={18} color="white" />
        </button>
      </div>

      {addInvite.isError && (
        <p className="font-dm text-xs text-danger">{(addInvite.error as any)?.response?.data?.message || "Failed to invite"}</p>
      )}

      {invites?.map((inv: any) => (
        <div key={inv.id} className="flex items-center gap-3 bg-white rounded-xl shadow-card-soft p-3">
          <div className="flex-1 min-w-0">
            <p className="font-dm text-sm text-text-dark truncate">{inv.email}</p>
            <p className="font-dm text-[10px] text-text-muted">
              Invited {new Date(inv.created_at).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={() => removeInvite.mutate(inv.id)}
            className="w-8 h-8 rounded-lg bg-danger-soft flex items-center justify-center press-scale"
          >
            <Trash2 size={14} className="text-danger" />
          </button>
        </div>
      ))}
      {invites?.length === 0 && <EmptyMessage>No invites yet</EmptyMessage>}
    </div>
  );
}

// ── Requests Tab ──

function RequestsTab() {
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery<any[]>({
    queryKey: ["/admin/access-requests"],
    queryFn: () => api.get("/admin/access-requests").then((r) => r.data),
  });

  const updateRequest = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/admin/access-requests/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/access-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/admin/invites"] });
      queryClient.invalidateQueries({ queryKey: ["/auth/me"] });
    },
  });

  if (isLoading) return <Loading />;

  const pending = requests?.filter((r: any) => r.status === "pending") ?? [];
  const resolved = requests?.filter((r: any) => r.status !== "pending") ?? [];

  return (
    <div className="space-y-3">
      <SectionLabel>PENDING ({pending.length})</SectionLabel>
      {pending.map((req: any) => (
        <div key={req.id} className="bg-white rounded-xl shadow-card-soft p-4">
          <p className="font-dm text-sm font-medium text-text-dark">{req.name}</p>
          <p className="font-dm text-xs text-text-grey">{req.email}</p>
          {req.cell && <p className="font-dm text-[10px] text-text-muted">{req.cell}</p>}
          <p className="font-dm text-[10px] text-text-muted mt-1">
            Requested {new Date(req.created_at).toLocaleDateString()}
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              color="green"
              icon={<Check size={12} />}
              onClick={() => updateRequest.mutate({ id: req.id, status: "approved" })}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="danger"
              icon={<X size={12} />}
              onClick={() => updateRequest.mutate({ id: req.id, status: "declined" })}
            >
              Decline
            </Button>
          </div>
        </div>
      ))}
      {pending.length === 0 && <EmptyMessage>No pending requests</EmptyMessage>}

      {resolved.length > 0 && (
        <>
          <SectionLabel className="mt-4">RESOLVED ({resolved.length})</SectionLabel>
          {resolved.map((req: any) => (
            <div key={req.id} className="bg-white rounded-xl shadow-card-soft p-3 opacity-60">
              <div className="flex items-center justify-between">
                <p className="font-dm text-sm text-text-dark">{req.name}</p>
                <span className={`text-[10px] font-dm font-semibold px-1.5 py-0.5 rounded-pill ${
                  req.status === "approved" ? "text-green bg-green-soft" : "text-danger bg-danger-soft"
                }`}>
                  {req.status}
                </span>
              </div>
              <p className="font-dm text-xs text-text-grey">{req.email}</p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ── Security Tab ──

function SecurityTab() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ["/admin/security-overview"],
    queryFn: () => api.get("/admin/security-overview").then((r) => r.data),
  });

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-3">
      <SectionLabel>OVERVIEW</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Users" value={data?.total_users} color="green" />
        <StatCard label="Admins" value={data?.admin_count} color="orange" />
        <StatCard label="Invites" value={data?.total_invites} color="yellow" />
        <StatCard label="Pending Requests" value={data?.pending_requests} color="danger" />
      </div>

      <SectionLabel className="mt-2">24H ACTIVITY</SectionLabel>
      {data?.activity_24h?.breakdown?.length > 0 ? (
        <div className="space-y-1">
          {data.activity_24h.breakdown.map((row: any, i: number) => (
            <div key={i} className="flex items-center justify-between bg-white rounded-xl shadow-card-soft p-3">
              <span className="font-dm text-xs text-text-dark">{row.action}</span>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-dm font-semibold px-1.5 py-0.5 rounded-pill ${
                  row.outcome === "success" ? "text-green bg-green-soft" : "text-danger bg-danger-soft"
                }`}>
                  {row.outcome}
                </span>
                <span className="font-dm text-xs font-medium text-text-grey">{row.count}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyMessage>No activity in the last 24 hours</EmptyMessage>
      )}
    </div>
  );
}

// ── AI Costs Tab ──

function AiCostsTab() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ["/admin/ai-usage"],
    queryFn: () => api.get("/admin/ai-usage").then((r) => r.data),
  });

  if (isLoading) return <Loading />;

  const totals = data?.totals;
  const perUser = data?.perUser ?? [];
  const recent = data?.recent ?? [];

  return (
    <div className="space-y-3">
      <SectionLabel>TOTALS</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="API Calls" value={totals?.calls ?? 0} color="green" />
        <StatCard label="Est. Cost" value={`$${(totals?.cost_usd ?? 0).toFixed(4)}`} color="orange" />
        <StatCard label="Input Tokens" value={formatNum(totals?.input_tokens ?? 0)} color="yellow" />
        <StatCard label="Output Tokens" value={formatNum(totals?.output_tokens ?? 0)} color="yellow" />
      </div>

      {perUser.length > 0 && (
        <>
          <SectionLabel className="mt-2">PER USER</SectionLabel>
          {perUser.map((u: any, i: number) => (
            <div key={i} className="flex items-center justify-between bg-white rounded-xl shadow-card-soft p-3">
              <span className="font-dm text-xs text-text-dark truncate">{u.user_email || "unknown"}</span>
              <span className="font-dm text-xs font-medium text-text-grey">{u.calls} calls</span>
            </div>
          ))}
        </>
      )}

      {recent.length > 0 && (
        <>
          <SectionLabel className="mt-2">RECENT CALLS</SectionLabel>
          {recent.map((r: any) => (
            <div key={r.id} className="bg-white rounded-xl shadow-card-soft p-3">
              <div className="flex items-center justify-between">
                <span className="font-dm text-xs font-medium text-text-dark">{r.action}</span>
                <span className="font-dm text-[10px] text-text-muted">{r.model}</span>
              </div>
              <p className="font-dm text-[10px] text-text-grey mt-0.5">
                {r.user_email || "unknown"} &middot; {new Date(r.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </>
      )}

      {totals?.calls === 0 && <EmptyMessage>No AI usage recorded yet</EmptyMessage>}
    </div>
  );
}

// ── Shared components ──

function StatCard({ label, value, color }: { label: string; value: React.ReactNode; color: string }) {
  const colorMap: Record<string, string> = {
    green: "text-green",
    orange: "text-orange",
    yellow: "text-yellow-dark",
    danger: "text-danger",
  };

  return (
    <div className="bg-white rounded-xl shadow-card-soft p-4">
      <p className="font-dm text-[10px] text-text-muted uppercase tracking-wider">{label}</p>
      <p className={`font-poppins font-bold text-xl ${colorMap[color] ?? "text-text-dark"}`}>{value}</p>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex justify-center py-12">
      <Spinner size={24} />
    </div>
  );
}

function EmptyMessage({ children }: { children: string }) {
  return <p className="font-dm text-sm text-text-muted text-center py-6">{children}</p>;
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
