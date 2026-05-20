'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchChapterAudio, fetchChapters, fetchReciters } from '@/lib/quran-api';
import { Navbar } from '@/components/layout/navbar';
import { Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

type ReciterOption = {
  id: number;
  reciter_name?: string;
  name?: string;
  style?: { name?: string; description?: string } | string | null;
};

export default function RecitationPage() {
  const [reciterId, setReciterId] = useState<number | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: reciters = [] } = useQuery({
    queryKey: ['chapter-reciters'],
    queryFn: () => fetchReciters(),
    staleTime: Infinity
  });

  const { data: chapters = [] } = useQuery({
    queryKey: ['chapters'],
    queryFn: () => fetchChapters(),
    staleTime: Infinity
  });

  useEffect(() => {
    if (reciters.length > 0 && reciterId === null) {
      setReciterId((reciters as ReciterOption[])[0].id);
    }
  }, [reciters, reciterId]);

  const { data: audioFile, isFetching: isLoadingAudio } = useQuery({
    queryKey: ['chapter-audio', reciterId, playingId],
    queryFn: () => fetchChapterAudio(reciterId!, playingId!),
    enabled: reciterId !== null && playingId !== null
  });

  const audioUrl: string | undefined = audioFile?.audio_url;

  // Drive the audio element from state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isPlaying || !audioUrl) {
      audio.pause();
      return;
    }

    if (audio.src !== audioUrl) {
      audio.src = audioUrl;
      audio.load();
    }

    audio.play().catch((err) => {
      if (err.name !== 'AbortError') setIsPlaying(false);
    });
  }, [isPlaying, audioUrl]);

  const handlePlay = (chapterId: number) => {
    if (playingId === chapterId) {
      setIsPlaying((p) => !p);
    } else {
      setPlayingId(chapterId);
      setIsPlaying(true);
    }
  };

  const handleReciterChange = (id: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = '';
    }
    setIsPlaying(false);
    setPlayingId(null);
    setReciterId(id);
  };

  const playingChapter = chapters.find((c) => c.id === playingId);

  return (
    <div className="min-h-screen pb-20 bg-background">
      <Navbar />
      <main className="max-w-3xl px-6 pt-24 pb-24 mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Recitation</h1>
            <p className="text-muted-foreground">
              Listen to the full Quran with your chosen reciter.
            </p>
          </div>

          {reciters.length > 0 && reciterId !== null ? (
            <select
              value={reciterId}
              onChange={(e) => handleReciterChange(Number(e.target.value))}
              className="px-4 py-2.5 rounded-xl border border-border bg-primary text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent min-w-[240px]"
            >
              {(reciters as ReciterOption[]).map((r) => (
                <option key={r.id} value={r.id} className="bg-card text-foreground">
                  {r.reciter_name ?? r.name ?? 'Unknown'}
                  {r.style ? ` — ${typeof r.style === 'object' ? r.style.name : r.style}` : ''}
                </option>
              ))}
            </select>
          ) : (
            <div className="h-10 w-60 rounded-xl bg-card border border-border animate-pulse" />
          )}
        </div>

        {/* Chapter list */}
        <div className="flex flex-col divide-y divide-border border border-border rounded-xl overflow-hidden">
          {chapters.length === 0
            ? Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="h-16 bg-card animate-pulse" />
              ))
            : chapters.map((chapter) => {
                const isActive = playingId === chapter.id;
                const isCurrentlyPlaying = isActive && isPlaying;

                return (
                  <button
                    key={chapter.id}
                    onClick={() => handlePlay(chapter.id)}
                    className={cn(
                      'flex items-center gap-4 px-4 py-3.5 text-left transition-colors w-full',
                      isActive ? 'bg-accent/8' : 'bg-card hover:bg-primary'
                    )}
                  >
                    {/* Play/pause icon */}
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                        isActive
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-primary border border-border text-muted-foreground'
                      )}
                    >
                      {isCurrentlyPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      )}
                    </div>

                    {/* Chapter number */}
                    <span className="text-xs text-muted-foreground w-6 text-right shrink-0">
                      {chapter.id}
                    </span>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm font-semibold',
                          isActive ? 'text-accent' : 'text-foreground'
                        )}
                      >
                        {chapter.name_simple}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {chapter.revelation_place} · {chapter.verses_count} verses
                      </p>
                    </div>

                    {/* Arabic name */}
                    <p
                      className={cn(
                        'text-xl font-arabic shrink-0',
                        isActive ? 'text-accent' : 'text-muted-foreground'
                      )}
                    >
                      {chapter.name_arabic}
                    </p>
                  </button>
                );
              })}
        </div>
      </main>

      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onError={() => setIsPlaying(false)}
      />

      {/* Fixed bottom now-playing bar */}
      {playingId !== null && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-accent/30 bg-background/95 backdrop-blur-sm px-6 py-3.5">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full bg-accent shrink-0',
                isPlaying ? 'animate-pulse' : 'opacity-50'
              )}
            />
            <p className="text-sm font-medium text-accent flex-1 truncate">
              {isPlaying ? (isLoadingAudio ? 'Loading…' : 'Playing') : 'Paused'} ·{' '}
              {playingChapter?.name_simple}
            </p>
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className="w-8 h-8 rounded-lg bg-accent text-accent-foreground flex items-center justify-center hover:bg-accent/90 transition-colors shrink-0"
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current ml-px" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
