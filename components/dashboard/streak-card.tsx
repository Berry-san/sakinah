import { useQFCurrentStreak } from '@/apiService/quranFoundationService/hooks';
import { GlassCard } from '@/components/ui/glass-card';
import { Flame } from 'lucide-react';

export function StreakCard() {
  const { data: streak, isLoading } = useQFCurrentStreak();

  if (isLoading) {
    return <GlassCard className="p-6 h-[112px] animate-pulse bg-white/5" />;
  }

  const streakCount = streak || 0;

  return (
    <GlassCard className="p-6 flex items-center gap-6 group hover:bg-white/5 transition-colors cursor-pointer">
      <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center relative">
        <Flame className="w-8 h-8 text-accent animate-pulse" />
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center border-2 border-background">
          {streakCount}
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-bold text-foreground/40 uppercase tracking-widest">
          Spiritual Streak
        </h3>
        <p className="text-2xl font-bold">
          {streakCount}{' '}
          <span className="text-sm font-medium text-foreground/60">Days in Sakinah</span>
        </p>
      </div>

      <div className="ml-auto hidden md:flex gap-2">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className={`w-2 h-8 rounded-full transition-all duration-500 ${i < streakCount % 7 ? 'bg-accent h-10' : 'bg-white/10'}`}
          />
        ))}
      </div>
    </GlassCard>
  );
}
