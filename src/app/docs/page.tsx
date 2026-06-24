"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

const SECTIONS = [
  {
    title: "Mulai Cepat",
    desc: "Daftar, isi saldo, buat API key, dan langsung kirim request. Hanya 4 langkah.",
    hash: "#section-mulai",
  },
  {
    title: "Endpoint API",
    desc: "Base URL https://nana.mwcs.dev/v1 — OpenAI-compatible. Satu endpoint untuk semua model.",
    hash: "#section-endpoint",
  },
  {
    title: "Autentikasi",
    desc: "Bearer token di header Authorization. API key dibuat dari dashboard.",
    hash: "#section-autentikasi",
  },
  {
    title: "Contoh Kode",
    desc: "cURL, JavaScript, Python, dan SDK OpenAI. Copy-paste langsung jalan.",
    hash: "#section-contoh",
  },
  {
    title: "Model Tersedia",
    desc: "GPT-4o, Claude 3.5 Sonnet, DeepSeek, Gemini — semua via satu endpoint.",
    hash: "#section-model",
  },
  {
    title: "Harga & Billing",
    desc: "Prepaid — isi saldo, potong otomatis per request. Tanpa biaya bulanan.",
    hash: "#section-pricing",
  },
  {
    title: "Streaming",
    desc: "SSE streaming — dapatkan token satu per satu, tanpa nunggu response lengkap.",
    hash: "#section-streaming",
  },
  {
    title: "FAQ",
    desc: "Pertanyaan umum: biaya bulanan, refund, rate limit, model yang didukung.",
    hash: "#section-faq",
  },
];

export default function DocsPage() {
  const { data: session } = useSession();

  const hrefFor = (hash: string) => {
    if (session) return `/dashboard/docs${hash}`;
    return `/login?callbackUrl=/dashboard/docs${encodeURIComponent(hash)}`;
  };

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <section className="pt-32 pb-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Dokumentasi <span className="gradient-text">nanaAI</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-xl mx-auto">
            Semua yang perlu diketahui untuk mengintegrasikan API AI ke aplikasi Anda.
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {SECTIONS.map((s) => (
            <Link
              key={s.title}
              href={hrefFor(s.hash)}
              className="glass-card rounded-2xl p-6 hover:border-[var(--gradient-start)]/30 hover:scale-[1.01] transition-all duration-300 group"
            >
              <h3 className="font-semibold text-lg mb-2 group-hover:text-[var(--gradient-start)] transition-colors">
                {s.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{s.desc}</p>
              {!session && (
                <span className="inline-block mt-3 text-xs font-medium text-[var(--gradient-start)] opacity-70 group-hover:opacity-100 transition-opacity">
                  Masuk untuk akses →
                </span>
              )}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
