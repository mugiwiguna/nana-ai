"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: string;
  credits: string;
  duration_days: number;
  features: string[];
  is_popular: boolean;
  is_active: boolean;
  daily_token_limit: number | null;
  weekly_token_limit: number | null;
  monthly_token_limit: number | null;
}

interface Subscription {
  active: {
    plan_name: string;
    plan_credits: string;
    starts_at: string;
    expires_at: string;
    payment_method: string;
    limit_multiplier: number;
    daily_token_limit: number | null;
    weekly_token_limit: number | null;
    monthly_token_limit: number | null;
  } | null;
  history: {
    id: string;
    plan_name: string;
    price: string;
    status: string;
    payment_method: string;
    starts_at: string;
    expires_at: string;
    created_at: string;
  }[];
  tokenLimits: {
    daily: { limit: number | null; used: number; remaining: number | null };
    weekly: { limit: number | null; used: number; remaining: number | null };
    monthly: { limit: number | null; used: number; remaining: number | null };
  } | null;
  freeTierLimits: {
    daily: { limit: number | null; used: number; remaining: number | null };
    weekly: { limit: number | null; used: number; remaining: number | null };
    monthly: { limit: number | null; used: number; remaining: number | null };
  } | null;
}

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [paymentPicker, setPaymentPicker] = useState<{ planId: string; planName: string; price: string } | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [freeUsage, setFreeUsage] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/plans").then((r) => r.json()),
      fetch("/api/subscription").then((r) => r.json()),
      fetch("/api/user/free-tier-usage", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
    ])
      .then(([p, s, f]) => {
        setPlans(p);
        setSub(s);
        if (f && !f.error) setFreeUsage(f);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubscribe(planId: string, method: "balance" | "qris") {
    setBuying(planId);
    setPaymentPicker(null);
    setMsg(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: planId, payment_method: method }),
      });
      const json = await res.json();
      if (res.ok) {
        setMsg({ text: json.message || "Berhasil!", ok: true });
        // Refresh subscription data
        const s = await fetch("/api/subscription").then((r) => r.json());
        setSub(s);
      } else {
        setMsg({ text: json.error || "Gagal", ok: false });
      }
    } catch {
      setMsg({ text: "Network error", ok: false });
    }
    setBuying(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[var(--gradient-start)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  const hasActivePlan = sub?.active != null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-8">
      {/* Message */}
      {msg && (
        <div className={`p-4 rounded-xl text-sm font-medium ${
          msg.ok
            ? "bg-[var(--gradient-start)]/10 text-[var(--gradient-start)] border border-[var(--gradient-start)]/20"
            : "bg-red-500/10 text-red-500 border border-red-500/20"
        }`}>
          {msg.text}
        </div>
      )}

      {/* Free Tier Card */}
      {freeUsage && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Free Tier</h2>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              freeUsage.eligible
                ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
            }`}>
              {freeUsage.eligible ? "Aktif" : "Tidak Aktif"}
            </span>
          </div>

          {freeUsage.eligible ? (
            <>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Akses gratis {freeUsage.freeModels} model · {freeUsage.used.toLocaleString()} / {freeUsage.limit.toLocaleString()} token hari ini
              </p>
              <div className="w-full h-3 bg-[var(--bg-primary)] rounded-full overflow-hidden border border-[var(--border-color)] mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    freeUsage.percentage > 90 ? "bg-red-500" : freeUsage.percentage > 70 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(100, freeUsage.percentage)}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-secondary)]">
                  Sisa: {freeUsage.remaining.toLocaleString()} token
                </span>
                <span className="text-xs text-[var(--text-secondary)]">
                  Reset harian
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">
              Top-up minimal $1 untuk mendapatkan akses gratis ke model free tier ({freeUsage.freeModels} model tersedia).
            </p>
          )}
        </div>
      )}

      {/* Active Plan */}
      {hasActivePlan && (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Plan Aktif</h2>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-2xl font-bold text-[var(--gradient-start)]">{sub!.active!.plan_name}
                {(sub!.active!.limit_multiplier ?? 1) > 1 && (
                  <span className="ml-2 text-sm font-normal px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400">
                    x{sub!.active!.limit_multiplier}
                  </span>
                )}
              </p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Berlaku hingga {new Date(sub!.active!.expires_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-[var(--text-secondary)]">Harga plan</p>
              <p className="text-xl font-bold">${Number(sub!.active!.plan_credits).toLocaleString()}</p>
              <p className="text-[10px] text-[var(--text-secondary)]">~Rp {Math.round(Number(sub!.active!.plan_credits) * 16000).toLocaleString("id-ID")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Free Tier Limits — always shown for all users */}
      {sub?.freeTierLimits && (sub.freeTierLimits.daily.limit || sub.freeTierLimits.weekly.limit || sub.freeTierLimits.monthly.limit) && (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">
            <span className="text-violet-400">Free Tier</span> Limits
          </h2>
          <div className="space-y-3">
            {([
              ["daily", "Harian", "midnight WITA"],
              ["weekly", "Mingguan", "Senin"],
              ["monthly", "Bulanan", "tgl 1"],
            ] as const).map(([key, label, resetNote]) => {
              const l = sub.freeTierLimits![key];
              if (!l.limit) return null;
              const pct = (l.used / l.limit) * 100;
              return (
                <div key={key} className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-[var(--text-primary)]">Token {label}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{l.used.toLocaleString()} / {l.limit.toLocaleString()}</p>
                  </div>
                  <div className="w-full h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${
                      pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-emerald-500"
                    }`} style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                    Sisa: {(l.remaining ?? 0).toLocaleString()} · Reset {resetNote}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] mt-3">
            Limit free tier selalu dicek duluan. Jika habis, gunakan limit plan.
          </p>
        </div>
      )}

      {/* Paid Plan Token Limits — shown if user has active subscription with limits */}
      {sub?.active && sub?.tokenLimits && (sub.tokenLimits.daily.limit || sub.tokenLimits.weekly.limit || sub.tokenLimits.monthly.limit) && (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Plan Limits</h2>
          <div className="space-y-3">
            {([
              ["daily", "Harian", "midnight WITA"],
              ["weekly", "Mingguan", "cycle 7 hari dari tgl sub"],
              ["monthly", "Bulanan", "cycle 30 hari dari tgl sub"],
            ] as const).map(([key, label, resetNote]) => {
              const l = sub.tokenLimits![key];
              if (!l.limit) return null;
              const pct = (l.used / l.limit) * 100;
              return (
                <div key={key} className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-[var(--text-primary)]">Token {label}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{l.used.toLocaleString()} / {l.limit.toLocaleString()}</p>
                  </div>
                  <div className="w-full h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${
                      pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-emerald-500"
                    }`} style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                    Sisa: {(l.remaining ?? 0).toLocaleString()} · Reset {resetNote}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Plans List */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">
          {hasActivePlan ? "Upgrade Plan" : "Pilih Plan"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isOut = !plan.is_active;
            return (
              <div key={plan.id} className={`relative rounded-xl p-5 border transition-all ${
                plan.is_popular ? "border-[var(--gradient-start)]/40 bg-[var(--gradient-start)]/5" : "border-[var(--border-color)] bg-[var(--bg-secondary)]"
              } ${isOut ? "opacity-60" : ""}`}>
                {isOut ? (
                  <div className="absolute -top-2 right-3">
                    <span className="text-[10px] font-bold tracking-wider uppercase bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full">OUT OF STOCK</span>
                  </div>
                ) : plan.is_popular ? (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                    <span className="text-[10px] font-bold tracking-wider uppercase bg-[var(--accent-bg)] text-[var(--accent-fg)] px-3 py-0.5 rounded-full">Populer</span>
                  </div>
                ) : null}

                <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                <div className="mb-3">
                  <span className="text-2xl font-bold">${Number(plan.price).toLocaleString()}</span>
                  <span className="text-xs text-[var(--text-secondary)]"> / {plan.duration_days} hari</span>
                  <p className="text-[10px] text-[var(--text-secondary)]">~Rp {Math.round(Number(plan.price) * 16000).toLocaleString("id-ID")}</p>
                </div>

                {/* Token Limits */}
                {(plan.daily_token_limit || plan.weekly_token_limit || plan.monthly_token_limit) && (
                  <div className="mb-3 p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] space-y-0.5">
                    <p className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">Token Limits</p>
                    {plan.daily_token_limit && <p className="text-xs">Harian: <span className="font-semibold">{Number(plan.daily_token_limit).toLocaleString()}</span></p>}
                    {plan.weekly_token_limit && <p className="text-xs">Mingguan: <span className="font-semibold">{Number(plan.weekly_token_limit).toLocaleString()}</span></p>}
                    {plan.monthly_token_limit && <p className="text-xs">Bulanan: <span className="font-semibold">{Number(plan.monthly_token_limit).toLocaleString()}</span></p>}
                  </div>
                )}

                <ul className="space-y-1.5 mb-4">
                  {(plan.features || []).map((f: string, j: number) => (
                    <li key={j} className="flex items-start gap-1.5 text-xs text-[var(--text-secondary)]">
                      <span className="text-[var(--gradient-start)] shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {isOut ? (
                  <button disabled className="w-full text-sm font-semibold py-2.5 rounded-xl bg-gray-500/10 text-gray-500 cursor-not-allowed">
                    Stok Habis
                  </button>
                ) : (() => {
                  const activePrice = sub?.active ? parseFloat(sub.active.plan_credits) : 0;
                  const planPrice = parseFloat(plan.price);
                  const activeSlug = ""; // We'll use price comparison
                  const isSamePlan = sub?.active?.plan_name === plan.name;
                  const canUpgrade = hasActivePlan && planPrice > activePrice;
                  const canBuyback = hasActivePlan && isSamePlan;
                  const canBuy = !hasActivePlan;
                  const canAct = canBuy || canUpgrade || canBuyback;

                  let btnLabel = "Beli Paket";
                  if (buying === plan.id) btnLabel = "Memproses...";
                  else if (canBuyback) btnLabel = "Buyback (+limit & durasi)";
                  else if (canUpgrade) btnLabel = "Upgrade";
                  else if (hasActivePlan && !canAct) btnLabel = "Plan aktif lebih mahal";

                  return (
                    <button
                      onClick={() => canAct && setPaymentPicker({ planId: plan.id, planName: plan.name, price: plan.price })}
                      disabled={!canAct || buying === plan.id}
                      className={`w-full text-sm font-semibold py-2.5 rounded-xl transition-all duration-300 ${
                        plan.is_popular ? "bg-[var(--accent-bg)] text-[var(--accent-fg)]" : "border border-[var(--border-color)]"
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      {btnLabel}
                    </button>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </div>

      {/* History */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Riwayat</h2>
        {sub?.history && sub.history.length > 0 ? (
          <div className="space-y-2">
            {sub.history.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
                <div>
                  <p className="font-medium text-sm">{item.plan_name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {new Date(item.created_at).toLocaleDateString("id-ID")} · {item.payment_method === "balance" ? "Saldo" : "QRIS"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">${Number(item.price).toLocaleString()}</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">~Rp {Math.round(Number(item.price) * 16000).toLocaleString("id-ID")}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    item.status === "active"
                      ? "bg-[var(--gradient-start)]/10 text-[var(--gradient-start)]"
                      : item.status === "pending"
                        ? "bg-yellow-500/10 text-yellow-500"
                        : "bg-zinc-500/10 text-zinc-400"
                  }`}>
                    {item.status === "active" ? "Aktif" : item.status === "pending" ? "Pending" : "Kadaluarsa"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[var(--text-secondary)] text-sm text-center py-4">Belum ada riwayat</p>
        )}
      </div>

      {/* Payment Method Picker Modal */}
      {paymentPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-6 w-[90vw] max-w-sm border border-[var(--border-color)]">
            <h3 className="text-lg font-semibold mb-1">Beli {paymentPicker.planName}</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">Pilih metode pembayaran</p>

            <div className="space-y-3 mb-4">
              <button
                onClick={() => handleSubscribe(paymentPicker.planId, "balance")}
                disabled={buying === paymentPicker.planId}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-[var(--border-color)] hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-lg">💰</div>
                <div className="text-left flex-1">
                  <p className="text-sm font-medium">Bayar dengan Saldo</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    ${Number(paymentPicker.price).toLocaleString()} dari saldo akun
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleSubscribe(paymentPicker.planId, "qris")}
                disabled={buying === paymentPicker.planId}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-[var(--border-color)] hover:border-violet-500/50 hover:bg-violet-500/5 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center text-lg">📱</div>
                <div className="text-left flex-1">
                  <p className="text-sm font-medium">Scan QRIS</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">${Number(paymentPicker.price).toLocaleString()} · ~Rp {Math.round(Number(paymentPicker.price) * 16000).toLocaleString("id-ID")}</p>
                </div>
              </button>
            </div>

            <button
              onClick={() => setPaymentPicker(null)}
              className="w-full text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-2"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
