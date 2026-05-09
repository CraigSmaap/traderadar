"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import { resolveAccessTier, getTrialDaysRemaining } from "@/lib/access";

type Metrics = {
  totalUsers: number;
  proUsers: number;
  freeUsers: number;
  exnessTrialUsers: number;
  trialUsers: number;
  expiredUsers: number;
  new24h: number;
  new7d: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  monthlyRevenueRand: number;
  churnRate: number;
};

type Role = "free" | "pro" | "admin" | "exness-trial";

type AdminUser = {
  id: string;
  email: string;
  role: Role;
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

type FilterTab = "all" | "trial" | "exness-trial" | "pro" | "expired" | "admin";

function getUserTier(user: AdminUser) {
  return resolveAccessTier(user.role, user.created_at);
}

function getTrialDays(user: AdminUser): number | null {
  if (user.role === "exness-trial" || user.role === "free") {
    return getTrialDaysRemaining(user.created_at, user.role);
  }
  return null;
}

export default function AdminPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
    const id = window.setTimeout(() => loadAdminData(), 0);
    return () => window.clearTimeout(id);
  }, []);

  async function updateUserRole(userId: string, role: Role, reason?: string) {
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

  async function copyEmail(email: string, id: string) {
    await navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  const filteredUsers = useMemo(() => {
    let list = users;

    if (activeTab !== "all") {
      list = list.filter((user) => {
        const tier = getUserTier(user);
        if (activeTab === "pro") return tier === "pro";
        if (activeTab === "admin") return user.role === "admin";
        if (activeTab === "exness-trial") return user.role === "exness-trial";
        if (activeTab === "trial") return tier === "trial" && user.role !== "exness-trial";
        if (activeTab === "expired") return tier === "expired";
        return true;
      });
    }

    const query = search.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (u) =>
          u.email.toLowerCase().includes(query) ||
          u.role.toLowerCase().includes(query),
      );
    }

    return list;
  }, [users, search, activeTab]);

  const tabCounts = useMemo(() => {
    const counts: Record<FilterTab, number> = {
      all: users.length,
      trial: 0,
      "exness-trial": 0,
      pro: 0,
      expired: 0,
      admin: 0,
    };
    for (const u of users) {
      const tier = getUserTier(u);
      if (u.role === "admin") counts.admin++;
      else if (tier === "pro") counts.pro++;
      else if (u.role === "exness-trial") counts["exness-trial"]++;
      else if (tier === "trial") counts.trial++;
      else if (tier === "expired") counts.expired++;
    }
    return counts;
  }, [users]);

  function MetricCard({
    label,
    value,
    color,
    sub,
  }: {
    label: string;
    value: number | string;
    color?: string;
    sub?: string;
  }) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{label}</p>
        <p className={`mt-2 text-3xl font-semibold ${color ?? "text-white"}`}>{value}</p>
        {sub ? <p className="mt-1 text-xs text-zinc-600">{sub}</p> : null}
      </div>
    );
  }

  function RoleBadge({ role }: { role: Role }) {
    const styles: Record<Role, string> = {
      admin: "border-purple-500/30 bg-purple-500/10 text-purple-300",
      pro: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
      "exness-trial": "border-amber-500/30 bg-amber-500/10 text-amber-300",
      free: "border-zinc-700 bg-zinc-900 text-zinc-400",
    };
    return (
      <span
        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.12em] ${styles[role]}`}
      >
        {role}
      </span>
    );
  }

  function TierPill({ user }: { user: AdminUser }) {
    const tier = getUserTier(user);
    const days = getTrialDays(user);

    if (tier === "expired") {
      return (
        <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-400">
          Expired
        </span>
      );
    }
    if (tier === "trial" && days !== null) {
      return (
        <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-300">
          {days}d left
        </span>
      );
    }
    if (user.role === "exness-trial" && days !== null) {
      return (
        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
          {days}d left
        </span>
      );
    }
    return null;
  }

  const tabs: { id: FilterTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "trial", label: "Trial" },
    { id: "exness-trial", label: "Exness Trial" },
    { id: "pro", label: "Pro" },
    { id: "expired", label: "Expired" },
    { id: "admin", label: "Admin" },
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-[32px] border border-zinc-800 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_32%),linear-gradient(135deg,rgba(24,24,27,0.96)_0%,rgba(6,6,8,0.99)_100%)] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Admin Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-5xl">
            TradeRadar Control Panel
          </h1>
          <p className="mt-4 text-sm text-zinc-400">
            Monitor users, trial conversions, revenue, and manage access.
          </p>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-400">
            Loading...
          </div>
        ) : !metrics ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
            Failed to load admin metrics.
          </div>
        ) : (
          <>
            {/* Metrics Grid */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              <MetricCard label="Total Users" value={metrics.totalUsers} />
              <MetricCard
                label="Pro Users"
                value={metrics.proUsers}
                color="text-emerald-300"
                sub="Paying subscribers"
              />
              <MetricCard
                label="Active Trial"
                value={metrics.trialUsers}
                color="text-sky-300"
                sub="Within 7-day window"
              />
              <MetricCard
                label="Exness Trial"
                value={metrics.exnessTrialUsers}
                color="text-amber-300"
                sub="30-day affiliate trial"
              />
              <MetricCard
                label="Expired"
                value={metrics.expiredUsers}
                color="text-red-400"
                sub="Conversion targets"
              />
              <MetricCard label="New (24h)" value={metrics.new24h} />
              <MetricCard label="New (7d)" value={metrics.new7d} />
              <MetricCard
                label="Active Subs"
                value={metrics.activeSubscriptions}
                color="text-emerald-300"
              />
              <MetricCard
                label="MRR (ZAR)"
                value={`R${metrics.monthlyRevenueRand.toLocaleString()}`}
                color="text-emerald-400"
              />
              <MetricCard
                label="Churn %"
                value={`${metrics.churnRate}%`}
                color={metrics.churnRate > 20 ? "text-red-300" : "text-yellow-300"}
              />
            </div>

            {/* Leads */}
            <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                    Leads
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-white">
                    Early Access Signups{" "}
                    <span className="text-base font-normal text-zinc-500">
                      ({leads.length})
                    </span>
                  </h2>
                </div>
                <button
                  onClick={loadAdminData}
                  className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Refresh
                </button>
              </div>

              <div className="space-y-2">
                {leads.length === 0 ? (
                  <div className="rounded-2xl border border-zinc-800 bg-black/40 p-5 text-sm text-zinc-500">
                    No leads captured yet.
                  </div>
                ) : (
                  leads.map((lead) => (
                    <div
                      key={lead.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-black/40 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <p className="font-medium text-white">{lead.email}</p>
                        <button
                          onClick={() => copyEmail(lead.email, lead.id)}
                          className="text-xs text-zinc-600 transition hover:text-zinc-300"
                        >
                          {copiedId === lead.id ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-500">
                          {lead.source || "direct"}
                        </span>
                        <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400">
                          {lead.status || "new"}
                        </span>
                        <p className="text-xs text-zinc-600">
                          {new Date(lead.created_at).toLocaleDateString("en-ZA")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Users */}
            <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                    User Management
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-white">
                    Accounts & Access Control
                  </h2>
                </div>
                <button
                  onClick={loadAdminData}
                  className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Refresh
                </button>
              </div>

              {/* Filter tabs */}
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      activeTab === tab.id
                        ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                        : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {tab.label}
                    <span className="ml-1.5 opacity-60">{tabCounts[tab.id]}</span>
                  </button>
                ))}
              </div>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email or role..."
                className="mt-4 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-emerald-400"
              />

              <div className="mt-4 space-y-2">
                {filteredUsers.length === 0 ? (
                  <div className="rounded-2xl border border-zinc-800 bg-black/40 p-5 text-sm text-zinc-500">
                    No users found.
                  </div>
                ) : (
                  filteredUsers.map((user) => {
                    const isUpdating = updatingUserId === user.id;

                    return (
                      <div
                        key={user.id}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-black/40 px-4 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-medium text-white">
                              {user.email}
                            </p>
                            <button
                              onClick={() => copyEmail(user.email, user.id)}
                              className="shrink-0 text-xs text-zinc-600 transition hover:text-zinc-300"
                            >
                              {copiedId === user.id ? "Copied!" : "Copy"}
                            </button>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <RoleBadge role={user.role} />
                            <TierPill user={user} />
                            <span className="text-xs text-zinc-600">
                              Joined {new Date(user.created_at).toLocaleDateString("en-ZA")}
                            </span>
                            {user.pro_granted_reason ? (
                              <span className="text-xs text-zinc-500">
                                · {user.pro_granted_reason}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            disabled={isUpdating || user.role === "pro"}
                            onClick={() => updateUserRole(user.id, "pro", "Manual admin grant")}
                            className="rounded-xl bg-emerald-400 px-3 py-1.5 text-xs font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Make Pro
                          </button>

                          <button
                            disabled={isUpdating || user.role === "exness-trial"}
                            onClick={() =>
                              updateUserRole(user.id, "exness-trial", "Exness affiliate trial")
                            }
                            className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Exness Trial
                          </button>

                          <button
                            disabled={isUpdating || user.role === "free"}
                            onClick={() => updateUserRole(user.id, "free")}
                            className="rounded-xl border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Make Free
                          </button>

                          <button
                            disabled={isUpdating || user.role === "admin"}
                            onClick={() =>
                              updateUserRole(user.id, "admin", "Manual admin promotion")
                            }
                            className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-300 transition hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Make Admin
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
