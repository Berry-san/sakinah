'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center space-y-8">
      <div className="relative">
        {/* Animated Geometric Pattern (Simple SVG) */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className="w-24 h-24 text-accent/20"
        >
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M50 5 L95 50 L50 95 L5 50 Z" />
            <path d="M50 5 L5 50 L50 95 L95 50 Z" transform="rotate(45 50 50)" />
          </svg>
        </motion.div>

        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 flex items-center justify-center text-accent"
        >
          <Sparkles className="w-8 h-8" />
        </motion.div>
      </div>

      <div className="space-y-2 text-center">
        <p className="font-nastaliq text-2xl text-accent">بِسْمِ اللَّهِ</p>
        <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-40 animate-pulse">
          Entering Sakinah
        </p>
      </div>
    </div>
  );
}
