"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, BarProps } from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];
const MODEL_COLORS: Record<string, string> = {
  "openai/gpt-4o-mini": "#10b981",
  "openai/gpt-4o": "#3b82f6",
  "openai/gpt-3.5-turbo": "#8b5cf6",
  "deepseek/deepseek-chat": "#f59e0b",
  "deepseek/deepseek-coder": "#f97316",
  "anthropic/claude-3.5-sonnet": "#ef4444",
  "anthropic/claude-3-haiku": "#ec4899",
  "anthropic/claude-3-opus": "#be185d",
  "google/gemini-pro": "#06b6d4",
  "google/gemini-1.5-flash": "#22d3ee",
  "google/gemini-1.5-pro": "#0891b2",
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [, setStats] = useState<any>({ recent: [], daily: [], dailyModels: [], modelBreakdown: [] });
  const [cardData, setCardData] = useState<any>({ balance: 0, activeKeys: 0, totalReqs: 0, totalTokens: 0, totalCost: 0 });
  const [recentUsage, setRecentUsage] = useState<any[]>([]);
  const [dailyModels, setDailyModels] = useState<any[]>([]);
  const [modelBreakdown, setModelBreakdown] = useState<any[]>([]);
  const [daily, setDaily] = useState<any[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status !== "authenticated") return;
    Promise.all([
      fetch("/api/keys/count").then(r => r.json()),
      fetch("/api/usage?limit=10").then(r => r.json()),
      fetch("/api/usage/daily").then(r => r.json()),
      fetch("/api/usage/daily-models").then(r => r.json()),
      fetch("/api/usage/models").then(r => r.json()),
    ]).then(([keyCount, recent, dailyData, dailyModelsData, modelsRes]) => {
      const d = dailyData.days || [];
      setDaily(d);
      setDailyModels(dailyModelsData.days || []);
      setModelBreakdown(modelsRes.models || []);
      setRecentUsage(recent.usage || []);
      setCardData({
        balance: Number((session?.user as any)?.balance || 0),
        activeKeys: keyCount.active ?? 0,
        totalReqs: d.reduce((s: number, r: any) => s + Number(r.requests), 0),
        totalTokens: keyCount.totalTokens ?? 0,
        totalCost: keyCount.totalCost ?? 0,
      });
      setStats({ keyCount, recent: recent.usage || [], daily: d, dailyModels: dailyModelsData.days || [], modelBreakdown: modelsRes.models || [] });
    });
  }, [status, router, session]);

  if (status === "loading") return <p className="text-center mt-20 text-[var(--text-secondary)]">Loading...</p>;
  if (!session) return null;

  const { balance, activeKeys, totalReqs, totalTokens, totalCost } = cardData;

  // Build stacked chart data — merge daily + models into day-groups
  const modelNames = [...new Set(dailyModels.map((d: any) => d.model))];
  const dayMap: Record<string, any> = {};
  for (const dm of dailyModels) {
    const day = dm.day;
    if (!dayMap[day]) dayMap[day] = { day, reqs: {} };
    dayMap[day].reqs[dm.model] = Number(dm.requests);
  }
  const stackedReqs = Object.values(dayMap).map((d: any) => {
    const entry: any = { day: d.day };
    for (const m of modelNames) entry[m] = d.reqs[m] || 0;
    return entry;
  });

  // Cost by model per day
  const costDayMap: Record<string, any> = {};
  for (const dm of dailyModels) {
    const day = dm.day;
    if (!costDayMap[day]) costDayMap[day] = { day, costs: {} };
    costDayMap[day].costs[dm.model] = (costDayMap[day].costs[dm.model] || 0) + Number(dm.cost);
  }
  const stackedCosts = Object.values(costDayMap).map((d: any) => {
    const entry: any = { day: d.day };
    for (const m of modelNames) entry[m] = d.costs[m] || 0;
    return entry;
  });
  const tickFmt = (v: string) => v?.slice(5) || "";

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Dashboard</h1>
        <StatusBadge status={(session.user as any)?.status} email={(session.user as any)?.email} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card title="Saldo" value={"$" + balance.toFixed(2)} color="emerald" link="/dashboard/topup" linkText="Top Up &rarr;" />
        <Card title="API Key Aktif" value={activeKeys ?? "—"} color="blue" link="/dashboard/keys" linkText="Kelola &rarr;" />
        <Card title="Total Request" value={totalReqs} color="amber" link="/dashboard/usage" linkText="Detail &rarr;" />
        <Card title="Total Token" value={totalTokens.toLocaleString()} color="purple" subtitle={"$" + Number(totalCost).toFixed(4) + " biaya"} />
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-6">
        <ChartCard title="Request per Hari (by Model)">
          {stackedReqs.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stackedReqs}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--text-secondary)" }} tickFormatter={tickFmt} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-secondary)" }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                  formatter={(v: any, name: any) => [v, name.split("/").pop() || name]} />
                <Legend formatter={(v: string) => v.split("/").pop() || v} wrapperStyle={{ fontSize: 11 }} />
                {modelNames.map((m, i) => (
                  <Bar key={m} dataKey={m} stackId="a" fill={MODEL_COLORS[m] || COLORS[i % COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
        <ChartCard title="Model Breakdown">
          {modelBreakdown.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={modelBreakdown} dataKey="requests" nameKey="model" cx="50%" cy="50%" outerRadius={80}
                  label={({ payload }) => (payload?.model || "").split("/")[1] || payload?.model}
                  labelLine={false}>
                  {modelBreakdown.map((_: any, i: number) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                  formatter={(v: any, name: any) => [v, name.split("/").pop() || name]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Cost stacked */}
      {stackedCosts.length > 0 && (
        <ChartCard title="Biaya Harian (by Model)">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stackedCosts}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--text-secondary)" }} tickFormatter={tickFmt} />
              <YAxis tick={{ fontSize: 10, fill: "var(--text-secondary)" }} tickFormatter={(v: number) => "$" + v.toFixed(6)} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                formatter={(v: any, name: any) => ["$" + Number(v).toFixed(6), name.split("/").pop() || name]} />
              <Legend formatter={(v: string) => v.split("/").pop() || v} wrapperStyle={{ fontSize: 11 }} />
              {modelNames.map((m, i) => (
                <Bar key={m} dataKey={m} stackId="a" fill={MODEL_COLORS[m] || COLORS[i % COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Recent usage */}
      <div className="bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Usage Terbaru</h3>
          <Link href="/dashboard/usage" className="text-xs text-[var(--gradient-start)] hover:underline">Lihat Semua</Link>
        </div>
        {recentUsage.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)] py-4">Belum ada usage. Buat API key dan mulai.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)]">
                  <th className="text-left py-2 px-4 font-medium">Model</th>
                  <th className="text-right py-2 px-4 font-medium">Tokens</th>
                  <th className="text-right py-2 px-4 font-medium">Cost</th>
                  <th className="text-right py-2 px-4 font-medium">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {recentUsage.map((u: any) => (
                  <tr key={u.id} className="border-b border-[var(--border-color)]">
                    <td className="py-2 px-4 text-[var(--text-primary)]">{u.model}</td>
                    <td className="text-right py-2 px-4 text-[var(--text-secondary)]">{u.tokens_in + u.tokens_out}</td>
                    <td className="text-right py-2 px-4 text-[var(--gradient-start)]">${Number(u.cost).toFixed(6)}</td>
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

function Card({ title, value, color, link, linkText, subtitle }: { title: string; value: string | number; color?: string; link?: string; linkText?: string; subtitle?: string }) {
  const dot = { emerald: "#10b981", blue: "#3b82f6", amber: "#f59e0b", purple: "#8b5cf6" }[color || "emerald"];
  return (
    <div className="bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] rounded-xl p-5">
      <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1">{title}</p>
      <p className="text-2xl font-bold text-[var(--text-primary)]" style={{ color: dot }}>{value}</p>
      {link && <Link href={link} className="text-xs text-[var(--gradient-start)] hover:underline mt-2 inline-block">{linkText}</Link>}
      {subtitle && <p className="text-xs text-[var(--text-secondary)] mt-1">{subtitle}</p>}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] rounded-xl p-5">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Empty() { return <p className="text-sm text-[var(--text-secondary)] py-8 text-center">Belum ada data</p>; }

function StatusBadge({ status, email }: { status?: string; email?: string }) {
  if (email === "admin@nanaai.id") {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700">
        Admin
      </span>
    );
  }
  if (status === "banned") {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700">
        Banned
      </span>
    );
  }
  if (status === "suspended") {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700">
        Suspend
      </span>
    );
  }
  return null;
}
