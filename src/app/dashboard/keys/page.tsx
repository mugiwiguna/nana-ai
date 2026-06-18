"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import Modal from "@/components/Modal";

const COLORS = ["#526477", "#3b82f6", "#6366f1", "#475569", "#1e40af"];

export default function KeysPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [keys, setKeys] = useState<any[]>([]);
  const [usage, setUsage] = useState<any[]>([]);
  const [daily, setDaily] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [newKey, setNewKey] = useState("");
  const [copiedKey, setCopiedKey] = useState("");
  const [regeneratedKey, setRegeneratedKey] = useState<{ key: string; name: string } | null>(null);
  const userStatus = (session?.user as any)?.status;
  const isBlocked = userStatus === "suspended" || userStatus === "banned";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") { loadKeys(); loadCharts(); }
  }, [status, router]);

  const loadKeys = async () => {
    const [kRes, uRes] = await Promise.all([
      fetch("/api/keys").then(r => r.json()),
      fetch("/api/usage?limit=500").then(r => r.json()),
    ]);
    setKeys(kRes.keys || []);
    setUsage(uRes.usage || []);
  };

  const loadCharts = async () => {
    const d = await fetch("/api/usage/daily").then(r => r.json());
    setDaily(d.days || []);
  };

  const generateKey = async () => {
    if (!newName) return;
    const res = await fetch("/api/keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newName }) });
    const data = await res.json();
    setNewKey(data.key); setNewName("");
    setCopiedKey("");
    loadKeys();
  };

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = key;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    });
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(""), 2500);
  };

  const revokeKey = async (id: string) => { await fetch(`/api/keys/${id}`, { method: "DELETE" }); loadKeys(); };

  const regenerateKey = async (keyId: string) => {
    const res = await fetch("/api/keys/regenerate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyId }) });
    const data = await res.json();
    if (data.key) {
      setRegeneratedKey({ key: data.key, name: data.name });
      setNewKey("");
      loadKeys();
    }
  };

  const keyUsageMap: Record<string, { requests: number; tokens: number; cost: number }> = {};
  for (const u of usage) {
    if (!keyUsageMap[u.model]) keyUsageMap[u.model] = { requests: 0, tokens: 0, cost: 0 };
    keyUsageMap[u.model].requests++;
    keyUsageMap[u.model].tokens += u.tokens_in + u.tokens_out;
    keyUsageMap[u.model].cost += Number(u.cost);
  }
  const modelData = Object.entries(keyUsageMap).map(([model, d]) => ({ model: model.split("/")[1] || model, ...d }));

  if (status === "loading") return <p className="text-center mt-20 text-[var(--text-secondary)]">Loading...</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-8">
      <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">API Keys</h1>

      {/* Suspended warning */}
      {isBlocked && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-400">Akun {userStatus === "banned" ? "Diblokir" : "Disuspend"}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Tidak dapat membuat atau meregenerasi API key saat akun {userStatus}.
                Hubungi <a href="mailto:admin@nanaai.id" className="text-[var(--gradient-start)] hover:underline">admin@nanaai.id</a>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Keys" value={keys.length} accent="violet" />
        <StatCard title="Aktif" value={keys.filter(k => k.is_active).length} accent="indigo" />
        <StatCard title="Total Request" value={usage.length} accent="purple" />
      </div>

      {/* Generate */}
      <div className={`glass-card rounded-xl p-5 ${isBlocked ? "opacity-60" : ""}`}>
        <div className="flex items-center gap-2 mb-3">
          {isBlocked ? (
            <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          ) : null}
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Buat API Key Baru</h2>
        </div>
        <div className="flex gap-2">
          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
            placeholder="Nama key (misal: Production)"
            disabled={isBlocked}
            className="min-w-0 flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--gradient-start)] focus:ring-1 focus:ring-[var(--gradient-start)]/30 outline-none transition disabled:opacity-50 disabled:cursor-not-allowed" />
          {isBlocked ? (
            <button disabled
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] cursor-not-allowed">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Diblokir
            </button>
          ) : (
            <button onClick={generateKey}
              className="shrink-0 btn-gradient px-4 py-2 rounded-lg text-sm font-medium">
              Generate
            </button>
          )}
        </div>
        {!isBlocked && newKey && (
          <div className="mt-4 p-3 bg-[var(--gradient-start)]/5 border border-[var(--gradient-start)]/20 rounded-lg">
            <p className="text-xs font-medium gradient-text mb-1">Key baru!</p>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-[var(--bg-primary)] border border-[var(--border-color)] px-2 py-1.5 rounded flex-1 break-all select-all text-[var(--text-primary)]">{newKey}</code>
              <button onClick={() => copyToClipboard(newKey)}
                className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--gradient-start)]/30 transition font-medium">
                {copiedKey === newKey ? "✓ Tersalin" : "Salin"}
              </button>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-2">Key hanya ditampilkan sekali. Simpan di tempat aman.</p>
          </div>
        )}
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
                <Bar dataKey="requests" fill="#526477" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
        <ChartCard title="Request per Model">
          {modelData.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={modelData} dataKey="requests" nameKey="model" cx="50%" cy="50%" outerRadius={70} innerRadius={30}
                  label={({ payload }) => (payload?.model || "").split("/").pop()}
                  labelLine={false}>
                  {modelData.map((_: any, i: number) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Key list */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Daftar API Key</h3>
        {keys.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)] py-4">Belum ada API key.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)]">
                  <th className="text-left py-3 px-4 font-medium">Nama</th>
                  <th className="text-left py-3 px-4 font-medium">Key</th>
                  <th className="text-center py-3 px-4 font-medium">Status</th>
                  <th className="text-right py-3 px-4 font-medium">Dibuat</th>
                  <th className="text-right py-3 px-4 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)]/50 transition-colors">
                    <td className="py-3 px-4 text-[var(--text-primary)]">{k.name}</td>
                    <td className="py-3 px-4 font-mono text-xs text-[var(--text-secondary)]">{k.key.slice(0, 24)}...</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        k.is_active
                          ? "bg-[var(--gradient-start)]/10 text-[var(--gradient-start)] border border-[var(--gradient-start)]/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {k.is_active ? "Aktif" : "Dicabut"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-[var(--text-secondary)] text-xs">{new Date(k.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {k.is_active && !isBlocked && (
                          <>
                            <button onClick={() => regenerateKey(k.id)}
                              className="text-xs text-[var(--gradient-start)] hover:text-white hover:bg-[var(--gradient-start)] rounded px-2 py-1 transition-all font-medium" title="Regenerate key baru">↻</button>
                            <button onClick={() => revokeKey(k.id)}
                              className="text-xs text-red-400 hover:text-white hover:bg-red-500 rounded px-2 py-1 transition-all" title="Cabut key">✕</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Regenerate key modal */}
      <Modal open={!!regeneratedKey} onClose={() => setRegeneratedKey(null)} title="Key Diregenerasi">
        {regeneratedKey && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">Nama key</p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{regeneratedKey.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">Key baru</p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-[var(--bg-primary)] border border-[var(--border-color)] px-3 py-2 rounded flex-1 break-all select-all text-[var(--text-primary)]">
                  {regeneratedKey.key}
                </code>
                <button onClick={() => copyToClipboard(regeneratedKey.key)}
                  className="shrink-0 text-xs px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--gradient-start)]/30 transition font-medium">
                  {copiedKey === regeneratedKey.key ? "✓ Tersalin" : "Salin"}
                </button>
              </div>
            </div>
            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
              <p className="text-xs text-amber-400">
                ⚠️ Key lama sudah dicabut. Simpan key baru ini — hanya muncul sekali.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function StatCard({ title, value, accent }: { title: string; value: string | number; accent?: string }) {
  const colors: Record<string, string> = { violet: "#526477", indigo: "#6366f1", purple: "#475569" };
  return (
    <div className="glass-card rounded-xl p-5">
      <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1">{title}</p>
      <p className="text-2xl font-bold mt-auto pt-2" style={{ color: colors[accent || "violet"] || "var(--text-primary)" }}>{value}</p>
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
