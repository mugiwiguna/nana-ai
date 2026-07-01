"use client";

import { useEffect, useState } from "react";

export default function ReferralAdminSection() {
  const [settings, setSettings] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/referral");
    const d = await res.json();
    setSettings(d.settings);
    setStats(d.stats);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/referral", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        is_active: settings.is_active,
        max_per_user: Number(settings.max_per_user),
        bonus_amount: Number(settings.bonus_amount),
      }),
    });
    setSaving(false);
    if (res.ok) {
      setToast({ text: "Pengaturan disimpan", ok: true });
    } else {
      setToast({ text: "Gagal menyimpan", ok: false });
    }
  };

  if (loading) return <div className="animate-pulse h-40 rounded-xl bg-[var(--bg-secondary)]" />;

  return (
    <div className="space-y-4">
      {toast && (
        <div className={`px-4 py-2 rounded-xl text-sm font-medium ${toast.ok ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
          {toast.text}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Pengaturan Referral</h2>
        {stats && (
          <span className="text-xs text-[var(--text-secondary)]">
            {stats.completed} referral berhasil · ${Number(stats.total_bonus_paid).toFixed(2)} total bonus
          </span>
        )}
      </div>

      <div className="glass-card rounded-xl p-5 space-y-4">
        {/* Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Program Referral</p>
            <p className="text-[11px] text-[var(--text-secondary)]">Aktifkan/nonaktifkan program referral</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, is_active: !settings.is_active })}
            className={`relative w-12 h-6 rounded-full transition-colors ${settings.is_active ? "bg-emerald-500" : "bg-zinc-400"}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${settings.is_active ? "translate-x-6" : ""}`} />
          </button>
        </div>

        {/* Bonus amount */}
        <div>
          <label className="text-sm font-medium block mb-1">Bonus per Referral (USD)</label>
          <p className="text-[11px] text-[var(--text-secondary)] mb-2">Jumlah bonus yang diterima referrer dan referee</p>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={settings.bonus_amount}
            onChange={e => setSettings({ ...settings, bonus_amount: e.target.value })}
            className="w-32 px-3 py-2 text-sm rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:outline-none focus:border-violet-500/50"
          />
        </div>

        {/* Max per user */}
        <div>
          <label className="text-sm font-medium block mb-1">Maksimal Referral per User</label>
          <p className="text-[11px] text-[var(--text-secondary)] mb-2">Berapa banyak referral yang bisa dikumpulkan per user</p>
          <input
            type="number"
            min="1"
            step="1"
            value={settings.max_per_user}
            onChange={e => setSettings({ ...settings, max_per_user: e.target.value })}
            className="w-32 px-3 py-2 text-sm rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:outline-none focus:border-violet-500/50"
          />
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2 rounded-xl bg-violet-500/20 text-violet-400 font-medium text-sm hover:bg-violet-500/30 disabled:opacity-50 transition-all"
        >
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </div>
  );
}
