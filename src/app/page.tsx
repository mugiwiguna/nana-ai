"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, useMotionValue, useTransform, useScroll, useSpring, useInView } from "framer-motion";
import dynamic from "next/dynamic";

const AnimatedHeroText = dynamic(() => import("@/components/AnimatedHeroText"), {
  ssr: false,
  loading: () => (
    <div className="text-center">
      <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-6">
        <span className="gradient-text">API Key AI,</span><br /><span>Akses Instan</span>
      </h1>
      <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10">
        Isi saldo, dapatkan API key, langsung bangun. Bayar sesuai pemakaian Anda.
      </p>
    </div>
  ),
});

/* ─── Pricing data ─── */
const PRICING_ROWS = [
  { model: "GPT-4o", input: "$0.0025", output: "$0.01", popular: true },
  { model: "GPT-4o-mini", input: "$0.00015", output: "$0.0006", popular: false },
  { model: "Claude 3.5 Sonnet", input: "$0.003", output: "$0.015", popular: false },
  { model: "DeepSeek V3", input: "$0.00014", output: "$0.00028", popular: false },
];

/* ─── Features data ─── */
const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
      </svg>
    ),
    title: "API Key Instan",
    desc: "Buat API key dalam hitungan detik. Tanpa persetujuan lama, tanpa formulir. Langsung mulai begitu saldo terisi.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Sistem Prepaid",
    desc: "Bayar sesuai pemakaian. Tanpa langganan bulanan, tanpa tagihan kejutan. Transparansi penuh di setiap permintaan.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: "Aman & Terpercaya",
    desc: "Enkripsi kelas enterprise, autentikasi berbasis token, dan monitoring real-time. Data Anda tetap terlindungi.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      </svg>
    ),
    title: "Multi-Model",
    desc: "Satu API key untuk akses GPT-4o, Claude, DeepSeek, Gemini dan lainnya. Ganti model cukup dengan satu parameter.",
  },
];

/* ─── CountUp animation ─── */
function AnimatedNumber({ n }: { n: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1500;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * n));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, n]);

  return <span ref={ref}>{display.toLocaleString()}</span>;
}

/* ─── Animated section wrapper with parallax ─── */
function SectionWrapper({ children, className = "", id, parallaxOffset = 30 }: { children: React.ReactNode; className?: string; id?: string; parallaxOffset?: number }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [parallaxOffset, -parallaxOffset]);
  const springY = useSpring(parallaxY, { stiffness: 100, damping: 30 });

  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      <motion.div style={{ y: springY }}>
        {children}
      </motion.div>
    </motion.section>
  );
}

/* ─── Section heading ─── */
function SectionHeading({ label, title }: { label: string; title: string }) {
  return (
    <div className="text-center mb-12">
      <motion.span
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="inline-block text-xs font-semibold tracking-widest uppercase text-[var(--gradient-start)]/80 dark:text-[var(--gradient-start)]/80 bg-[var(--gradient-start)]/10 px-3 py-1 rounded-full mb-4"
      >
        {label}
      </motion.span>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-3xl md:text-4xl font-bold"
      >
        {title}
      </motion.h2>
    </div>
  );
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="border-t border-[var(--border-color)] mt-24 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h4 className="font-semibold mb-3 text-sm">Produk</h4>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li><Link href="/pricing" className="hover:text-[var(--gradient-start)] transition-colors">Harga</Link></li>
              <li><Link href="/docs" className="hover:text-[var(--gradient-start)] transition-colors">Dokumentasi</Link></li>
              <li><Link href="/changelog" className="hover:text-[var(--gradient-start)] transition-colors">Rilis Terbaru</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Sumber Daya</h4>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li><Link href="/status" className="hover:text-[var(--gradient-start)] transition-colors">Status</Link></li>
              <li><Link href="/docs" className="hover:text-[var(--gradient-start)] transition-colors">Referensi API</Link></li>
              <li><Link href="/contact" className="hover:text-[var(--gradient-start)] transition-colors">Kontak</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Perusahaan</h4>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li><Link href="/about" className="hover:text-[var(--gradient-start)] transition-colors">Tentang</Link></li>
              <li><Link href="/privacy" className="hover:text-[var(--gradient-start)] transition-colors">Privasi</Link></li>
              <li><Link href="/terms" className="hover:text-[var(--gradient-start)] transition-colors">Syarat & Ketentuan</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Connect</h4>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li><a href="https://github.com/nanaai" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--gradient-start)] transition-colors">GitHub</a></li>
              <li><a href="https://twitter.com/nanaai" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--gradient-start)] transition-colors">Twitter</a></li>
              <li><Link href="/discord" className="hover:text-[var(--gradient-start)] transition-colors">Discord</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[var(--border-color)] pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[var(--text-secondary)]">
          <p>&copy; {new Date().getFullYear()} nanaAI. Hak cipta dilindungi.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-[var(--text-primary)] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--text-primary)] transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── Stats bar ─── */
function StatsBar() {
  return (
    <SectionWrapper parallaxOffset={50}>
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Permintaan API", value: 1250000 },
            { label: "Developer Aktif", value: 8400 },
            { label: "Model Tersedia", value: 12 },
            { label: "Uptime SLA", value: 99.9 },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">
                {stat.label === "Uptime SLA" ? (
                  <><AnimatedNumber n={Math.floor(stat.value)} />%</>
                ) : (
                  <><AnimatedNumber n={stat.value} />+</>
                )}
              </div>
              <div className="text-sm text-[var(--text-secondary)]">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}

/* ─── Main page ─── */
export default function HomePage() {
  const { data: session } = useSession();
  const heroRef = useRef<HTMLDivElement>(null);

  // ── Cursor-tracking motion values ──
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const orbX = useTransform(mouseX, [0, 1], [0, 100]);
  const orbY = useTransform(mouseY, [0, 1], [0, 100]);
  const springX = useSpring(orbX, { stiffness: 80, damping: 25 });
  const springY = useSpring(orbY, { stiffness: 80, damping: 25 });

  // ── 3D cat cursor tracking ──
  const [catMouse, setCatMouse] = useState({ x: 0.5, y: 0.5 });

  const catMouseRef = useRef({ x: 0.5, y: 0.5 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = heroRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mouseX.set(x);
      mouseY.set(y);
      catMouseRef.current = { x, y };
    },
    [mouseX, mouseY]
  );

  // ── Gyro support ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.DeviceOrientationEvent) return;

    const handler = (e: DeviceOrientationEvent) => {
      const gx = (e.gamma ?? 0) / 45; // -1 to 1
      const gy = (e.beta ?? 0) / 90;  // -1 to 1
      const x = Math.min(1, Math.max(0, 0.5 + gx * 0.5));
      const y = Math.min(1, Math.max(0, 0.5 + gy * 0.5));
      mouseX.set(x);
      mouseY.set(y);
      catMouseRef.current = { x, y };
    };

    window.addEventListener("deviceorientation", handler);
    return () => window.removeEventListener("deviceorientation", handler);
  }, [mouseX, mouseY]);

  // Throttle cat mouse updates for 3D rendering
  useEffect(() => {
    let raf: number;
    const tick = () => {
      setCatMouse((prev) => {
        const { x, y } = catMouseRef.current;
        if (Math.abs(prev.x - x) < 0.001 && Math.abs(prev.y - y) < 0.001) return prev;
        return { x, y };
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ── Parallax ──
  const { scrollYProgress } = useScroll();
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const parallaxOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.6]);
  const parallaxOrb = useTransform(scrollYProgress, [0, 0.3], [0, 80]);
  const springParallaxY = useSpring(parallaxY, { stiffness: 60, damping: 20 });

  // ── 3D tilt effect on hero ──
  const rotateX = useTransform(mouseY, [0, 1], [4, -4]);
  const rotateY = useTransform(mouseX, [0, 1], [-4, 4]);
  const springRotateX = useSpring(rotateX, { stiffness: 60, damping: 20 });
  const springRotateY = useSpring(rotateY, { stiffness: 60, damping: 20 });

  return (
    <>
      {/* ──────── HERO ──────── */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
      >
        {/* Background gradient orbs */}
        <motion.div
          className="gradient-orb absolute w-[600px] h-[600px] rounded-full"
          style={{
            left: `calc(50% - 300px + ${springX}px)`,
            top: `calc(50% - 300px + ${springY}px)`,
            x: springX,
            y: springY,
          }}
        />
        <motion.div
          className="gradient-orb absolute w-[400px] h-[400px] rounded-full opacity-20"
          style={{
            left: `calc(30% - 200px - ${springX}px)`,
            top: `calc(60% - 200px - ${springY}px)`,
            x: useTransform(springX, (v) => -v * 0.7),
            y: useTransform(springY, (v) => -v * 0.7),
          }}
        />

        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(var(--text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Hero content */}
        <motion.div
          className="relative z-10 text-center max-w-4xl mx-auto px-4"
          style={{
            y: springParallaxY,
            opacity: parallaxOpacity,
          }}
        >
          {/* Hero logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6 flex justify-center"
          >
            <img src="/logo-header.png" alt="nanaAI" className="h-32 sm:h-40 md:h-48 lg:h-56 2xl:h-64 w-auto max-w-[200px] sm:max-w-[280px] md:max-w-[340px] lg:max-w-[420px] 2xl:max-w-[500px] object-contain" />
          </motion.div>

          {/* Announcement pill */}
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8"
          >
            <span className="inline-flex items-center gap-2 text-xs font-medium bg-[var(--gradient-start)]/10 dark:bg-[var(--gradient-start)]/10 text-[var(--gradient-start)] px-4 py-1.5 rounded-full border border-[var(--gradient-start)]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-bg)] animate-pulse" />
              Sekarang mendukung GPT-4o & Claude 3.5 Sonnet
            </span>
          </motion.div>

          {/* Headline */}
          <AnimatedHeroText mouseX={catMouse.x} mouseY={catMouse.y} />

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-row flex-wrap gap-3 sm:gap-4 justify-center"
          >
            {/* Primary — liquid glass + gradient */}
            <Link
              href={session ? "/dashboard" : "/register"}
              className="group relative overflow-hidden inline-flex items-center gap-2.5 text-[var(--accent-fg)] font-semibold px-5 py-2.5 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-500 hover:scale-[1.03] active:scale-[0.98]"
            >
              {/* Animated gradient bg */}
              <span className="absolute inset-0 bg-[var(--gradient-start)]/10" />
              {/* Glass overlay */}
              <span className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
              {/* Inner glow ring */}
              <span className="absolute inset-0 rounded-xl sm:rounded-2xl ring-1 ring-inset ring-white/20" />
              {/* Bottom highlight */}
              <span className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              <span className="relative z-10">{session ? "Akses Dashboard" : "Mulai Gratis"}</span>
              <svg className="relative z-10 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>

            {/* Secondary — glass ghost */}
            <Link
              href="/#pricing"
              className="group relative overflow-hidden inline-flex items-center gap-2.5 text-[var(--text-primary)] font-semibold px-5 py-2.5 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-500 hover:scale-[1.03] active:scale-[0.98]"
            >
              {/* Glass bg */}
              <span className="absolute inset-0 bg-[var(--glass-bg)] backdrop-blur-xl" />
              {/* Border */}
              <span className="absolute inset-0 rounded-xl sm:rounded-2xl ring-1 ring-inset ring-[var(--border-color)] group-hover:ring-[var(--gradient-start)]/30 transition-all duration-500" />
              {/* Top highlight */}
              <span className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <span className="relative z-10">Lihat Harga</span>
              <svg className="relative z-10 w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--gradient-start)] group-hover:translate-x-0.5 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </Link>
          </motion.div>

          {/* Floating indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-[var(--text-secondary)]/50"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ──────── STATS ──────── */}
      <StatsBar />

      {/* ──────── FEATURES ──────── */}
      <SectionWrapper id="features" className="py-16 md:py-24" parallaxOffset={20}>
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeading label="Fitur" title="Semua yang Anda butuhkan untuk membangun produk AI" />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="glass-card rounded-2xl p-6 group"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-bg)] flex items-center justify-center text-[var(--accent-fg)] mb-4 group-hover:scale-110 transition-transform duration-300">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* ──────── HOW IT WORKS ──────── */}
      <SectionWrapper className="py-16 md:py-24" parallaxOffset={40}>
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeading label="Cara Kerja" title="Tiga langkah untuk mulai membangun" />
          <div className="grid md:grid-cols-3 gap-8 md:gap-12 max-w-4xl mx-auto">
            {[
              {
                step: "01",
                title: "Buat Akun",
                desc: "Daftar kurang dari satu menit. Tanpa kartu kredit untuk memulai.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                ),
              },
              {
                step: "02",
                title: "Isi Saldo",
                desc: "Tambahkan dana ke akun Anda. Mulai dari $5 — tanpa langganan.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
              {
                step: "03",
                title: "Gunakan API",
                desc: "Buat API key dan mulai kirim permintaan. Satu key, semua model.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                  </svg>
                ),
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="text-center relative"
              >
                {/* Connector line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[40%] h-[1px] bg-gradient-to-r from-[var(--gradient-start)]/40 to-transparent" />
                )}
                {/* Icon circle */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[var(--accent-bg)] flex items-center justify-center text-[var(--accent-fg)] shadow-lg shadow-[var(--gradient-start)]/20"
                >
                  {step.icon}
                </motion.div>
                <span className="text-xs font-semibold tracking-widest text-[var(--gradient-start)]/60 uppercase mb-2 block">
                  Langkah {step.step}
                </span>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* ──────── PRICING ──────── */}
      <SectionWrapper id="pricing" className="py-16 md:py-24" parallaxOffset={25}>
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeading label="Harga" title="Harga transparan per model" />
          <div className="max-w-3xl mx-auto">
            <div className="glass-card rounded-2xl overflow-hidden">
              <table className="w-full pricing-table">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th>Model</th>
                    <th className="text-right">Input / 1K token</th>
                    <th className="text-right">Output / 1K token</th>
                    <th className="text-right w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {PRICING_ROWS.map((row, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className={row.popular ? "popular" : ""}
                    >
                      <td className="font-medium">
                        <span className="flex items-center gap-2">
                          {row.model}
                          {row.popular && (
                            <span className="text-[10px] font-semibold tracking-wider uppercase bg-[var(--gradient-start)]/15 text-[var(--gradient-start)] px-2 py-0.5 rounded-full">
                              Paling Populer
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="text-right font-mono text-sm">{row.input}</td>
                      <td className="text-right font-mono text-sm">{row.output}</td>
                      <td className="text-right">
                        <Link
                          href="/register"
                          className="text-xs font-medium text-[var(--gradient-start)] hover:underline"
                        >
                          Dapatkan Key
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-center text-xs text-[var(--text-secondary)] mt-4">
              Semua harga dalam USD. Dihitung per token. Tanpa biaya bulanan atau komitmen minimum.
            </p>
          </div>
        </div>
      </SectionWrapper>

      {/* ──────── CTA ──────── */}
      <SectionWrapper className="py-16 md:py-24" parallaxOffset={15}>
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-3xl bg-[var(--gradient-start)]/5 border border-[var(--border-color)] p-10 md:p-16 text-center"
          >
            {/* Decorative orbs */}
            <div className="absolute top-0 right-0 w-64 h-64 gradient-orb opacity-20" />
            <div className="absolute bottom-0 left-0 w-48 h-48 gradient-orb opacity-10" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Siap mulai membangun?
              </h2>
              <p className="text-lg text-[var(--text-secondary)] mb-8 max-w-lg mx-auto">
                Bergabung dengan ribuan developer yang sudah menggunakan nanaAI. Dapat $1 kredit gratis saat daftar.
              </p>
              <div className="flex flex-row flex-wrap gap-3 sm:gap-4 justify-center">
                {/* Primary liquid glass */}
                <Link
                  href={session ? "/dashboard" : "/register"}
                  className="group relative overflow-hidden inline-flex items-center gap-2.5 text-[var(--accent-fg)] font-semibold px-5 py-2.5 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-500 hover:scale-[1.03] active:scale-[0.98]"
                >
                  <span className="absolute inset-0 bg-[var(--gradient-start)]/10" />
                  <span className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
                  <span className="absolute inset-0 rounded-xl sm:rounded-2xl ring-1 ring-inset ring-white/20" />
                  <span className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                  <span className="relative z-10">{session ? "Akses Dashboard" : "Mulai Gratis"}</span>
                </Link>
                {/* Secondary glass ghost */}
                <Link
                  href="/login"
                  className="group relative overflow-hidden inline-flex items-center gap-2.5 text-[var(--text-primary)] font-semibold px-5 py-2.5 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-500 hover:scale-[1.03] active:scale-[0.98]"
                >
                  <span className="absolute inset-0 bg-[var(--glass-bg)] backdrop-blur-xl" />
                  <span className="absolute inset-0 rounded-xl sm:rounded-2xl ring-1 ring-inset ring-[var(--border-color)] group-hover:ring-[var(--gradient-start)]/30 transition-all duration-500" />
                  <span className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  <span className="relative z-10">Masuk</span>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </SectionWrapper>

      {/* ──────── FOOTER ──────── */}
      <Footer />
    </>
  );
}
