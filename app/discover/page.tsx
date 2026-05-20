'use client';

import { Navbar } from '@/components/layout/navbar';
import { VerseDetailModal } from '@/components/ui/verse-detail-modal';
import { searchQuran } from '@/lib/quran-api';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CloudRain, Shield, Star, Sun, Wind } from 'lucide-react';
import { useState } from 'react';

const EMOTIONS = [
  { id: 'anxiety', label: 'Anxious', icon: Wind, search: 'fear', desc: 'Find calm in uncertainty' },
  {
    id: 'gratitude',
    label: 'Grateful',
    icon: Sun,
    search: 'gratitude',
    desc: 'Deepen your thankfulness'
  },
  {
    id: 'patience',
    label: 'Struggling',
    icon: Shield,
    search: 'patience',
    desc: 'Strength through hardship'
  },
  { id: 'hope', label: 'Hopeful', icon: Star, search: 'mercy', desc: 'Hold on to His mercy' },
  { id: 'lost', label: 'Lost', icon: CloudRain, search: 'guidance', desc: 'Seek His guidance' }
];

export default function DiscoverPage() {
  const [selectedEmotion, setSelectedEmotion] = useState(EMOTIONS[0]);
  const [detailVerseKey, setDetailVerseKey] = useState<string | null>(null);

  const { data: results, isLoading } = useQuery({
    queryKey: ['discover', selectedEmotion.id],
    queryFn: async () => {
      const searchData = await searchQuran(selectedEmotion.search, { language: 'en', size: 6 });
      return searchData.results;
    }
  });

  return (
    <div className="min-h-screen pb-24 bg-background">
      <Navbar />

      <main className="max-w-4xl px-6 pt-24 mx-auto space-y-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-2 space-y-2"
        >
          <p className="text-sm font-medium text-accent">Discover</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            How is your heart today?
          </h1>
          <p className="max-w-md text-muted-foreground">
            Choose a feeling and let divine wisdom meet you where you are.
          </p>
        </motion.div>

        {/* Emotion selector */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
          {EMOTIONS.map((emotion, i) => {
            const Icon = emotion.icon;
            const active = selectedEmotion.id === emotion.id;
            return (
              <motion.button
                key={emotion.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedEmotion(emotion)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-sm',
                  active
                    ? 'border-accent/50 bg-accent/10 text-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-accent/30 hover:bg-accent/10 hover:text-foreground card-highlight'
                )}
              >
                <Icon className={cn('w-5 h-5', active ? 'text-accent' : '')} />
                <span className="font-medium">{emotion.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Context text */}
        <p className="text-sm italic text-muted-foreground">
          {selectedEmotion.desc} — verses about{' '}
          <span className="text-accent">{selectedEmotion.search}</span>
        </p>

        {/* Results */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 border rounded-xl bg-card border-border animate-pulse"
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key={selectedEmotion.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {results?.map((result: any, i: number) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setDetailVerseKey(result.verse_key)}
                  className="w-full p-5 text-left transition-all border rounded-xl border-border bg-card card-highlight hover:border-accent/40 hover:bg-accent/5 group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <p className="text-xs font-medium text-accent">{result.verse_key}</p>
                      <p className="text-lg leading-relaxed text-foreground line-clamp-3 font-arabic">
                        {result.text?.replace(/<[^>]*>?/gm, '') ?? ''}
                      </p>
                      <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
                        {result.translations[0]?.text?.replace(/<[^>]*>?/gm, '') ?? ''}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                  </div>
                </motion.button>
              ))}
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
