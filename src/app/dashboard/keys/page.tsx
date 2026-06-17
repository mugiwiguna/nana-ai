"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import Modal from "@/components/Modal";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function KeysPage() {
  const { status } = useSession();
  const router = useRouter();
  const [keys, setKeys] = useState<any[]>([]);
  const [usage, setUsage] = useState<any[]>([]);
  const [daily, setDaily] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [newKey, setNewKey] = useState("");
  const [copiedKey, setCopiedKey] = useState("");
  const [regeneratedKey, setRegeneratedKey] = useState<{ key: string; name: string } | null>(null);

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
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">API Keys</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Keys" value={keys.length} />
        <StatCard title="Aktif" value={keys.filter(k => k.is_active).length} color="#10b981" />
        <StatCard title="Total Request" value={usage.length} color="#f59e0b" />
      </div>

      {/* Generate */}
      <div className="bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Buat API Key Baru</h2>
        <div className="flex gap-2">
          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
            placeholder="Nama key (misal: Production)"
            className="min-w-0 flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--gradient-start)] outline-none" />
          <button onClick={generateKey}
            className="shrink-0 bg-[var(--gradient-start)] hover:opacity-90 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
            Generate
          </button>
        </div>
        {newKey && (
          <div className="mt-4 p-3 bg-[var(--gradient-start)]/10 border border-[var(--gradient-start)]/30 rounded-lg">
            <p className="text-xs font-medium text-[var(--gradient-start)] mb-1">Key baru!</p>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-[var(--bg-primary)] border border-[var(--border-color)] px-2 py-1.5 rounded flex-1 break-all select-all text-[var(--text-primary)]">{newKey}</code>
              <button onClick={() => copyToClipboard(newKey)}
                className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition font-medium">
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
                <Bar dataKey="requests" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
        <ChartCard title="Request per Model">
          {modelData.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={modelData} dataKey="requests" nameKey="model" cx="50%" cy="50%" outerRadius={70}
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
      <div className="bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] rounded-xl p-5">
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
                  <tr key={k.id} className="border-b border-[var(--border-color)] group">
                    <td className="py-3 px-4 text-[var(--text-primary)]">{k.name}</td>
                    <td className="py-3 px-4 font-mono text-xs text-[var(--text-secondary)]">{k.key.slice(0, 24)}...</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-3 py-0.5 rounded text-xs font-medium ${
                        k.is_active
                          ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                          : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                      }`}>
                        {k.is_active ? "Aktif" : "Dicabut"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-[var(--text-secondary)] text-xs">{new Date(k.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {k.is_active && (
                          <>
                            <button onClick={() => regenerateKey(k.id)}
                              className="text-xs text-emerald-500 hover:text-emerald-400 transition px-1" title="Regenerate key baru">↻</button>
                            <button onClick={() => revokeKey(k.id)}
                              className="text-xs text-red-500 hover:text-red-400 transition px-1" title="Cabut key">✕</button>
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
                  className="shrink-0 text-xs px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition font-medium">
                  {copiedKey === regeneratedKey.key ? "✓ Tersalin" : "Salin"}
                </button>
              </div>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                ⚠️ Key lama sudah dicabut. Simpan key baru ini — hanya muncul sekali.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: string | number; color?: string }) {
  return (
    <div className="bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] rounded-xl p-5 h-full flex flex-col">
      <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-bold mt-auto pt-2" style={{ color: color || "var(--text-primary)" }}>{value}</p>
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
