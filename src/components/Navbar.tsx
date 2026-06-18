"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useSidebar } from "@/components/SidebarContext";

const DUMMY_NOTIFS = [
  { id: 1, title: "Selamat datang!", desc: "Akun Anda berhasil dibuat. Nikmati $5 saldo awal.", time: "2 jam lalu", type: "success" },
  { id: 2, title: "Top-up berhasil", desc: "Saldo $25 berhasil ditambahkan.", time: "1 hari lalu", type: "success" },
  { id: 3, title: "API Key dicabut", desc: "Key 'Dev-2' telah dinonaktifkan.", time: "3 hari lalu", type: "warning" },
  { id: 4, title: "Rate limit mendekati batas", desc: "Anda telah menggunakan 80% RPM.", time: "5 hari lalu", type: "warning" },
];

export default function Navbar() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const sidebar = useSidebar();

  const isDashboard = pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin");

  useEffect(() => setMounted(true), []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/70 backdrop-blur-2xl supports-[backdrop-filter]:bg-[var(--bg-primary)]/60">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {isDashboard && (
            <button
              onClick={sidebar.toggle}
              className="p-2 -ml-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors lg:hidden"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5 text-[var(--text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          )}
          <Link href="/" className="flex items-center gap-2">
            <svg className="w-7 h-7" viewBox="0 0 120 120" fill="none">
              <path d="M30 52 L18 18 L42 38 Z" stroke="var(--gradient-start)" strokeWidth="3" strokeLinejoin="miter" fill="none"/>
              <path d="M90 52 L102 18 L78 38 Z" stroke="var(--gradient-start)" strokeWidth="3" strokeLinejoin="miter" fill="none"/>
              <path d="M35 42 L28 58 L32 80 L60 92 L88 80 L92 58 L85 42 Z" stroke="var(--gradient-start)" strokeWidth="3" strokeLinejoin="miter" fill="none"/>
              <path d="M44 60 L50 54 L56 60 L50 66 Z" stroke="var(--gradient-start)" strokeWidth="2.5" fill="none"/>
              <path d="M64 60 L70 54 L76 60 L70 66 Z" stroke="var(--gradient-start)" strokeWidth="2.5" fill="none"/>
              <path d="M57 72 L63 72 L60 76 Z" fill="var(--gradient-start)" fillOpacity="0.3"/>
            </svg>
            <span className="font-bold text-lg text-zinc-400">nana<span className="text-red-500">AI</span><span className="text-zinc-400">.</span></span>
          </Link>

        </div>

        {/* Right side */}
        <div className="flex items-center gap-1 sm:gap-2 text-sm">
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
              aria-label="Ganti tema"
            >
              {theme === "dark" ? (
                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-13.66l-.7.7M4.04 18.3l-.7.7M21 12h-1M4 12H3m15.66 7.66l-.7-.7M4.04 5.64l-.7-.7M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          )}

          {session ? (
            <>
              {/* Balance always visible */}
              <span className="gradient-text font-semibold text-sm hidden sm:inline">
                ${Number((session.user as any)?.balance || 0).toFixed(2)}
              </span>

              {/* Notifications — dashboard only */}
              {isDashboard && (
                <div className="relative">
                  <button onClick={() => setShowNotifs(!showNotifs)}
                    className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors relative">
                    <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--gradient-start)] rounded-full" />
                  </button>
                  {showNotifs && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
                      <div className="absolute right-0 top-full mt-2 w-80 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-lg z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-[var(--border-color)]">
                          <p className="text-sm font-semibold text-[var(--text-primary)]">Notifikasi</p>
                        </div>
                        <div className="max-h-72 overflow-y-auto divide-y divide-[var(--border-color)]">
                          {DUMMY_NOTIFS.map((n) => (
                            <div key={n.id} className="px-4 py-3 hover:bg-[var(--bg-secondary)] transition-colors">
                              <div className="flex items-start gap-3">
                                <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                                  n.type === "success" ? "bg-emerald-500" : n.type === "warning" ? "bg-amber-500" : "bg-blue-500"
                                }`} />
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-[var(--text-primary)]">{n.title}</p>
                                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{n.desc}</p>
                                  <p className="text-[10px] text-[var(--text-secondary)]/60 mt-1">{n.time}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="px-4 py-2 border-t border-[var(--border-color)] text-center">
                          <button className="text-xs text-[var(--gradient-start)] hover:underline">Tandai semua dibaca</button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Non-dashboard: only Dashboard link */}
              {!isDashboard && (
                <Link href="/dashboard" className="text-[var(--text-secondary)] hover:text-[var(--gradient-start)] transition-colors px-2 py-1">
                  Dashboard
                </Link>
              )}

              <button onClick={() => signOut({ redirectTo: "/login" })}
                className="text-[var(--text-secondary)] hover:text-red-400 transition-colors px-2 py-1">
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-[var(--text-secondary)] hover:text-[var(--gradient-start)] transition-colors px-2 py-1">Masuk</Link>
              <Link href="/register"
                className="bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 px-4 py-1.5 rounded-lg text-white font-medium transition-opacity">
                Daftar
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
