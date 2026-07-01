"use client";

import { useEffect, useState } from "react";

interface UserPlan {
  id: string;
  plan_name: string;
  plan_slug: string;
  status: string;
  expires_at: string;
  payment_method: string;
  daily_limit: number | null;
  weekly_limit: number | null;
  monthly_limit: number | null;
}

interface User {
  id: string;
  email: string;
  name: string;
  balance: string;
  status: string;
  created_at: string;
  api_key_count: number;
  totalUsageId?: string;
  total_usage: string;
  active_plan: UserPlan | null;
  token_usage: { daily_used: string; weekly_used: string; monthly_used: string } | null;
}

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: string;
  duration_days: number;
}

export default function UsersSection() {
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [resetting, setResetting] = useState(false);

  const filtered = search.trim()
    ? users.filter(u =>
        (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const fetchAll = async () => {
    setLoading(true);
    const [uRes, pRes] = await Promise.all([
      fetch("/api/admin/users"),
      fetch("/api/plans"),
    ]);
    const uData = await uRes.json();
    const pData = await pRes.json();
    setUsers(uData.users || []);
    setPlans(pData.filter((p: Plan & { is_active: boolean }) => p.is_active));
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(u => u.id)));
    }
  };

  const resetLimits = async (userIds: string[]) => {
    if (userIds.length === 0) return;
    if (!confirm(`Reset limit untuk ${userIds.length} user?`)) return;
    setResetting(true);
    const res = await fetch("/api/admin/users/reset-limit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_ids: userIds }),
    });
    const data = await res.json();
    setResetting(false);
    if (res.ok) {
      alert(data.message);
      setSelected(new Set());
      fetchAll();
    } else {
      alert(data.error || "Gagal reset");
    }
  };

  const assignPlan = async (userId: string) => {
    if (!selectedPlan) return;
    if (!confirm("Assign plan ke user ini?")) return;
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_id: selectedPlan }),
    });
    if (res.ok) {
      setAssigning(null);
      setSelectedPlan("");
      fetchAll();
    }
  };

  const deletePlan = async (userId: string) => {
    if (!confirm("Hapus plan aktif user ini?")) return;
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    if (res.ok) fetchAll();
  };

  const fmtCountdown = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    return d > 0 ? `${d}h ${h}j` : `${h}j`;
  };

  const fmtTokens = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n.toLocaleString();
  };

  const usagePct = (used: number, limit: number | null) => {
    if (!limit || limit === 0) return 0;
    return Math.min(100, (used / limit) * 100);
  };

  const barColor = (pct: number) =>
    pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-emerald-500";

  if (loading) return <div className="animate-pulse h-40 rounded-xl bg-[var(--bg-secondary)]" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">User & Paket</h2>
        <span className="text-xs text-[var(--text-secondary)]">{users.length} user</span>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Cari user (email/nama)..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-violet-500/50"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">✕</button>
        )}
      </div>

      {/* Bulk actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={toggleSelectAll}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-violet-500/50"
        >
          {selected.size === filtered.length ? "☐ Batal Pilih" : "☑ Pilih Semua"}
        </button>
        {selected.size > 0 && (
          <>
            <span className="text-xs text-[var(--text-secondary)]">{selected.size} dipilih</span>
            <button
              onClick={() => resetLimits(Array.from(selected))}
              disabled={resetting}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 disabled:opacity-50"
            >
              {resetting ? "Resetting..." : `Reset Limit (${selected.size})`}
            </button>
          </>
        )}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-sm text-[var(--text-secondary)] text-center py-4">{search ? "Tidak ditemukan" : "Belum ada user"}</p>
        )}
        {filtered.map((u) => {
          const tu = u.token_usage;
          const ap = u.active_plan;
          const dUsed = tu ? Number(tu.daily_used) : 0;
          const wUsed = tu ? Number(tu.weekly_used) : 0;
          const mUsed = tu ? Number(tu.monthly_used) : 0;

          return (
            <div key={u.id} className={`glass-card rounded-xl p-4 transition-all ${selected.has(u.id) ? "ring-2 ring-violet-500/50" : ""}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(u.id)}
                    onChange={() => toggleSelect(u.id)}
                    className="mt-1 w-4 h-4 rounded border-[var(--border-color)] accent-violet-500"
                  />
                  <div>
                    <p className="font-medium text-sm">{u.name || u.email}</p>
                    <p className="text-[11px] text-[var(--text-secondary)]">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {ap ? (
                    <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-500/20 text-emerald-400">
                      {ap.plan_name} · {fmtCountdown(ap.expires_at)}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-zinc-500/20 text-zinc-400">
                      Free
                    </span>
                  )}
                </div>
              </div>

              {/* Balance + total usage */}
              <div className="grid grid-cols-3 gap-2 text-[11px] text-[var(--text-secondary)] mb-3 ml-7">
                <div>
                  <span className="block text-[var(--text-primary)] font-medium tabular-nums">${Number(u.balance).toFixed(2)}</span>
                  Saldo
                </div>
                <div>
                  <span className="block text-[var(--text-primary)] font-medium tabular-nums">
                    {fmtTokens(dUsed)}
                  </span>
                  Token hari ini
                </div>
                <div>
                  <span className="block text-[var(--text-primary)] font-medium tabular-nums">
                    {fmtTokens(Number(u.total_usage))}
                  </span>
                  Total usage
                </div>
              </div>

              {/* Token limits progress bars */}
              {ap && (
                <div className="space-y-2 ml-7 mb-3">
                  {ap.daily_limit && (
                    <div>
                      <div className="flex items-center justify-between text-[10px] mb-0.5">
                        <span className="text-[var(--text-secondary)]">Harian</span>
                        <span className="text-[var(--text-secondary)] tabular-nums">{fmtTokens(dUsed)} / {fmtTokens(ap.daily_limit)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColor(usagePct(dUsed, ap.daily_limit))}`} style={{ width: `${usagePct(dUsed, ap.daily_limit)}%` }} />
                      </div>
                    </div>
                  )}
                  {ap.weekly_limit && (
                    <div>
                      <div className="flex items-center justify-between text-[10px] mb-0.5">
                        <span className="text-[var(--text-secondary)]">Mingguan</span>
                        <span className="text-[var(--text-secondary)] tabular-nums">{fmtTokens(wUsed)} / {fmtTokens(ap.weekly_limit)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColor(usagePct(wUsed, ap.weekly_limit))}`} style={{ width: `${usagePct(wUsed, ap.weekly_limit)}%` }} />
                      </div>
                    </div>
                  )}
                  {ap.monthly_limit && (
                    <div>
                      <div className="flex items-center justify-between text-[10px] mb-0.5">
                        <span className="text-[var(--text-secondary)]">Bulanan</span>
                        <span className="text-[var(--text-secondary)] tabular-nums">{fmtTokens(mUsed)} / {fmtTokens(ap.monthly_limit)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColor(usagePct(mUsed, ap.monthly_limit))}`} style={{ width: `${usagePct(mUsed, ap.monthly_limit)}%` }} />
                      </div>
                    </div>
                  )}
                  {ap.expires_at && (
                    <p className="text-[10px] text-[var(--text-secondary)]">
                      Aktif s/d {new Date(ap.expires_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}via {ap.payment_method}
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 ml-7">
                {assigning === u.id ? (
                  <div className="flex items-center gap-2 w-full">
                    <select
                      value={selectedPlan}
                      onChange={(e) => setSelectedPlan(e.target.value)}
                      className="flex-1 px-2 py-1 text-xs rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)]"
                    >
                      <option value="">Pilih plan...</option>
                      {plans.filter(p => p.slug !== "free").map((p) => (
                        <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
                      ))}
                    </select>
                    <button onClick={() => assignPlan(u.id)} className="px-2 py-1 text-[10px] font-medium rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
                      Assign
                    </button>
                    <button onClick={() => { setAssigning(null); setSelectedPlan(""); }} className="px-2 py-1 text-[10px] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                      Batal
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setAssigning(u.id)}
                      className="px-2 py-1 text-[10px] font-medium rounded-lg bg-violet-500/20 text-violet-400 hover:bg-violet-500/30"
                    >
                      Assign Plan
                    </button>
                    {ap && (
                      <button
                        onClick={() => deletePlan(u.id)}
                        className="px-2 py-1 text-[10px] font-medium rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      >
                        Hapus Plan
                      </button>
                    )}
                    <button
                      onClick={() => resetLimits([u.id])}
                      disabled={resetting}
                      className="px-2 py-1 text-[10px] font-medium rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 disabled:opacity-50"
                    >
                      Reset Limit
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
