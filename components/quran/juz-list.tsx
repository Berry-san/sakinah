'use client';

import { GlassCard } from '@/components/ui/glass-card';
import { cn } from '@/lib/utils';

interface JuzListProps {
  juzs: any[];
  selectedId: number;
  onSelect: (id: number) => void;
}

export function JuzList({ juzs, selectedId, onSelect }: JuzListProps) {
  return (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
      {juzs.map((juz) => (
        <button
          key={juz.juz_number}
          onClick={() => onSelect(juz.juz_number)}
          className={cn(
            'w-full text-left p-4 rounded-2xl border transition-all',
            selectedId === juz.juz_number
              ? 'bg-primary text-white border-primary shadow-lg scale-[1.02]'
              : 'bg-white/5 border-white/10 hover:bg-white/10'
          )}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs',
                  selectedId === juz.juz_number ? 'bg-white/20' : 'bg-primary/10 text-accent'
                )}
              >
                {juz.juz_number}
              </span>
              <div>
                <p className="font-bold text-sm">Juz {juz.juz_number}</p>
                <p className="text-[10px] uppercase tracking-widest opacity-60">
                  {Object.keys(juz.verse_mapping).length} Surahs
                </p>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
