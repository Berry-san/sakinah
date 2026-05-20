'use client';

import {
  useDeleteQFBookmark,
  useMyPosts,
  useQFBookmarks,
  useQFCurrentStreak,
  useQFProfile,
  useUserFollowers,
  useUserFollowing
} from '@/apiService/quranFoundationService/hooks';
import { Navbar } from '@/components/layout/navbar';
import { useAuth } from '@/lib/auth-context';
import { fetchVerseByKey } from '@/lib/quran-api';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/use-store';
import { useQueries } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BookMarked,
  BookOpen,
  Clock,
  Flame,
  Loader2,
  MessageSquare,
  PenSquare,
  Target,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function fmtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const {
    stats,
    bookmarks: localBookmarks,
    removeBookmark,
    setCurrentChapterId,
    setCurrentVerseKey
  } = useStore();
  const router = useRouter();

  const { data: qfBookmarks, isLoading: bookmarksLoading } = useQFBookmarks();
  const { data: qfStreak } = useQFCurrentStreak();
  const { data: qfProfile } = useQFProfile();
  const deleteQFBookmark = useDeleteQFBookmark();
  const { data: followersData } = useUserFollowers(qfProfile?.id ?? null);
  const { data: followingData } = useUserFollowing(qfProfile?.id ?? null);
  const { data: myPostsData, isLoading: myPostsLoading } = useMyPosts({
    tab: 'my_reflections',
    limit: 20
  });

  const activeStreak = qfStreak ?? stats.streak ?? 0;
  const cloudStats = qfProfile?.statistics;

  const cloudKeys = qfBookmarks?.map((b) => b.key) ?? [];
  const bookmarkKeys = isAuthenticated && qfBookmarks ? cloudKeys : localBookmarks;

  // Prefer QF profile fields, fall back to auth context
  const firstName = qfProfile?.firstName ?? user?.firstName ?? '';
  const lastName = qfProfile?.lastName ?? user?.lastName ?? '';
  const email = qfProfile?.email ?? user?.email ?? '';
  const username = qfProfile?.username;
  const photoUrl = qfProfile?.photoUrl;

  const fullName =
    [firstName, lastName].filter(Boolean).join(' ') || username || email.split('@')[0] || 'User';

  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const bookmarkQueries = useQueries({
    queries: bookmarkKeys.map((key) => ({
      queryKey: ['verse', key],
      queryFn: () => fetchVerseByKey(key),
      staleTime: Infinity,
      retry: false
    }))
  });

  const handleRemove = (verseKey: string) => {
    if (isAuthenticated && qfBookmarks) {
      const qfBm = qfBookmarks.find((b) => b.key === verseKey);
      if (qfBm) {
        deleteQFBookmark.mutate(qfBm.id);
        return;
      }
    }
    removeBookmark(verseKey);
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      <Navbar />

      <main className="max-w-3xl px-6 pt-24 mx-auto space-y-10">
        {/* Back */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Dashboard
        </Link>

        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-5"
        >
          <div className="w-16 h-16 overflow-hidden border shrink-0 rounded-2xl border-accent/30">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={fullName}
                className="object-cover w-full h-full"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div
              className={`flex items-center justify-center w-full h-full bg-accent/15 ${photoUrl ? 'hidden' : ''}`}
            >
              <span className="text-xl font-bold text-accent">{initials}</span>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{fullName}</h1>
            {username && <p className="text-sm text-accent font-medium mt-0.5">@{username}</p>}
            {email && <p className="text-sm text-muted-foreground mt-0.5">{email}</p>}
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="text-foreground/70">
                <span className="font-bold text-foreground">{followersData?.total ?? '—'}</span>{' '}
                followers
              </span>
              <span className="text-foreground/70">
                <span className="font-bold text-foreground">{followingData?.total ?? '—'}</span>{' '}
                following
              </span>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            icon={<Flame className="w-4 h-4" />}
            label="Streak"
            value={`${activeStreak}d`}
            accent
          />
          <StatCard
            icon={<BookOpen className="w-4 h-4" />}
            label="Verses Read"
            value={`${stats.totalVersesRead}`}
          />
          <StatCard
            icon={<BookMarked className="w-4 h-4" />}
            label="Bookmarks"
            value={`${cloudStats?.bookmarksCount ?? bookmarkKeys.length}`}
          />
          <StatCard
            icon={<PenSquare className="w-4 h-4" />}
            label="Notes"
            value={`${cloudStats?.notesCount ?? stats.totalReflections}`}
          />
        </div>

        {/* Cloud reading stats */}
        {isAuthenticated && cloudStats && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <StatCard
              icon={<Clock className="w-4 h-4" />}
              label="Time Read"
              value={fmtTime(cloudStats.totalSecondsRead)}
            />
            <StatCard
              icon={<BookOpen className="w-4 h-4" />}
              label="Pages Read"
              value={`${cloudStats.totalPagesRead}`}
            />
            <StatCard
              icon={<Target className="w-4 h-4" />}
              label="Active Days"
              value={`${cloudStats.activityDaysCount}`}
            />
          </div>
        )}

        {/* Bookmarks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Bookmarked Verses</h2>
            {bookmarkKeys.length > 0 && (
              <span className="text-xs text-muted-foreground">{bookmarkKeys.length} saved</span>
            )}
          </div>

          {bookmarksLoading && isAuthenticated ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : bookmarkKeys.length === 0 ? (
            <div className="py-16 text-center border border-border rounded-xl bg-card">
              <BookMarked className="mx-auto mb-3 w-7 h-7 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">No bookmarks yet.</p>
              <p className="mt-1 text-xs text-muted-foreground opacity-70">
                Bookmark verses while reading to save them here.
              </p>
              <Link href="/quran" className="inline-block mt-4 text-xs text-accent hover:underline">
                Start reading →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {bookmarkQueries.map((query, i) => {
                const verseKey = bookmarkKeys[i];
                const handleNavigate = () => {
                  const [chapter] = verseKey.split(':').map(Number);
                  setCurrentChapterId(chapter);
                  setCurrentVerseKey(verseKey);
                  router.push(`/quran?verse=${verseKey}`);
                };
                return (
                  <motion.div
                    key={verseKey}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={handleNavigate}
                    className="p-5 transition-colors border cursor-pointer rounded-xl border-border bg-card card-highlight group hover:border-accent/40"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-2">
                        <p className="text-xs font-medium text-accent">{verseKey}</p>

                        {query.isLoading ? (
                          <div className="pt-1 space-y-2 animate-pulse">
                            <div className="w-full h-5 rounded bg-border" />
                            <div className="w-3/4 h-3 rounded bg-border" />
                          </div>
                        ) : query.data ? (
                          <>
                            <p className="font-arabic text-xl text-right text-foreground leading-[2.2]">
                              {query.data.text_uthmani}
                            </p>
                            {query.data.translations?.[0] && (
                              <p className="text-sm leading-relaxed text-muted-foreground">
                                {(query.data.translations[0] as { text?: string }).text?.replace(
                                  /<[^>]*>?/gm,
                                  ''
                                )}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">{verseKey}</p>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(verseKey);
                        }}
                        disabled={deleteQFBookmark.isPending}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100 shrink-0 mt-0.5"
                        title="Remove bookmark"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* My Posts */}
        {isAuthenticated && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">My Reflections</h2>
              {myPostsData && (
                <span className="text-xs text-muted-foreground">{myPostsData.total} posts</span>
              )}
            </div>

            {myPostsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : !myPostsData?.data?.length ? (
              <div className="py-16 text-center border border-border rounded-xl bg-card">
                <PenSquare className="mx-auto mb-3 w-7 h-7 text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground">No reflections yet.</p>
                <Link
                  href="/reflections"
                  className="inline-block mt-4 text-xs text-accent hover:underline"
                >
                  Write your first reflection →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myPostsData.data.map((post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="p-5 border rounded-xl border-border bg-card card-highlight"
                  >
                    <div
                      className="text-sm text-foreground/80 leading-relaxed line-clamp-3 whitespace-pre-line"
                      dangerouslySetInnerHTML={{ __html: post.body }}
                    />
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.createdAt).toLocaleDateString('en', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {post.commentsCount}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Activity summary — local fallback when no cloud data */}
        {(!isAuthenticated || !cloudStats) && (
          <div className="p-5 space-y-3 border rounded-xl border-border bg-card card-highlight">
            <h2 className="text-base font-semibold text-foreground">Reading Activity</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Today</p>
                <p className="font-medium text-foreground mt-0.5">{stats.progressToday} verses</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Daily Goal</p>
                <p className="font-medium text-foreground mt-0.5">{stats.dailyGoal} verses</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Days</p>
                <p className="font-medium text-foreground mt-0.5">
                  {Object.keys(stats.dailyActivity).length}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Streak</p>
                <p className="font-medium text-foreground mt-0.5">{activeStreak} days</p>
              </div>
            </div>
          </div>
        )}
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
