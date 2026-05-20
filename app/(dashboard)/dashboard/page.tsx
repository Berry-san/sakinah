'use client';

import {
  useQFActivityDays,
  useQFBookmarks,
  useQFCurrentStreak,
  useQFProfile,
  useQFTodayGoalPlan,
  useReadingSessions
} from '@/apiService/quranFoundationService/hooks';
import { goalPlanStats } from '@/apiService/quranFoundationService/qfService';
import { Navbar } from '@/components/layout/navbar';
import { useAuth } from '@/lib/auth-context';
import { fetchChapters, fetchRandomAyah } from '@/lib/quran-api';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/use-store';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  FolderOpen,
  Layers,
  Pause,
  PenSquare,
  Play,
  RefreshCw,
  Sparkles,
  Target
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type Banner = 'streak-at-risk' | 'welcome-back' | 'reconnect';

// ─── Activity heatmap ─────────────────────────────────────────────────────────

function ActivityHeatmap({ days }: { days: { date: string; seconds: number }[] }) {
  const byDate = new Map(days.map((d) => [d.date, d.seconds]));
  const maxSeconds = Math.max(...days.map((d) => d.seconds), 1);

  const cells = Array.from({ length: 20 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (19 - i));
    const key = d.toISOString().slice(0, 10);
    const secs = byDate.get(key) ?? 0;
    return { key, secs, intensity: secs / maxSeconds, isToday: i === 19 };
  });

  return (
    <div className="flex gap-1">
      {cells.map((cell) => (
        <div
          key={cell.key}
          title={cell.secs > 0 ? `${Math.round(cell.secs / 60)} min — ${cell.key}` : cell.key}
          className={cn(
            'flex-1 h-6 rounded-sm transition-colors',
            cell.isToday && cell.intensity === 0 && 'ring-1 ring-accent/50'
          )}
          style={{
            background:
              cell.intensity > 0
                ? `hsl(var(--accent) / ${0.2 + cell.intensity * 0.8})`
                : 'hsl(var(--border))'
          }}
        />
      ))}
    </div>
  );
}

// ─── Reflect on This ─────────────────────────────────────────────────────────

function RandomVerseCard() {
  const [seed, setSeed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();

  const { data: verse, isFetching } = useQuery({
    queryKey: ['random-verse', seed],
    queryFn: () => fetchRandomAyah({ audio: 7 }),
    staleTime: Infinity
  });

  useEffect(() => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [verse]);

  const translation = (verse?.translations?.[0] as { text?: string } | undefined)?.text?.replace(
    /<[^>]*>/g,
    ''
  );
  const transliteration = (verse?.translations?.[1] as { text?: string } | undefined)?.text;
  const rawAudioUrl = (verse as { audio?: { url?: string } } | undefined)?.audio?.url;
  const audioUrl = rawAudioUrl ? `https://verses.quran.com/${rawAudioUrl}` : null;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 space-y-4 border rounded-xl border-border bg-card card-highlight"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <p className="text-sm font-medium text-foreground">Reflect on This</p>
        </div>
        <button
          onClick={() => setSeed((s) => s + 1)}
          disabled={isFetching}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary transition-colors disabled:opacity-40"
          title="New verse"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />
        </button>
      </div>

      {verse ? (
        <div className="space-y-3">
          <p dir="rtl" className="font-arabic text-2xl leading-[2.4] text-foreground text-right">
            {verse.text_uthmani}
          </p>
          {transliteration && (
            <p className="text-xs italic leading-relaxed text-muted-foreground">
              {transliteration}
            </p>
          )}
          {translation && (
            <p className="text-sm leading-relaxed text-muted-foreground">{translation}</p>
          )}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-medium text-accent">{verse.verse_key}</span>
            <div className="flex items-center gap-1">
              {audioUrl && (
                <button
                  onClick={togglePlay}
                  className="flex items-center gap-1 px-2 py-1 text-xs transition-colors rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10"
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
              )}
              <button
                onClick={() => verse.verse_key && router.push(`/quran?verse=${verse.verse_key}`)}
                className="px-2 py-1 text-xs transition-colors text-muted-foreground hover:text-accent"
              >
                Read in context →
              </button>
            </div>
          </div>
          {audioUrl && <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />}
        </div>
      ) : (
        <div className="space-y-3 animate-pulse">
          <div className="w-3/4 h-8 ml-auto rounded bg-border" />
          <div className="w-full h-3 rounded bg-border" />
          <div className="w-5/6 h-3 rounded bg-border" />
        </div>
      )}
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, isAuthenticated, login } = useAuth();
  const { stats, bookmarks, currentChapterId, currentVerseKey } = useStore();
  const { data: qfProfile } = useQFProfile();
  const { data: qfStreak } = useQFCurrentStreak();
  const { data: activityDays } = useQFActivityDays(20);
  const { data: todayPlan, isLoading: goalsLoading } = useQFTodayGoalPlan();
  const { data: sessions } = useReadingSessions();
  const { data: qfBookmarks } = useQFBookmarks();

  const { data: chapters } = useQuery({
    queryKey: ['chapters'],
    queryFn: () => fetchChapters(),
    staleTime: Infinity
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = qfProfile?.firstName || user?.firstName || user?.email?.split('@')[0] || 'there';
  const activeStreak = qfStreak ?? stats.streak ?? 0;

  // Today's activity
  const today = new Date().toISOString().slice(0, 10);
  const todayActivity = activityDays?.find((d) => d.date === today);
  const hasReadToday = (todayActivity?.seconds ?? 0) > 0;
  const todayMinutes = Math.floor((todayActivity?.seconds ?? 0) / 60);

  // Days since last read
  const lastActiveDay = activityDays
    ?.filter((d) => d.seconds > 0)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const daysSinceLast = lastActiveDay
    ? Math.floor((Date.now() - new Date(lastActiveDay.date + 'T00:00:00').getTime()) / 86400000)
    : null;

  // Banner
  let banner: Banner | null = null;
  if (isAuthenticated && !hasReadToday) {
    if (activeStreak > 0) banner = 'streak-at-risk';
    else if (daysSinceLast !== null && daysSinceLast <= 14) banner = 'welcome-back';
    else banner = 'reconnect';
  }

  // Continue reading — prefer cloud reading session, fall back to local store
  const lastSession = sessions
    ?.slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  const continueChapterId = lastSession?.chapter_number ?? currentChapterId;
  const continueVerseKey =
    lastSession?.chapter_number && lastSession?.verse_number
      ? `${lastSession.chapter_number}:${lastSession.verse_number}`
      : currentVerseKey;
  const continueHref = continueVerseKey ? `/quran?verse=${continueVerseKey}` : '/quran';
  const continueChapter = chapters?.find((c) => c.id === continueChapterId);

  // Goals
  const completedGoals = todayPlan?.filter((p) => goalPlanStats(p).percentage >= 100).length ?? 0;
  const totalGoals = todayPlan?.length ?? 0;

  // Bookmarks
  const bookmarkCount = isAuthenticated ? (qfBookmarks?.length ?? 0) : bookmarks.length;

  // Fallback 7-day local activity
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const isoKey = d.toISOString().slice(0, 10);
    const qfSecs = activityDays?.find((a) => a.date === isoKey)?.seconds ?? 0;
    const localCount = stats.dailyActivity[d.toDateString()] ?? 0;
    return {
      label: d.toLocaleDateString('en', { weekday: 'short' }).charAt(0),
      count: qfSecs > 0 ? Math.ceil(qfSecs / 60) : localCount,
      isToday: i === 6
    };
  });
  const maxActivity = Math.max(...last7Days.map((d) => d.count), 1);

  const bannerConfig: Record<Banner, { bg: string; icon: React.ReactNode; cta: string }> = {
    'streak-at-risk': {
      bg: 'bg-accent/10 border-accent/40',
      icon: <Flame className="w-4 h-4 text-accent shrink-0" />,
      cta: 'Read now'
    },
    'welcome-back': {
      bg: 'bg-card border-border',
      icon: <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />,
      cta: 'Continue'
    },
    reconnect: {
      bg: 'bg-card border-border',
      icon: <Sparkles className="w-4 h-4 text-accent shrink-0" />,
      cta: 'Start reading'
    }
  };

  const bannerText = (b: Banner) => {
    if (b === 'streak-at-risk')
      return `Your ${activeStreak}-day streak is at risk — read today to keep it going.`;
    if (b === 'welcome-back')
      return `Welcome back — it's been ${daysSinceLast} day${daysSinceLast === 1 ? '' : 's'}. Pick up where you left off.`;
    return 'The Quran is waiting — start your journey back today.';
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      <Navbar />

      <main className="max-w-4xl px-6 pt-24 mx-auto space-y-6">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-2 space-y-1"
        >
          <p className="text-sm font-medium text-accent">{greeting}</p>
          <h1 className="text-3xl font-bold tracking-tight capitalize md:text-4xl">{name}</h1>
          {isAuthenticated && hasReadToday && (
            <p className="text-sm text-muted-foreground">
              {todayMinutes > 0 ? `${todayMinutes} min read today` : 'Reading started today'}
              {activeStreak > 0 && ` · ${activeStreak}-day streak`}
            </p>
          )}
        </motion.div>

        {/* Re-engagement banner */}
        <AnimatePresence>
          {banner && (
            <motion.div
              key={banner}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Link
                href={continueHref}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-xl border transition-all hover:border-accent/60 group',
                  bannerConfig[banner].bg
                )}
              >
                {bannerConfig[banner].icon}
                <p className="flex-1 text-sm text-foreground">{bannerText(banner)}</p>
                <span className="text-xs font-semibold text-accent shrink-0 group-hover:translate-x-0.5 transition-transform">
                  {bannerConfig[banner].cta} →
                </span>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            icon={<Flame className="w-4 h-4" />}
            label="Day Streak"
            value={`${activeStreak}`}
            accent
          />
          <StatCard
            icon={<Clock className="w-4 h-4" />}
            label="Today"
            value={todayMinutes > 0 ? `${todayMinutes}m` : hasReadToday ? '<1m' : '—'}
          />
          <StatCard
            icon={<CheckCircle2 className="w-4 h-4" />}
            label="Goals"
            value={totalGoals > 0 ? `${completedGoals}/${totalGoals}` : '—'}
          />
          <StatCard
            icon={<BookMarked className="w-4 h-4" />}
            label="Bookmarks"
            value={`${bookmarkCount}`}
          />
        </div>

        {/* Continue reading */}
        <Link
          href={continueHref}
          className="block p-6 transition-all border rounded-xl border-border bg-card card-highlight hover:border-accent/40 group"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium tracking-wide uppercase text-accent">
                  Continue Reading
                </p>
                {isAuthenticated && !hasReadToday && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 font-medium">
                    Not yet today
                  </span>
                )}
              </div>
              <p className="text-lg font-semibold text-foreground">
                {continueChapter
                  ? `Surah ${continueChapter.name_simple}`
                  : `Surah ${continueChapterId}`}
              </p>
              {continueVerseKey && (
                <p className="text-xs text-muted-foreground">Resume at {continueVerseKey}</p>
              )}
              {continueChapter && (
                <p className="text-xs text-muted-foreground">
                  {continueChapter.verses_count} verses · {continueChapter.revelation_place}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {continueChapter?.name_arabic && (
                <span className="text-3xl transition-colors font-arabic text-muted-foreground group-hover:text-foreground">
                  {continueChapter.name_arabic}
                </span>
              )}
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        </Link>

        {/* Today's Goals */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Today's Goals</p>
            <Link href="/goals" className="text-xs transition-colors text-accent hover:underline">
              Manage →
            </Link>
          </div>

          {isAuthenticated ? (
            goalsLoading ? (
              <div className="h-16 border rounded-xl bg-card border-border animate-pulse" />
            ) : todayPlan && todayPlan.length > 0 ? (
              <div className="space-y-2">
                {todayPlan.map((plan, i) => {
                  const { completed, target, percentage } = goalPlanStats(plan);
                  const pct = Math.min(100, percentage);
                  const done = pct >= 100;
                  const iconCls = cn(
                    'w-3.5 h-3.5 shrink-0',
                    done ? 'text-accent' : 'text-muted-foreground'
                  );
                  const info = (
                    {
                      QURAN_TIME: {
                        label: 'Time',
                        unit: 'min',
                        icon: <Clock className={iconCls} />
                      },
                      QURAN_PAGES: {
                        label: 'Pages',
                        unit: 'pages',
                        icon: <Layers className={iconCls} />
                      },
                      QURAN_RANGE: {
                        label: 'Range',
                        unit: 'juz',
                        icon: <BookOpen className={iconCls} />
                      }
                    } as Record<string, { label: string; unit: string; icon: React.ReactNode }>
                  )[plan.goalType ?? ''] ?? {
                    label: plan.goalType ?? '',
                    unit: '',
                    icon: <Target className={iconCls} />
                  };

                  return (
                    <div
                      key={plan.goalId ?? i}
                      className={cn(
                        'p-4 rounded-xl border transition-colors',
                        done ? 'border-accent/30 bg-accent/5' : 'border-border bg-card'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          {info.icon}
                          <span className="text-sm font-medium text-foreground">{info.label}</span>
                        </div>
                        <span
                          className={cn(
                            'text-xs font-semibold tabular-nums',
                            done ? 'text-accent' : 'text-muted-foreground'
                          )}
                        >
                          {completed} / {target} {info.unit}
                          {done && ' ✓'}
                        </span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: 'circOut' }}
                          className={cn('h-full rounded-full', done ? 'bg-accent' : 'bg-accent/60')}
                        />
                      </div>
                    </div>
                  );
                })}
                {completedGoals === totalGoals && totalGoals > 0 && (
                  <p className="py-1 text-xs font-medium text-center text-accent">
                    All goals complete for today ✓
                  </p>
                )}
              </div>
            ) : (
              <div className="p-5 space-y-2 text-center border border-dashed rounded-xl border-border bg-card">
                <Target className="w-5 h-5 mx-auto text-muted-foreground opacity-40" />
                <p className="text-xs text-muted-foreground">
                  No goals set — consistency is how the habit sticks.
                </p>
                <Link href="/goals" className="text-xs font-medium text-accent hover:underline">
                  Set your first goal →
                </Link>
              </div>
            )
          ) : (
            <div className="p-5 space-y-2 text-center border border-dashed rounded-xl border-border bg-card">
              <p className="text-xs text-muted-foreground">
                Sign in to set daily goals and build your streak.
              </p>
              <button onClick={login} className="text-xs font-medium text-accent hover:underline">
                Sign in →
              </button>
            </div>
          )}
        </div>

        {/* Reflect on This */}
        <RandomVerseCard />

        {/* Activity */}
        {activityDays && activityDays.length > 0 ? (
          <div className="p-5 space-y-4 border rounded-xl border-border bg-card card-highlight">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Reading Activity</p>
              <p className="text-xs text-muted-foreground">Last 20 days</p>
            </div>
            <ActivityHeatmap days={activityDays} />
          </div>
        ) : (
          <div className="p-5 space-y-4 border rounded-xl border-border bg-card card-highlight">
            <p className="text-sm font-medium text-foreground">This Week</p>
            <div className="flex items-end gap-2 h-14">
              {last7Days.map((day, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                >
                  <div
                    className={cn(
                      'w-full rounded-sm transition-all',
                      day.count > 0 ? 'bg-accent' : 'bg-border',
                      day.isToday && day.count === 0 && 'bg-accent/20'
                    )}
                    style={{ height: `${Math.max(4, (day.count / maxActivity) * 40)}px` }}
                  />
                  <span
                    className={cn(
                      'text-[10px]',
                      day.isToday ? 'text-accent' : 'text-muted-foreground'
                    )}
                  >
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            {
              href: '/profile',
              label: 'Your Profile',
              desc: 'Bookmarks & stats',
              icon: BookMarked
            },
            {
              href: '/reflections',
              label: 'Reflections',
              desc: 'Journal your thoughts',
              icon: PenSquare
            },
            {
              href: '/collections',
              label: 'Collections',
              desc: 'Saved verse sets',
              icon: FolderOpen
            },
            { href: '/goals', label: 'Goals', desc: 'Track your progress', icon: Target }
          ].map(({ href, label, desc, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="p-4 transition-all border rounded-xl border-border bg-card card-highlight hover:border-accent/40 group"
            >
              <Icon className="w-4 h-4 mb-2 transition-colors text-muted-foreground group-hover:text-accent" />
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'p-4 rounded-xl border card-highlight',
        accent ? 'border-accent/30 bg-accent/8' : 'border-border bg-card'
      )}
    >
      <div className={cn('mb-2', accent ? 'text-accent' : 'text-muted-foreground')}>{icon}</div>
      <p
        className={cn(
          'text-2xl font-bold tracking-tight',
          accent ? 'text-accent' : 'text-foreground'
        )}
      >
        {value}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
