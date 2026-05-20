'use client';

import { useRef, useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, X, ChevronDown } from 'lucide-react';
import { useStore } from '@/store/use-store';
import { fetchVerseReciters, fetchVerseAudioFiles, fetchChapters } from '@/lib/quran-api';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

const VERSE_AUDIO_BASE = 'https://verses.quran.com';

function reciterLabel(r: any): string {
  const name = r.reciter_name || r.name || 'Unknown';
  return r.style ? `${name} — ${r.style}` : name;
}

export function AudioPlayer() {
  const {
    isAudioPlaying,
    setAudioPlaying,
    isAudioActive,
    setAudioActive,
    currentReciter,
    setCurrentReciter,
    currentChapterId,
    setCurrentChapterId,
    currentVerseKey,
    setCurrentVerseKey,
    audioRepeatMode,
    setAudioRepeatMode,
    audioRangeStart,
    setAudioRangeStart,
    audioRangeEnd,
    setAudioRangeEnd
  } = useStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingBismillah, setPlayingBismillah] = useState(false);
  const [showRange, setShowRange] = useState(false);

  const { data: reciterData } = useQuery({
    queryKey: ['verse-reciters'],
    queryFn: fetchVerseReciters,
    staleTime: Infinity
  });
  const reciters: any[] = reciterData?.reciters ?? [];

  const { data: chapters = [] } = useQuery({
    queryKey: ['chapters'],
    queryFn: () => fetchChapters(),
    staleTime: Infinity
  });
  const currentChapter = (chapters as any[]).find((c) => c.id === currentChapterId);

  const { data: verseAudioFiles = [] } = useQuery({
    queryKey: ['verse-audio-files', currentReciter, currentChapterId],
    queryFn: () => fetchVerseAudioFiles(currentReciter, currentChapterId),
    enabled: isAudioActive
  });
  const files = verseAudioFiles as any[];

  // Verse 1:1 from selected reciter = bismillah audio
  const { data: bismillahFiles = [] } = useQuery({
    queryKey: ['verse-audio-files', currentReciter, 1],
    queryFn: () => fetchVerseAudioFiles(currentReciter, 1),
    staleTime: Infinity,
    enabled: isAudioActive
  });
  const bismillahUrl = (bismillahFiles as any[])[0]?.url
    ? `${VERSE_AUDIO_BASE}/${(bismillahFiles as any[])[0].url}`
    : null;

  // Set first verse once audio files are ready
  useEffect(() => {
    if (!isAudioActive || currentVerseKey || playingBismillah || files.length === 0) return;

    const startKey =
      audioRangeStart && files.some((f) => f.verse_key === audioRangeStart)
        ? audioRangeStart
        : files[0].verse_key;

    const isFromBeginning = startKey === files[0].verse_key;
    if (isFromBeginning && currentChapter?.bismillah_pre) {
      setPlayingBismillah(true);
    } else {
      setCurrentVerseKey(startKey);
    }
  }, [isAudioActive, currentVerseKey, playingBismillah, files, audioRangeStart, currentChapter]);

  const currentFile = files.find((f) => f.verse_key === currentVerseKey);
  const verseUrl = currentFile ? `${VERSE_AUDIO_BASE}/${currentFile.url}` : null;
  const audioUrl = playingBismillah ? bismillahUrl : verseUrl;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isAudioPlaying && audioUrl) audio.play().catch(console.error);
    else audio.pause();
  }, [isAudioPlaying, audioUrl]);

  const getRangeFiles = () => {
    if (!audioRangeStart && !audioRangeEnd) return files;
    const startIdx = audioRangeStart ? files.findIndex((f) => f.verse_key === audioRangeStart) : 0;
    const endIdx = audioRangeEnd
      ? files.findIndex((f) => f.verse_key === audioRangeEnd)
      : files.length - 1;
    return files.slice(
      startIdx === -1 ? 0 : startIdx,
      (endIdx === -1 ? files.length - 1 : endIdx) + 1
    );
  };

  const handleEnded = () => {
    if (playingBismillah) {
      setPlayingBismillah(false);
      const rangeFiles = getRangeFiles();
      setCurrentVerseKey(rangeFiles[0]?.verse_key ?? files[0]?.verse_key ?? null);
      return;
    }

    // Repeat single verse
    if (audioRepeatMode === 'verse') {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      }
      return;
    }

    const rangeFiles = getRangeFiles();
    const idx = rangeFiles.findIndex((f) => f.verse_key === currentVerseKey);
    const next = rangeFiles[idx + 1];

    if (next) {
      setCurrentVerseKey(next.verse_key);
      return;
    }

    // End of range/selection
    if (audioRepeatMode === 'selection') {
      const first = rangeFiles[0];
      if (!first) return;
      const isFromBeginning = first.verse_key === files[0]?.verse_key;
      if (isFromBeginning && currentChapter?.bismillah_pre) {
        setCurrentVerseKey(null);
        setPlayingBismillah(true);
      } else {
        setCurrentVerseKey(first.verse_key);
      }
      return;
    }

    // Advance to next chapter if no hard end constraint
    if (!audioRangeEnd && currentChapterId < 114) {
      const nextId = currentChapterId + 1;
      const nextChapter = (chapters as any[]).find((c) => c.id === nextId);
      setCurrentChapterId(nextId);
      setCurrentVerseKey(null);
      setAudioRangeStart(null);
      setAudioRangeEnd(null);
      if (nextChapter?.bismillah_pre) setPlayingBismillah(true);
    } else {
      setAudioPlaying(false);
    }
  };

  const prevVerse = () => {
    if (playingBismillah) {
      setPlayingBismillah(false);
      return;
    }
    const rangeFiles = getRangeFiles();
    const idx = rangeFiles.findIndex((f) => f.verse_key === currentVerseKey);
    if (idx > 0) {
      setCurrentVerseKey(rangeFiles[idx - 1].verse_key);
    } else if (!audioRangeStart && currentChapterId > 1) {
      setCurrentChapterId(currentChapterId - 1);
      setCurrentVerseKey(null);
      setAudioRangeStart(null);
      setAudioRangeEnd(null);
    }
  };

  const nextVerse = () => {
    if (playingBismillah) {
      setPlayingBismillah(false);
      const rangeFiles = getRangeFiles();
      setCurrentVerseKey(rangeFiles[0]?.verse_key ?? null);
      return;
    }
    const rangeFiles = getRangeFiles();
    const idx = rangeFiles.findIndex((f) => f.verse_key === currentVerseKey);
    const next = rangeFiles[idx + 1];
    if (next) {
      setCurrentVerseKey(next.verse_key);
    } else if (!audioRangeEnd && currentChapterId < 114) {
      const nextId = currentChapterId + 1;
      const nextChapter = (chapters as any[]).find((c) => c.id === nextId);
      setCurrentChapterId(nextId);
      setCurrentVerseKey(null);
      setAudioRangeStart(null);
      setAudioRangeEnd(null);
      if (nextChapter?.bismillah_pre) setPlayingBismillah(true);
    }
  };

  const handleClose = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = '';
    }
    setPlayingBismillah(false);
    setAudioPlaying(false);
    setAudioActive(false);
    setCurrentVerseKey(null);
    setAudioRangeStart(null);
    setAudioRangeEnd(null);
    setAudioRepeatMode('none');
  };

  const verseCount = files.length;
  const rangeStartNum = audioRangeStart ? Number(audioRangeStart.split(':')[1]) : 1;
  const rangeEndNum = audioRangeEnd ? Number(audioRangeEnd.split(':')[1]) : verseCount;

  const nowPlayingLabel = playingBismillah
    ? 'Bismillah'
    : (currentVerseKey ?? `Surah ${currentChapterId}`);

  return (
    <div className="w-full">
      <audio
        key={`${playingBismillah ? 'bismillah' : (currentVerseKey ?? 'none')}-${currentReciter}`}
        ref={audioRef}
        src={audioUrl ?? undefined}
        onEnded={handleEnded}
        autoPlay={isAudioPlaying && !!audioUrl}
      />

      {/* Main controls row */}
      <div className="flex items-center gap-2 px-4 py-3">
        {/* Close */}
        <button
          onClick={handleClose}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary transition-colors shrink-0"
          title="Close player"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Now playing info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {nowPlayingLabel}
            {!playingBismillah && currentChapter && (
              <span className="font-normal text-muted-foreground">
                {' '}
                · {currentChapter.name_simple}
              </span>
            )}
          </p>
          {reciters.length > 0 ? (
            <select
              value={currentReciter}
              onChange={(e) => setCurrentReciter(Number(e.target.value))}
              className="bg-transparent text-xs text-muted-foreground border-none p-0 focus:ring-0 cursor-pointer hover:text-foreground transition-colors max-w-[200px] truncate"
            >
              {reciters.map((r: any) => (
                <option key={r.id} value={r.id} className="bg-card text-foreground text-xs">
                  {reciterLabel(r)}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-muted-foreground">Loading reciters…</p>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Repeat verse */}
          <button
            onClick={() => setAudioRepeatMode(audioRepeatMode === 'verse' ? 'none' : 'verse')}
            className={cn(
              'p-2 rounded-lg transition-colors',
              audioRepeatMode === 'verse'
                ? 'text-accent bg-accent/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-primary'
            )}
            title="Repeat verse"
          >
            <Repeat1 className="w-3.5 h-3.5" />
          </button>

          {/* Repeat selection */}
          <button
            onClick={() =>
              setAudioRepeatMode(audioRepeatMode === 'selection' ? 'none' : 'selection')
            }
            className={cn(
              'p-2 rounded-lg transition-colors',
              audioRepeatMode === 'selection'
                ? 'text-accent bg-accent/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-primary'
            )}
            title="Repeat selection"
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>

          {/* Range toggle */}
          <button
            onClick={() => setShowRange((v) => !v)}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
              audioRangeStart || audioRangeEnd
                ? 'text-accent bg-accent/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-primary'
            )}
            title="Set verse range"
          >
            {audioRangeStart || audioRangeEnd ? `${rangeStartNum}–${rangeEndNum}` : 'All'}
            <ChevronDown
              className={cn('w-3 h-3 transition-transform', showRange && 'rotate-180')}
            />
          </button>

          <div className="w-px h-5 bg-border mx-0.5 shrink-0" />

          {/* Prev verse */}
          <button
            onClick={prevVerse}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-primary"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          {/* Play / Pause */}
          <button
            onClick={() => setAudioPlaying(!isAudioPlaying)}
            className="w-8 h-8 rounded-lg bg-accent text-accent-foreground flex items-center justify-center hover:bg-accent/90 transition-colors"
          >
            {isAudioPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current ml-px" />
            )}
          </button>

          {/* Next verse */}
          <button
            onClick={nextVerse}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-primary"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Range picker (expanded) */}
      {showRange && verseCount > 0 && (
        <div className="flex items-center gap-3 px-4 pb-3 pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground shrink-0">From verse</span>
          <select
            value={rangeStartNum}
            onChange={(e) => {
              const v = Number(e.target.value);
              const newKey = `${currentChapterId}:${v}`;
              setAudioRangeStart(v === 1 ? null : newKey);
              if (files.some((f) => f.verse_key === newKey)) setCurrentVerseKey(newKey);
            }}
            className="bg-primary border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {Array.from({ length: verseCount }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

          <span className="text-xs text-muted-foreground shrink-0">to</span>

          <select
            value={rangeEndNum}
            onChange={(e) => {
              const v = Number(e.target.value);
              setAudioRangeEnd(v === verseCount ? null : `${currentChapterId}:${v}`);
            }}
            className="bg-primary border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {Array.from({ length: verseCount }, (_, i) => i + 1)
              .filter((n) => n >= rangeStartNum)
              .map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
          </select>

          {(audioRangeStart || audioRangeEnd) && (
            <button
              onClick={() => {
                setAudioRangeStart(null);
                setAudioRangeEnd(null);
              }}
              className="text-xs text-muted-foreground hover:text-accent transition-colors shrink-0"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function FloatingAudioPlayer() {
  return null;
}
