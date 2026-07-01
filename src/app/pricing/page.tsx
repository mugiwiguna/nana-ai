"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

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

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then(setPlans);
  }, []);

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Hero */}
      <section className="pt-32 pb-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-4 font-space">
            Pilih Plan <span className="text-[var(--gradient-start)]">Sesuai Kebutuhan</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-lg text-[var(--text-secondary)] max-w-xl mx-auto">
            Bonus credit lebih besar dari harga plan. Atau top-up manual sesuai kebutuhan.
          </motion.p>
        </div>
      </section>

      {/* Plan Cards */}
      <section className="pb-24">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => {
            const isOut = !plan.is_active;
            return (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 * i, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={`relative glass-card rounded-2xl p-8 flex flex-col ${
                plan.is_popular ? "border-[var(--gradient-start)]/40 shadow-lg shadow-[var(--gradient-start)]/10" : ""
              } ${isOut ? "opacity-60" : ""}`}>
              {isOut ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-xs font-bold tracking-wider uppercase bg-red-500/15 text-red-400 px-4 py-1 rounded-full">OUT OF STOCK</span>
                </div>
              ) : plan.is_popular ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-xs font-bold tracking-wider uppercase bg-[var(--accent-bg)] text-[var(--accent-fg)] px-4 py-1 rounded-full">Paling Populer</span>
                </div>
              ) : null}

              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>

              <div className="mb-6">
                <span className="text-3xl font-bold">Rp {Number(plan.price).toLocaleString("id-ID")}</span>
                <span className="text-[var(--text-secondary)] text-sm"> / {plan.duration_days} hari</span>
              </div>

              <div className="mb-6 p-3 rounded-xl bg-[var(--gradient-start)]/5 border border-[var(--gradient-start)]/10">
                <p className="text-sm text-[var(--text-secondary)]">Credit didapat</p>
                <p className="text-xl font-bold text-[var(--gradient-start)]">
                  Rp {Number(plan.credits).toLocaleString("id-ID")}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Bonus Rp {(Number(plan.credits) - Number(plan.price)).toLocaleString("id-ID")}
                </p>
              </div>

              {(plan.daily_token_limit || plan.weekly_token_limit || plan.monthly_token_limit) && (
                <div className="mb-6 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] space-y-1">
                  <p className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">Token Limits</p>
                  {plan.daily_token_limit && <p className="text-xs">Harian: <span className="font-semibold">{Number(plan.daily_token_limit).toLocaleString()}</span></p>}
                  {plan.weekly_token_limit && <p className="text-xs">Mingguan: <span className="font-semibold">{Number(plan.weekly_token_limit).toLocaleString()}</span></p>}
                  {plan.monthly_token_limit && <p className="text-xs">Bulanan: <span className="font-semibold">{Number(plan.monthly_token_limit).toLocaleString()}</span></p>}
                </div>
              )}

              <ul className="flex-1 space-y-3 mb-8">
                {(plan.features || []).map((f: string, j: number) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <svg className="w-4 h-4 text-[var(--gradient-start)] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {isOut ? (
                <div className="text-center font-semibold py-3 rounded-xl bg-gray-500/10 text-gray-500 cursor-not-allowed">
                  Stok Habis
                </div>
              ) : (
                <Link href="/dashboard/topup" className={`text-center font-semibold py-3 rounded-xl transition-all duration-300 ${
                  plan.is_popular ? "bg-[var(--accent-bg)] text-[var(--accent-fg)] hover:scale-[1.02]" : "border border-[var(--border-color)] hover:border-[var(--gradient-start)]/40 hover:bg-[var(--gradient-start)]/5"
                }`}>
                  Pilih {plan.name}
                </Link>
              )}
            </motion.div>
            );
          })}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="text-center mt-12 text-[var(--text-secondary)] text-sm">
          <p>
            Tidak mau langganan?{" "}
            <Link href="/dashboard/topup" className="text-[var(--gradient-start)] hover:underline font-medium">
              Top-up manual
            </Link>{" "}
            sesuai kebutuhan.
          </p>
        </motion.div>
      </section>
    </main>
  );
}
