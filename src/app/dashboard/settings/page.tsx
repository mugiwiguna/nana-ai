"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [topups, setTopups] = useState<any[]>([]);
  const [cpw, setCpw] = useState("");
  const [npw, setNpw] = useState("");
  const [npw2, setNpw2] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const user = session?.user as any;
  const isGoogle = !!user?.image;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      fetch("/api/user/topups").then(r => r.json()).then(d => setTopups(d.topups || []));
    }
  }, [status, router]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (npw !== npw2) { setPwMsg("⚠️ Password baru tidak cocok"); return; }
    if (npw.length < 6) { setPwMsg("⚠️ Minimal 6 karakter"); return; }
    setPwLoading(true); setPwMsg("");
    const res = await fetch("/api/user/password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: cpw, newPassword: npw }),
    });
    const data = await res.json();
    setPwMsg(data.success ? "✅ " + data.message : "❌ " + (data.error || "Gagal"));
    if (data.success) { setCpw(""); setNpw(""); setNpw2(""); }
    setPwLoading(false);
  };

  if (status === "loading") return <p className="text-center mt-20 text-[var(--text-secondary)]">Loading...</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-8">
      <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Pengaturan</h1>

      {/* Info Akun */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Informasi Akun</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-[var(--border-color)] pb-2">
            <span className="text-[var(--text-secondary)]">Email</span>
            <span className="text-[var(--text-primary)] font-medium">{user?.email || "—"}</span>
          </div>
          <div className="flex justify-between border-b border-[var(--border-color)] pb-2">
            <span className="text-[var(--text-secondary)]">Nama</span>
            <span className="text-[var(--text-primary)] font-medium">{user?.name || "—"}</span>
          </div>
          <div className="flex justify-between border-b border-[var(--border-color)] pb-2">
            <span className="text-[var(--text-secondary)]">Saldo</span>
            <span className="gradient-text font-medium">${Number(user?.balance || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-b border-[var(--border-color)] pb-2">
            <span className="text-[var(--text-secondary)]">Login via</span>
            <span className="text-[var(--text-primary)] font-medium">{isGoogle ? "Google" : "Email + Password"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Status</span>
            <span className={`font-medium ${user?.status === "active" ? "gradient-text" : "text-red-400"}`}>
              {user?.email === "admin@nanaai.id" ? "Admin" : user?.status === "active" ? "Aktif" : user?.status === "suspended" ? "Suspend" : "Banned"}
            </span>
          </div>
        </div>
      </div>

      {/* History Topup */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Riwayat Top-up</h2>
        {topups.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">Belum ada transaksi top-up.</p>
        ) : (
          <div className="space-y-2">
            {topups.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between text-sm py-2 border-b border-[var(--border-color)] last:border-0">
                <div>
                  <span className="text-[var(--text-primary)]">${Number(t.amount).toFixed(2)}</span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                    t.status === "success" ? "bg-[var(--gradient-start)]/10 text-[var(--gradient-start)] border border-[var(--gradient-start)]/20" :
                    t.status === "pending" ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" :
                    "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                  }`}>{t.status === "success" ? "Sukses" : t.status === "pending" ? "Pending" : "Gagal"}</span>
                </div>
                <span className="text-xs text-[var(--text-secondary)]">{new Date(t.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Ubah Password</h2>
        {isGoogle ? (
          <div className="text-sm text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-4 py-3">
            Akun Google tidak mendukung perubahan password.
          </div>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Password Saat Ini</label>
              <input type="password" value={cpw} onChange={(e) => setCpw(e.target.value)} required
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Password Baru</label>
              <input type="password" value={npw} onChange={(e) => setNpw(e.target.value)} required minLength={6}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Konfirmasi Password Baru</label>
              <input type="password" value={npw2} onChange={(e) => setNpw2(e.target.value)} required minLength={6}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]" />
            </div>
            {pwMsg && (
              <div className={`text-xs px-3 py-2 rounded-lg ${pwMsg.startsWith("✅") ? "bg-[var(--gradient-start)]/10 text-[var(--gradient-start)] border border-[var(--gradient-start)]/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                {pwMsg}
              </div>
            )}
            <button type="submit" disabled={pwLoading}
              className="w-full bg-[var(--gradient-start)] hover:opacity-90 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition">
              {pwLoading ? "Memproses..." : "Simpan Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
