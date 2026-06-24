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
}

interface Subscription {
  active: {
    plan_name: string;
    plan_credits: string;
    starts_at: string;
    expires_at: string;
    payment_method: string;
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
}

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<"balance" | "qris">("balance");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/plans").then((r) => r.json()),
      fetch("/api/subscription").then((r) => r.json()),
    ])
      .then(([p, s]) => {
        setPlans(p);
        setSub(s);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubscribe(planId: string) {
    setBuying(planId);
    setMsg(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: planId, payment_method: payMethod }),
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

      {/* Active Plan */}
      {hasActivePlan && (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Plan Aktif</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-[var(--gradient-start)]">{sub!.active!.plan_name}</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Berlaku hingga {new Date(sub!.active!.expires_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-[var(--text-secondary)]">Credit plan</p>
              <p className="text-xl font-bold">Rp {Number(sub!.active!.plan_credits).toLocaleString("id-ID")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Plans List */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">
          {hasActivePlan ? "Upgrade Plan" : "Pilih Plan"}
        </h2>

        <p className="text-xs text-[var(--text-secondary)] mb-6">Sistem plan sedang dalam pengembangan. Akan segera tersedia.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-xl p-5 border transition-all ${
                plan.is_popular
                  ? "border-[var(--gradient-start)]/40 bg-[var(--gradient-start)]/5"
                  : "border-[var(--border-color)] bg-[var(--bg-secondary)]"
              }`}
            >
              {/* Soon badge */}
              <div className="absolute -top-2 right-3">
                <span className="text-[10px] font-bold tracking-wider uppercase bg-zinc-500/80 text-[var(--accent-fg)] px-2 py-0.5 rounded-full">
                  Soon
                </span>
              </div>

              {plan.is_popular && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                  <span className="text-[10px] font-bold tracking-wider uppercase bg-[var(--accent-bg)] text-[var(--accent-fg)] px-3 py-0.5 rounded-full">
                    Populer
                  </span>
                </div>
              )}

              <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
              <div className="mb-3">
                <span className="text-2xl font-bold">Rp {Number(plan.price).toLocaleString("id-ID")}</span>
                <span className="text-xs text-[var(--text-secondary)]"> / {plan.duration_days} hari</span>
              </div>

              <div className="mb-3 p-2 rounded-lg bg-black/10">
                <p className="text-xs text-[var(--text-secondary)]">Credit</p>
                <p className="text-sm font-bold text-[var(--gradient-start)]">
                  Rp {Number(plan.credits).toLocaleString("id-ID")}
                  <span className="text-[10px] font-normal text-[var(--gradient-start)] ml-1">
                    +{Math.round(((Number(plan.credits) - Number(plan.price)) / Number(plan.price)) * 100)}%
                  </span>
                </p>
              </div>

              <ul className="space-y-1.5 mb-4">
                {(plan.features || []).map((f: string, j: number) => (
                  <li key={j} className="flex items-start gap-1.5 text-xs text-[var(--text-secondary)]">
                    <span className="text-[var(--gradient-start)] shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                disabled
                className={`w-full text-sm font-semibold py-2.5 rounded-xl transition-all duration-300 cursor-not-allowed opacity-40 ${
                  plan.is_popular
                    ? "bg-[var(--accent-bg)] text-[var(--accent-fg)]"
                    : "border border-[var(--border-color)]"
                }`}
              >
                Segera Hadir
              </button>
            </div>
          ))}
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
                  <p className="text-sm font-medium">Rp {Number(item.price).toLocaleString("id-ID")}</p>
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
    </div>
  );
}
