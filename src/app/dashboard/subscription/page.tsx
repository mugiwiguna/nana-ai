"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  const [data, setData] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[var(--gradient-start)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Active Plan */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Plan Aktif</h2>
        {data?.active ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-[var(--gradient-start)]">{data.active.plan_name}</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Berlaku hingga {new Date(data.active.expires_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-[var(--text-secondary)]">Credit plan</p>
              <p className="text-xl font-bold">Rp {Number(data.active.plan_credits).toLocaleString("id-ID")}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-[var(--text-secondary)] mb-4">Belum punya plan</p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] text-white font-medium px-6 py-2.5 rounded-xl hover:shadow-lg hover:shadow-[var(--gradient-start)]/25 transition-all"
            >
              Lihat Plan
            </Link>
          </div>
        )}
      </div>

      {/* History */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Riwayat Subscription</h2>
        {data?.history && data.history.length > 0 ? (
          <div className="space-y-3">
            {data.history.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
                <div>
                  <p className="font-medium">{item.plan_name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {new Date(item.created_at).toLocaleDateString("id-ID")} · {item.payment_method === "balance" ? "Saldo" : "QRIS"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">Rp {Number(item.price).toLocaleString("id-ID")}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    item.status === "active"
                      ? "bg-green-500/10 text-green-500"
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
