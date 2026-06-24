import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rilis Terbaru — nanaAI",
  description: "Changelog dan update terbaru nanaAI. Fitur baru, perbaikan, dan peningkatan performa.",
};

const CHANGELOG = [
  {
    version: "v0.6",
    date: "24 Juni 2026",
    changes: [
      "Landing page baru dengan animasi parallax",
      "Hero section interaktif dengan efek 3D",
      "Tabel harga transparan per model",
      "Perbaikan UI dark/light mode",
      "Integrasi Google OAuth",
    ],
  },
  {
    version: "v0.5",
    date: "15 Juni 2026",
    changes: [
      "Dashboard dengan monitoring penggunaan real-time",
      "Manajemen API key: buat, cabut, regenerate",
      "Halaman top-up saldo",
      "Rate limiting per API key",
      "Admin panel: manajemen user & provider",
    ],
  },
  {
    version: "v0.4",
    date: "1 Juni 2026",
    changes: [
      "API proxy OpenAI-compatible",
      "Dukungan multi-model: GPT-4o, Claude, DeepSeek, Gemini",
      "Billing prepaid otomatis per request",
      "Log penggunaan & riwayat transaksi",
    ],
  },
  {
    version: "v0.3",
    date: "20 Mei 2026",
    changes: [
      "Sistem autentikasi dengan NextAuth",
      "Registrasi & login",
      "Manajemen sesi & token JWT",
    ],
  },
  {
    version: "v0.2",
    date: "10 Mei 2026",
    changes: [
      "Setup database & schema Prisma",
      "Model user, API key, transaksi",
      "Seeder data awal",
    ],
  },
  {
    version: "v0.1",
    date: "1 Mei 2026",
    changes: [
      "Inisialisasi project Next.js",
      "Konfigurasi Tailwind CSS",
      "Struktur folder & routing dasar",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <section className="pt-32 pb-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Rilis <span className="gradient-text">Terbaru</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-xl mx-auto">
            Pantau update dan peningkatan platform nanaAI.
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-3xl mx-auto px-4">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 md:left-8 top-0 bottom-0 w-px bg-[var(--border-color)]" />

            <div className="space-y-10">
              {CHANGELOG.map((release, i) => (
                <div key={i} className="relative pl-12 md:pl-16">
                  {/* Dot */}
                  <div className="absolute left-[11px] md:left-[27px] top-1.5 w-3 h-3 rounded-full bg-[var(--gradient-start)] ring-4 ring-[var(--bg-primary)]" />

                  <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-baseline gap-3 mb-4">
                      <span className="text-sm font-mono font-semibold gradient-text">
                        {release.version}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {release.date}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {release.changes.map((change, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                          <svg
                            className="w-4 h-4 text-[var(--gradient-start)] mt-0.5 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
