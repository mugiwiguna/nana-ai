"use client";

import { useEffect, useState } from "react";

export default function ReferralPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applyCode, setApplyCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchReferral = async () => {
    setLoading(true);
    const res = await fetch("/api/referral");
    const d = await res.json();
    setData(d);
    setLoading(false);
  };

  useEffect(() => { fetchReferral(); }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleApply = async () => {
    if (!applyCode.trim()) return;
    setApplying(true);
    const res = await fetch("/api/referral/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: applyCode.trim() }),
    });
    const d = await res.json();
    setApplying(false);
    if (res.ok) {
      setToast({ text: d.message, ok: true });
      setApplyCode("");
      fetchReferral();
    } else {
      setToast({ text: d.error, ok: false });
    }
  };

  const copyCode = () => {
    if (!data?.code) return;
    navigator.clipboard.writeText(data.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="animate-pulse h-40 rounded-xl bg-[var(--bg-secondary)]" />;
  if (!data) return null;

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-sm font-medium shadow-2xl border-[3px] ${toast.ok ? "bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-400 dark:text-emerald-200" : "bg-red-50 border-red-500 text-red-800 dark:bg-red-950 dark:border-red-400 dark:text-red-200"}`}>
          {toast.text}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold">Referral</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">Undang teman, dapatkan bonus!</p>
      </div>

      {!data.isActive && (
        <div className="glass-card rounded-xl p-4 border-l-4 border-amber-500">
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Program referral sedang tidak aktif</p>
        </div>
      )}

      {/* Referral Code */}
      <div className="glass-card rounded-xl p-5">
        <p className="text-sm text-[var(--text-secondary)] mb-2">Kode Referral Kamu</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-2xl font-mono font-bold tracking-[0.3em] text-center text-[var(--gradient-start)]">
            {data.code}
          </div>
          <button
            onClick={copyCode}
            className="px-4 py-3 rounded-xl bg-[var(--gradient-start)] text-white font-medium text-sm hover:opacity-90 transition-all"
          >
            {copied ? "✓ Copied" : "Copy Link"}
          </button>
        </div>
        <p className="text-[11px] text-[var(--text-secondary)] mt-2">
          Bagikan link: <span className="font-mono">{data.shareUrl}</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-500">{data.stats.completed}</p>
          <p className="text-[11px] text-[var(--text-secondary)]">Berhasil</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-500">${data.stats.totalEarned.toFixed(2)}</p>
          <p className="text-[11px] text-[var(--text-secondary)]">Bonus Diterima</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[var(--text-secondary)]">{data.stats.remaining}</p>
          <p className="text-[11px] text-[var(--text-secondary)]">Sisa Slot</p>
        </div>
      </div>

      {/* Apply Code */}
      <div className="glass-card rounded-xl p-5">
        <p className="text-sm font-medium mb-3">Punya Kode Referral?</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={applyCode}
            onChange={e => setApplyCode(e.target.value.toUpperCase())}
            placeholder="Masukkan kode..."
            maxLength={6}
            className="flex-1 px-3 py-2 text-sm rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-violet-500/50 font-mono tracking-wider text-center"
          />
          <button
            onClick={handleApply}
            disabled={applying || !applyCode.trim()}
            className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 font-medium text-sm hover:bg-emerald-500/30 disabled:opacity-50 transition-all"
          >
            {applying ? "..." : "Gunakan"}
          </button>
        </div>
        <p className="text-[11px] text-[var(--text-secondary)] mt-2">
          Dapatkan ${data.bonusAmount} untukmu dan temanmu setelah topup pertama ≥ $1
        </p>
      </div>

      {/* History */}
      <div className="glass-card rounded-xl p-5">
        <p className="text-sm font-medium mb-3">Riwayat Referral ({data.stats.total})</p>
        {data.referrals.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)] text-center py-4">Belum ada referral</p>
        ) : (
          <div className="space-y-2">
            {data.referrals.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-[var(--border-color)] last:border-0">
                <div>
                  <p className="text-sm font-medium">{r.referee_name || "User"}</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">{fmtDate(r.created_at)}</p>
                </div>
                <div>
                  {r.is_completed ? (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">+${r.bonus_amount}</span>
                  ) : (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
