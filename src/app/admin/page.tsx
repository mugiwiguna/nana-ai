"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import ProviderSection from "@/components/admin/ProviderSection";
import ModelSection from "@/components/admin/ModelSection";

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [msg, onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-5 py-3 rounded-xl shadow-2xl text-sm flex items-center gap-3 border border-neutral-700 dark:border-neutral-200">
        <span>{msg}</span>
        <button onClick={onClose} className="text-neutral-400 hover:text-white dark:hover:text-neutral-600">&times;</button>
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } } .animate-slide-up { animation: slideUp 0.25s ease-out; }`}</style>
    </div>
  );
}

const infoRef = { current: null as HTMLDivElement | null };
function scrollToInfo() {
  setTimeout(() => {
    document.getElementById("admin-info-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);
}

type Tab = "users" | "providers" | "models";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [topupAmount, setTopupAmount] = useState("");
  const [toast, setToast] = useState("");
  const [topupHistory, setTopupHistory] = useState<any[]>([]);
  const [topupHistoryUser, setTopupHistoryUser] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [editBalanceOpen, setEditBalanceOpen] = useState("");
  const [editBalanceVal, setEditBalanceVal] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((msg: string) => {
    setToast("");
    requestAnimationFrame(() => setToast(msg));
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      if (session?.user?.email !== "admin@nana.mwcs.dev") { router.push("/dashboard"); return; }
      loadUsers();
    }
  }, [status, session, router]);

  const loadUsers = async () => {
    const url = search ? `/api/admin/users/search?q=${encodeURIComponent(search)}` : "/api/admin/users";
    const res = await fetch(url);
    const data = await res.json();
    setUsers(data.users || []);
  };

  useEffect(() => {
    if (status !== "authenticated" || session?.user?.email !== "admin@nana.mwcs.dev") return;
    const timer = setTimeout(loadUsers, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (showPicker) setTimeout(() => pickerRef.current?.focus(), 100);
  }, [showPicker]);

  const loadTopupHistory = async (userId: string) => {
    setTopupHistoryUser(userId);
    if (!userId) { setTopupHistory([]); return; }
    const res = await fetch(`/api/admin/topups?userId=${userId}`);
    const data = await res.json();
    setTopupHistory(data.topups || []);
  };

  const handleTopup = async () => {
    if (!selectedUser || !topupAmount) return;
    const res = await fetch("/api/admin/balance", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selectedUser, amount: parseFloat(topupAmount) }),
    });
    const data = await res.json();
    if (data.success) {
      const amt = parseFloat(topupAmount);
      const label = amt >= 0 ? "Top-up" : "Pengurangan";
      showToast(`✅ ${label} $${Math.abs(amt).toFixed(2)} berhasil`);
      setTopupAmount(""); loadUsers(); loadTopupHistory(selectedUser);
    } else { showToast(`❌ ${data.error}`); }
  };

  const handleEditBalance = async (userId: string) => {
    const amt = parseFloat(editBalanceVal);
    if (isNaN(amt) || amt < 0) { showToast("⚠️ Masukkan angka valid"); return; }
    const res = await fetch("/api/admin/edit-balance", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, balance: amt }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(`✅ Saldo ${users.find(u=>u.id===userId)?.email} diubah ke $${amt.toFixed(2)}`);
    } else { showToast(`❌ ${data.error}`); }
    setEditBalanceOpen(""); loadUsers();
  };

  const handleBan = async (userId: string, action: string) => {
    const label = action === "active" ? "aktifkan" : action;
    if (!confirm(`Yakin ${label} user ini?`)) return;
    const res = await fetch("/api/admin/ban", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(`✅ User ${action === "active" ? "diaktifkan" : label + "d"}`);
    } else { showToast(`❌ ${data.error || "Gagal"}`); }
    if (data.success) loadUsers();
  };

  const getSmartResetAmount = async (userId: string): Promise<number> => {
    const user = users.find(u => u.id === userId);
    if (!user) return 5;
    const tuRes = await fetch(`/api/admin/topups?userId=${userId}`);
    const tuData = await tuRes.json();
    const topups = tuData.topups || [];
    const lastTopup = topups.length > 0 ? Number(topups[0].amount) : 0;
    return Number(user.balance) + lastTopup;
  };

  const handleResetUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    const a = await getSmartResetAmount(userId);
    if (!confirm(`Reset quota ${user?.email || "?"} ke $${a.toFixed(2)}?`)) return;
    const res = await fetch("/api/admin/reset-quota", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, amount: a }) });
    const data = await res.json();
    if (data.success) showToast(`✅ ${data.message}`);
    else showToast(`❌ ${data.error}`);
    if (data.success) loadUsers();
  };

  const handleResetAllSmart = async () => {
    if (!confirm("Reset SEMUA user dengan saldo+topup terakhir?")) return;
    await Promise.all(users.filter(u => u.email !== "admin@nana.mwcs.dev").map(async (u) => {
      const a = await getSmartResetAmount(u.id);
      await fetch("/api/admin/reset-quota", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: u.id, amount: a }) });
    }));
    showToast("✅ Semua user direset"); loadUsers();
  };

  const handleInfoClick = async (u: any) => {
    setSelectedUser(u.id);
    await loadTopupHistory(u.id);
    scrollToInfo();
  };

  const summary = users.reduce((acc, u) => ({
    totalUsers: acc.totalUsers + 1,
    totalBalance: acc.totalBalance + Number(u.balance),
    totalUsage: acc.totalUsage + Number(u.total_usage),
    totalKeys: acc.totalKeys + Number(u.api_key_count),
  }), { totalUsers: 0, totalBalance: 0, totalUsage: 0, totalKeys: 0 });

  const pickerItems = users.filter(u => u.email !== "admin@nana.mwcs.dev" && (!pickerSearch || u.email.toLowerCase().includes(pickerSearch.toLowerCase()) || u.name?.toLowerCase().includes(pickerSearch.toLowerCase())));
  const topupUserObj = users.find(u => u.id === topupHistoryUser);

  if (status === "loading") return <p className="text-center mt-20 text-[var(--text-secondary)]">Loading...</p>;
  if (session?.user?.email !== "admin@nana.mwcs.dev") return null;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Admin Panel</h1>

      <div className="flex gap-6 mt-6 border-b border-[var(--border-color)]">
        {([
          ["users", "Pengguna"],
          ["providers", "Provider"],
          ["models", "Model Kustom"],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-1 py-2 text-sm font-medium transition border-b-2 ${
              tab === key
                ? "text-[var(--text-primary)] border-[var(--text-primary)]"
                : "text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "providers" && <ProviderSection showToast={showToast} />}
      {tab === "models" && <ModelSection showToast={showToast} />}
      {tab === "users" && (
        <>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SumCard title="Total User" value={summary.totalUsers} />
        <SumCard title="Total Saldo" value={"$" + summary.totalBalance.toFixed(2)} />
        <SumCard title="API Key" value={summary.totalKeys} />
        <SumCard title="Revenue" value={"$" + summary.totalUsage.toFixed(4)} />
      </div>

      {/* Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Topup */}
        <div className="bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Tambah Saldo</h2>
          <div className="space-y-3">
            <button onClick={() => setShowPicker(true)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-left text-[var(--text-primary)] hover:border-[var(--text-secondary)] transition">
              {selectedUser ? users.find(u => u.id === selectedUser)?.email || "Pilih user..." : "Pilih user..."}
            </button>
            {showPicker && (
              <>
                <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setShowPicker(false)} />
                <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 max-w-[90vw] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden">
                  <div className="p-3 border-b border-[var(--border-color)]">
                    <input ref={pickerRef} type="text" value={pickerSearch} onChange={(e) => setPickerSearch(e.target.value)}
                      placeholder="Cari user..."
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none" />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-1">
                    {pickerItems.length === 0 ? (
                      <p className="text-sm text-[var(--text-secondary)] p-3 text-center">Tidak ditemukan</p>
                    ) : pickerItems.map((u: any) => (
                      <button key={u.id} onClick={() => { setSelectedUser(u.id); setShowPicker(false); setPickerSearch(""); loadTopupHistory(u.id); }}
                        className="flex items-center justify-between w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-[var(--bg-secondary)] transition">
                        <span className="text-[var(--text-primary)]">{u.email}</span>
                        <span className="text-[var(--gradient-start)] font-mono text-xs">${Number(u.balance).toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <input type="number" step="0.01" value={topupAmount} onChange={(e) => setTopupAmount(e.target.value)}
              placeholder="Contoh: 10 atau -5"
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]" />
            <button onClick={handleTopup}
              className="w-full bg-[var(--gradient-start)] hover:opacity-90 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
              {!topupAmount || parseFloat(topupAmount) >= 0 ? "Tambah Saldo" : "Kurangi Saldo"}
            </button>
          </div>
          {topupHistory.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
              <h3 className="text-xs font-semibold text-[var(--text-secondary)] mb-2">Riwayat Top-up {topupUserObj?.email}</h3>
              <div className="space-y-1">
                {topupHistory.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-secondary)]">{new Date(t.created_at).toLocaleDateString()}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono">+${Number(t.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              {topupUserObj && (
                <p className="text-xs text-[var(--text-secondary)] mt-2">Saldo: <span className="text-emerald-600 dark:text-emerald-400 font-medium">${Number(topupUserObj.balance).toFixed(2)}</span></p>
              )}
            </div>
          )}
        </div>

        {/* Reset & Edit */}
        <div className="bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Reset Quota</h2>
          <div className="space-y-3">
            <p className="text-xs text-[var(--text-secondary)]">Saldo + top-up terakhir.</p>
            <button onClick={() => { if (!selectedUser) { showToast("⚠️ Pilih user dulu"); return; } handleResetUser(selectedUser); }}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
              Reset User Terpilih
            </button>
            <button onClick={handleResetAllSmart}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
              Reset Semua (Smart)
            </button>
          </div>
        </div>

        {/* Info */}
        <div id="admin-info-section" className="bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] rounded-xl p-5 scroll-mt-32">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Info User</h2>
          {selectedUser ? (() => {
            const u = users.find(x => x.id === selectedUser);
            return u ? (
              <div className="space-y-2 text-sm">
                <p className="text-[var(--text-secondary)]"><span className="text-[var(--text-primary)]">Email:</span> {u.email}</p>
                <p className="text-[var(--text-secondary)]"><span className="text-[var(--text-primary)]">Saldo:</span> <span className="text-emerald-600 dark:text-emerald-400">${Number(u.balance).toFixed(2)}</span>
                  <button onClick={() => { setEditBalanceOpen(u.id); setEditBalanceVal(String(Number(u.balance))); }} className="ml-2 text-xs text-blue-500 hover:underline">edit</button>
                </p>
                {editBalanceOpen === u.id && (
                  <div className="flex gap-2 items-center">
                    <input type="number" step="0.01" value={editBalanceVal} onChange={(e) => setEditBalanceVal(e.target.value)}
                      className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded px-2 py-1 text-xs text-[var(--text-primary)] w-24" />
                    <button onClick={() => handleEditBalance(u.id)} className="text-xs text-emerald-500 hover:underline">simpan</button>
                    <button onClick={() => setEditBalanceOpen("")} className="text-xs text-[var(--text-secondary)] hover:underline">batal</button>
                  </div>
                )}
                <p className="text-[var(--text-secondary)]"><span className="text-[var(--text-primary)]">Status:</span> {u.email === "admin@nana.mwcs.dev" ? "🔧 Admin" : u.status === "active" ? "✅ Aktif" : u.status === "suspended" ? "⏸ Suspend" : "🚫 Banned"}</p>
                <p className="text-[var(--text-secondary)]"><span className="text-[var(--text-primary)]">Keys:</span> {u.api_key_count}</p>
                <p className="text-[var(--text-secondary)]"><span className="text-[var(--text-primary)]">Usage:</span> ${Number(u.total_usage).toFixed(4)}</p>
                {topupHistory.length > 0 && (
                  <div className="pt-2 border-t border-[var(--border-color)]">
                    <p className="text-xs font-semibold text-[var(--text-secondary)] mb-1">Top-up History</p>
                    {topupHistory.map((t: any) => (
                      <div key={t.id} className="flex items-center justify-between text-xs py-1">
                        <span className="text-[var(--text-secondary)]">{new Date(t.created_at).toLocaleDateString()}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono">+${Number(t.amount).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : <p className="text-xs text-[var(--text-secondary)]">Tidak ditemukan</p>;
          })() : <p className="text-xs text-[var(--text-secondary)]">Pilih user dulu.</p>}
        </div>
      </div>

      {/* Users table */}
      <div className="bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] rounded-xl p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">User ({users.length})</h2>
          <input ref={searchRef} type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari..."
            className="sm:w-64 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)]">
                <th className="text-left py-3 px-4 font-medium">Email</th>
                <th className="text-left py-3 px-4 font-medium">Nama</th>
                <th className="text-right py-3 px-4 font-medium">Saldo</th>
                <th className="text-center py-3 px-4 font-medium">Status</th>
                <th className="text-right py-3 px-4 font-medium">Keys</th>
                <th className="text-right py-3 px-4 font-medium">Usage</th>
                <th className="text-right py-3 px-4 font-medium">Info</th>
                <th className="text-right py-3 px-4 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} className="border-b border-[var(--border-color)] group">
                  <td className="py-2 px-4 text-[var(--text-primary)] max-w-[180px] truncate">{u.email}</td>
                  <td className="py-2 px-4 text-[var(--text-secondary)]">{u.name}</td>
                  <td className="py-2 px-4 text-right">
                    <span className="text-[var(--gradient-start)]">${Number(u.balance).toFixed(2)}</span>
                    <button onClick={() => { setSelectedUser(u.id); setEditBalanceOpen(u.id); setEditBalanceVal(String(Number(u.balance))); }}
                      className="ml-1.5 text-[10px] text-blue-400 opacity-0 group-hover:opacity-100 transition">✎</button>
                  </td>
                  <td className="py-2 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      u.email === "admin@nana.mwcs.dev"
                        ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                        : u.status === "active" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                      : u.status === "suspended" ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                      : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                    }`}>
                      {u.email === "admin@nana.mwcs.dev" ? "Admin" : u.status === "active" ? "Aktif" : u.status === "suspended" ? "Suspend" : "Banned"}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-right text-[var(--text-secondary)]">{u.api_key_count}</td>
                  <td className="py-2 px-4 text-right text-[var(--text-secondary)]">${Number(u.total_usage).toFixed(4)}</td>
                  <td className="py-2 px-4 text-right">
                    <button onClick={() => handleInfoClick(u)}
                      className="text-xs text-blue-500 hover:text-blue-400 transition">Lihat</button>
                  </td>
                  <td className="py-2 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {u.email !== "admin@nana.mwcs.dev" && (
                        <>
                          <button onClick={() => { setSelectedUser(u.id); handleResetUser(u.id); }}
                            className="text-xs text-blue-500 hover:text-blue-400 px-1" title="Reset quota">↺</button>
                          {u.status === "active" && (
                            <button onClick={() => handleBan(u.id, "suspend")}
                              className="text-xs text-amber-500 hover:text-amber-400 px-1" title="Suspend">⏸</button>
                          )}
                          {u.status !== "active" && (
                            <button onClick={() => handleBan(u.id, "active")}
                              className="text-xs text-emerald-500 hover:text-emerald-400 px-1" title="Unban/Aktifkan">▶</button>
                          )}
                          {u.status === "active" && (
                            <button onClick={() => handleBan(u.id, "ban")}
                              className="text-xs text-red-500 hover:text-red-400 px-1" title="Ban">✕</button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast msg={toast} onClose={() => setToast("")} />}
      </>
      )}
    </div>
  );
}

function SumCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] rounded-xl p-5">
      <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1">{title}</p>
      <p className="text-2xl font-bold mt-1 text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
