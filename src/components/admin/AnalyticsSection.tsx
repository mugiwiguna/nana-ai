"use client";

import { useEffect, useState } from "react";

export default function AnalyticsSection() {
  const [data, setData] = useState<any>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?days=${days}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [days]);

  if (loading) return <p className="text-[var(--text-secondary)] text-sm">Loading analytics...</p>;
  if (!data) return <p className="text-[var(--text-secondary)] text-sm">Gagal load analytics</p>;

  const { summary, dailyUsage, topUsers, modelUsage } = data;
  const maxTokens = Math.max(...dailyUsage.map((d: any) => Number(d.total_tokens)), 1);

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        {[7, 14, 30, 60].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              days === d
                ? "bg-[var(--gradient-start)] text-white"
                : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {d} hari
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Request", value: Number(summary?.total_requests || 0).toLocaleString() },
          { label: "Total Token", value: formatTokens(Number(summary?.total_tokens || 0)) },
          { label: "Total Cost", value: `$${Number(summary?.total_cost || 0).toFixed(2)}` },
          { label: "Unique Users", value: Number(summary?.total_users || 0).toLocaleString() },
        ].map((card) => (
          <div key={card.label} className="glass-card rounded-xl p-4">
            <p className="text-xs text-[var(--text-secondary)]">{card.label}</p>
            <p className="text-xl font-bold mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Daily chart (bar) */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold mb-4">Token per Hari</h3>
        <div className="flex items-end gap-1 h-40">
          {dailyUsage.slice().reverse().map((d: any) => {
            const pct = (Number(d.total_tokens) / maxTokens) * 100;
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="relative w-full flex justify-center">
                  <div className="absolute -top-6 hidden group-hover:block text-[10px] bg-black text-white px-1.5 py-0.5 rounded whitespace-nowrap">
                    {formatTokens(Number(d.total_tokens))}
                  </div>
                </div>
                <div
                  className="w-full rounded-t bg-gradient-to-t from-[var(--gradient-start)] to-[var(--gradient-end)] transition-all hover:opacity-80"
                  style={{ height: `${Math.max(pct, 2)}%` }}
                />
                <span className="text-[8px] text-[var(--text-secondary)]">
                  {new Date(d.date).getDate()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top users */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold mb-3">Top Users</h3>
        <div className="space-y-2">
          {topUsers.map((u: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-secondary)]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--text-secondary)] w-5">{i + 1}</span>
                <div>
                  <p className="text-sm font-medium">{u.name || u.email}</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">{u.requests} request</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{formatTokens(Number(u.tokens))}</p>
                <p className="text-[10px] text-[var(--text-secondary)]">${Number(u.cost).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model usage */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold mb-3">Usage per Model</h3>
        <div className="space-y-2">
          {modelUsage.map((m: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-secondary)]">
              <p className="text-sm font-medium">{m.model}</p>
              <div className="text-right">
                <p className="text-sm font-bold">{formatTokens(Number(m.tokens))}</p>
                <p className="text-[10px] text-[var(--text-secondary)]">{m.requests} req · ${Number(m.cost).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
