"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const MODELS = [
  { id: "openai/gpt-4o", name: "GPT-4o", provider: "OpenAI", input: 0.0000025, output: 0.00001, context: "128K" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", input: 0.00000015, output: 0.0000006, context: "128K" },
  { id: "openai/gpt-4-turbo", name: "GPT-4 Turbo", provider: "OpenAI", input: 0.00001, output: 0.00003, context: "128K" },
  { id: "openai/gpt-3.5-turbo", name: "GPT-3.5 Turbo", provider: "OpenAI", input: 0.0000005, output: 0.0000015, context: "16K" },
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic", input: 0.000003, output: 0.000015, context: "200K" },
  { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku", provider: "Anthropic", input: 0.00000025, output: 0.00000125, context: "200K" },
  { id: "anthropic/claude-3-opus", name: "Claude 3 Opus", provider: "Anthropic", input: 0.000015, output: 0.000075, context: "200K" },
  { id: "google/gemini-pro", name: "Gemini Pro", provider: "Google", input: 0.00000125, output: 0.000005, context: "32K" },
  { id: "google/gemini-1.5-flash", name: "Gemini 1.5 Flash", provider: "Google", input: 0.00000035, output: 0.00000105, context: "1M" },
  { id: "google/gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "Google", input: 0.00000125, output: 0.000005, context: "2M" },
  { id: "deepseek/deepseek-chat", name: "DeepSeek Chat", provider: "DeepSeek", input: 0.00000014, output: 0.00000028, context: "64K" },
  { id: "deepseek/deepseek-coder", name: "DeepSeek Coder", provider: "DeepSeek", input: 0.00000014, output: 0.00000028, context: "64K" },
];

const PROVIDERS = [...new Set(MODELS.map(m => m.provider))];

const PROVIDER_ICONS: Record<string, string> = {
  OpenAI: "⚡",
  Anthropic: "🧠",
  Google: "🔮",
  DeepSeek: "🐋",
};

export default function ModelsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [copied, setCopied] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

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

  if (status === "loading") return <p className="text-center mt-20 text-[var(--text-secondary)]">Loading...</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-8">
      <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Model & Harga</h1>

      {PROVIDERS.map(provider => {
        const models = MODELS.filter(m => m.provider === provider);
        return (
          <div key={provider} className="glass-card rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/30">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <span>{PROVIDER_ICONS[provider] || "📦"}</span> {provider}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)]">
                    <th className="text-left py-3 px-4 font-medium">Model</th>
                    <th className="text-right py-3 px-4 font-medium">Input / 1K token</th>
                    <th className="text-right py-3 px-4 font-medium">Output / 1K token</th>
                    <th className="text-right py-3 px-4 font-medium">Context</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map(m => (
                    <tr key={m.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)]/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="text-[var(--text-primary)] font-medium">{m.name}</span>
                        <span className="text-[var(--text-secondary)] text-xs ml-2 font-mono opacity-60">{m.id}</span>
                        <button onClick={() => copyModel(m.id)}
                          className="ml-2 text-xs px-2 py-0.5 rounded border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--gradient-start)]/30 hover:text-[var(--gradient-start)] transition align-middle">
                          {copied === m.id ? "✓" : "Salin"}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right text-[var(--text-secondary)] font-mono">
                        ${m.input.toFixed(7).replace(/0+$/, "").replace(/\.$/, "")}
                      </td>
                      <td className="py-3 px-4 text-right text-[var(--text-secondary)] font-mono">
                        ${m.output.toFixed(7).replace(/0+$/, "").replace(/\.$/, "")}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="px-2 py-0.5 rounded text-xs bg-[var(--gradient-start)]/10 text-[var(--gradient-start)] border border-[var(--gradient-start)]/20 font-medium">
                          {m.context}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
