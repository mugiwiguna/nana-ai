"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const PAGE_SIZES = [25, 50, 100];

export default function UsagePage() {
  const { status } = useSession();
  const router = useRouter();
  const [usage, setUsage] = useState<any[]>([]);
  const [daily, setDaily] = useState<any[]>([]);
  const [modelBreakdown, setModelBreakdown] = useState<any[]>([]);
  const [pageSize, setPageSize] = useState(50);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    loadData();
  }, [status, page, pageSize]);

  const loadData = async () => {
    const [uRes, dRes, mRes] = await Promise.all([
      fetch(`/api/usage?limit=${pageSize}&offset=${page * pageSize}`).then(r => r.json()),
      fetch("/api/usage/daily").then(r => r.json()),
      fetch("/api/usage/models").then(r => r.json()),
    ]);
    setUsage(uRes.usage || []);
    setTotal(uRes.total || 0);
    setDaily(dRes.days || []);
    setModelBreakdown(mRes.models || []);
  };

  if (status === "loading") return <p className="text-center mt-20 text-[var(--text-secondary)]">Loading...</p>;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const totalTokens = daily.reduce((s, d) => s + Number(d.tokens), 0);
  const totalCost = daily.reduce((s, d) => s + Number(d.cost), 0);
  const pages = Array.from({ length: Math.min(totalPages, 20) }, (_, i) => i);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-8">
      <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Usage Log</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Request" value={total} accent="violet" />
        <StatCard title="Total Token" value={totalTokens.toLocaleString()} accent="indigo" />
        <StatCard title="Token In" value={totalTokens > 0 ? Math.round(totalTokens * 0.6).toLocaleString() : "0"} accent="purple" />
        <StatCard title="Total Biaya" value={"$" + totalCost.toFixed(4)} accent="fuchsia" />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <ChartCard title="Request per Hari">
          {daily.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={daily}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--text-secondary)" }} tickFormatter={(v) => v?.slice(5) || ""} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-secondary)" }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
                <Bar dataKey="requests" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
        <ChartCard title="Biaya Harian">
          {daily.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={daily}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--text-secondary)" }} tickFormatter={(v) => v?.slice(5) || ""} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-secondary)" }} />
                <Tooltip formatter={(v: any) => "$" + Number(v).toFixed(6)} contentStyle={{ fontSize: 12, borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
                <Line type="monotone" dataKey="cost" stroke="#c084fc" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Model breakdown */}
      {modelBreakdown.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Breakdown per Model</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)]">
                  <th className="text-left py-2 px-4 font-medium">Model</th>
                  <th className="text-right py-2 px-4 font-medium">Request</th>
                  <th className="text-right py-2 px-4 font-medium">Token</th>
                  <th className="text-right py-2 px-4 font-medium">Cost</th>
                </tr>
              </thead>
              <tbody>
                {modelBreakdown.map((m: any, i: number) => (
                  <tr key={i} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)]/50 transition-colors">
                    <td className="py-2 px-4 text-[var(--text-primary)]">{m.model}</td>
                    <td className="text-right py-2 px-4 text-[var(--text-secondary)]">{m.requests}</td>
                    <td className="text-right py-2 px-4 text-[var(--text-secondary)]">{Number(m.tokens).toLocaleString()}</td>
                    <td className="text-right py-2 px-4 gradient-text font-medium">${Number(m.cost).toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Usage log */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 w-full">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Log Detail</h3>
          <div className="flex flex-wrap items-center gap-2">
            <select value={pageSize} onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(0); }}
              className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] shrink-0 focus:border-[var(--gradient-start)]/30 outline-none">
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s} / hal</option>)}
            </select>
            <div className="flex items-center gap-0.5 shrink-0">
              <button onClick={() => setPage(0)} disabled={page === 0}
                className={`px-2 py-1 rounded text-xs border transition ${page === 0 ? "text-[var(--text-secondary)]/30 border-[var(--border-color)] cursor-not-allowed" : "text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-secondary)]"}`}>&#171;</button>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className={`px-2 py-1 rounded text-xs border transition ${page === 0 ? "text-[var(--text-secondary)]/30 border-[var(--border-color)] cursor-not-allowed" : "text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-secondary)]"}`}>&lsaquo;</button>
              {pages.slice(Math.max(0, page - 2), page + 3).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-2.5 py-1 rounded text-xs border transition ${
                    p === page
                      ? "btn-gradient border-transparent"
                      : "text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-secondary)]"
                  }`}>{p + 1}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className={`px-2 py-1 rounded text-xs border transition ${page >= totalPages - 1 ? "text-[var(--text-secondary)]/30 border-[var(--border-color)] cursor-not-allowed" : "text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-secondary)]"}`}>&rsaquo;</button>
              <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}
                className={`px-2 py-1 rounded text-xs border transition ${page >= totalPages - 1 ? "text-[var(--text-secondary)]/30 border-[var(--border-color)] cursor-not-allowed" : "text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-secondary)]"}`}>&#187;</button>
            </div>
            <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap shrink-0">{page + 1}/{totalPages}</span>
          </div>
        </div>
        {usage.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)] py-4">Belum ada data penggunaan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)]">
                  <th className="text-left py-3 px-4 font-medium">Model</th>
                  <th className="text-right py-3 px-4 font-medium">Token In</th>
                  <th className="text-right py-3 px-4 font-medium">Token Out</th>
                  <th className="text-right py-3 px-4 font-medium">Cost</th>
                  <th className="text-right py-3 px-4 font-medium">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {usage.map((u: any) => (
                  <tr key={u.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)]/50 transition-colors">
                    <td className="py-2 px-4 text-[var(--text-primary)]">{u.model}</td>
                    <td className="text-right py-2 px-4 text-[var(--text-secondary)]">{u.tokens_in}</td>
                    <td className="text-right py-2 px-4 text-[var(--text-secondary)]">{u.tokens_out}</td>
                    <td className="text-right py-2 px-4 gradient-text font-medium">${Number(u.cost).toFixed(6)}</td>
                    <td className="text-right py-2 px-4 text-[var(--text-secondary)] text-xs">{new Date(u.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, accent }: { title: string; value: string | number; accent?: string }) {
  const colors: Record<string, string> = { violet: "#a78bfa", indigo: "#818cf8", purple: "#8b5cf6", fuchsia: "#c084fc" };
  return (
    <div className="glass-card rounded-xl p-5">
      <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1">{title}</p>
      <p className="text-2xl font-bold mt-1" style={{ color: colors[accent || "violet"] || "var(--text-primary)" }}>{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Empty() { return <p className="text-sm text-[var(--text-secondary)] py-8 text-center">Belum ada data</p>; }
