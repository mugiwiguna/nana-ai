"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const AMOUNTS_USD = [5, 10, 25, 50, 100];

export default function TopupPage() {
  const { status } = useSession();
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(10);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD")
      .then(r => r.json())
      .then(d => setRate(d.rates.IDR))
      .catch(() => setRate(16000));
  }, []);

  if (status === "unauthenticated") router.push("/login");
  if (status === "loading") return <p className="text-center mt-20 text-[var(--text-secondary)]">Loading...</p>;

  const activeAmount = customAmount ? parseFloat(customAmount) : (selected || 0);
  const validAmount = Math.max(1, activeAmount);
  const idrAmount = Math.round(validAmount * (rate || 16000));
  const formattedIdr = new Intl.NumberFormat("id-ID").format(idrAmount);

  const handleTopup = async () => {
    const amt = Math.max(1, activeAmount);
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/topup", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amt }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-16">
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Top Up Saldo</h1>
      <p className="text-xs text-[var(--text-secondary)] mb-6">
        Kurs: 1 USD = Rp {rate ? new Intl.NumberFormat("id-ID").format(rate) : "..."} &middot; Harga realtime dari open.er-api.com
      </p>
      <div className="max-w-md">
        <p className="text-[var(--text-secondary)] text-sm mb-3">Pilih nominal:</p>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {AMOUNTS_USD.map((a) => (
            <button key={a} onClick={() => { setSelected(a); setCustomAmount(""); }}
              className={`p-3 rounded-xl border text-sm font-medium transition text-center ${
                selected === a && !customAmount
                  ? "border-[var(--gradient-start)] bg-[var(--gradient-start)]/10 text-[var(--gradient-start)]"
                  : "border-[var(--border-color)] hover:border-[var(--text-secondary)] text-[var(--text-primary)]"
              }`}>
              <div className="font-semibold">${a}</div>
              <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">≈ Rp {new Intl.NumberFormat("id-ID").format(a * (rate || 16000))}</div>
            </button>
          ))}
        </div>
        <div className="mb-4">
          <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Atau isi sendiri (USD, min $1):</label>
          <input type="number" min="1" step="0.01" value={customAmount} onChange={(e) => { setCustomAmount(e.target.value); setSelected(null); }}
            placeholder="Contoh: 3.50"
            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]" />
        </div>
        <div className="glass-card rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">USD</span>
            <span className="text-[var(--text-primary)] font-semibold font-mono">${validAmount.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-[var(--border-color)]">
            <span className="text-[var(--text-secondary)]">IDR (Rp)</span>
            <span className="gradient-text font-semibold font-mono">Rp {formattedIdr}</span>
          </div>
        </div>
        <button onClick={handleTopup} disabled={loading}
          className="w-full bg-[var(--gradient-start)] hover:opacity-90 disabled:opacity-50 py-3 rounded-xl font-semibold text-white transition flex items-center justify-center gap-2">
          {loading ? "Memproses..." : <>Bayar Rp {formattedIdr}</>}
        </button>
        {result && (
          <div className={`mt-4 p-4 rounded-xl text-sm ${
            result.status === "success"
              ? "bg-[var(--gradient-start)]/10 border border-[var(--gradient-start)]/20 text-[var(--gradient-start)]"
              : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
          }`}>
            {result.status === "success"
              ? `✅ Pembayaran Rp ${formattedIdr} berhasil. +$${result.amount} ke saldo.`
              : `❌ Gagal: ${result.error || "Unknown error"}`}
          </div>
        )}
        <p className="text-[var(--text-secondary)] text-xs mt-4">
          * Pembayaran masih mock (auto-approve). Midtrans/Xendit menyusul. <br />
          Minimal $1.
        </p>
      </div>
    </div>
  );
}
