'use client';

import { Chapter } from '@/lib/quran-api';
import { GlassCard } from '@/components/ui/glass-card';
import { cn } from '@/lib/utils';

interface ChapterListProps {
  chapters: Chapter[];
  selectedId: number;
  onSelect: (id: number) => void;
}

export function ChapterList({ chapters, selectedId, onSelect }: ChapterListProps) {
  return (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
      {chapters.map((chapter) => (
        <button
          key={chapter.id}
          onClick={() => onSelect(chapter.id)}
          className={cn(
            'w-full text-left p-4 rounded-2xl border transition-all',
            selectedId === chapter.id
              ? 'bg-primary text-white border-primary shadow-lg scale-[1.02]'
              : 'bg-white/5 border-white/10 hover:bg-white/10'
          )}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs',
                  selectedId === chapter.id ? 'bg-white/20' : 'bg-primary/10 text-accent'
                )}
              >
                {chapter.id}
              </span>
              <div>
                <p className="font-bold text-sm">{chapter.name_simple}</p>
                <p className="text-[10px] uppercase tracking-widest opacity-60">
                  {chapter.revelation_place} • {chapter.verses_count} Verses
                </p>
              </div>
            </div>
            <p className="font-arabic text-lg">{chapter.name_arabic}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
