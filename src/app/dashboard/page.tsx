"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const COLORS = ["#18181b", "#27272a", "#3f3f46", "#52525b", "#71717a", "#a1a1aa", "#d4d4d8", "#e4e4e7"];
const MODEL_COLORS: Record<string, string> = {
  "openai/gpt-4o-mini": "#71717a",
  "openai/gpt-4o": "#18181b",
  "openai/gpt-3.5-turbo": "#52525b",
  "deepseek/deepseek-chat": "#3f3f46",
  "deepseek/deepseek-coder": "#27272a",
  "anthropic/claude-3.5-sonnet": "#a1a1aa",
  "anthropic/claude-3-haiku": "#71717a",
  "anthropic/claude-3-opus": "#52525b",
  "google/gemini-pro": "#3f3f46",
  "google/gemini-1.5-flash": "#27272a",
  "google/gemini-1.5-pro": "#18181b",
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
  const [fetchErr, setFetchErr] = useState("");
  const [freeUsage, setFreeUsage] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status !== "authenticated") return;
    Promise.all([
      fetch("/api/keys/count").then(r => r.json()).catch(e => ({ error: e.message })),
      fetch("/api/usage?limit=10").then(r => r.json()).catch(e => ({ error: e.message })),
      fetch("/api/usage/daily").then(r => r.json()).catch(e => ({ error: e.message })),
      fetch("/api/usage/daily-models").then(r => r.json()).catch(e => ({ error: e.message })),
      fetch("/api/usage/models").then(r => r.json()).catch(e => ({ error: e.message })),
      fetch("/api/user/free-tier-usage", { cache: "no-store" }).then(r => r.json()).catch(e => null),
    ]).then(([keyCount, recent, dailyData, dailyModelsData, modelsRes, freeData]) => {
      if (keyCount.error || recent.error || dailyData.error || dailyModelsData.error || modelsRes.error) {
        const errs = [keyCount, recent, dailyData, dailyModelsData, modelsRes]
          .map((r:any,i) => r.error ? ["keys/count","usage","usage/daily","usage/daily-models","usage/models"][i]+": "+r.error : null).filter(Boolean);
        setFetchErr(errs.join(" | "));
      }
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
      if (freeData && !freeData.error) setFreeUsage(freeData);
      setStats({ keyCount, recent: recent.usage || [], daily: d, dailyModels: dailyModelsData.days || [], modelBreakdown: modelsRes.models || [] });
    });
  }, [status, router, session]);

  if (status === "loading") return <p className="text-center mt-20 text-[var(--text-secondary)]">Loading...</p>;
  if (!session) return null;

  const { balance, activeKeys, totalReqs, totalTokens, totalCost } = cardData;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-8">
      {/* Fetch error */}
      {fetchErr && (
        <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5 text-xs text-red-400">{fetchErr}</div>
      )}

      {/* Suspended warning */}
      {((session.user as any)?.status === "suspended" || (session.user as any)?.status === "banned") && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-400">Akun {(session.user as any)?.status === "banned" ? "Diblokir" : "Disuspend"}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Akun Anda sedang dalam status {(session.user as any)?.status === "banned" ? "banned" : "suspended"}. Semua API key telah dinonaktifkan.
                Silakan hubungi admin untuk informasi lebih lanjut:{" "}
                <a href="mailto:admin@nanaai.id" className="text-[var(--gradient-start)] hover:underline">admin@nanaai.id</a>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Dashboard</h1>
        <StatusBadge status={(session.user as any)?.status} email={(session.user as any)?.email} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          title="Saldo"
          value={"$" + balance.toFixed(2)}
          accent="violet"
          link="/dashboard/topup"
          linkText="Top Up →"
          icon={<WalletIcon />}
        />
        <Card
          title="API Key Aktif"
          value={activeKeys ?? "—"}
          accent="indigo"
          link="/dashboard/keys"
          linkText="Kelola →"
          icon={<KeyIcon />}
        />
        <Card
          title="Total Request"
          value={totalReqs}
          accent="purple"
          link="/dashboard/usage"
          linkText="Detail →"
          icon={<ActivityIcon />}
        />
        <Card
          title="Total Token"
          value={totalTokens.toLocaleString()}
          accent="fuchsia"
          subtitle={"$" + Number(totalCost).toFixed(4) + " biaya"}
          icon={<ZapIcon />}
        />
      </div>

      {/* Free Tier Progress Bar */}
      {freeUsage && (
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{freeUsage.eligible ? "🆓" : "📋"}</span>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                {freeUsage.eligible ? "Free Tier Aktif" : "Free Tier"}
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                freeUsage.eligible
                  ? "bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20"
                  : "bg-zinc-500/10 text-zinc-400 ring-1 ring-zinc-500/20"
              }`}>
                {freeUsage.eligible ? "Aktif" : "Tidak Aktif"}
              </span>
            </div>
            {freeUsage.eligible && (
              <span className="text-xs text-[var(--text-secondary)]">
                {freeUsage.freeModels} model tersedia
              </span>
            )}
          </div>

          {freeUsage.eligible ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[var(--text-secondary)]">Token Terpakai Hari Ini</span>
                <span className={`text-sm font-bold tabular-nums ${
                  freeUsage.percentage > 90 ? "text-red-400" : freeUsage.percentage > 70 ? "text-amber-400" : "text-emerald-400"
                }`}>
                  {freeUsage.used.toLocaleString()} / {freeUsage.limit.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-3 bg-[var(--bg-primary)] rounded-full overflow-hidden border border-[var(--border-color)]">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    freeUsage.percentage > 90 ? "bg-red-500" : freeUsage.percentage > 70 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(100, freeUsage.percentage)}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-[var(--text-secondary)]">
                  Sisa: {freeUsage.remaining.toLocaleString()} token
                </span>
                <span className="text-[11px] text-[var(--text-secondary)]">
                  Reset: {new Date(freeUsage.resetAt).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
                </span>
              </div>
            </>
          ) : (
            <p className="text-xs text-[var(--text-secondary)]">
              Top-up minimal $1 untuk akses model free tier. {freeUsage.freeModels} model tersedia.
            </p>
          )}
        </div>
      )}

      {/* Model Breakdown */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Model Breakdown</h3>
        {modelBreakdown.length === 0 ? <Empty /> : (
            <div className="space-y-3">
              {modelBreakdown.map((m: any, i: number) => {
                const total = modelBreakdown.reduce((s:number, x:any) => s + Number(x.requests||0), 0);
                const pct = total > 0 ? (Number(m.requests||0) / total * 100) : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-[var(--text-primary)]">{m.model.split("/")[1] || m.model}</span>
                      <span className="text-xs text-[var(--text-secondary)] tabular-nums">
                        {m.requests} reqs · ${Number(m.cost||0).toFixed(4)}
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-[var(--bg-primary)] border border-[var(--border-color)] overflow-hidden">
                      <span className="block h-full rounded-full" style={{ width: pct+'%', backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      {/* Recent usage */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Usage Terbaru</h3>
          <Link href="/dashboard/usage" className="text-xs gradient-text hover:underline font-medium">Lihat Semua →</Link>
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
                  <tr key={u.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)]/50 transition-colors">
                    <td className="py-2.5 px-4 text-[var(--text-primary)]">{u.model}</td>
                    <td className="text-right py-2.5 px-4 text-[var(--text-secondary)]">{u.tokens_in + u.tokens_out}</td>
                    <td className="text-right py-2.5 px-4 gradient-text font-medium">${Number(u.cost).toFixed(6)}</td>
                    <td className="text-right py-2.5 px-4 text-[var(--text-secondary)] text-xs">{new Date(u.created_at).toLocaleString()}</td>
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

function Card({ title, value, accent, link, linkText, subtitle, icon }: {
  title: string;
  value: string | number;
  accent?: string;
  link?: string;
  linkText?: string;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  const colors: Record<string, string> = {
    violet: "#526477",
    indigo: "#27272a",
    purple: "#475569",
    fuchsia: "#52525b",
  };
  const dot = colors[accent || "violet"] || "#526477";
  return (
    <div className="glass-card rounded-xl p-5 group">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[var(--text-secondary)] opacity-60">{icon}</span>
        <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">{title}</p>
      </div>
      <p className="text-2xl font-bold text-[var(--text-primary)] group-hover:text-white transition-colors duration-300">
        {value}
      </p>
      {subtitle && <p className="text-xs text-[var(--text-secondary)] mt-1">{subtitle}</p>}
      {link && (
        <Link href={link} className="text-xs gradient-text hover:underline mt-2 inline-block font-medium">
          {linkText}
        </Link>
      )}
    </div>
  );
}

function Empty() { return <p className="text-sm text-[var(--text-secondary)] py-8 text-center">Belum ada data</p>; }

function StatusBadge({ status, email }: { status?: string; email?: string }) {
  if (email === "admin@nanaai.id") {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        Admin
      </span>
    );
  }
  if (status === "banned") {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
        Banned
      </span>
    );
  }
  if (status === "suspended") {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        Suspend
      </span>
    );
  }
  return null;
}

/* Icons */
function WalletIcon() { return (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" /></svg>); }
function KeyIcon() { return (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>); }
function ActivityIcon() { return (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>); }
function ZapIcon() { return (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>); }
