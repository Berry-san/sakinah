'use client';

import {
  useCreateGoal,
  useDeleteGoal,
  useQFCurrentStreak,
  useQFTodayGoalPlan
} from '@/apiService/quranFoundationService/hooks';
import type { QFGoal } from '@/apiService/quranFoundationService/qfService';
import { goalPlanStats } from '@/apiService/quranFoundationService/qfService';
import { Navbar } from '@/components/layout/navbar';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/use-store';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  Layers,
  Loader2,
  LogIn,
  Plus,
  Target,
  Trash2,
  X
} from 'lucide-react';
import { useState } from 'react';

const GOAL_TYPES: { value: QFGoal['type']; label: string; icon: React.ReactNode; unit: string }[] =
  [
    { value: 'QURAN_TIME', label: 'Time', icon: <Clock className="w-4 h-4" />, unit: 'min' },
    {
      value: 'QURAN_PAGES',
      label: 'Pages',
      icon: <Layers className="w-4 h-4" />,
      unit: 'pages'
    },
    {
      value: 'QURAN_RANGE',
      label: 'Range',
      icon: <BookOpen className="w-4 h-4" />,
      unit: 'juz'
    }
  ];

export default function GoalsPage() {
  const { isAuthenticated, login } = useAuth();
  const { stats } = useStore();
  const { data: qfStreak } = useQFCurrentStreak();
  const { data: todayPlan, isLoading: plansLoading } = useQFTodayGoalPlan();
  const createGoal = useCreateGoal();
  const deleteGoal = useDeleteGoal();

  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<QFGoal['type']>('QURAN_TIME');
  const [formAmount, setFormAmount] = useState('30');
  const [formDuration, setFormDuration] = useState('');

  const activeStreak = qfStreak ?? stats.streak ?? 0;
  const completedCount = todayPlan?.filter((p) => goalPlanStats(p).percentage >= 100).length ?? 0;
  const activeGoals = todayPlan?.length ?? 0;

  const handleCreate = async () => {
    if (!formAmount || isNaN(Number(formAmount))) return;
    const rawAmount = Number(formAmount);
    const amount = formType === 'QURAN_TIME' ? rawAmount * 60 : rawAmount;
    const duration =
      formDuration && !isNaN(Number(formDuration)) ? Number(formDuration) : undefined;
    await createGoal.mutateAsync({
      type: formType,
      amount,
      category: 'QURAN',
      ...(duration !== undefined ? { duration } : {})
    });
    setShowForm(false);
    setFormAmount('30');
    setFormDuration('');
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      <Navbar />

      <main className="max-w-3xl px-6 pt-24 mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-end justify-between"
        >
          <div className="space-y-1">
            <p className="text-sm font-medium tracking-wide uppercase text-accent">
              Spiritual Roadmap
            </p>
            <h1 className="text-4xl font-bold tracking-tight">Your Goals</h1>
            <p className="text-sm text-muted-foreground">Track your consistency and growth.</p>
          </div>
          {isAuthenticated && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Goal
            </button>
          )}
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<Flame className="w-4 h-4" />}
            label="Streak"
            value={`${activeStreak}d`}
            accent
          />
          <StatCard
            icon={<CheckCircle2 className="w-4 h-4" />}
            label="Done Today"
            value={`${completedCount}`}
          />
          <StatCard
            icon={<Target className="w-4 h-4" />}
            label="Active Goals"
            value={`${activeGoals}`}
          />
        </div>

        {/* Not signed in */}
        {!isAuthenticated && (
          <div className="py-16 space-y-4 text-center border border-border rounded-2xl bg-card">
            <Target className="w-8 h-8 mx-auto text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground">Sign in to set and track reading goals.</p>
            <button
              onClick={login}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          </div>
        )}

        {/* Goals / Today's progress */}
        {isAuthenticated && (
          <div className="space-y-3">
            {plansLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : todayPlan && todayPlan.length > 0 ? (
              todayPlan.map((plan, i) => {
                const meta = GOAL_TYPES.find((g) => g.value === plan.goalType);
                const { target, completed, percentage } = goalPlanStats(plan);
                const pct = Math.min(100, percentage);
                return (
                  <motion.div
                    key={plan.goalId ?? i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-5 border rounded-xl border-border bg-card card-highlight group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center rounded-lg w-9 h-9 bg-accent/10 text-accent shrink-0">
                          {meta?.icon ?? <Target className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {target} {meta?.unit ?? ''}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {meta?.label ?? plan.goalType} · daily
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={cn(
                            'text-xs font-semibold tabular-nums',
                            pct >= 100 ? 'text-accent' : 'text-muted-foreground'
                          )}
                        >
                          {completed} / {target} {meta?.unit ?? ''}
                          {pct >= 100 && ' ✓'}
                        </span>
                        {plan.goalId && (
                          <button
                            onClick={() => deleteGoal.mutate(plan.goalId)}
                            disabled={deleteGoal.isPending}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 h-1.5 bg-border rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'circOut' }}
                        className={cn(
                          'h-full rounded-full',
                          pct >= 100 ? 'bg-accent' : 'bg-accent/60'
                        )}
                      />
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="py-16 text-center border border-border rounded-xl bg-card">
                <Target className="mx-auto mb-3 w-7 h-7 text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground">No goals yet.</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 text-xs text-accent hover:underline"
                >
                  Create your first goal →
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create goal modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 12 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-sm p-6 space-y-5 border rounded-2xl border-border bg-card card-highlight"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">New Reading Goal</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Goal type</p>
                <div className="grid grid-cols-3 gap-2">
                  {GOAL_TYPES.map((g) => (
                    <button
                      key={g.value}
                      onClick={() => {
                        setFormType(g.value);
                        setFormAmount(g.value === 'QURAN_TIME' ? '30' : '5');
                      }}
                      className={cn(
                        'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-colors',
                        formType === g.value
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border text-muted-foreground hover:text-foreground hover:bg-primary'
                      )}
                    >
                      {g.icon}
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Target ({GOAL_TYPES.find((g) => g.value === formType)?.unit})
                </p>
                <input
                  type="number"
                  min="1"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="e.g. 30"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Duration (days) —{' '}
                  <span className="text-foreground/40">leave empty for a daily ongoing goal</span>
                </p>
                <input
                  type="number"
                  min="1"
                  value={formDuration}
                  onChange={(e) => setFormDuration(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="e.g. 30"
                />
              </div>

              <button
                onClick={handleCreate}
                disabled={!formAmount || isNaN(Number(formAmount)) || createGoal.isPending}
                className="w-full py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-semibold disabled:opacity-40 hover:bg-accent/90 transition-colors"
              >
                {createGoal.isPending ? 'Creating…' : 'Create Goal'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
