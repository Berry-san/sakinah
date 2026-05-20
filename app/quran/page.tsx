'use client';

import {
  useAddQFBookmark,
  useDeleteQFBookmark,
  useLogActivity,
  useQFBookmarks,
  useUpdateReadingSession
} from '@/apiService/quranFoundationService/hooks';
import { Navbar } from '@/components/layout/navbar';
import { MushafPageView } from '@/components/quran/mushaf-page-view';
import { TajweedLegend } from '@/components/quran/tajweed-legend';
import { TajweedVerse } from '@/components/quran/tajweed-text';
import { VerseDetailModal } from '@/components/ui/verse-detail-modal';
import { useAuth } from '@/lib/auth-context';
import {
  fetchChapters,
  fetchJuzs,
  fetchVersesByChapter,
  fetchVersesByHizb,
  fetchVersesByJuz,
  fetchVersesForPageBrowse
} from '@/lib/quran-api';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/use-store';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookMarked,
  BookOpen,
  BookText,
  ChevronLeft,
  Info,
  Languages,
  Layers,
  LayoutGrid,
  List,
  Play,
  Sparkles
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Fragment, useEffect, useRef, useState } from 'react';

function verseKeysToRanges(keys: string[]): string[] {
  if (keys.length === 0) return [];
  const sorted = [...keys].sort((a, b) => {
    const [ac, av] = a.split(':').map(Number);
    const [bc, bv] = b.split(':').map(Number);
    return ac !== bc ? ac - bc : av - bv;
  });
  const ranges: string[] = [];
  let start = sorted[0];
  let end = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const [pc, pv] = end.split(':').map(Number);
    const [cc, cv] = sorted[i].split(':').map(Number);
    if (cc === pc && cv === pv + 1) {
      end = sorted[i];
    } else {
      ranges.push(`${start}-${end}`);
      start = sorted[i];
      end = sorted[i];
    }
  }
  ranges.push(`${start}-${end}`);
  return ranges;
}

export default function QuranPage() {
  const {
    currentChapterId,
    setCurrentChapterId,
    currentVerseKey,
    setAudioActive,
    setAudioPlaying
  } = useStore();
  const { isAuthenticated } = useAuth();
  const { mutate: logActivity } = useLogActivity();
  const { mutate: updateSession } = useUpdateReadingSession();
  const searchParams = useSearchParams();
  const jumpVerse = searchParams.get('verse');
  const [browseMode, setBrowseMode] = useState<'surah' | 'juz' | 'hizb' | 'page'>('surah');
  const [isReading, setIsReading] = useState(!!jumpVerse);
  const [selectedChapterId, setSelectedChapterId] = useState(() => {
    if (jumpVerse) return Number(jumpVerse.split(':')[0]);
    return currentChapterId || 1;
  });
  const [selectedJuzId, setSelectedJuzId] = useState(1);
  const [selectedHizbId, setSelectedHizbId] = useState(1);
  const [selectedPageId, setSelectedPageId] = useState(1);
  const [displayMode, setDisplayMode] = useState<'pure' | 'full'>('full');
  const [isTajweed, setIsTajweed] = useState(false);
  const [detailVerseKey, setDetailVerseKey] = useState<string | null>(null);

  const seenVersesRef = useRef(new Set<string>());
  const readingSecondsRef = useRef(0);

  useEffect(() => {
    if (browseMode === 'surah') setCurrentChapterId(selectedChapterId);
  }, [selectedChapterId, browseMode, setCurrentChapterId]);

  // Count seconds while the reader is open and the tab is visible
  useEffect(() => {
    if (!isReading || !isAuthenticated) return;
    const tick = setInterval(() => {
      if (!document.hidden) readingSecondsRef.current += 5;
    }, 5000);
    return () => clearInterval(tick);
  }, [isReading, isAuthenticated]);

  // Flush activity every 30 s
  useEffect(() => {
    if (!isReading || !isAuthenticated) return;
    const flush = setInterval(() => {
      if (readingSecondsRef.current < 5 || seenVersesRef.current.size === 0) return;
      const ranges = verseKeysToRanges([...seenVersesRef.current]);
      logActivity({ seconds: readingSecondsRef.current, ranges });
      readingSecondsRef.current = 0;
      seenVersesRef.current.clear();
    }, 30_000);
    return () => clearInterval(flush);
  }, [isReading, isAuthenticated, logActivity]);

  // Track current verse key for ranges
  useEffect(() => {
    if (currentVerseKey) seenVersesRef.current.add(currentVerseKey);
  }, [currentVerseKey]);

  // Sync reading position to cloud (debounced via 2 s delay)
  useEffect(() => {
    if (!currentVerseKey || !isAuthenticated) return;
    const [chapter, verse] = currentVerseKey.split(':').map(Number);
    const t = setTimeout(() => updateSession({ chapterNumber: chapter, verseNumber: verse }), 2000);
    return () => clearTimeout(t);
  }, [currentVerseKey, isAuthenticated, updateSession]);

  const { data: chapters } = useQuery({
    queryKey: ['chapters'],
    queryFn: () => fetchChapters()
  });

  const { data: juzs } = useQuery({
    queryKey: ['juzs'],
    queryFn: () => fetchJuzs()
  });

  const activeId =
    browseMode === 'surah'
      ? selectedChapterId
      : browseMode === 'juz'
        ? selectedJuzId
        : browseMode === 'hizb'
          ? selectedHizbId
          : selectedPageId;

  const { data: verses, isLoading: isVersesLoading } = useQuery({
    queryKey: ['verses', browseMode, activeId],
    queryFn: () => {
      const params = {
        translations: '20,57',
        per_page: 50,
        fields: 'text_uthmani',
        words: true,
        word_fields: 'text_uthmani,text_uthmani_tajweed,transliteration,char_type_name',
        mushaf: 1
      };
      if (browseMode === 'surah') return fetchVersesByChapter(selectedChapterId, params);
      if (browseMode === 'juz') return fetchVersesByJuz(selectedJuzId, params);
      if (browseMode === 'hizb') return fetchVersesByHizb(selectedHizbId, params);
      return fetchVersesForPageBrowse(selectedPageId, params);
    },
    enabled: isReading && !!activeId
  });

  const selectedChapter = chapters?.find((c) => c.id === selectedChapterId);

  const handleSelectChapter = (id: number) => {
    setSelectedChapterId(id);
    setIsReading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectJuz = (id: number) => {
    setSelectedJuzId(id);
    setIsReading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectHizb = (id: number) => {
    setSelectedHizbId(id);
    setIsReading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPage = (id: number) => {
    setSelectedPageId(id);
    setIsReading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      <Navbar />

      <main className="max-w-5xl px-6 pt-24 pb-24 mx-auto">
        <AnimatePresence mode="wait">
          {!isReading ? (
            <motion.div
              key="list-view"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="flex flex-col justify-between gap-6 pb-2 md:flex-row md:items-end">
                <div className="space-y-1">
                  <h1 className="text-4xl font-bold tracking-tight md:text-5xl">The Quran</h1>
                  <p className="text-muted-foreground">Browse by Surah, Juz, Hizb, or Page.</p>
                </div>

                {/* Segment control */}
                <div className="flex p-1 border bg-card rounded-xl border-border w-fit">
                  {(
                    [
                      { mode: 'surah', icon: List, label: 'Surahs' },
                      { mode: 'juz', icon: LayoutGrid, label: 'Juz' },
                      { mode: 'hizb', icon: Layers, label: 'Hizb' },
                      { mode: 'page', icon: BookText, label: 'Page' }
                    ] as const
                  ).map(({ mode, icon: Icon, label }) => (
                    <button
                      key={mode}
                      onClick={() => setBrowseMode(mode)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-lg',
                        browseMode === mode
                          ? 'bg-accent text-accent-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {browseMode === 'page' ? (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                  {Array.from({ length: 604 }, (_, i) => i + 1).map((p) => (
                    <PageCard
                      key={p}
                      pageNumber={p}
                      onClick={() => handleSelectPage(p)}
                      isSelected={selectedPageId === p}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {browseMode === 'surah'
                    ? chapters?.map((chapter) => (
                        <ChapterCard
                          key={chapter.id}
                          chapter={chapter}
                          onClick={() => handleSelectChapter(chapter.id)}
                          isSelected={selectedChapterId === chapter.id}
                        />
                      ))
                    : browseMode === 'juz'
                      ? juzs?.map((juz: any) => (
                          <JuzCard
                            key={juz.juz_number}
                            juz={juz}
                            onClick={() => handleSelectJuz(juz.juz_number)}
                            isSelected={selectedJuzId === juz.juz_number}
                          />
                        ))
                      : Array.from({ length: 60 }, (_, i) => i + 1).map((h) => (
                          <HizbCard
                            key={h}
                            hizbNumber={h}
                            onClick={() => handleSelectHizb(h)}
                            isSelected={selectedHizbId === h}
                          />
                        ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="reading-view"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="space-y-8"
            >
              {/* Reading header */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setIsReading(false)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  Back
                </button>

                <div className="flex items-center gap-2">
                  <div className="flex p-1 border bg-card rounded-xl border-border">
                    <button
                      onClick={() => {
                        setDisplayMode('pure');
                        setAudioActive(false);
                        setAudioPlaying(false);
                      }}
                      className={cn(
                        'flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium transition-all rounded-lg',
                        displayMode === 'pure'
                          ? 'bg-accent text-accent-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Mushaf
                    </button>
                    <button
                      onClick={() => {
                        setDisplayMode('full');
                        setAudioActive(false);
                        setAudioPlaying(false);
                      }}
                      className={cn(
                        'flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium transition-all rounded-lg',
                        displayMode === 'full'
                          ? 'bg-accent text-accent-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Languages className="w-3.5 h-3.5" />
                      Translation
                    </button>
                  </div>

                  <button
                    onClick={() => setIsTajweed((v) => !v)}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border transition-all',
                      isTajweed
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Tajweed
                  </button>
                </div>
              </div>

              {/* Chapter header */}
              <div className="py-10 space-y-3 text-center border-b border-border">
                <p className="text-sm font-medium text-accent">
                  {browseMode === 'surah'
                    ? `Surah ${selectedChapterId}`
                    : browseMode === 'juz'
                      ? `Juz ${selectedJuzId}`
                      : browseMode === 'hizb'
                        ? `Hizb ${selectedHizbId}`
                        : `Page ${selectedPageId}`}
                </p>
                <h1 className="text-5xl font-bold tracking-tight md:text-6xl">
                  {browseMode === 'surah'
                    ? selectedChapter?.name_simple
                    : browseMode === 'juz'
                      ? `Juz ${selectedJuzId}`
                      : browseMode === 'hizb'
                        ? `Hizb ${selectedHizbId}`
                        : `Page ${selectedPageId}`}
                </h1>
                {browseMode === 'surah' && selectedChapter?.name_arabic && (
                  <p className="mt-2 text-5xl font-arabic text-muted-foreground">
                    {selectedChapter.name_arabic}
                  </p>
                )}
              </div>

              {isTajweed && <TajweedLegend />}

              {displayMode === 'pure' ? (
                <MushafPageView
                  startPage={
                    browseMode === 'page' ? selectedPageId : (verses?.[0]?.page_number ?? 1)
                  }
                  chapterName={selectedChapter?.name_simple}
                  chapters={chapters}
                  isTajweed={isTajweed}
                />
              ) : (
                <>
                  <div className="py-4 space-y-0">
                    {isVersesLoading ? (
                      <div className="pt-8 space-y-6">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="w-full h-48 border rounded-2xl bg-card border-border animate-pulse"
                          />
                        ))}
                      </div>
                    ) : (
                      verses?.map((verse, i) => {
                        const chapterId = verse.chapter_id ?? Number(verse.verse_key.split(':')[0]);
                        const prevChapterId =
                          i > 0
                            ? (verses[i - 1].chapter_id ??
                              Number(verses[i - 1].verse_key.split(':')[0]))
                            : null;
                        const isNewChapter =
                          verse.verse_number === 1 && chapterId !== prevChapterId;
                        // Show surah header at the very first verse too, so juz/hizb/page modes
                        // always identify which surah we're reading even when starting mid-surah
                        const showSurahHeader = browseMode !== 'surah' && (i === 0 || isNewChapter);
                        const chapterMeta = chapters?.find((c) => c.id === chapterId);
                        const showBismillah = isNewChapter && (chapterMeta?.bismillah_pre ?? false);

                        return (
                          <Fragment key={verse.id}>
                            {showSurahHeader && (
                              <div className="pt-10 pb-6 mb-2 text-center border-b border-border">
                                <p className="mb-1 text-xs font-medium text-accent">
                                  Surah {chapterId}
                                </p>
                                <h3 className="text-2xl font-bold text-foreground">
                                  {chapterMeta?.name_simple ?? `Surah ${chapterId}`}
                                </h3>
                                {chapterMeta?.name_arabic && (
                                  <p className="mt-1 text-3xl font-arabic text-muted-foreground">
                                    {chapterMeta.name_arabic}
                                  </p>
                                )}
                              </div>
                            )}
                            {showBismillah && <Bismillah />}
                            <VerseCard
                              verse={verse}
                              isTajweed={isTajweed}
                              jumpTo={jumpVerse}
                              onOpenDetail={() => setDetailVerseKey(verse.verse_key)}
                            />
                          </Fragment>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <VerseDetailModal
        verseKey={detailVerseKey || ''}
        isOpen={!!detailVerseKey}
        onClose={() => setDetailVerseKey(null)}
      />
    </div>
  );
}

function Bismillah() {
  return (
    <div className="my-6 flex flex-col items-center gap-2 select-none">
      {/* Top ornament rule */}
      <div className="flex items-center gap-3 w-full max-w-xs">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-accent/50" />
        <span className="text-accent text-xs">✦</span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-accent/50" />
      </div>

      {/* Bismillah text */}
      <div className="relative px-8 py-3 text-center">
        <p
          dir="rtl"
          className="font-arabic text-3xl md:text-4xl leading-[2.2] text-accent tracking-wide"
          style={{ textShadow: '0 0 40px hsl(var(--accent) / 0.25)' }}
        >
          بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
        </p>
      </div>

      {/* Bottom ornament rule */}
      <div className="flex items-center gap-3 w-full max-w-xs">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-accent/50" />
        <span className="text-accent/60 text-[8px]">◆ ◆ ◆</span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-accent/50" />
      </div>
    </div>
  );
}

function ChapterCard({
  chapter,
  onClick,
  isSelected
}: {
  chapter: any;
  onClick: () => void;
  isSelected: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-left w-full p-5 rounded-xl border transition-all group',
        isSelected
          ? 'border-accent bg-accent/8'
          : 'border-border bg-card hover:border-accent/40 hover:bg-accent/5 card-highlight'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div
            className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0',
              isSelected
                ? 'bg-accent text-accent-foreground'
                : 'bg-card text-muted-foreground border border-border'
            )}
          >
            {chapter.id}
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">{chapter.name_simple}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {chapter.revelation_place} · {chapter.verses_count} verses
            </p>
          </div>
        </div>
        <p className="text-2xl transition-colors font-arabic text-muted-foreground group-hover:text-foreground">
          {chapter.name_arabic}
        </p>
      </div>
    </button>
  );
}

function JuzCard({
  juz,
  onClick,
  isSelected
}: {
  juz: any;
  onClick: () => void;
  isSelected: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-left w-full p-5 rounded-xl border transition-all group',
        isSelected
          ? 'border-accent bg-accent/8'
          : 'border-border bg-card hover:border-accent/40 hover:bg-accent/5 card-highlight'
      )}
    >
      <div className="flex items-center gap-3.5">
        <div
          className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0',
            isSelected
              ? 'bg-accent text-accent-foreground'
              : 'bg-card text-muted-foreground border border-border'
          )}
        >
          {juz.juz_number}
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">Juz {juz.juz_number}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {Object.keys(juz.verse_mapping).length} Surahs
          </p>
        </div>
      </div>
    </button>
  );
}

function VerseCard({
  verse,
  isTajweed,
  jumpTo,
  onOpenDetail
}: {
  verse: any;
  isTajweed: boolean;
  jumpTo?: string | null;
  onOpenDetail: () => void;
}) {
  const {
    currentVerseKey,
    isAudioPlaying,
    setAudioPlaying,
    setAudioActive,
    setCurrentChapterId,
    setCurrentVerseKey,
    bookmarks,
    addBookmark,
    removeBookmark
  } = useStore();
  const { isAuthenticated } = useAuth();
  const { data: qfBookmarks } = useQFBookmarks();
  const addQFBookmark = useAddQFBookmark();
  const deleteQFBookmark = useDeleteQFBookmark();

  const isBookmarked =
    isAuthenticated && qfBookmarks
      ? qfBookmarks.some((b) => b.key === verse.verse_key)
      : bookmarks.includes(verse.verse_key);

  const handleToggleBookmark = () => {
    if (isAuthenticated) {
      const qfBm = qfBookmarks?.find((b) => b.key === verse.verse_key);
      if (qfBm) {
        deleteQFBookmark.mutate(qfBm.id);
      } else {
        addQFBookmark.mutate(verse.verse_key);
      }
    } else {
      if (bookmarks.includes(verse.verse_key)) {
        removeBookmark(verse.verse_key);
      } else {
        addBookmark(verse.verse_key);
      }
    }
  };

  const isActive = isAudioPlaying && currentVerseKey === verse.verse_key;
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isActive]);

  useEffect(() => {
    if (jumpTo === verse.verse_key && cardRef.current) {
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const translation = verse.translations?.find((t: any) => t.resource_id === 20);
  const transliteration = verse.translations?.find((t: any) => t.resource_id === 57);

  return (
    <div
      ref={cardRef}
      className={cn(
        'py-10 border-b border-border last:border-0 transition-all duration-500',
        isActive && 'border-l-2 border-l-accent pl-6 -ml-6'
      )}
    >
      {/* Verse meta row */}
      <div className="flex items-center justify-between mb-8">
        <span
          className={cn(
            'inline-flex items-center justify-center w-8 h-8 rounded-full border text-xs font-medium',
            isActive ? 'border-accent text-accent' : 'border-border text-muted-foreground'
          )}
        >
          {verse.verse_number ?? verse.verse_key.split(':')[1]}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setCurrentChapterId(Number(verse.verse_key.split(':')[0]));
              setAudioActive(true);
              setAudioPlaying(true);
              setCurrentVerseKey(verse.verse_key);
            }}
            className={cn(
              'p-2 rounded-lg transition-all text-sm',
              isActive
                ? 'text-accent bg-accent/10'
                : 'text-muted-foreground hover:text-accent hover:bg-accent/10'
            )}
          >
            <Play className={cn('w-3.5 h-3.5 fill-current', isActive && 'animate-pulse')} />
          </button>
          <button
            onClick={handleToggleBookmark}
            className={cn(
              'p-2 rounded-lg transition-all',
              isBookmarked
                ? 'text-accent bg-accent/10'
                : 'text-muted-foreground hover:text-accent hover:bg-accent/10'
            )}
          >
            <BookMarked className={cn('w-3.5 h-3.5', isBookmarked && 'fill-current')} />
          </button>
          <button
            onClick={onOpenDetail}
            className="p-2 transition-all rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/10"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Arabic text */}
      {isTajweed && verse.words?.length > 0 ? (
        <TajweedVerse
          words={verse.words}
          className={cn('transition-colors duration-500', isActive ? 'text-accent' : '')}
        />
      ) : (
        <p
          className={cn(
            'font-arabic text-2xl md:text-4xl text-right leading-[2.2] md:leading-[2.5] transition-colors duration-500',
            isActive ? 'text-accent' : 'text-foreground'
          )}
        >
          {verse.text_uthmani || verse.text_qpc_hafs || '—'}
        </p>
      )}

      {/* Translation */}
      <div className="max-w-2xl mt-8 space-y-3">
        {transliteration && (
          <p className="text-base italic leading-relaxed text-accent/70">
            {transliteration.text.replace(/<[^>]*>?/gm, '')}
          </p>
        )}
        {translation && (
          <p className="text-lg leading-relaxed text-muted-foreground">
            {translation.text?.replace(/<[^>]*>?/gm, '') ?? ''}
          </p>
        )}
      </div>
    </div>
  );
}

function HizbCard({
  hizbNumber,
  onClick,
  isSelected
}: {
  hizbNumber: number;
  onClick: () => void;
  isSelected: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-left w-full p-5 rounded-xl border transition-all group',
        isSelected
          ? 'border-accent bg-accent/8'
          : 'border-border bg-card hover:border-accent/40 hover:bg-accent/5 card-highlight'
      )}
    >
      <div className="flex items-center gap-3.5">
        <div
          className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0',
            isSelected
              ? 'bg-accent text-accent-foreground'
              : 'bg-card text-muted-foreground border border-border'
          )}
        >
          {hizbNumber}
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">Hizb {hizbNumber}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quarters {(hizbNumber - 1) * 4 + 1}–{hizbNumber * 4}
          </p>
        </div>
      </div>
    </button>
  );
}

function PageCard({
  pageNumber,
  onClick,
  isSelected
}: {
  pageNumber: number;
  onClick: () => void;
  isSelected: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'py-2.5 rounded-lg border text-sm font-medium transition-all',
        isSelected
          ? 'border-accent bg-accent/8 text-accent'
          : 'border-border bg-card text-muted-foreground hover:border-accent/40 hover:text-foreground hover:bg-accent/5'
      )}
    >
      {pageNumber}
    </button>
  );
}
