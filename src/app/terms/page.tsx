import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan — nanaAI",
  description: "Syarat dan ketentuan penggunaan layanan nanaAI. Aturan penggunaan API, billing, dan tanggung jawab.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <section className="pt-32 pb-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Syarat & <span className="gradient-text">Ketentuan</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-xl mx-auto">
            Terakhir diperbarui: 24 Juni 2026
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-3xl mx-auto px-4">
          <div className="glass-card rounded-2xl p-8 space-y-8">
            <div>
              <h2 className="text-xl font-bold mb-3">1. Penerimaan Ketentuan</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Dengan menggunakan layanan nanaAI, Anda setuju untuk terikat oleh Syarat dan Ketentuan ini.
                Jika Anda tidak setuju, harap tidak menggunakan layanan kami.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">2. Layanan</h2>
              <div className="space-y-2 text-[var(--text-secondary)] leading-relaxed">
                <p>nanaAI menyediakan akses API ke berbagai model AI melalui sistem prepaid. Layanan mencakup:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Pembuatan dan pengelolaan API key</li>
                  <li>Akses ke endpoint Chat Completion yang kompatibel dengan OpenAI</li>
                  <li>Sistem billing prepaid per token</li>
                  <li>Dashboard pemantauan penggunaan</li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">3. Akun Pengguna</h2>
              <div className="space-y-2 text-[var(--text-secondary)] leading-relaxed">
                <p>Anda bertanggung jawab untuk:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Menjaga kerahasiaan kredensial akun</li>
                  <li>Semua aktivitas yang terjadi di bawah akun Anda</li>
                  <li>Memberikan informasi yang akurat saat registrasi</li>
                  <li>Memberitahu kami segera jika terjadi pelanggaran keamanan</li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">4. Penggunaan yang Diterima</h2>
              <div className="space-y-2 text-[var(--text-secondary)] leading-relaxed">
                <p>Anda setuju untuk tidak menggunakan layanan untuk:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Aktivitas ilegal atau melanggar hukum</li>
                  <li>Menghasilkan konten berbahaya, menyesatkan, atau tidak etis</li>
                  <li>Melanggar hak kekayaan intelektual pihak lain</li>
                  <li>Spam, scraping berlebihan, atau DDoS</li>
                  <li>Membagikan API key kepada pihak yang tidak berwenang</li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">5. Billing & Pembayaran</h2>
              <div className="space-y-2 text-[var(--text-secondary)] leading-relaxed">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Sistem prepaid — Anda mengisi saldo sebelum penggunaan</li>
                  <li>Biaya dihitung per token dan dipotong otomatis setiap request</li>
                  <li>Harga dapat berubah sewaktu-waktu dengan pemberitahuan</li>
                  <li>Saldo yang sudah diisi tidak dapat di-refund</li>
                  <li>Kami berhak menangguhkan akun dengan saldo negatif</li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">6. Batasan Tanggung Jawab</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Layanan disediakan &ldquo;sebagaimana adanya&rdquo; tanpa jaminan. Kami tidak bertanggung jawab
                atas kerugian tidak langsung, insidental, atau konsekuensial yang timbul dari penggunaan
                layanan. Kami tidak menjamin ketersediaan layanan tanpa gangguan.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">7. Pengakhiran</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Kami berhak menangguhkan atau mengakhiri akun Anda jika melanggar ketentuan ini.
                Anda dapat mengakhiri akun kapan saja dengan menghubungi kami. Saldo yang tersisa
                tidak dapat di-refund setelah pengakhiran.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">8. Perubahan Ketentuan</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Kami dapat memperbarui ketentuan ini sewaktu-waktu. Perubahan material akan
                diberitahukan melalui email atau pemberitahuan di platform. Penggunaan berkelanjutan
                setelah perubahan berarti Anda menerima ketentuan yang diperbarui.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">9. Kontak</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Pertanyaan tentang ketentuan ini? Hubungi kami di{" "}
                <a href="mailto:hello@nana.mwcs.dev" className="text-[var(--gradient-start)] hover:underline">
                  hello@nana.mwcs.dev
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
