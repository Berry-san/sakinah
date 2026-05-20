'use client';

import { QFWrappedData } from '@/apiService/quranFoundationService/types';
import { wrappedService } from '@/apiService/quranFoundationService/wrappedService';
import { GlassCard } from '@/components/ui/glass-card';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  ChevronRight,
  Clock,
  Flame,
  MessageSquare,
  Share2,
  Sparkles
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function WrappedPage() {
  const [data, setData] = useState<QFWrappedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    async function loadWrapped() {
      try {
        const insights = await wrappedService.getWrappedInsights();
        setData(insights);
      } catch (err) {
        console.error('Failed to load wrapped insights:', err);
        toast.error('Could not load your spiritual insights');
      } finally {
        setLoading(false);
      }
    }
    loadWrapped();
  }, []);

  const slides = [
    {
      title: 'Your Spiritual Journey',
      content: (data: any) => (
        <div className="space-y-6 text-center">
          <div className="relative inline-block">
            <div className="flex items-center justify-center w-32 h-32 rounded-full bg-accent/20 animate-pulse">
              <Sparkles className="w-16 h-16 text-accent" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-transparent md:text-6xl bg-gradient-to-r from-white to-white/40 bg-clip-text">
            Sakinah Wrapped 2024
          </h1>
          <p className="max-w-md mx-auto text-lg text-foreground/60">
            {data.profile.firstName}, you've been busy connecting with the Divine. Let's see your
            progress.
          </p>
        </div>
      )
    },
    {
      title: 'The Consistency King',
      content: (data: any) => (
        <div className="grid items-center grid-cols-1 gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-accent">
              <Flame className="w-6 h-6" />
              <span className="text-sm font-bold tracking-widest uppercase">Persistence</span>
            </div>
            <h2 className="text-5xl font-bold">Unstoppable.</h2>
            <p className="text-lg text-foreground/60">
              You maintained a streak of{' '}
              <span className="font-bold text-white">{data.currentStreak} days</span>. Your longest
              ever?{' '}
              <span className="font-bold text-accent">{data.longestStreak?.count || 0} days</span>.
            </p>
          </div>
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-accent/20 blur-3xl" />
            <div className="relative text-[120px] font-black text-center text-accent/80 select-none">
              {data.currentStreak}
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Depth of Knowledge',
      content: (data: any) => (
        <div className="grid grid-cols-2 gap-4">
          <GlassCard className="p-8 space-y-4 text-center">
            <BookOpen className="w-8 h-8 mx-auto text-primary" />
            <div className="text-4xl font-bold">{data.profile.statistics.totalPagesRead}</div>
            <div className="text-xs font-bold tracking-widest uppercase text-foreground/40">
              Pages Read
            </div>
          </GlassCard>
          <GlassCard className="p-8 space-y-4 text-center">
            <Clock className="w-8 h-8 mx-auto text-accent" />
            <div className="text-4xl font-bold">
              {(data.profile.statistics.totalSecondsRead / 3600).toFixed(1)}h
            </div>
            <div className="text-xs font-bold tracking-widest uppercase text-foreground/40">
              Total Time
            </div>
          </GlassCard>
          <GlassCard className="col-span-2 p-8 space-y-4 text-center">
            <MessageSquare className="w-8 h-8 mx-auto text-secondary" />
            <div className="text-4xl font-bold">{data.profile.statistics.reflectionsCount}</div>
            <div className="text-xs font-bold tracking-widest uppercase text-foreground/40">
              Heart-felt Reflections
            </div>
          </GlassCard>
        </div>
      )
    },
    {
      title: 'Your Spiritual Peak',
      content: (data: any) => (
        <div className="space-y-8 text-center">
          <div className="space-y-2">
            <div className="text-sm font-bold tracking-widest uppercase text-accent">
              Peak Momentum
            </div>
            <h2 className="text-4xl font-bold md:text-5xl">{data.topMonth} was your month.</h2>
          </div>
          <p className="max-w-lg mx-auto text-lg text-foreground/60">
            You were most connected to the Quran in {data.topMonth}. Your most active day was{' '}
            <span className="font-bold text-white">
              {new Date(data.mostActiveDay).toLocaleDateString('default', {
                month: 'short',
                day: 'numeric'
              })}
            </span>
            .
          </p>
          <div className="flex justify-center gap-4">
            <button className="flex items-center gap-2 px-6 py-3 font-bold text-black transition-transform bg-white rounded-full hover:scale-105">
              <Share2 className="w-4 h-4" />
              Share My Wrapped
            </button>
          </div>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-2 rounded-full border-accent border-t-transparent animate-spin" />
        <p className="font-medium text-foreground/40 animate-pulse">
          Calculating your spiritual insights...
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-4xl px-6 py-12 mx-auto">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/20">
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          <span className="font-bold tracking-tight">Sakinah Insights</span>
        </div>
        <div className="flex gap-1">
          {slides.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1 rounded-full transition-all duration-500',
                i === currentSlide ? 'w-8 bg-accent' : 'w-4 bg-white/10'
              )}
            />
          ))}
        </div>
      </div>

      <div className="relative min-h-[500px] flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
            transition={{ duration: 0.6, ease: 'circOut' }}
            className="w-full"
          >
            {slides[currentSlide].content(data)}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between mt-16">
        <button
          onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
          disabled={currentSlide === 0}
          className="p-4 transition-all rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-0"
        >
          <ChevronRight className="w-6 h-6 rotate-180" />
        </button>

        {currentSlide < slides.length - 1 ? (
          <button
            onClick={() => setCurrentSlide((prev) => prev + 1)}
            className="flex items-center gap-2 px-8 py-4 font-bold transition-all rounded-full shadow-lg bg-accent text-accent-foreground hover:scale-105 shadow-accent/20"
          >
            Next Insight
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={() => (window.location.href = '/dashboard')}
            className="flex items-center gap-2 px-8 py-4 font-bold text-black transition-all bg-white rounded-full hover:scale-105"
          >
            Back to Dashboard
          </button>
        )}
      </div>
    </div>
  );
}
