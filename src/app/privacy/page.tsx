import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kebijakan Privasi — nanaAI",
  description: "Kebijakan privasi nanaAI. Bagaimana kami mengumpulkan, menggunakan, dan melindungi data Anda.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <section className="pt-32 pb-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Kebijakan <span className="gradient-text">Privasi</span>
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
              <h2 className="text-xl font-bold mb-3">1. Informasi yang Kami Kumpulkan</h2>
              <div className="space-y-2 text-[var(--text-secondary)] leading-relaxed">
                <p>Kami mengumpulkan informasi minimal yang diperlukan untuk menyediakan layanan:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Alamat email (untuk autentikasi akun)</li>
                  <li>Nama pengguna (opsional, untuk identifikasi)</li>
                  <li>Data penggunaan API (request count, token usage, timestamp)</li>
                  <li>Data transaksi (top-up, pemotongan saldo)</li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">2. Penggunaan Informasi</h2>
              <div className="space-y-2 text-[var(--text-secondary)] leading-relaxed">
                <p>Informasi yang dikumpulkan digunakan untuk:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Menyediakan dan memelihara layanan</li>
                  <li>Memproses transaksi dan menghitung biaya</li>
                  <li>Memantau penggunaan untuk mencegah penyalahgunaan</li>
                  <li>Mengirim pemberitahuan terkait akun dan layanan</li>
                  <li>Meningkatkan keamanan platform</li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">3. Data API</h2>
              <div className="space-y-2 text-[var(--text-secondary)] leading-relaxed">
                <p>
                  <strong>Kami tidak menyimpan konten request/response API Anda.</strong> Pesan yang
                  dikirim melalui API diproses secara real-time dan tidak disimpan di server kami.
                  Hanya metadata (model, token count, timestamp) yang dicatat untuk keperluan billing.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">4. Keamanan Data</h2>
              <div className="space-y-2 text-[var(--text-secondary)] leading-relaxed">
                <p>Kami menerapkan langkah-langkah keamanan untuk melindungi data Anda:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Enkripsi data dalam transit (TLS 1.3)</li>
                  <li>Enkripsi data saat disimpan (AES-256)</li>
                  <li>API key di-hash sebelum disimpan</li>
                  <li>Autentikasi berbasis token (JWT)</li>
                  <li>Monitoring dan logging keamanan</li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">5. Pihak Ketiga</h2>
              <div className="space-y-2 text-[var(--text-secondary)] leading-relaxed">
                <p>
                  Kami tidak menjual atau membagikan data pribadi Anda kepada pihak ketiga.
                  Request API Anda diteruskan ke provider AI (OpenAI, Anthropic, Google, DeepSeek)
                  sesuai model yang dipilih, dan tunduk pada kebijakan privasi masing-masing provider.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">6. Hak Anda</h2>
              <div className="space-y-2 text-[var(--text-secondary)] leading-relaxed">
                <p>Anda memiliki hak untuk:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Mengakses data pribadi Anda</li>
                  <li>Memperbaiki data yang tidak akurat</li>
                  <li>Menghapus akun dan data terkait</li>
                  <li>Menolak komunikasi pemasaran</li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">7. Kontak</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Pertanyaan tentang kebijakan privasi? Hubungi kami di{" "}
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
