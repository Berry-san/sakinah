'use client';

import { Navbar } from '@/components/layout/navbar';
import { SakinahLogo } from '@/components/ui/SakinahLogo';
import {
  ArrowRight,
  BookOpen,
  Headphones,
  Moon,
  NotePencil,
  Sparkle,
  Star,
  Sun
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const ARABIC = { fontFamily: "'Scheherazade New', serif" } as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: 'easeOut' as const }
  })
};

const FEATURES = [
  {
    Icon: BookOpen,
    title: 'Full Quran',
    desc: 'Read with beautiful Uthmanic script, Tajweed highlighting, and side-by-side translations.',
    href: '/quran',
    label: 'Start reading'
  },
  {
    Icon: Headphones,
    title: 'Audio Recitation',
    desc: 'Listen to world-class reciters with verse-by-verse playback and repeat modes.',
    href: '/quran',
    label: 'Listen now'
  },
  {
    Icon: NotePencil,
    title: 'Reflection Journal',
    desc: 'Record your thoughts, duas, and insights as you journey through the Quran.',
    href: '/reflections',
    label: 'Open journal'
  },
  {
    Icon: Sparkle,
    title: 'AI Guidance',
    desc: 'Ask questions about verses, get tafsir summaries, and deepen your understanding.',
    href: '/companion',
    label: 'Ask a question'
  }
];

const STATS = [
  { value: '114', label: 'Surahs' },
  { value: '6,236', label: 'Verses' },
  { value: '30', label: 'Juz' },
  { value: '∞', label: 'Reflection' }
];

const STEPS = [
  {
    n: '١',
    title: 'Choose your surah',
    desc: 'Browse by surah, juz, or search by verse. Begin wherever your heart calls.'
  },
  {
    n: '٢',
    title: 'Read or listen',
    desc: 'Follow the Arabic with Tajweed color-coding or listen to a world-class reciter.'
  },
  {
    n: '٣',
    title: 'Reflect and record',
    desc: 'Capture your thoughts in your personal journal. Return to them anytime.'
  },
  {
    n: '٤',
    title: 'Build your rhythm',
    desc: 'Daily streaks and gentle reminders keep your connection consistent.'
  }
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground font-telegraf">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center px-6 pb-32 overflow-hidden text-center pt-28">
        <div className="absolute inset-0 overflow-hidden -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-green-950/20 via-background to-background dark:from-green-950/40" />
          <svg
            className="absolute top-0 left-0 w-full h-full opacity-[0.035] dark:opacity-[0.06]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="geo" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <path
                  d="M40 4 L76 22 L76 58 L40 76 L4 58 L4 22 Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.6"
                />
                <path
                  d="M40 16 L64 28 L64 52 L40 64 L16 52 L16 28 Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.4"
                />
                <circle cx="40" cy="40" r="4" fill="none" stroke="currentColor" strokeWidth="0.4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#geo)" />
          </svg>
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-green-600/10 blur-[120px]" />
        </div>

        {/* Bismillah */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <p
            className="text-5xl font-light leading-relaxed text-green-600 md:text-6xl dark:text-green-400"
            style={{ ...ARABIC, fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <p className="mt-3 text-sm tracking-[0.2em] uppercase text-muted-foreground font-telegraf">
            In the Name of Allah, the Most Gracious, the Most Merciful
          </p>
        </motion.div>

        {/* Opening verse */}
        <motion.div
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="max-w-2xl px-8 py-6 mb-10 border border-green-500/20 rounded-2xl bg-green-500/5"
        >
          <p
            className="mb-4 text-3xl leading-relaxed md:text-4xl text-foreground"
            style={{ ...ARABIC, direction: 'rtl' }}
          >
            ٱقْرَأْ بِٱسْمِ رَبِّكَ ٱلَّذِى خَلَقَ
          </p>
          <p className="text-sm italic text-muted-foreground font-telegraf">
            "Read in the name of your Lord who created" — Al-Alaq 96:1
          </p>
        </motion.div>

        {/* Headline */}
        <motion.h1
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mb-6 text-6xl font-bold leading-none tracking-tight md:text-7xl lg:text-8xl font-telegraf"
        >
          Your Quranic <span className="text-gradient">Companion</span>
        </motion.h1>

        <motion.p
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="max-w-xl mb-12 text-xl font-light leading-relaxed text-muted-foreground font-telegraf"
        >
          Read, listen, reflect — build a lasting relationship with the Quran, one verse at a time.
        </motion.p>

        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center gap-4 sm:flex-row"
        >
          <Link
            href="/quran"
            className="flex items-center gap-2 px-8 py-4 text-base font-semibold text-white transition-colors bg-green-600 rounded-xl hover:bg-green-700 font-telegraf"
          >
            Open the Quran <ArrowRight weight="fill" size={18} />
          </Link>
          <Link
            href="/signup"
            className="flex items-center gap-2 px-8 py-4 text-base font-medium transition-colors border rounded-xl border-border hover:border-green-600/50 text-foreground font-telegraf"
          >
            Create free account
          </Link>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="absolute -translate-x-1/2 bottom-8 left-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-px h-12 mx-auto bg-gradient-to-b from-transparent via-green-500/50 to-transparent" />
        </motion.div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────────────────────── */}
      <section className="px-6 py-12 border-y border-border bg-card/40">
        <div className="grid max-w-4xl grid-cols-2 gap-8 mx-auto md:grid-cols-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center"
            >
              <p className="mb-1 text-4xl font-bold text-green-600 md:text-5xl font-telegraf dark:text-green-400">
                {s.value}
              </p>
              <p className="text-sm tracking-widest uppercase text-muted-foreground font-telegraf">
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES GRID ──────────────────────────────────────────────────── */}
      <section className="px-6 py-28">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <p className="text-sm uppercase tracking-[0.2em] text-lime-600 dark:text-lime-400 mb-4 font-telegraf">
              Everything you need
            </p>
            <h2 className="text-5xl font-bold leading-tight md:text-6xl font-telegraf">
              One app, complete journey
            </h2>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="relative flex flex-col gap-5 transition-colors border cursor-pointer group p-7 rounded-2xl border-border bg-card card-highlight hover:border-green-600/40"
              >
                <div className="flex items-center justify-center transition-colors w-11 h-11 rounded-xl bg-green-600/10 group-hover:bg-green-600/20">
                  <f.Icon weight="fill" size={22} className="text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-2 text-xl font-semibold font-telegraf">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground font-telegraf">
                    {f.desc}
                  </p>
                </div>
                <Link
                  href={f.href}
                  className="flex items-center gap-1 text-sm font-medium text-green-600 transition-all dark:text-green-400 font-telegraf group-hover:gap-2"
                >
                  {f.label} <ArrowRight weight="fill" size={14} />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QURAN READER SHOWCASE ──────────────────────────────────────────── */}
      <section className="px-6 py-28 bg-card/30 border-y border-border">
        <div className="grid items-center max-w-6xl gap-16 mx-auto md:grid-cols-2">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-6"
          >
            <p className="text-sm uppercase tracking-[0.2em] text-lime-600 dark:text-lime-400 font-telegraf">
              The Quran, beautifully
            </p>
            <h2 className="text-4xl font-bold leading-tight md:text-5xl font-telegraf">
              Read with clarity and depth
            </h2>
            <p className="leading-relaxed text-muted-foreground font-telegraf">
              Sakinah presents the Quran in authentic Uthmanic script with Tajweed color-coding, so
              every rule of recitation is visible at a glance. Switch between narrations instantly.
            </p>
            <ul className="space-y-3">
              {[
                'Tajweed color highlighting',
                'Side-by-side translation',
                'Mushaf page view',
                'Word-by-word mode'
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-sm text-muted-foreground font-telegraf"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/quran"
              className="inline-flex items-center gap-2 font-medium text-green-600 transition-all dark:text-green-400 font-telegraf hover:gap-3"
            >
              Open the Quran reader <ArrowRight weight="fill" size={16} />
            </Link>
          </motion.div>

          {/* Mock Quran reader card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="p-8 space-y-6 border rounded-2xl border-border bg-card card-highlight">
              <div className="flex items-center justify-between text-xs tracking-wider uppercase text-muted-foreground font-telegraf">
                <span>Al-Fatiha • 7 verses</span>
                <span>Surah 1</span>
              </div>
              <div className="pt-6 space-y-4 border-t border-border">
                {[
                  {
                    ar: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ',
                    en: 'All praise is for Allah, Lord of all worlds',
                    n: '٢'
                  },
                  {
                    ar: 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
                    en: 'the Most Compassionate, Most Merciful',
                    n: '٣'
                  },
                  { ar: 'مَٰلِكِ يَوْمِ ٱلدِّينِ', en: 'Master of the Day of Judgment', n: '٤' }
                ].map((v) => (
                  <div
                    key={v.n}
                    className="flex items-start gap-4 py-3 border-b border-border/50 last:border-0"
                  >
                    <span className="flex-shrink-0 verse-num">{v.n}</span>
                    <div className="flex-1 space-y-2">
                      <p
                        className="text-2xl leading-relaxed text-right text-foreground"
                        style={{ ...ARABIC, direction: 'rtl' }}
                      >
                        {v.ar}
                      </p>
                      <p className="text-xs italic text-muted-foreground font-telegraf">{v.en}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-4 pt-2">
                {[
                  { color: 'bg-green-500', label: 'Ghunnah' },
                  { color: 'bg-blue-400', label: 'Madd' },
                  { color: 'bg-red-400', label: 'Qalqalah' }
                ].map((t) => (
                  <div
                    key={t.label}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground font-telegraf"
                  >
                    <span className={`w-2 h-2 rounded-full ${t.color}`} />
                    {t.label}
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute w-40 h-40 rounded-full -bottom-6 -right-6 bg-green-600/10 blur-3xl -z-10" />
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section className="px-6 py-28">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-20 text-center"
          >
            <p className="text-sm uppercase tracking-[0.2em] text-lime-600 dark:text-lime-400 mb-4 font-telegraf">
              Your practice
            </p>
            <h2 className="text-5xl font-bold md:text-6xl font-telegraf">How Sakinah works</h2>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="flex gap-6 border p-7 rounded-2xl border-border bg-card card-highlight"
              >
                <div className="flex-shrink-0">
                  <span
                    className="text-4xl font-light text-green-600/40 dark:text-green-400/40"
                    style={ARABIC}
                  >
                    {s.n}
                  </span>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold font-telegraf">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground font-telegraf">
                    {s.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DAILY RHYTHM CALLOUT ───────────────────────────────────────────── */}
      <section className="px-6 py-20 border-y border-border bg-card/30">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-3xl mx-auto space-y-6 text-center"
        >
          <div className="flex justify-center gap-4 mb-2">
            <Moon weight="fill" size={20} className="text-lime-500/60" />
            <Sun weight="fill" size={20} className="text-lime-500/60" />
            <Star weight="fill" size={20} className="text-lime-500/60" />
          </div>
          <h2 className="text-3xl font-bold md:text-4xl font-telegraf">
            A verse a day, a habit for life
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground font-telegraf">
            Sakinah sends you a daily ayah in the morning and a gentle reminder in the evening.
            Small moments of connection compound into lasting transformation.
          </p>
          <p
            className="text-2xl leading-relaxed text-green-600 md:text-3xl dark:text-green-400"
            style={{ ...ARABIC, direction: 'rtl' }}
          >
            وَنُنَزِّلُ مِنَ ٱلْقُرْءَانِ مَا هُوَ شِفَآءٌ وَرَحْمَةٌ لِّلْمُؤْمِنِينَ
          </p>
          <p className="text-sm italic text-muted-foreground font-telegraf">
            "We send down of the Quran that which is healing and mercy for the believers." — Al-Isra
            17:82
          </p>
        </motion.div>
      </section>

      {/* ── CLOSING CTA ────────────────────────────────────────────────────── */}
      <section className="relative px-6 overflow-hidden py-36">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-green-950/10 to-background" />
          <svg
            className="absolute top-0 left-0 w-full h-full opacity-[0.04] dark:opacity-[0.07]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="geo2" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <path
                  d="M30 3 L57 16 L57 44 L30 57 L3 44 L3 16 Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#geo2)" />
          </svg>
          <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-green-600/[0.08] blur-[100px]" />
        </div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-2xl mx-auto space-y-8 text-center"
        >
          {/* Logo in CTA */}
          <div className="flex justify-center">
            <SakinahLogo size="lg" />
          </div>

          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-telegraf">
            Light upon Light — Al-Nur 24:35
          </p>
          <p className="text-4xl text-green-600 dark:text-green-400" style={ARABIC}>
            نُورٌ عَلَىٰ نُورٍ
          </p>
          <h2 className="text-5xl font-bold leading-tight md:text-6xl font-telegraf">
            Begin your journey with the Quran today
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground font-telegraf">
            Free to use. No account required to start reading. Join thousands building a daily
            practice with Sakinah.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
            <Link
              href="/quran"
              className="flex items-center gap-2 px-8 py-4 text-base font-semibold text-white transition-colors bg-green-600 rounded-xl hover:bg-green-700 font-telegraf"
            >
              Open the Quran <ArrowRight weight="fill" size={18} />
            </Link>
            <Link
              href="/signup"
              className="flex items-center gap-2 px-8 py-4 text-base font-medium transition-colors border rounded-xl border-border hover:border-green-600/40 text-foreground font-telegraf"
            >
              Create free account
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="px-6 py-12 border-t border-border bg-card/40">
        <div className="flex flex-col items-center justify-between max-w-6xl gap-6 mx-auto md:flex-row">
          <div className="text-center md:text-left">
            <SakinahLogo size="md" />
            <p className="mt-3 text-sm text-muted-foreground font-telegraf">
              Your Quranic companion
            </p>
          </div>
          {/* <nav className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground font-telegraf">
            <Link href="/quran" className="transition-colors hover:text-foreground">
              Quran
            </Link>
            <Link href="/reflections" className="transition-colors hover:text-foreground">
              Reflections
            </Link>
            <Link href="/companion" className="transition-colors hover:text-foreground">
              AI Companion
            </Link>
            <Link href="/rooms" className="transition-colors hover:text-foreground">
              Rooms
            </Link>
          </nav> */}
          <p className="text-xs text-center text-muted-foreground md:text-right font-telegraf">
            © {new Date().getFullYear()} Sakinah — Built for the Ummah
          </p>
        </div>
      </footer>
    </div>
  );
}
