import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tentang — nanaAI",
  description: "nanaAI — platform API key AI untuk developer. Satu key, semua model. Prepaid, transparan, instan.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <section className="pt-32 pb-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Tentang <span className="gradient-text">nanaAI</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-xl mx-auto">
            Misi kami: membuat akses AI terjangkau dan mudah untuk semua developer.
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-3xl mx-auto px-4 space-y-12">
          {/* Story */}
          <div className="glass-card rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">Cerita Kami</h2>
            <div className="space-y-4 text-[var(--text-secondary)] leading-relaxed">
              <p>
                nanaAI lahir dari frustrasi — proses panjang untuk mendapatkan API key AI.
                Formulir, approval manual, langganan mahal, provider yang berbeda-beda.
              </p>
              <p>
                Kami percaya developer seharusnya bisa langsung mulai membangun.
                Tanpa hambatan birokrasi. Tanpa langganan yang tidak perlu.
                Tanpa harus mengelola banyak akun provider.
              </p>
              <p>
                Jadi kami bangun nanaAI — platform yang menyatukan model AI terbaik
                dalam satu API key, dengan sistem prepaid yang transparan.
              </p>
            </div>
          </div>

          {/* Values */}
          <div>
            <h2 className="text-2xl font-bold mb-6 text-center">Nilai Kami</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: "Transparan",
                  desc: "Harga jelas per token. Tanpa biaya tersembunyi. Tanpa lock-in. Semua tercatat.",
                },
                {
                  title: "Instan",
                  desc: "Daftar dalam hitungan detik. API key langsung aktif. Tanpa approval.",
                },
                {
                  title: "Terbuka",
                  desc: "Satu API key untuk semua model. Ganti provider cukup ganti parameter. Fleksibel.",
                },
              ].map((v) => (
                <div key={v.title} className="glass-card rounded-2xl p-6 text-center">
                  <h3 className="font-semibold text-lg mb-2">{v.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center pt-4">
            <p className="text-[var(--text-secondary)] mb-6">
              Siap mulai membangun? Dapatkan API key dalam hitungan detik.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 text-white font-semibold px-8 py-4 rounded-2xl bg-[var(--gradient-start)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300"
            >
              Mulai Gratis
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
