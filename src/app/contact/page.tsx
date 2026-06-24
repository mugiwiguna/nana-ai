import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kontak — nanaAI",
  description: "Hubungi tim nanaAI. Dukungan teknis, pertanyaan billing, atau kerjasama.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <section className="pt-32 pb-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Hubungi <span className="gradient-text">Kami</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-xl mx-auto">
            Ada pertanyaan, butuh bantuan, atau ingin kerjasama? Kami siap membantu.
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-3xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email */}
          <div className="glass-card rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-[var(--gradient-start)] flex items-center justify-center text-white mb-4">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-2">Email</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              Kirim email ke tim support kami. Respon dalam 1×24 jam.
            </p>
            <a
              href="mailto:hello@nana.mwcs.dev"
              className="text-sm font-medium text-[var(--gradient-start)] hover:underline"
            >
              hello@nana.mwcs.dev
            </a>
          </div>

          {/* Discord */}
          <div className="glass-card rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-[var(--gradient-start)] flex items-center justify-center text-white mb-4">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.363 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.086-2.157-2.419 0-1.332.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.332-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419 0-1.332.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.332-.946 2.418-2.157 2.418z" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-2">Discord</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              Gabung komunitas developer. Diskusi, bantuan, dan update real-time.
            </p>
            <a
              href="/discord"
              className="text-sm font-medium text-[var(--gradient-start)] hover:underline"
            >
              Gabung Server →
            </a>
          </div>

          {/* GitHub */}
          <div className="glass-card rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-[var(--gradient-start)] flex items-center justify-center text-white mb-4">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-2">GitHub</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              Lihat source code, contoh integrasi, dan kontribusi open-source.
            </p>
            <a
              href="https://github.com/nanaai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-[var(--gradient-start)] hover:underline"
            >
              github.com/nanaai →
            </a>
          </div>

          {/* Status */}
          <div className="glass-card rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-[var(--gradient-start)] flex items-center justify-center text-white mb-4">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-2">Status Layanan</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              Cek uptime dan status operasional platform nanaAI secara real-time.
            </p>
            <Link
              href="/status"
              className="text-sm font-medium text-[var(--gradient-start)] hover:underline"
            >
              Lihat Status →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
