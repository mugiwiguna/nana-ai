"use client";

import { useEffect, useState, useCallback, useMemo, useRef, Component, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// ── Error boundary ──
class ErrorBd extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(e: Error) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div className="p-4 m-4 rounded-xl border border-red-500/30 bg-red-500/5">
          <p className="text-sm font-bold text-red-400 mb-1">Rendering Error:</p>
          <pre className="text-xs text-red-300/80 whitespace-pre-wrap">{this.state.error.message}</pre>
          <p className="text-xs text-red-400/60 mt-2">Stack:</p>
          <pre className="text-xs text-red-300/50 whitespace-pre-wrap">{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const PAGE_SIZES = [25, 50, 100];
const COLORS = ["#18181b", "#3f3f46", "#52525b", "#71717a", "#a1a1aa", "#27272a", "#d4d4d8", "#e4e4e7"];
const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

function toISODate(d: Date) { return d.toISOString().slice(0, 10); }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d; }
function fmtDate(iso: string) {
  if (!iso) return "";
  const [y,m,d] = iso.split("-");
  return parseInt(d) + " " + MONTHS[parseInt(m)-1];
}

// ── Line chart (SVG pure) ──
function LineChart({
  data,
  valueKey,
  color,
  days,
}: {
  data: { day: string; [key: string]: any }[];
  valueKey: string;
  color: string;
  days: number;
}) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; val: string } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const slice = useMemo(() => {
    if (!data || data.length === 0) return [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = toISODate(cutoff);
    return data.filter(d => d && d.day && d.day >= cutoffStr);
  }, [data, days]);

  if (slice.length === 0) {
    return <p className="text-sm text-[var(--text-secondary)] py-8 text-center">Belum ada data</p>;
  }

  const w = 560;
  const h = 180;
  const pad = { top: 20, right: 20, bottom: 30, left: 45 };
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;

  const values = slice.map(d => Number(d[valueKey]));
  const maxVal = Math.max(...values, 0.0001);
  const fmtVal = (v: number) =>
    valueKey === "cost" ? "$" + v.toFixed(v < 0.01 ? 6 : 4) : String(Math.round(v));

  const n = slice.length;
  const points = slice.map((d, i) => {
    const x = pad.left + (n < 2 ? innerW / 2 : (i / (n - 1)) * innerW);
    const y = pad.top + innerH - (Number(d[valueKey]) / maxVal) * innerH;
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, label: fmtDate(d.day), val: fmtVal(Number(d[valueKey])) };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaD = n < 2
    ? `${pathD} L${points[0].x},${pad.top + innerH} L${points[0].x},${pad.top + innerH} Z`
    : `${pathD} L${points[n - 1].x},${pad.top + innerH} L${points[0].x},${pad.top + innerH} Z`;

  const labelEvery = n <= 7 ? 1 : n <= 15 ? 2 : Math.ceil(n / 6);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg || points.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = w / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    // find nearest point
    let nearest = points[0];
    let minDist = Math.abs(points[0].x - mouseX);
    for (const p of points) {
      const d = Math.abs(p.x - mouseX);
      if (d < minDist) { minDist = d; nearest = p; }
    }
    setTooltip({ x: nearest.x, y: nearest.y, label: nearest.label, val: nearest.val });
  };

  return (
    <div className="relative">
      <svg ref={svgRef} viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" style={{ minHeight: 180 }}
        onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}>
        {/* Area fill */}
        <path d={areaD} fill={color} fillOpacity={0.1} />
        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={tooltip && tooltip.label === p.label ? 5 : 3}
            fill={tooltip && tooltip.label === p.label ? color : color}
            stroke="#050508" strokeWidth={2} style={{ transition: "r 0.1s" }} />
        ))}
        {/* Hover crosshair */}
        {tooltip && (
          <line x1={tooltip.x} y1={pad.top} x2={tooltip.x} y2={pad.top + innerH}
            stroke={color} strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
        )}
        {/* X labels */}
        {points.map((p, i) =>
          i % labelEvery === 0 ? (
            <text key={i} x={p.x} y={h - 5} textAnchor="middle" fill="var(--text-secondary)" fontSize={10}>
              {p.label}
            </text>
          ) : null
        )}
        {/* Y axis */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => {
          const y = pad.top + innerH - t * innerH;
          const v = maxVal * t;
          return (
            <g key={t}>
              <line x1={pad.left - 4} y1={y} x2={pad.left} y2={y} stroke="var(--text-secondary)" strokeWidth={1} />
              <text x={pad.left - 6} y={y + 3} textAnchor="end" fill="var(--text-secondary)" fontSize={9}>
                {fmtVal(v)}
              </text>
            </g>
          );
        })}
        {/* Latest value */}
        <text x={w - pad.right} y={pad.top - 6} textAnchor="end" fill={color} fontSize={11} fontWeight={600}>
          {fmtVal(Number(slice[slice.length - 1][valueKey]))}
        </text>
      </svg>
      {/* Tooltip */}
      {tooltip && (
        <div className="absolute pointer-events-none z-10 px-2.5 py-1.5 rounded-lg text-xs font-medium shadow-lg"
          style={{
            left: `${(tooltip.x / w) * 100}%`,
            top: `${(tooltip.y / h) * 100}%`,
            transform: tooltip.x > w * 0.7 ? "translate(-110%, -110%)" : "translate(-50%, -110%)",
            background: "var(--bg-card, #1a1a2e)",
            border: `1px solid ${color}40`,
            color: "var(--text-primary)",
          }}>
          <span style={{ color }} className="mr-1">{tooltip.label}</span>{tooltip.val}
        </div>
      )}
    </div>
  );
}

// ── Request Detail Modal ──
function RequestModal({ item, onClose }: { item: any; onClose: () => void }) {
  if (!item) return null;
  const rows = [
    ["ID", item.id],
    ["Model", item.model],
    ["API Key ID", item.api_key_id || "—"],
    ["Tokens In", item.tokens_in?.toLocaleString()],
    ["Tokens Out", item.tokens_out?.toLocaleString()],
    ["Total Tokens", ((item.tokens_in || 0) + (item.tokens_out || 0)).toLocaleString()],
    ["Cost", "$" + Number(item.cost).toFixed(6)],
    ["Waktu", new Date(item.created_at).toLocaleString()],
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative glass-card rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Detail Request</h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition text-xl leading-none">&times;</button>
        </div>
        <div className="space-y-3">
          {rows.map(([label, val]) => (
            <div key={label} className="flex justify-between gap-4 text-sm border-b border-[var(--border-color)] pb-2 last:border-0">
              <span className="text-[var(--text-secondary)] shrink-0">{label}</span>
              <span className="text-[var(--text-primary)] text-right break-all font-mono text-xs">{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Page ──
export default function UsagePage() {
  const { status } = useSession();
  const router = useRouter();
  const [usage, setUsage] = useState<any[]>([]);
  const [daily, setDaily] = useState<any[]>([]);
  const [modelBreakdown, setModelBreakdown] = useState<any[]>([]);
  const [pageSize, setPageSize] = useState(50);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedRow, setSelectedRow] = useState<any>(null);

  const [activePresetKey, setActivePresetKey] = useState("month");
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
    setActivePresetKey(preset);
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
    try {
      const qs = fromDate && toDate ? `from=${fromDate}T00:00:00Z&to=${toDate}T23:59:59Z` : "";
      const [uRes, dRes, mRes] = await Promise.all([
        fetch(`/api/usage?limit=${pageSize}&offset=${page * pageSize}${qs ? "&" + qs : ""}`).then(r => r.json()),
        fetch(`/api/usage/daily${qs ? "?" + qs : ""}`).then(r => r.json()),
        fetch(`/api/usage/models${qs ? "?" + qs : ""}`).then(r => r.json()),
      ]);
      setUsage(uRes && uRes.usage ? uRes.usage : []);
      setTotal(uRes && uRes.total ? uRes.total : 0);
      setDaily(dRes && dRes.days ? dRes.days : []);
      setModelBreakdown(mRes && mRes.models ? mRes.models : []);
    } catch (e) {
      console.error("loadData failed", e);
    }
  }, [page, pageSize, fromDate, toDate]);

  if (status === "loading") return <ErrorBd><p className="text-center mt-20 text-[var(--text-secondary)]">Loading...</p></ErrorBd>;

  const totalTokens = Array.isArray(daily) ? daily.reduce((s, d) => s + Number(d && d.tokens ? d.tokens : 0), 0) : 0;
  const totalCost = Array.isArray(daily) ? daily.reduce((s, d) => s + Number(d && d.cost ? d.cost : 0), 0) : 0;
  const totalReqs = Array.isArray(daily) ? daily.reduce((s, d) => s + Number(d && d.requests ? d.requests : 0), 0) : 0;
  const totalPagesVal = Math.max(1, Math.ceil(total / pageSize));
  const pages = Array.from({ length: Math.min(totalPagesVal, 20) }, (_, i) => i);

  const presets = [
    { key: "today", label: "Hari Ini" },
    { key: "24h", label: "24 Jam" },
    { key: "week", label: "7 Hari" },
    { key: "month", label: "30 Hari" },
    { key: "all", label: "Semua" },
  ];

  return (
    <ErrorBd>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-8">
      <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Usage Log</h1>

      {/* Date range bar */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          {presets.map(p => (
            <button key={p.key} onClick={() => setPreset(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activePresetKey === p.key
                  ? "btn-gradient"
                  : "text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)]"
              }`}>{p.label}</button>
          ))}
          <span className="w-px h-6 bg-[var(--border-color)] mx-1" />
          <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPreset("custom"); setPage(0); }}
            className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--gradient-start)]/30 outline-none" />
          <span className="text-xs text-[var(--text-secondary)]">sampai</span>
          <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPreset("custom"); setPage(0); }}
            className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--gradient-start)]/30 outline-none" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Request" value={totalReqs} />
        <StatCard title="Total Token" value={totalTokens.toLocaleString()} />
        <StatCard title="Token In" value={totalTokens > 0 ? Math.round(totalTokens * 0.6).toLocaleString() : "0"} />
        <StatCard title="Total Biaya" value={"$" + totalCost.toFixed(4)} />
      </div>

      {/* Charts — line charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Request per Hari */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Request per Hari</h3>
          <ErrorBd><LineChart data={daily} valueKey="requests" color="#7b7b8e" days={90} /></ErrorBd>
        </div>

        {/* Biaya Harian */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Biaya Harian</h3>
          <ErrorBd><LineChart data={daily} valueKey="cost" color="#18181b" days={90} /></ErrorBd>
        </div>
      </div>

      {/* Model breakdown */}
      {Array.isArray(modelBreakdown) && modelBreakdown.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Breakdown per Model</h3>
          <div className="space-y-3">
            {modelBreakdown.map((m: any, i: number) => {
              const totalM = modelBreakdown.reduce((s: number, x: any) => s + Number(x && x.requests ? x.requests : 0), 0);
              const pct = totalM > 0 ? (Number(m && m.requests ? m.requests : 0) / totalM * 100) : 0;
              return (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-[var(--text-primary)]">
                      {m && m.model ? (m.model.split("/")[1] || m.model) : "?"}
                      {m && m.is_free && (
                        <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">FREE</span>
                      )}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)] tabular-nums">
                      {m && m.requests ? m.requests : 0} reqs · ${Number(m && m.cost ? m.cost : 0).toFixed(4)}
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

      {/* Request Log */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 w-full">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Request Log</h3>
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
              <button onClick={() => setPage(p => Math.min(totalPagesVal - 1, p + 1))} disabled={page >= totalPagesVal - 1}
                className={`px-2 py-1 rounded text-xs border transition ${page >= totalPagesVal - 1 ? "text-[var(--text-secondary)]/30 border-[var(--border-color)] cursor-not-allowed" : "text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-secondary)]"}`}>&rsaquo;</button>
              <button onClick={() => setPage(totalPagesVal - 1)} disabled={page >= totalPagesVal - 1}
                className={`px-2 py-1 rounded text-xs border transition ${page >= totalPagesVal - 1 ? "text-[var(--text-secondary)]/30 border-[var(--border-color)] cursor-not-allowed" : "text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-secondary)]"}`}>&#187;</button>
            </div>
            <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap shrink-0">{page + 1}/{totalPagesVal}</span>
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
                  <tr key={u.id} onClick={() => setSelectedRow(u)} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)]/50 transition-colors cursor-pointer">
                    <td className="py-2 px-4 text-[var(--text-primary)]">
                      {u.model}
                      {u.is_free && (
                        <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">FREE</span>
                      )}
                    </td>
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
    {selectedRow && <RequestModal item={selectedRow} onClose={() => setSelectedRow(null)} />}
    </ErrorBd>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="glass-card rounded-xl p-5">
      <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1">{title}</p>
      <p className="text-2xl font-bold mt-1 text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
