"use client";

import { useState } from "react";

const SECTIONS = [
  {
    id: "mulai",
    title: "Mulai Cepat",
    icon: "🚀",
    content: [
      { title: "1. Daftar Akun", desc: "Buat akun di halaman registrasi. Tanpa kartu kredit." },
      { title: "2. Isi Saldo", desc: "Top up minimal $5 lewat halaman Isi Saldo." },
      { title: "3. Buat API Key", desc: "Generate key di halaman Key API. Simpan — hanya tampil sekali." },
      { title: "4. Kirim Request", desc: "Chat completion via endpoint API dengan Bearer token." },
    ],
  },
  {
    id: "endpoint",
    title: "Endpoint API",
    icon: "🔌",
    content: [
      { title: "Base URL", code: "https://api.nanaai.id/v1", desc: "Semua request ke base URL ini. OpenAI-compatible." },
      { title: "Chat Completion", code: "POST /chat/completions", desc: "Endpoint utama kirim pesan ke model AI." },
    ],
  },
  {
    id: "autentikasi",
    title: "Autentikasi",
    icon: "🔑",
    content: [
      { title: "Bearer Token", code: "Authorization: Bearer ***", desc: "Sertakan API key di header Authorization tiap request." },
      { title: "Keamanan", desc: "Jangan simpan API key di public repo atau client-side code. Pakai env variable." },
    ],
  },
  {
    id: "contoh",
    title: "Contoh Request",
    icon: "📋",
    content: [
      {
        title: "cURL", lang: "bash",
        code: `curl -X POST https://api.nanaai.id/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ***" \\
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"Halo!"}]}'`,
      },
      {
        title: "JavaScript (fetch)", lang: "javascript",
        code: `const res = await fetch("https://api.nanaai.id/v1/chat/completions", {
  method: "POST",
  headers: { "Content-Type": "application/json", "Authorization": "***" },
  body: JSON.stringify({ model: "gpt-4o", messages: [{ role: "user", content: "Halo!" }] })
});
const data = await res.json();
console.log(data.choices[0].message.content);`,
      },
      {
        title: "Python", lang: "python",
        code: `import requests
response = requests.post("https://api.nanaai.id/v1/chat/completions",
    headers={"Content-Type":"application/json","Authorization":"***"},
    json={"model":"gpt-4o","messages":[{"role":"user","content":"Halo!"}]})
print(response.json()["choices"][0]["message"]["content"])`,
      },
    ],
  },
  {
    id: "model",
    title: "Model Tersedia", icon: "🧠",
    content: [
      { title: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"] },
      { title: "Anthropic", models: ["claude-3.5-sonnet", "claude-3-haiku", "claude-3-opus"] },
      { title: "Google", models: ["gemini-pro", "gemini-1.5-flash", "gemini-1.5-pro"] },
      { title: "DeepSeek", models: ["deepseek-chat", "deepseek-coder"] },
    ],
  },
  {
    id: "streaming", title: "Streaming", icon: "⚡",
    content: [
      { title: "SSE Streaming", desc: "Dapet token satu per satu tanpa nunggu response lengkap. Format OpenAI SSE." },
      { title: "cURL", lang: "bash", code: `curl -X POST https://api.nanaai.id/v1/chat/completions -H "Content-Type: application/json" -H "Authorization: Bearer ***" -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Halo!"}],"stream":true}'` },
      { title: "JavaScript", lang: "javascript", code: `const res = await fetch("https://api.nanaai.id/v1/chat/completions", {
  method: "POST",
  headers: { "Content-Type": "application/json", "Authorization": "***" },
  body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: "Halo!" }], stream: true })
});
const reader = res.body.getReader();
const decoder = new TextDecoder();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  for (const line of decoder.decode(value).split("\\n").filter(l => l.startsWith("data: "))) {
    const json = line.slice(6);
    if (json === "[DONE]") break;
    console.log(JSON.parse(json).choices?.[0]?.delta?.content || "");
  }
}` },
      { title: "Python", lang: "python", code: `import httpx
with httpx.Client() as client:
    with client.stream("POST", "https://api.nanaai.id/v1/chat/completions",
        headers={"Content-Type":"application/json","Authorization":"***"},
        json={"model":"gpt-4o-mini","messages":[{"role":"user","content":"Halo!"}],"stream":True}
    ) as res:
        for line in res.iter_lines():
            if line.startswith("data: ") and line[6:] != "[DONE]":
                print(line[6:])` },
    ],
  },
  {
    id: "sdk", title: "SDK & Library", icon: "📦",
    content: [
      { title: "OpenAI JS SDK", lang: "javascript", desc: "Tinggal ganti baseURL + apiKey.", code: `import OpenAI from "openai";
const client = new OpenAI({ baseURL: "https://api.nanaai.id/v1", apiKey: "***" });
const c = await client.chat.completions.create({ model: "gpt-4o-mini", messages: [{ role: "user", content: "Halo!" }] });
console.log(c.choices[0].message.content);` },
      { title: "OpenAI Python SDK", lang: "python", desc: "OpenAI Python library kompatibel.", code: `from openai import OpenAI
client = OpenAI(base_url="https://api.nanaai.id/v1", api_key="***")
c = client.chat.completions.create(model="gpt-4o-mini", messages=[{"role":"user","content":"Halo!"}])
print(c.choices[0].message.content)` },
      { title: "LangChain", lang: "python", desc: "Integrasi via ChatOpenAI.", code: `from langchain_openai import ChatOpenAI
llm = ChatOpenAI(model="gpt-4o-mini", base_url="https://api.nanaai.id/v1", api_key="***")
print(llm.invoke("Halo!").content)` },
    ],
  },
  {
    id: "ratelimit", title: "Rate Limits", icon: "⏱️",
    content: [
      { title: "Default Limits", kv: [{ k: "RPM", v: "60" }, { k: "RPD", v: "10.000" }, { k: "Token/menit", v: "100.000" }, { k: "Concurrent", v: "10" }, { k: "Max context", v: "128K" }] },
      { title: "Penanganan 429", desc: "Exponential backoff dianjurkan:", lang: "javascript", code: `async function fetchWithRetry(url, opts, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, opts);
    if (res.status !== 429) return res;
    await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
  }
  throw new Error("Max retries");
}` },
      { title: "Upgrade", desc: "Butuh limit lebih tinggi? Hubungi admin." },
    ],
  },
  {
    id: "apiref", title: "API Reference", icon: "📖",
    content: [
      { title: "Base URL", code: "https://api.nanaai.id/v1", desc: "Prefix semua endpoint. OpenAI-compatible." },
      { title: "POST /chat/completions", desc: "Parameter:", params: [
          { name: "model", type: "string", req: true, desc: "ID model" },
          { name: "messages", type: "array", req: true, desc: "[{role, content}]" },
          { name: "temperature", type: "number", req: false, desc: "0-2 (default 1)" },
          { name: "max_tokens", type: "number", req: false, desc: "Max output token" },
          { name: "stream", type: "boolean", req: false, desc: "SSE streaming" },
          { name: "top_p", type: "number", req: false, desc: "Nucleus sampling" },
        ]},
      { title: "Response", lang: "json", code: `{"choices":[{...}],"usage":{"prompt_tokens":20,"completion_tokens":50,"total_tokens":70,"cost":0.000042,"remaining_balance":4.999958}}` },
      { title: "Error Response", lang: "json", code: `{"error":{"message":"Insufficient balance","type":"insufficient_quota"}}` },
    ],
  },
  {
    id: "pricing", title: "Harga & Billing", icon: "💰",
    content: [
      { title: "Prepaid", desc: "Isi saldo dulu, potong otomatis per request. Tanpa tagihan bulanan." },
      { title: "Estimasi", desc: "10.000 req × 500 token × GPT-4o-mini ($0.00015/1K) = $0.75" },
      { title: "Cek Pemakaian", desc: "Monitor di halaman Pemakaian. Semua request tercatat." },
    ],
  },
  {
    id: "roadmap", title: "Roadmap", icon: "🗺️",
    content: [
      { title: "✅ Selesai", checklist: ["Registrasi & Login", "Generate API Key", "API Proxy", "Billing & Usage Logs", "Dashboard", "Admin Panel", "UI Docs"] },
      { title: "🔄 Progress", checklist: ["Streaming (SSE)", "Payment Gateway"] },
      { title: "📋 Rencana", checklist: ["Google OAuth", "Rate Limiting per Key", "Email Verification", "Domain & SSL", "Webhook Callback", "Unit Tests"] },
    ],
  },
  {
    id: "error", title: "Error Codes", icon: "⚠️",
    content: [
      { err: "401", desc: "API key tidak valid atau tidak ada." },
      { err: "402", desc: "Saldo tidak cukup. Isi ulang." },
      { err: "429", desc: "Rate limit terlampaui. Tunggu." },
      { err: "500", desc: "Server error. Hubungi admin." },
      { err: "502", desc: "Upstream error. Model mungkin down." },
    ],
  },
  {
    id: "faq", title: "FAQ", icon: "❓",
    content: [
      { q: "Ada biaya bulanan?", a: "Tidak. Prepaid — bayar sesuai pemakaian." },
      { q: "Bisa pakai model apa aja?", a: "Ya. Satu key buat semua model. Ganti parameter model." },
      { q: "Saldo habis?", a: "Request gagal error 402. Isi ulang." },
      { q: "Ada rate limit?", a: "Ya. Hubungi admin kalau butuh lebih tinggi." },
      { q: "Bisa refund?", a: "Saldo terisi tidak bisa di-refund." },
    ],
  },
];

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="not-prose mt-3">
      <div className="flex items-center justify-between bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-t-lg px-4 py-2">
        <span className="text-xs text-[var(--text-secondary)] font-mono uppercase">{lang || "code"}</span>
        <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          {copied ? "✓ Tersalin" : "Salin"}
        </button>
      </div>
      <pre className="bg-[var(--bg-primary)] border border-t-0 border-[var(--border-color)] rounded-b-lg p-4 overflow-x-auto text-sm leading-relaxed">
        <code className="text-[var(--text-primary)]">{code}</code>
      </pre>
    </div>
  );
}

function InlineCode({ children }: { children: string }) {
  return (
    <code className="inline-block text-sm font-mono bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-emerald-700 dark:text-emerald-400 mt-1">
      {children}
    </code>
  );
}

function ErrBadge({ code, desc }: { code: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <code className="text-xs font-mono bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-md px-2 py-1 font-semibold shrink-0 w-12 text-center">
        {code}
      </code>
      <span className="text-sm text-[var(--text-secondary)]">{desc}</span>
    </div>
  );
}

export default function DocsPage() {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const scrollTo = (id: string) => {
    document.getElementById("section-" + id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Dokumentasi</h1>
        <p className="text-[var(--text-secondary)] mt-1">Panduan lengkap nanaAI API</p>
      </div>

      {/* Horizontal scroll nav */}
      <nav className="sticky top-14 z-30 -mx-4 md:-mx-6 lg:-mx-0 px-4 md:px-6 lg:px-0 pb-2 mb-8 overflow-x-auto scrollbar-hide bg-[var(--bg-primary)]/80 backdrop-blur-lg border-b border-[var(--border-color)]">
        <div className="flex gap-1 min-w-max pb-3">
          {SECTIONS.map((s) => (
            <button key={s.id} onClick={() => scrollTo(s.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]">
              <span className="text-base">{s.icon}</span>
              {s.title}
            </button>
          ))}
        </div>
      </nav>

      {/* All sections */}
      <div className="space-y-14">
        {SECTIONS.map((section) => (
          <section key={section.id} id={"section-" + section.id} className="scroll-mt-36">
            <div className="flex items-center gap-3 pb-4 mb-6 border-b border-[var(--border-color)]">
              <span className="text-2xl">{section.icon}</span>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">{section.title}</h2>
            </div>
            <div className="space-y-6">
              {section.content.map((item: any, i: number) => (
                <div key={i} className="pb-5 border-b border-[var(--border-color)] last:border-0">
                  {item.err ? (
                    <ErrBadge code={item.err} desc={item.desc} />
                  ) : (
                    <>
                      {item.title && <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{item.title}</h3>}
                      {item.desc && <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>}
                      {item.code && !item.lang && <InlineCode>{item.code}</InlineCode>}
                      {item.code && item.lang && <CodeBlock code={item.code} lang={item.lang} />}
                      {item.kv && (
                        <div className="mt-2 divide-y divide-[var(--border-color)] border border-[var(--border-color)] rounded-lg overflow-hidden">
                          {item.kv.map((kv: any, ki: number) => (
                            <div key={ki} className="flex items-center justify-between px-4 py-2.5 text-sm bg-[var(--bg-card)]">
                              <span className="text-[var(--text-secondary)]">{kv.k}</span>
                              <span className="text-[var(--text-primary)] font-mono font-medium">{kv.v}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {item.checklist && (
                        <ul className="mt-2 space-y-1">
                          {item.checklist.map((label: string, ci: number) => (
                            <li key={ci} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                              <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                              {label}
                            </li>
                          ))}
                        </ul>
                      )}
                      {item.models && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {item.models.map((m: string, mi: number) => (
                            <span key={mi} className="text-xs font-mono bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-md px-2.5 py-1 text-[var(--text-secondary)]">{m}</span>
                          ))}
                        </div>
                      )}
                      {item.params && (
                        <div className="overflow-x-auto mt-2 border border-[var(--border-color)] rounded-lg">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
                                <th className="text-left px-3 py-2 font-medium text-[var(--text-secondary)]">Parameter</th>
                                <th className="text-left px-3 py-2 font-medium text-[var(--text-secondary)]">Tipe</th>
                                <th className="text-left px-3 py-2 font-medium text-[var(--text-secondary)]">Req</th>
                                <th className="text-left px-3 py-2 font-medium text-[var(--text-secondary)]">Deskripsi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                              {item.params.map((p: any, pi: number) => (
                                <tr key={pi}>
                                  <td className="px-3 py-2 font-mono text-emerald-700 dark:text-emerald-400">{p.name}</td>
                                  <td className="px-3 py-2 font-mono text-xs text-[var(--text-secondary)]">{p.type}</td>
                                  <td className="px-3 py-2">
                                    {p.req
                                      ? <span className="text-xs font-medium text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-400 px-1.5 py-0.5 rounded">Wajib</span>
                                      : <span className="text-xs text-[var(--text-secondary)]">Opsional</span>
                                    }
                                  </td>
                                  <td className="px-3 py-2 text-[var(--text-secondary)]">{p.desc}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {item.q && (
                        <div>
                          <button onClick={() => setOpenFaq(openFaq === item.q ? null : item.q)}
                            className="flex items-center justify-between w-full text-left py-2">
                            <span className="text-sm font-medium text-[var(--text-primary)]">{item.q}</span>
                            <svg className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${openFaq === item.q ? "rotate-180" : ""}`}
                              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                          </button>
                          {openFaq === item.q && <p className="text-sm text-[var(--text-secondary)] pr-4 pb-2">{item.a}</p>}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
