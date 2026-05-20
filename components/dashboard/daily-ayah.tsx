'use client';

import { useQuery } from '@tanstack/react-query';
import { getRandomVerse } from '@/lib/quran-api';
import { GlassCard } from '@/components/ui/glass-card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { BookOpen, Share2, Heart } from 'lucide-react';

export function DailyAyah() {
  const {
    data: verse,
    isLoading,
    error
  } = useQuery({
    queryKey: ['randomVerse'],
    queryFn: () => getRandomVerse(),
    staleTime: 1000 * 60 * 60 * 24 // 24 hours
  });

  if (isLoading) return <Skeleton className="h-[300px] w-full rounded-3xl" />;
  if (error || !verse) return null;

  return (
    <GlassCard className="p-8 md:p-10 space-y-6 overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 transition-opacity">
        <BookOpen className="w-12 h-12 text-accent" />
      </div>

      <div className="space-y-4">
        <span className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold tracking-widest uppercase">
          Ayah of the Day
        </span>
        <p className="font-arabic text-3xl md:text-4xl text-right leading-[1.8] text-primary">
          {verse.text_uthmani}
        </p>
      </div>

      <div className="space-y-4 border-t border-white/10 pt-6">
        <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-medium">
          {verse.translations?.[0]?.text.replace(/<[^>]*>?/gm, '')}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-accent">{verse.verse_key}</span>
          <div className="flex gap-4">
            <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <Heart className="w-5 h-5 text-foreground/40 hover:text-rose-500" />
            </button>
            <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <Share2 className="w-5 h-5 text-foreground/40" />
            </button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
