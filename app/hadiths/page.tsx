'use client';

import { Navbar } from '@/components/layout/navbar';
import { FloatingLights } from '@/components/ui/floating-lights';
import { GlassCard } from '@/components/ui/glass-card';
import { getHadithByAyah, HadithReference } from '@/lib/quran-api';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Quote, Search, Sparkles } from 'lucide-react';
import { useState } from 'react';

export default function HadithsPage() {
  const [verseKey, setVerseKey] = useState('2:255');
  const [inputValue, setInputValue] = useState('2:255');

  const { data: hadithData, isLoading } = useQuery({
    queryKey: ['hadiths-dynamic', verseKey],
    queryFn: () => getHadithByAyah(verseKey)
  });

  const hadiths: HadithReference[] = hadithData?.hadith_references ?? [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed) setVerseKey(trimmed);
  };

  return (
    <div className="relative min-h-screen">
      <FloatingLights />
      <Navbar />

      <main className="max-w-5xl px-6 pt-32 pb-20 mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold tracking-widest uppercase border rounded-full bg-accent/10 border-accent/20 text-accent"
          >
            <Sparkles className="w-3 h-3" />
            Prophetic Wisdom
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold tracking-tight md:text-6xl"
          >
            Explore <span className="text-accent">Hadiths</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-xl mx-auto text-lg text-foreground/60"
          >
            Timeless guidance from the life and sayings of Prophet Muhammad (ﷺ).
          </motion.p>
        </div>

        {/* Verse Key Search */}
        <form onSubmit={handleSearch} className="flex flex-col gap-4 md:flex-row">
          <GlassCard className="flex items-center flex-1 gap-3 p-2">
            <div className="pl-4 text-foreground/40">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Enter verse key (e.g. 2:255, 3:1, 36:1)..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 py-2 text-sm bg-transparent border-none focus:ring-0"
            />
            <button
              type="submit"
              className="px-4 py-2 mr-2 text-xs font-bold tracking-widest uppercase transition-colors rounded-xl bg-accent text-primary hover:bg-accent/80"
            >
              Search
            </button>
          </GlassCard>
        </form>

        <p className="-mt-8 text-xs tracking-widest text-center uppercase text-foreground/30">
          Showing hadiths linked to verse <span className="text-accent">{verseKey}</span>
        </p>

        {/* Hadith List */}
        <div className="grid gap-6">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="w-full h-48 glass rounded-3xl animate-pulse" />
            ))
          ) : hadiths.length > 0 ? (
            hadiths.map((hadith, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <GlassCard className="p-8 space-y-6 transition-all md:p-10 group hover:bg-white/5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/20">
                        <Quote className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{hadith.collection}</p>
                        <p className="text-[10px] uppercase tracking-widest text-foreground/40 font-bold">
                          Ref: {hadith.hadith_number}
                        </p>
                      </div>
                    </div>
                  </div>

                  {hadith.text ? (
                    <p className="font-serif text-xl leading-relaxed md:text-2xl text-foreground/90">
                      {hadith.text}
                    </p>
                  ) : (
                    <p className="text-lg leading-relaxed text-foreground/60">
                      Related to Ayah {hadith.ayah_start_number}
                      {hadith.ayah_end_number !== hadith.ayah_start_number &&
                        ` – ${hadith.ayah_end_number}`}{' '}
                      in the {hadith.collection} collection.
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-6 text-sm border-t border-white/5 text-foreground/50">
                    <span className="font-bold text-accent">Source:</span>
                    <span>Quran Foundation Prophetic Resources</span>
                  </div>
                </GlassCard>
              </motion.div>
            ))
          ) : (
            <p className="py-20 text-center text-foreground/40">
              No hadiths found for verse {verseKey}.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
