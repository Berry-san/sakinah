'use client';

import type { Chapter, Reciter, Verse, Word } from '@/lib/quran-api';
import { fetchRecitationsByPage, fetchVerseReciters, fetchVersesByPage } from '@/lib/quran-api';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pause,
  Play,
  Settings2,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';

const FONT_CDN = 'https://verses.quran.foundation';
const AUDIO_CDN = 'https://verses.quran.com';
const TOTAL_PAGES = 604;
const DEFAULT_RECITER_ID = 7;

const TAJWEED_COLORS: Record<string, string> = {
  ham_wasl: '#888888',
  laam_shamsiyah: '#888888',
  silent: '#888888',
  madda_normal: '#537FFF',
  madda_permissible: '#4F80FF',
  madda_necessary: '#6699FF',
  madda_obligatory: '#6699FF',
  qalqala: '#FF4444',
  ghunnah: '#DD55CC',
  ikhafa: '#DD55CC',
  ikhafa_shafawi: '#DD55CC',
  idghaam: '#44CC33',
  idghaam_mutajanisayn: '#44CC33',
  idghaam_mutaqaribayn: '#44CC33',
  idghaam_shafawi: '#44CC33',
  iqlab: '#26BFFD'
};

function getWordTajweedColor(tajweedText?: string): string | null {
  if (!tajweedText) return null;
  const match = tajweedText.match(/<rule class=([a-z_]+)>/);
  return match ? (TAJWEED_COLORS[match[1]] ?? null) : null;
}

// ─── Options ──────────────────────────────────────────────────────────────────

type MushafFont = 'qcf_v2' | 'uthmani' | 'indopak';
type PageTheme = 'cream' | 'white' | 'dark';

const FONT_OPTIONS = [
  { id: 'qcf_v2' as MushafFont, label: 'Madani', sample: 'بِسۡمِ' },
  { id: 'uthmani' as MushafFont, label: 'Uthmani', sample: 'بِسْمِ' },
  { id: 'indopak' as MushafFont, label: 'IndoPak', sample: 'بِسْمِ' }
];

const THEME_OPTIONS: {
  id: PageTheme;
  label: string;
  bg: string;
  text: string;
  active: string;
  border: string;
}[] = [
  {
    id: 'cream',
    label: 'Cream',
    bg: '#fdf8f0',
    text: '#2d1f0e',
    active: '#9a5f12',
    border: 'rgba(180,140,80,0.35)'
  },
  {
    id: 'white',
    label: 'White',
    bg: '#ffffff',
    text: '#111111',
    active: '#7c3d08',
    border: 'rgba(0,0,0,0.1)'
  },
  {
    id: 'dark',
    label: 'Dark',
    bg: '#1a1510',
    text: '#e0ccaa',
    active: '#d4a853',
    border: 'rgba(180,140,80,0.25)'
  }
];

const SIZE_OPTIONS = [
  { id: 'sm' as const, label: 'S', fs: 'clamp(0.9rem, 2.4vw, 1.45rem)', lh: '2.3' },
  { id: 'md' as const, label: 'M', fs: 'clamp(1.15rem, 3vw, 1.85rem)', lh: '2.6' },
  { id: 'lg' as const, label: 'L', fs: 'clamp(1.45rem, 3.8vw, 2.3rem)', lh: '3.0' }
];

// ─── Font loading ──────────────────────────────────────────────────────────────

const loadedQcfFonts = new Set<number>();
async function loadQcfPageFont(n: number) {
  if (loadedQcfFonts.has(n) || typeof document === 'undefined') return;
  try {
    const f = new FontFace(
      `QCFPage${n}`,
      `url('${FONT_CDN}/fonts/quran/hafs/v2/woff2/p${n}.woff2')`
    );
    f.display = 'block';
    await f.load();
    document.fonts.add(f);
    loadedQcfFonts.add(n);
  } catch {
    /* fallback */
  }
}

let indopakLoaded = false;
async function loadIndopakFont() {
  if (indopakLoaded || typeof document === 'undefined') return;
  try {
    const f = new FontFace(
      'IndoPakNastaleeq',
      `url('${FONT_CDN}/fonts/quran/hafs/nastaleeq/indopak/indopak-nastaleeq-waqf-lazim-v4.2.1.woff2')`
    );
    f.display = 'swap';
    await f.load();
    document.fonts.add(f);
    indopakLoaded = true;
  } catch {
    /* fallback */
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface LineWord extends Word {
  verseKey: string;
  verseNumber: number;
}

function groupByLine(verses: Verse[]) {
  const lines = new Map<number, LineWord[]>();
  for (const verse of verses) {
    for (const word of verse.words) {
      if (!lines.has(word.line_number)) lines.set(word.line_number, []);
      lines
        .get(word.line_number)!
        .push({ ...word, verseKey: verse.verse_key, verseNumber: verse.verse_number });
    }
  }
  return lines;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface MushafPageViewProps {
  startPage?: number;
  chapterName?: string;
  chapters?: Chapter[];
  onPageChange?: (page: number) => void;
  isTajweed?: boolean;
}

export function MushafPageView({
  startPage = 1,
  chapterName,
  chapters,
  onPageChange,
  isTajweed = false
}: MushafPageViewProps) {
  const [page, setPage] = useState(startPage);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [fontReady, setFontReady] = useState(false);
  const [activeVerse, setActiveVerse] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  const [font, setFont] = useState<MushafFont>('qcf_v2');
  const [theme, setTheme] = useState<PageTheme>('cream');
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');

  // Audio state
  const [audioFiles, setAudioFiles] = useState<{ verse_key: string; url: string }[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentVerse, setCurrentVerse] = useState<string | null>(null);
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [reciterId, setReciterId] = useState(DEFAULT_RECITER_ID);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  // Tracks if page was advanced mid-playback so we resume on the next page
  const continuationRef = useRef(false);

  const goTo = useCallback(
    (p: number) => {
      const c = Math.max(1, Math.min(TOTAL_PAGES, p));
      setPage(c);
      onPageChange?.(c);
    },
    [onPageChange]
  );

  // Close settings on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setPage(startPage);
  }, [startPage]);

  // Fetch reciters
  useEffect(() => {
    fetchVerseReciters()
      .then((r) => setReciters(r.reciters ?? []))
      .catch(() => null);
  }, []);

  // Pause audio on unmount (e.g. switching to Translation tab)
  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  // Load page data + fonts
  useEffect(() => {
    setLoading(true);
    setFontReady(false);
    setVerses([]);
    // Only reset audio state when NOT continuing playback across pages
    if (!continuationRef.current) {
      setIsPlaying(false);
      setCurrentVerse(null);
      setActiveVerse(null);
    }

    fetchVersesByPage(page)
      .then(async (res: any) => {
        const pv: Verse[] = res.verses ?? [];
        setVerses(pv);
        const pageNums = new Set(pv.flatMap((v) => v.words.map((w) => w.page_number)));
        await Promise.all([...pageNums].map(loadQcfPageFont));
        await loadIndopakFont();
        setFontReady(true);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [page]);

  // Fetch audio for the current page
  useEffect(() => {
    if (!verses.length) return;
    setAudioFiles([]);
    setAudioLoading(true);

    fetchRecitationsByPage(reciterId, page)
      .then((files) => {
        const mapped = files.map((a) => ({
          ...a,
          url: a.url.startsWith('http') ? a.url : `${AUDIO_CDN}/${a.url}`
        }));
        setAudioFiles(mapped);

        // If we advanced to this page mid-playback, start the first verse
        if (continuationRef.current && mapped.length > 0) {
          continuationRef.current = false;
          setCurrentVerse(mapped[0].verse_key);
          setActiveVerse(mapped[0].verse_key);
          // isPlaying is already true (we didn't reset it), audio effect will auto-play
        }
      })
      .catch(() => null)
      .finally(() => setAudioLoading(false));
  }, [verses, reciterId, page]);

  // Sync audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = isMuted;
    const file = audioFiles.find((a) => a.verse_key === currentVerse);
    if (!file) {
      audio.pause();
      return;
    }
    if (audio.src !== file.url) {
      audio.src = file.url;
      audio.load();
      if (isPlaying) {
        const onCanPlay = () => {
          audio.play().catch(() => setIsPlaying(false));
          audio.removeEventListener('canplay', onCanPlay);
        };
        audio.addEventListener('canplay', onCanPlay);
      }
      return;
    }
    isPlaying ? audio.play().catch(() => setIsPlaying(false)) : audio.pause();
  }, [isPlaying, isMuted, currentVerse, audioFiles]);

  const playVerse = (key: string) => {
    setCurrentVerse(key);
    setActiveVerse(key);
    setIsPlaying(true);
  };
  const onVerseEnd = () => {
    const idx = audioFiles.findIndex((a) => a.verse_key === currentVerse);
    if (idx < audioFiles.length - 1) {
      const k = audioFiles[idx + 1].verse_key;
      setCurrentVerse(k);
      setActiveVerse(k);
    } else if (page < TOTAL_PAGES) {
      // Last verse on this page — advance to next page and keep playing
      continuationRef.current = true;
      goTo(page + 1);
    } else {
      setIsPlaying(false);
    }
  };

  const skipPrev = () => {
    const idx = audioFiles.findIndex((a) => a.verse_key === currentVerse);
    if (idx > 0) {
      const k = audioFiles[idx - 1].verse_key;
      setCurrentVerse(k);
      setActiveVerse(k);
    } else if (page > 1) {
      continuationRef.current = isPlaying;
      goTo(page - 1);
    }
  };
  const skipNext = () => {
    const idx = audioFiles.findIndex((a) => a.verse_key === currentVerse);
    if (idx < audioFiles.length - 1) {
      const k = audioFiles[idx + 1].verse_key;
      setCurrentVerse(k);
      setActiveVerse(k);
    } else if (page < TOTAL_PAGES) {
      continuationRef.current = isPlaying;
      goTo(page + 1);
    }
  };

  const handleTimeUpdate = () => {
    const a = audioRef.current;
    if (!a || !progressRef.current || !a.duration) return;
    progressRef.current.style.width = `${(a.currentTime / a.duration) * 100}%`;
  };
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a?.duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - r.left) / r.width) * a.duration;
  };

  // Swipe
  const touchX = useRef<number | null>(null);

  // Derived
  const tc = THEME_OPTIONS.find((t) => t.id === theme)!;
  const sc = SIZE_OPTIONS.find((s) => s.id === size)!;
  const sortedLines = [...groupByLine(verses).entries()].sort((a, b) => a[0] - b[0]);
  const curIdx = audioFiles.findIndex((a) => a.verse_key === currentVerse);

  // Derived page metadata
  const pageChapterIds = [...new Set(verses.map((v) => Number(v.verse_key.split(':')[0])))];
  const pageChapterNames = pageChapterIds.map(
    (id) => chapters?.find((c) => c.id === id)?.name_simple ?? chapterName ?? `Surah ${id}`
  );
  const pageJuzNumbers = [
    ...new Set(verses.map((v) => v.juz_number).filter((n): n is number => n != null))
  ];
  const pageHizbNumbers = [
    ...new Set(verses.map((v) => v.hizb_number).filter((n): n is number => n != null))
  ];

  // Enrich lines with chapter-break and verse-1 detection for bismillah headers
  const enrichedLines = sortedLines.map(([ln, words], i) => {
    const firstWord = words.find((w) => w.char_type_name !== 'end');
    const chapterId = firstWord ? Number(firstWord.verseKey.split(':')[0]) : null;
    const prevLine = i > 0 ? sortedLines[i - 1] : null;
    const prevFirst = prevLine?.[1].find((w) => w.char_type_name !== 'end');
    const prevChapterId = prevFirst ? Number(prevFirst.verseKey.split(':')[0]) : null;
    const hasVerseOne = words.some((w) => w.verseNumber === 1);
    const isNewChapter = chapterId !== null && chapterId !== prevChapterId;
    const showBismillah =
      isNewChapter &&
      hasVerseOne &&
      (chapters?.find((c) => c.id === chapterId)?.bismillah_pre ?? false);
    return { ln, words, chapterId, isNewChapter, showBismillah };
  });

  const getWordStyle = (w: LineWord): React.CSSProperties => {
    if (font === 'qcf_v2')
      return { fontFamily: `QCFPage${w.page_number}, 'UthmanicHafs', serif`, fontSize: sc.fs };
    if (font === 'indopak' && w.char_type_name !== 'end')
      return { fontFamily: "'IndoPakNastaleeq', 'UthmanicHafs', serif", fontSize: sc.fs };
    return { fontFamily: "'UthmanicHafs', serif", fontSize: sc.fs };
  };

  const getWordText = (w: LineWord): string => {
    if (font === 'qcf_v2' && fontReady) return w.code_v2 || w.text_qpc_hafs;
    if (w.char_type_name === 'end') {
      return `<span style="display:inline-flex;align-items:center;justify-content:center;width:2em;height:2em;border-radius:50%;border:1px solid currentColor;font-size:0.55em;line-height:1;margin:0 0.5em;vertical-align:middle">${w.text_qpc_hafs}</span>`;
    }
    if (font === 'indopak') return w.text_indopak || w.text_uthmani;
    return w.text_qpc_hafs || w.text_uthmani;
  };

  const reciterLabel = (r: Reciter) =>
    r.style ? `${r.reciter_name ?? r.name} — ${r.style}` : (r.reciter_name ?? r.name ?? 'Unknown');

  return (
    <div className="w-full space-y-4 select-none">
      {/* ── Top bar ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center min-w-0 gap-2">
          <span className="text-sm font-medium truncate text-foreground">
            {pageChapterNames.length > 0 ? pageChapterNames.join(' · ') : (chapterName ?? '')}
          </span>
          {pageJuzNumbers.length > 0 && (
            <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-card border border-border text-muted-foreground">
              Juz {pageJuzNumbers.join(', ')}
            </span>
          )}
          {pageHizbNumbers.length > 0 && (
            <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-card border border-border text-muted-foreground">
              Hizb {pageHizbNumbers.join(', ')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-muted-foreground tabular-nums">
            {page} / {TOTAL_PAGES}
          </span>

          {/* Settings popover */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setSettingsOpen((o) => !o)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                settingsOpen
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
              )}
            >
              <Settings2 className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {settingsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 z-50 w-64 p-4 mt-2 space-y-4 border shadow-xl top-full rounded-xl border-border bg-card card-highlight"
                >
                  {/* Script */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Script</p>
                    <div className="flex gap-1.5">
                      {FONT_OPTIONS.map((o) => (
                        <button
                          key={o.id}
                          onClick={() => setFont(o.id)}
                          className={cn(
                            'flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                            font === o.id
                              ? 'border-accent bg-accent/10 text-foreground'
                              : 'border-border text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Theme */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Theme</p>
                    <div className="flex gap-1.5">
                      {THEME_OPTIONS.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTheme(t.id)}
                          className={cn(
                            'flex-1 py-2 rounded-lg border text-xs font-semibold transition-all',
                            theme === t.id
                              ? 'ring-1 ring-accent ring-offset-1 ring-offset-card'
                              : 'opacity-70 hover:opacity-100'
                          )}
                          style={{ background: t.bg, color: t.text, borderColor: t.border }}
                        >
                          {theme === t.id ? <Check className="w-3 h-3 mx-auto" /> : t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Size */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Size</p>
                    <div className="flex gap-1.5">
                      {SIZE_OPTIONS.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSize(s.id)}
                          className={cn(
                            'flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                            size === s.id
                              ? 'border-accent bg-accent/10 text-foreground'
                              : 'border-border text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {s.id === 'sm' ? 'Small' : s.id === 'md' ? 'Medium' : 'Large'}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Page + side arrows ────────────────────────────────────── */}
      <div className="relative flex items-start justify-center gap-3">
        {/* In RTL Quran reading: left button = next page (forward), right button = prev page (back) */}
        <button
          onClick={() => goTo(page + 1)}
          disabled={page >= TOTAL_PAGES}
          className="items-center justify-center hidden mt-24 transition-colors border md:flex shrink-0 w-9 h-9 rounded-xl border-border bg-card hover:bg-accent/10 text-muted-foreground hover:text-foreground disabled:opacity-20 card-highlight"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Mushaf page */}
        <div
          className="w-full rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.35)] min-h-[60vh]"
          style={{ background: tc.bg, border: `1px solid ${tc.border}` }}
          onTouchStart={(e) => {
            touchX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            // RTL: swipe left (dx < 0) = flip forward = page+1; swipe right = page-1
            if (Math.abs(dx) > 48) goTo(dx < 0 ? page + 1 : page - 1);
            touchX.current = null;
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: tc.text, opacity: 0.35 }} />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${page}-${font}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="px-6 py-8"
                dir="rtl"
              >
                {enrichedLines.map(({ ln, words, showBismillah }) => (
                  <Fragment key={ln}>
                    {showBismillah && (
                      <div className="my-4 flex flex-col items-center gap-1.5 select-none">
                        <div className="flex items-center gap-2 w-full max-w-[220px]">
                          <div
                            className="flex-1 h-px"
                            style={{
                              background: `linear-gradient(to right, transparent, ${tc.text}55)`
                            }}
                          />
                          <span style={{ color: tc.text, opacity: 0.6, fontSize: 8 }}>✦</span>
                          <div
                            className="flex-1 h-px"
                            style={{
                              background: `linear-gradient(to left, transparent, ${tc.text}55)`
                            }}
                          />
                        </div>
                        <p
                          className="text-center"
                          style={{
                            fontFamily: "'UthmanicHafs', 'Amiri', serif",
                            color: tc.text,
                            fontSize: '1.35rem',
                            lineHeight: 2.2,
                            textShadow: `0 0 32px ${tc.text}30`
                          }}
                        >
                          بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                        </p>
                        <div className="flex items-center gap-2 w-full max-w-[220px]">
                          <div
                            className="flex-1 h-px"
                            style={{
                              background: `linear-gradient(to right, transparent, ${tc.text}55)`
                            }}
                          />
                          <span style={{ color: tc.text, opacity: 0.4, fontSize: 6 }}>◆ ◆ ◆</span>
                          <div
                            className="flex-1 h-px"
                            style={{
                              background: `linear-gradient(to left, transparent, ${tc.text}55)`
                            }}
                          />
                        </div>
                      </div>
                    )}
                    <div
                      className="flex items-baseline justify-center"
                      style={{ lineHeight: sc.lh }}
                    >
                      {words.map((w, wi) => {
                        const tajweedColor = isTajweed
                          ? getWordTajweedColor(w.text_uthmani_tajweed)
                          : null;
                        return (
                          <span
                            key={`${w.verseKey}-${w.position}-${wi}`}
                            onClick={() =>
                              activeVerse === w.verseKey
                                ? setIsPlaying((p) => !p)
                                : playVerse(w.verseKey)
                            }
                            className="cursor-pointer transition-colors duration-100 px-[1px]"
                            style={{
                              ...getWordStyle(w),
                              color:
                                activeVerse === w.verseKey ? tc.active : (tajweedColor ?? tc.text)
                            }}
                            dangerouslySetInnerHTML={{ __html: getWordText(w) }}
                          />
                        );
                      })}
                    </div>
                  </Fragment>
                ))}
                {!verses.length && (
                  <p className="py-16 text-sm text-center" style={{ color: tc.text, opacity: 0.4 }}>
                    No content found.
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Right button = prev page in RTL */}
        <button
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          className="items-center justify-center hidden mt-24 transition-colors border md:flex shrink-0 w-9 h-9 rounded-xl border-border bg-card hover:bg-accent/10 text-muted-foreground hover:text-foreground disabled:opacity-20 card-highlight"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile page navigation — RTL: Next is left, Prev is right */}
      <div className="flex items-center justify-center gap-4 md:hidden">
        <button
          onClick={() => goTo(page + 1)}
          disabled={page >= TOTAL_PAGES}
          className="flex items-center gap-1 px-4 py-2 text-sm transition-colors border rounded-lg border-border text-muted-foreground hover:text-foreground hover:bg-accent/10 disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" /> Next
        </button>
        <span className="text-sm text-muted-foreground tabular-nums">{page}</span>
        <button
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          className="flex items-center gap-1 px-4 py-2 text-sm transition-colors border rounded-lg border-border text-muted-foreground hover:text-foreground hover:bg-accent/10 disabled:opacity-30"
        >
          Prev <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── Audio bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 border rounded-2xl border-border bg-card card-highlight">

        {/* Left: reciter */}
        <div className="flex-1 min-w-0 hidden sm:block">
          {reciters.length > 0 ? (
            <select
              value={reciterId}
              onChange={(e) => {
                setReciterId(Number(e.target.value));
                setIsPlaying(false);
                setCurrentVerse(null);
                setActiveVerse(null);
              }}
              className="bg-transparent text-xs text-muted-foreground border-none p-0 focus:ring-0 cursor-pointer hover:text-foreground transition-colors w-full truncate"
            >
              {reciters.map((r) => (
                <option key={r.id} value={r.id} className="bg-card text-foreground">
                  {reciterLabel(r)}
                </option>
              ))}
            </select>
          ) : (
            <div className="h-4 w-24 rounded bg-border/40 animate-pulse" />
          )}
        </div>

        {/* Centre: controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={skipPrev}
            disabled={curIdx <= 0}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors disabled:opacity-30"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() =>
              !currentVerse && audioFiles.length
                ? playVerse(audioFiles[0].verse_key)
                : setIsPlaying((p) => !p)
            }
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 transition-colors shadow-sm"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 translate-x-px" />
            )}
          </button>
          <button
            onClick={skipNext}
            disabled={curIdx >= audioFiles.length - 1}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors disabled:opacity-30"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Right: verse key + mute */}
        <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
          <span className="text-xs text-muted-foreground tabular-nums truncate">
            {audioLoading ? (
              <Loader2 className="w-3 h-3 animate-spin inline" />
            ) : (
              currentVerse ?? 'tap a verse'
            )}
          </span>
          <button
            onClick={() => setIsMuted((m) => !m)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors shrink-0"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onVerseEnd}
        onError={() => setIsPlaying(false)}
      />
    </div>
  );
}
