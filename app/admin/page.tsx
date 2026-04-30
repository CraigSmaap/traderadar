"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/layout/Header";

type Metrics = {
  totalUsers: number;
  proUsers: number;
  freeUsers: number;
  new24h: number;
  new7d: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  monthlyRevenueRand: number;
  churnRate: number;
};

type AdminUser = {
  id: string;
  email: string;
  role: "free" | "pro" | "admin";
  created_at: string;
  pro_granted_reason: string | null;
  pro_expires_at: string | null;
};

type Lead = {
  id: string;
  email: string;
  source: string;
  status: string;
  created_at: string;
};

export default function AdminPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  async function loadAdminData() {
    try {
      setLoading(true);

      const [metricsRes, usersRes, leadsRes] = await Promise.all([
        fetch("/api/admin/metrics", { cache: "no-store" }),
        fetch("/api/admin/users", { cache: "no-store" }),
        fetch("/api/admin/leads", { cache: "no-store" }),
      ]);

      if (!metricsRes.ok) throw new Error("Failed to load metrics");
      if (!usersRes.ok) throw new Error("Failed to load users");
      if (!leadsRes.ok) throw new Error("Failed to load leads");

      setMetrics((await metricsRes.json()) as Metrics);
      setUsers((await usersRes.json()) as AdminUser[]);
      setLeads((await leadsRes.json()) as Lead[]);
    } catch (error) {
      console.error("Admin load failed:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadAdminData();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  async function updateUserRole(
    userId: string,
    role: "free" | "pro" | "admin",
    reason?: string
  ) {
    try {
      setUpdatingUserId(userId);

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role, reason: reason || null }),
      });

      if (!res.ok) throw new Error("Failed to update user role");

      await loadAdminData();
    } catch (error) {
      console.error("Role update failed:", error);
      alert("Could not update user role.");
    } finally {
      setUpdatingUserId(null);
    }
  }

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return users;

    return users.filter(
      (user) =>
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
    );
  }, [users, search]);

  function Card({
    label,
    value,
    color,
  }: {
    label: string;
    value: number | string;
    color?: string;
  }) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
          {label}
        </p>
        <p className={`mt-2 text-3xl font-semibold ${color || "text-white"}`}>
          {value}
        </p>
      </div>
    );
  }

  function RoleBadge({ role }: { role: AdminUser["role"] }) {
    const className =
      role === "admin"
        ? "border-purple-500/30 bg-purple-500/10 text-purple-300"
        : role === "pro"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : "border-zinc-700 bg-zinc-900 text-zinc-300";

    return (
      <span
        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${className}`}
      >
        {role}
      </span>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-[32px] border border-zinc-800 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_32%),linear-gradient(135deg,rgba(24,24,27,0.96)_0%,rgba(6,6,8,0.99)_100%)] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Admin Dashboard
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-5xl">
            TradeRadar SaaS Control Panel
          </h1>

          <p className="mt-4 text-sm text-zinc-400">
            Monitor users, leads, revenue, churn, growth, and manually control
            access.
          </p>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-400">
            Loading admin dashboard...
          </div>
        ) : !metrics ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
            Failed to load admin metrics.
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-5">
              <Card label="Total Users" value={metrics.totalUsers} />
              <Card label="Pro Users" value={metrics.proUsers} color="text-emerald-300" />
              <Card label="Free Users" value={metrics.freeUsers} />
              <Card label="Leads" value={leads.length} color="text-emerald-300" />
              <Card label="New (24h)" value={metrics.new24h} />
              <Card label="New (7d)" value={metrics.new7d} />
              <Card label="Active Subs" value={metrics.activeSubscriptions} color="text-emerald-300" />
              <Card label="Cancelled" value={metrics.cancelledSubscriptions} color="text-red-300" />
              <Card label="MRR (ZAR)" value={`R${metrics.monthlyRevenueRand}`} color="text-emerald-400" />
              <Card label="Churn %" value={`${metrics.churnRate}%`} color="text-yellow-300" />
            </div>

            <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                    Leads
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    Early Access Signups
                  </h2>
                  <p className="mt-2 text-sm text-zinc-400">
                    People who joined your waitlist.
                  </p>
                </div>

                <button
                  onClick={loadAdminData}
                  className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Refresh
                </button>
              </div>

              <div className="space-y-3">
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-black/40 p-4"
                  >
                    <div>
                      <p className="font-medium text-white">{lead.email}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Source: {lead.source || "—"} · Status:{" "}
                        {lead.status || "new"}
                      </p>
                    </div>

                    <p className="text-xs text-zinc-500">
                      {new Date(lead.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}

                {leads.length === 0 ? (
                  <div className="rounded-2xl border border-zinc-800 bg-black/40 p-5 text-sm text-zinc-400">
                    No leads captured yet.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                    User Management
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    Accounts & Access Control
                  </h2>
                  <p className="mt-2 text-sm text-zinc-400">
                    Upgrade, downgrade, or grant admin access from one place.
                  </p>
                </div>

                <button
                  onClick={loadAdminData}
                  className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Refresh
                </button>
              </div>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by email or role..."
                className="mt-5 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-emerald-400"
              />

              <div className="mt-5 space-y-3">
                {filteredUsers.map((user) => {
                  const isUpdating = updatingUserId === user.id;

                  return (
                    <div
                      key={user.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-black/40 p-4"
                    >
                      <div>
                        <p className="font-medium text-white">{user.email}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <RoleBadge role={user.role} />
                          <span className="text-xs text-zinc-500">
                            Joined {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-zinc-500">
                          Reason: {user.pro_granted_reason || "—"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          disabled={isUpdating || user.role === "pro"}
                          onClick={() =>
                            updateUserRole(user.id, "pro", "Manual admin grant")
                          }
                          className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Make Pro
                        </button>

                        <button
                          disabled={isUpdating || user.role === "free"}
                          onClick={() => updateUserRole(user.id, "free")}
                          className="rounded-xl border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Make Free
                        </button>

                        <button
                          disabled={isUpdating || user.role === "admin"}
                          onClick={() =>
                            updateUserRole(
                              user.id,
                              "admin",
                              "Manual admin promotion"
                            )
                          }
                          className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs font-semibold text-purple-300 transition hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Make Admin
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredUsers.length === 0 ? (
                  <div className="rounded-2xl border border-zinc-800 bg-black/40 p-5 text-sm text-zinc-400">
                    No users found.
                  </div>
                ) : null}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}