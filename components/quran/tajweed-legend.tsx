'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const RULES = [
  {
    color: '#888888',
    name: 'Silent / Assimilated',
    desc: 'Hamzat al-Wasl & Lam Shamsiyya — not pronounced or merged silently'
  },
  {
    color: '#537FFF',
    name: 'Madd (Prolongation)',
    desc: 'Natural, permissible, or necessary lengthening of vowel sounds'
  },
  {
    color: '#FF4444',
    name: 'Qalqala',
    desc: 'Echoing/bouncing sound on certain stop consonants'
  },
  {
    color: '#DD55CC',
    name: "Ghunnah / Ikhfa'",
    desc: 'Nasalisation and concealment of nun/meem sounds'
  },
  {
    color: '#44CC33',
    name: 'Idgham',
    desc: 'Merging of nun sakinah or tanwin into the following letter'
  },
  {
    color: '#26BFFD',
    name: 'Iqlab',
    desc: 'Converting nun sakinah into a meem sound'
  }
];

export function TajweedLegend({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('rounded-xl border border-border bg-card overflow-hidden', className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-medium text-foreground hover:bg-primary/60 transition-colors"
      >
        <span className="flex items-center gap-2.5">
          <span className="flex gap-1">
            {RULES.map((r) => (
              <span
                key={r.color}
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: r.color }}
              />
            ))}
          </span>
          Tajweed color guide
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className="px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-border pt-4">
          {RULES.map((rule) => (
            <div key={rule.name} className="flex items-start gap-3">
              <span
                className="mt-1 w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: rule.color }}
              />
              <div>
                <p className="text-sm font-medium text-foreground">{rule.name}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{rule.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
