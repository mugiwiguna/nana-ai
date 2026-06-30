"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Model {
  id: string;
  name: string;
  upstream_model_name: string;
  input_price: string;
  output_price: string;
  provider_name: string;
  is_free: boolean;
}

export default function ModelsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [copied, setCopied] = useState("");
  const [customModels, setCustomModels] = useState<Model[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/custom-models")
      .then(r => r.json())
      .then(d => setCustomModels(d.models || []))
      .catch(() => {});
  }, []);

  const copyModel = (id: string) => {
    navigator.clipboard.writeText(id).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = id;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    });
    setCopied(id);
    setTimeout(() => setCopied(""), 2000);
  };

  // Group by provider
  const grouped = customModels.reduce<Record<string, Model[]>>((acc, m) => {
    (acc[m.provider_name] ||= []).push(m);
    return acc;
  }, {});

  if (status === "loading") return <p className="text-center mt-20 text-[var(--text-secondary)]">Loading...</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-8">
      <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Model & Harga</h1>

      {customModels.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center">
          <svg className="w-12 h-12 mx-auto text-[var(--text-secondary)] opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          <p className="text-[var(--text-secondary)] mt-3 text-sm">Belum ada model tersedia.</p>
          <p className="text-[var(--text-secondary)] text-xs mt-1 opacity-60">Tambahkan provider dan model di halaman Admin.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--gradient-start)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
            </svg>
            Model Available
          </h2>

          {Object.entries(grouped).map(([provider, models]) => (
            <div key={provider} className="glass-card rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/30">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">{provider}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)]">
                      <th className="text-left py-3 px-4 font-medium">Model</th>
                      <th className="text-right py-3 px-4 font-medium">Input / 1K token</th>
                      <th className="text-right py-3 px-4 font-medium">Output / 1K token</th>
                    </tr>
                  </thead>
                  <tbody>
                    {models.map(m => (
                      <tr key={m.id} className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-secondary)]/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[var(--text-primary)] font-medium">{m.name}</span>
                            {m.is_free && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">FREE</span>
                            )}
                            <code className="text-[11px] text-blue-400 font-mono bg-blue-500/10 px-1.5 py-0.5 rounded">{m.name}</code>
                            <button onClick={() => copyModel(m.name)}
                              className="text-[11px] px-1.5 py-0.5 rounded border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--gradient-start)]/30 hover:text-[var(--gradient-start)] transition">
                              {copied === m.name ? "✓" : "Salin"}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-400 font-mono text-[12px]">
                          ${Number(m.input_price).toFixed(8)}
                        </td>
                        <td className="py-3 px-4 text-right text-amber-400 font-mono text-[12px]">
                          ${Number(m.output_price).toFixed(8)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
