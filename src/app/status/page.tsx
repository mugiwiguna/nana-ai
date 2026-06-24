import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Status — nanaAI",
  description: "Status layanan nanaAI. Pantau uptime, downtime, dan performa real-time.",
};

const SERVICES = [
  { name: "API Utama", status: "🟢 Online", uptime: "99.95%", lag: "<50ms" },
  { name: "Dashboard", status: "🟢 Online", uptime: "99.91%", lag: "<100ms" },
  { name: "Landing Page", status: "🟢 Online", uptime: "99.99%", lag: "<30ms" },
  { name: "Top-Up", status: "🟢 Online", uptime: "99.87%", lag: "<200ms" },
];

export default function StatusPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <section className="pt-32 pb-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Status <span className="gradient-text">Layanan</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-xl mx-auto">
            Pantau ketersediaan dan performa platform nanaAI secara real-time.
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-3xl mx-auto px-4">
          <div className="glass-card rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="text-left p-4 font-semibold">Layanan</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-left p-4 font-semibold hidden sm:table-cell">Uptime</th>
                  <th className="text-left p-4 font-semibold hidden sm:table-cell">Latensi</th>
                </tr>
              </thead>
              <tbody>
                {SERVICES.map((s) => (
                  <tr key={s.name} className="border-b border-[var(--border-color)]/50 last:border-0">
                    <td className="p-4 font-medium">{s.name}</td>
                    <td className="p-4">{s.status}</td>
                    <td className="p-4 text-[var(--text-secondary)] hidden sm:table-cell">{s.uptime}</td>
                    <td className="p-4 text-[var(--text-secondary)] hidden sm:table-cell">{s.lag}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 glass-card rounded-2xl p-6 text-center">
            <h2 className="font-semibold text-lg mb-2">Semua Sistem Berfungsi Normal ✅</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Pembaruan terakhir: {new Date().toLocaleString("id-ID", { timeZone: "Asia/Shanghai" })}
            </p>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Ada masalah? Hubungi kami atau lihat dokumentasi untuk panduan.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/contact"
                className="text-sm font-medium text-[var(--gradient-start)] hover:underline"
              >
                Hubungi Kami →
              </Link>
              <Link
                href="/docs"
                className="text-sm font-medium text-[var(--gradient-start)] hover:underline"
              >
                Dokumentasi →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
