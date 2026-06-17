"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

/* ─── Character with individual cursor parallax ─── */
function Char({ ch, index, total, mouseX, mouseY }: {
  ch: string;
  index: number;
  total: number;
  mouseX: number;
  mouseY: number;
}) {
  const x = useSpring(0, { stiffness: 150, damping: 15 });
  const y = useSpring(0, { stiffness: 150, damping: 15 });

  useEffect(() => {
    const offset = ((index - total / 2) / total) * 8;
    x.set((mouseX - 0.5) * 6 + offset);
    y.set((mouseY - 0.5) * 4 + Math.abs(offset) * 0.3);
  }, [mouseX, mouseY, index, total, x, y]);

  if (ch === " ") return <span>&nbsp;</span>;

  return (
    <motion.span
      style={{ x, y, display: "inline-block" }}
      className="inline-block"
    >
      {ch}
    </motion.span>
  );
}

/* ─── Typewriter line that cycles through phrases ─── */
function TypewriterLine({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  const phrases = useMemo(() => [
    "Akses Instan",
    "Tanpa Ribet",
    "AI Apa Saja",
    "Langsung Jalan",
    "Bayar Sekali",
  ], []);

  const [display, setDisplay] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const stateRef = useRef({ phraseIdx: 0, pos: 0, mode: "type" as "type" | "wait" | "erase" });

  // Blink cursor
  useEffect(() => {
    const iv = setInterval(() => setShowCursor((c) => !c), 530);
    return () => clearInterval(iv);
  }, []);

  // Typing / erasing logic
  useEffect(() => {
    let active = true;
    let timeout: ReturnType<typeof setTimeout>;

    function tick() {
      if (!active) return;
      const s = stateRef.current;
      const phrase = phrases[s.phraseIdx];

      if (s.mode === "type") {
        if (s.pos < phrase.length) {
          s.pos++;
          setDisplay(phrase.slice(0, s.pos));
          timeout = setTimeout(tick, 80);
        } else {
          s.mode = "wait";
          timeout = setTimeout(tick, 2200);
        }
      } else if (s.mode === "wait") {
        s.mode = "erase";
        timeout = setTimeout(tick, 0);
      } else if (s.mode === "erase") {
        if (s.pos > 0) {
          s.pos--;
          setDisplay(phrase.slice(0, s.pos));
          timeout = setTimeout(tick, 35);
        } else {
          s.phraseIdx = (s.phraseIdx + 1) % phrases.length;
          s.mode = "type";
          timeout = setTimeout(tick, 200);
        }
      }
    }

    timeout = setTimeout(tick, 0);
    return () => { active = false; clearTimeout(timeout); };
  }, [phrases]);

  // Cursor parallax on each character
  const chars = display.split("");

  return (
    <span>
      {chars.map((ch, i) => (
        <Char
          key={i}
          ch={ch}
          index={i}
          total={chars.length}
          mouseX={mouseX}
          mouseY={mouseY}
        />
      ))}
      <span
        className={`inline-block w-[3px] h-[0.8em] align-middle ml-1 rounded-full bg-[var(--gradient-start)] transition-opacity duration-100 ${showCursor ? "opacity-100" : "opacity-0"}`}
      />
    </span>
  );
}

/* ─── Main export: animated hero headline ─── */
export default function AnimatedHeroText({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  const headline1 = "API Key AI,";
  const headline2 = "nanaAI";

  return (
    <div className="w-full">
      {/* ── Headline line 1: static gradient text ── */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-6 font-space"
      >
        <span className="gradient-text">
          {headline1.split("").map((ch, i) => (
            <Char key={i} ch={ch} index={i} total={headline1.length} mouseX={mouseX} mouseY={mouseY} />
          ))}
        </span>
        <br />
        <span>
          <TypewriterLine mouseX={mouseX} mouseY={mouseY} />
        </span>
      </motion.h1>

      {/* ── Subtitle with staggered cursor-reactive words ── */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed"
      >
        <SubWord text="Isi saldo," mouseX={mouseX} mouseY={mouseY} delay={0} />
        <SubWord text="dapatkan API key," mouseX={mouseX} mouseY={mouseY} delay={0.05} />
        <SubWord text="langsung bangun." mouseX={mouseX} mouseY={mouseY} delay={0.1} />
        <br />
        <span className="hidden sm:inline">
          <SubWord text="Bayar sesuai pemakaian Anda." mouseX={mouseX} mouseY={mouseY} delay={0.15} />
        </span>
      </motion.p>
    </div>
  );
}

/* ─── Subtitle word with subtle float on cursor ─── */
function SubWord({ text, mouseX, mouseY, delay }: {
  text: string;
  mouseX: number;
  mouseY: number;
  delay: number;
}) {
  const y = useSpring(0, { stiffness: 100, damping: 12 });
  const x = useSpring(0, { stiffness: 100, damping: 12 });
  const opacity = useSpring(0, { stiffness: 80, damping: 12 });

  useEffect(() => {
    x.set((mouseX - 0.5) * 3);
    y.set((mouseY - 0.5) * 2);
  }, [mouseX, mouseY, x, y]);

  useEffect(() => {
    opacity.set(1);
  }, [opacity]);

  return (
    <motion.span
      style={{ x, y, opacity, display: "inline-block" }}
      className="inline-block mr-1"
    >
      {text}
    </motion.span>
  );
}
