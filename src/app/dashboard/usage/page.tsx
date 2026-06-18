"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const PAGE_SIZES = [25, 50, 100];
const COLORS = ["#526477", "#3b82f6", "#6366f1", "#475569", "#1e40af", "#334155", "#4338ca", "#203059"];

function toISODate(d: Date) { return d.toISOString().slice(0, 10); }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d; }

export default function UsagePage() {
  const { status } = useSession();
  const router = useRouter();
  const [usage, setUsage] = useState<any[]>([]);
  const [daily, setDaily] = useState<any[]>([]);
  const [modelBreakdown, setModelBreakdown] = useState<any[]>([]);
  const [pageSize, setPageSize] = useState(50);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  // Date range
  const [, setRange] = useState("month");
  const [fromDate, setFromDate] = useState(toISODate(daysAgo(30)));
  const [toDate, setToDate] = useState(toISODate(new Date()));

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    loadData();
  }, [status, page, pageSize, fromDate, toDate]);

  const setPreset = (preset: string) => {
    setRange(preset);
    setPage(0);
    const now = new Date();
    switch (preset) {
      case "today": setFromDate(toISODate(now)); setToDate(toISODate(now)); break;
      case "24h": { const d = new Date(now.getTime() - 86400000); setFromDate(toISODate(d)); setToDate(toISODate(now)); break; }
      case "week": setFromDate(toISODate(daysAgo(7))); setToDate(toISODate(now)); break;
      case "month": setFromDate(toISODate(daysAgo(30))); setToDate(toISODate(now)); break;
      case "all": setFromDate(""); setToDate(""); break;
    }
  };

  const loadData = useCallback(async () => {
    const qs = fromDate && toDate ? `&from=${fromDate}T00:00:00Z&to=${toDate}T23:59:59Z` : "";
    const [uRes, dRes, mRes] = await Promise.all([
      fetch(`/api/usage?limit=${pageSize}&offset=${page * pageSize}${qs}`).then(r => r.json()),
      fetch(`/api/usage/daily${qs ? "?" + qs.slice(1) : ""}`).then(r => r.json()),
      fetch(`/api/usage/models${qs ? "?" + qs.slice(1) : ""}`).then(r => r.json()),
    ]);
    setUsage(uRes.usage || []);
    setTotal(uRes.total || 0);
    setDaily(dRes.days || []);
    setModelBreakdown(mRes.models || []);
  }, [page, pageSize, fromDate, toDate]);

  if (status === "loading") return <p className="text-center mt-20 text-[var(--text-secondary)]">Loading...</p>;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const totalTokens = daily.reduce((s, d) => s + Number(d.tokens), 0);
  const totalCost = daily.reduce((s, d) => s + Number(d.cost), 0);
  const totalReqs = daily.reduce((s, d) => s + Number(d.requests), 0);
  const pages = Array.from({ length: Math.min(totalPages, 20) }, (_, i) => i);

  const presets = [
    { key: "today", label: "Hari Ini" },
    { key: "24h", label: "24 Jam" },
    { key: "week", label: "7 Hari" },
    { key: "month", label: "30 Hari" },
    { key: "all", label: "Semua" },
  ];
  const activePreset = !fromDate ? "all" : fromDate === toDate ? "today" : "";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-8">
      <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Usage Log</h1>

      {/* Date range bar */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          {presets.map(p => (
            <button key={p.key} onClick={() => setPreset(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activePreset === p.key
                  ? "btn-gradient"
                  : "text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)]"
              }`}>{p.label}</button>
          ))}
          <span className="w-px h-6 bg-[var(--border-color)] mx-1" />
          <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setRange("custom"); setPage(0); }}
            className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--gradient-start)]/30 outline-none" />
          <span className="text-xs text-[var(--text-secondary)]">sampai</span>
          <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setRange("custom"); setPage(0); }}
            className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--gradient-start)]/30 outline-none" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Request" value={totalReqs} accent="violet" />
        <StatCard title="Total Token" value={totalTokens.toLocaleString()} accent="indigo" />
        <StatCard title="Token In" value={totalTokens > 0 ? Math.round(totalTokens * 0.6).toLocaleString() : "0"} accent="purple" />
        <StatCard title="Total Biaya" value={"$" + totalCost.toFixed(4)} accent="fuchsia" />
      </div>

      {/* Charts — HTML bars */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Request per Hari */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Request per Hari</h3>
          {daily.length === 0 ? <Empty /> : (
            <div className="space-y-2">
              {daily.slice(-14).map((d: any, di: number) => {
                const maxVal = Math.max(...daily.map((x: any) => Number(x.requests)), 1);
                const w = Math.max(Number(d.requests) / maxVal * 100, 1);
                return (
                  <div key={di} className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-secondary)] w-10 shrink-0 text-right">{d.day?.slice(5) || d.day}</span>
                    <div className="flex-1 h-4 rounded-full bg-[var(--bg-primary)] border border-[var(--border-color)] overflow-hidden">
                      <span className="block h-full rounded-full" style={{ width: w + "%", backgroundColor: "#526477" }} />
                    </div>
                    <span className="text-xs text-[var(--text-secondary)] w-8 shrink-0 tabular-nums">{d.requests}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Biaya Harian */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Biaya Harian</h3>
          {daily.length === 0 ? <Empty /> : (
            <div className="flex items-end gap-1 h-32 pt-2">
              {daily.slice(-14).map((d: any, di: number) => {
                const maxVal = Math.max(...daily.map((x: any) => Number(x.cost)), 0.0001);
                const h = Math.max(Number(d.cost) / maxVal * 100, 2);
                return (
                  <div key={di} className="flex-1 flex flex-col items-center gap-1 min-w-[20px]" title={`${d.day?.slice(5)}: $${Number(d.cost).toFixed(6)}`}>
                    <span className="text-[9px] text-[var(--text-secondary)] tabular-nums">${Number(d.cost).toFixed(3)}</span>
                    <span className="w-full rounded-t-sm" style={{ height: h + "%", backgroundColor: "#3b82f6", minHeight: 2 }} />
                    <span className="text-[9px] text-[var(--text-secondary)]">{d.day?.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Model breakdown */}
      {modelBreakdown.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Breakdown per Model</h3>
          <div className="space-y-3">
            {modelBreakdown.map((m: any, i: number) => {
              const total = modelBreakdown.reduce((s: number, x: any) => s + Number(x.requests || 0), 0);
              const pct = total > 0 ? (Number(m.requests || 0) / total * 100) : 0;
              return (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-[var(--text-primary)]">{m.model}</span>
                    <span className="text-xs text-[var(--text-secondary)] tabular-nums">
                      {m.requests} reqs · {Number(m.tokens).toLocaleString()} tokens · ${Number(m.cost || 0).toFixed(4)}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-[var(--bg-primary)] border border-[var(--border-color)] overflow-hidden">
                    <span className="block h-full rounded-full" style={{ width: pct + "%", backgroundColor: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              );
            })}
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
  const colors: Record<string, string> = { violet: "#526477", indigo: "#6366f1", purple: "#475569", fuchsia: "#3b82f6" };
  return (
    <div className="glass-card rounded-xl p-5">
      <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1">{title}</p>
      <p className="text-2xl font-bold mt-1" style={{ color: colors[accent || "violet"] || "var(--text-primary)" }}>{value}</p>
    </div>
  );
}

function Empty() { return <p className="text-sm text-[var(--text-secondary)] py-8 text-center">Belum ada data</p>; }
