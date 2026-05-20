'use client';

import { FloatingLights } from '@/components/ui/floating-lights';
import { Navbar } from '@/components/layout/navbar';
import { JournalEditor } from '@/components/reflections/journal-editor';
import { GlassCard } from '@/components/ui/glass-card';
import {
  useAllNotes,
  useCommentReplies,
  useCreateComment,
  useDeleteNote,
  useFollowUser,
  usePostComments,
  usePostsFeed,
  useQFProfile,
  useToggleLike,
  useToggleSave,
  useUnfollowUser,
  type QFComment
} from '@/apiService/quranFoundationService/hooks';
import type { QFPost } from '@/apiService/quranFoundationService/qfService';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';
import {
  MessageSquare,
  Calendar,
  Filter,
  Heart as HeartIcon,
  Bookmark,
  PenSquare,
  Trash2,
  LogIn,
  Loader2,
  Send,
  ChevronUp
} from 'lucide-react';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export default function ReflectionsPage() {
  const { isAuthenticated, login } = useAuth();
  const { data: notes, isLoading: notesLoading } = useAllNotes();
  const deleteNote = useDeleteNote('');

  const noteCount = notes?.length ?? 0;
  const thisMonthCount =
    notes?.filter((n) => {
      const d = new Date(n.createdAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length ?? 0;

  return (
    <div className="relative min-h-screen">
      <FloatingLights />
      <Navbar />

      <section className="pt-32 px-6 max-w-6xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Your <span className="text-gradient">Reflections</span>
            </h1>
            <p className="text-foreground/60 max-w-xl">
              A private space to document your spiritual growth and lessons learned from the Divine
              Word.
            </p>
          </div>
          <div className="flex gap-4">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl glass text-sm font-bold">
              <Calendar className="w-4 h-4" /> History
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl glass text-sm font-bold">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Editor Column */}
          <div className="lg:col-span-2 space-y-12">
            <JournalEditor />

            {/* My Notes from QF */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-accent" />
                My Verse Notes
              </h3>

              {!isAuthenticated ? (
                <div className="flex flex-col items-center gap-4 py-12 text-center border border-border rounded-2xl bg-card/40">
                  <PenSquare className="w-7 h-7 text-muted-foreground opacity-40" />
                  <p className="text-sm text-muted-foreground">Sign in to see your verse notes.</p>
                  <button
                    onClick={login}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </button>
                </div>
              ) : notesLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : notes && notes.length > 0 ? (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <GlassCard key={note.id} className="p-6 space-y-3 group">
                      <div className="flex justify-between items-start gap-4">
                        <span className="text-xs font-bold text-accent tracking-widest uppercase">
                          {note.ranges?.[0]?.split('-')[0] ?? '—'}
                        </span>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-foreground/40">
                            {formatDate(note.createdAt)}
                          </span>
                          <button
                            onClick={() => deleteNote.mutate(note.id)}
                            disabled={deleteNote.isPending}
                            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                        {note.body}
                      </p>
                    </GlassCard>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center border border-border rounded-2xl bg-card/40">
                  <p className="text-sm text-muted-foreground">
                    No notes yet. Add them from the verse detail panel while reading.
                  </p>
                </div>
              )}
            </div>

            {/* Community Feed */}
            <CommunityFeed />
          </div>

          {/* Stats Column */}
          <aside className="space-y-8">
            <GlassCard className="p-6 space-y-6">
              <h3 className="font-bold">Reflection Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-primary/10 text-center space-y-1">
                  <p className="text-2xl font-bold">{noteCount}</p>
                  <p className="text-[10px] uppercase tracking-widest opacity-60">Total</p>
                </div>
                <div className="p-4 rounded-2xl bg-accent/10 text-center space-y-1">
                  <p className="text-2xl font-bold">{thisMonthCount}</p>
                  <p className="text-[10px] uppercase tracking-widest opacity-60">This Month</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6 space-y-6">
              <h3 className="font-bold">Writing Prompts</h3>
              <ul className="space-y-4 text-sm text-foreground/70 leading-relaxed">
                <li className="flex gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5" />
                  What was the highlight of your connection with the Quran today?
                </li>
                <li className="flex gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5" />
                  Which attribute of Allah stood out to you in your reading?
                </li>
              </ul>
            </GlassCard>
          </aside>
        </div>
      </section>
    </div>
  );
}

function CommunityFeed() {
  const { isAuthenticated, login } = useAuth();
  const { data: myProfile } = useQFProfile();
  const [feedTab, setFeedTab] = useState<'trending' | 'following'>('trending');
  const { data, isLoading } = usePostsFeed({ tab: feedTab, limit: 10 });
  const toggleLike = useToggleLike();
  const toggleSave = useToggleSave();
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const posts = data?.data ?? [];

  const handleFollow = async (authorId: string, isFollowing: boolean) => {
    if (isFollowing || followedIds.has(authorId)) {
      await unfollowUser.mutateAsync(authorId);
      setFollowedIds((prev) => {
        const next = new Set<string>(prev);
        next.delete(authorId);
        return next;
      });
    } else {
      await followUser.mutateAsync(authorId);
      setFollowedIds((prev) => new Set<string>(prev).add(authorId));
    }
  };

  return (
    <div className="space-y-8 pt-8 border-t border-white/5">
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <h3 className="text-2xl font-bold">Community Reflections</h3>
          <p className="text-sm text-foreground/40 font-bold uppercase tracking-widest">
            {feedTab === 'following' ? 'From people you follow' : 'Trending from the global Ummah'}
          </p>
        </div>
        {data && isAuthenticated && (
          <span className="text-xs text-muted-foreground">{data.total} posts</span>
        )}
      </div>

      {isAuthenticated && (
        <div className="flex gap-1 p-1 rounded-xl bg-primary/30 w-fit">
          {(['trending', 'following'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFeedTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${
                feedTab === tab
                  ? 'bg-accent text-accent-foreground'
                  : 'text-foreground/50 hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {!isAuthenticated ? (
        <div className="flex flex-col items-center gap-4 py-12 text-center border border-border rounded-2xl bg-card/40">
          <MessageSquare className="w-7 h-7 text-muted-foreground opacity-40" />
          <p className="text-sm text-muted-foreground">Sign in to see community reflections.</p>
          <button
            onClick={login}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            <LogIn className="w-4 h-4" /> Sign In
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {isLoading ? (
            Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-40 w-full glass animate-pulse rounded-3xl" />
            ))
          ) : posts.length === 0 ? (
            <div className="py-12 text-center border border-border rounded-2xl bg-card/40">
              <p className="text-sm text-muted-foreground">
                {feedTab === 'following'
                  ? 'No posts from people you follow yet. Follow someone below!'
                  : 'No community reflections yet.'}
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                myProfileId={myProfile?.id}
                followedIds={followedIds}
                onFollow={handleFollow}
                followPending={followUser.isPending || unfollowUser.isPending}
                onToggleLike={(id) => toggleLike.mutate(id)}
                onToggleSave={(id) => toggleSave.mutate(id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

function PostCard({
  post,
  myProfileId,
  followedIds,
  onFollow,
  followPending,
  onToggleLike,
  onToggleSave
}: {
  post: QFPost;
  myProfileId?: string;
  followedIds: Set<string>;
  onFollow: (authorId: string, isFollowing: boolean) => void;
  followPending: boolean;
  onToggleLike: (id: number) => void;
  onToggleSave: (id: number) => void;
}) {
  const [commentsOpen, setCommentsOpen] = useState(false);

  const a = post.author;
  const fullName =
    [a?.firstName, a?.lastName].filter(Boolean).join(' ') || a?.username || 'Anonymous';
  const avatarUrl = a?.avatarUrls?.small;
  const initials = (a?.firstName?.[0] ?? a?.username?.[0] ?? '?').toUpperCase();
  const ref = post.references?.[0];
  const typeLabel = post.postTypeName ?? (post.postTypeId === 2 ? 'Lesson' : 'Reflection');
  const authorId = a?.id;
  const isOwnPost = authorId && myProfileId === authorId;
  const isFollowed = followedIds.has(authorId ?? '');

  return (
    <GlassCard className="border-white/5 hover:border-accent/20 transition-all group">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-primary/20 overflow-hidden flex items-center justify-center text-accent font-bold text-sm shrink-0 border border-border">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <span className={avatarUrl ? 'hidden' : ''}>{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm truncate">{fullName}</p>
              {a?.verified && <span className="text-[10px] text-accent font-bold shrink-0">✓</span>}
              {!isOwnPost && authorId && (
                <button
                  onClick={() => onFollow(authorId, isFollowed)}
                  disabled={followPending}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors shrink-0 ${
                    isFollowed
                      ? 'bg-accent/15 text-accent'
                      : 'bg-primary/40 text-foreground/50 hover:bg-accent/10 hover:text-accent'
                  }`}
                >
                  {isFollowed ? 'Following' : '+ Follow'}
                </button>
              )}
            </div>
            <p className="text-xs text-foreground/40">
              {new Date(post.createdAt).toLocaleDateString('en', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {ref && (
              <span className="text-xs font-bold text-accent px-2.5 py-1 rounded-full bg-accent/10">
                {ref.chapterId}:{ref.from}
                {ref.to !== ref.from ? `–${ref.to}` : ''}
              </span>
            )}
            <span className="text-xs text-muted-foreground px-2.5 py-1 rounded-full border border-border">
              {typeLabel}
            </span>
          </div>
        </div>

        {/* Body */}
        <div
          className="text-foreground/80 text-sm leading-relaxed line-clamp-4 group-hover:line-clamp-none transition-all whitespace-pre-line"
          dangerouslySetInnerHTML={{ __html: post.body }}
        />

        {/* Footer */}
        <div className="flex items-center gap-4 mt-5 pt-4 border-t border-white/5">
          <button
            onClick={() => onToggleLike(post.id)}
            className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
              post.isLiked ? 'text-rose-500' : 'text-foreground/40 hover:text-rose-500'
            }`}
          >
            <HeartIcon className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
            {post.likesCount}
          </button>
          <button
            onClick={() => setCommentsOpen((v) => !v)}
            className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
              commentsOpen ? 'text-accent' : 'text-foreground/40 hover:text-accent'
            }`}
          >
            {commentsOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <MessageSquare className="w-4 h-4" />
            )}
            {post.commentsCount}
          </button>
          <button
            onClick={() => onToggleSave(post.id)}
            className={`ml-auto flex items-center gap-1.5 text-xs font-semibold transition-colors ${
              post.isSaved ? 'text-accent' : 'text-foreground/40 hover:text-accent'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${post.isSaved ? 'fill-current' : ''}`} />
            {post.isSaved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      {/* Inline comments panel */}
      {commentsOpen && <CommentsPanel postId={post.id} />}
    </GlassCard>
  );
}

// ─── CommentsPanel ────────────────────────────────────────────────────────────

function CommentsPanel({ postId }: { postId: number }) {
  const { data, isLoading } = usePostComments(postId);
  const createComment = useCreateComment();
  const [text, setText] = useState('');
  const comments: QFComment[] = data?.comments ?? [];

  const handleSubmit = async () => {
    if (!text.trim()) return;
    await createComment.mutateAsync({ postId, body: text.trim() });
    setText('');
  };

  return (
    <div className="border-t border-border px-6 pb-5 pt-4 space-y-4 bg-card/40">
      {/* Compose */}
      <div className="flex gap-2 items-end">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Write a comment…"
          rows={1}
          className="flex-1 resize-none rounded-xl border border-border bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-muted-foreground/50"
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || createComment.isPending}
          className="p-2 rounded-xl bg-accent text-accent-foreground disabled:opacity-40 hover:bg-accent/90 transition-colors shrink-0"
        >
          {createComment.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">
          No comments yet. Be the first!
        </p>
      ) : (
        <div className="space-y-1 max-h-96 overflow-y-auto custom-scrollbar pr-1">
          {comments.map((c) => (
            <CommentRow key={c.id} comment={c} postId={postId} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CommentRow ───────────────────────────────────────────────────────────────

function CommentRow({
  comment: c,
  postId,
  depth = 0
}: {
  comment: QFComment;
  postId: number;
  depth?: number;
}) {
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyBoxOpen, setReplyBoxOpen] = useState(false);
  const { data: repliesData, isLoading: repliesLoading } = useCommentReplies(
    repliesOpen ? c.id : null
  );
  const createComment = useCreateComment();

  const name =
    [c.author?.firstName, c.author?.lastName].filter(Boolean).join(' ') ||
    c.author?.username ||
    'Anonymous';
  const av = c.author?.avatarUrls?.small;
  const ini = (c.author?.firstName?.[0] ?? c.author?.username?.[0] ?? '?').toUpperCase();
  const replies: QFComment[] = repliesData?.data ?? [];

  const handleReply = async () => {
    if (!replyText.trim()) return;
    await createComment.mutateAsync({ postId, body: replyText.trim(), parentId: c.id });
    setReplyText('');
    setReplyBoxOpen(false);
    setRepliesOpen(true);
  };

  return (
    <div className={depth > 0 ? 'ml-8 border-l border-border pl-3' : ''}>
      <div className="flex gap-2.5 py-2">
        <div className="w-7 h-7 rounded-full bg-primary/30 overflow-hidden flex items-center justify-center text-accent font-bold text-[10px] shrink-0 border border-border mt-0.5">
          {av ? (
            <img
              src={av}
              alt={name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <span className={av ? 'hidden' : ''}>{ini}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-semibold text-foreground">{name}</span>
            <span className="text-[10px] text-foreground/30">
              {new Date(c.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <p className="text-xs text-foreground/70 leading-relaxed mt-0.5 whitespace-pre-wrap">
            {c.body}
          </p>
          <div className="flex items-center gap-3 mt-1.5">
            {depth === 0 && (
              <button
                onClick={() => setReplyBoxOpen((v) => !v)}
                className="text-[10px] text-foreground/40 hover:text-accent transition-colors font-medium"
              >
                Reply
              </button>
            )}
            {(c.repliesCount ?? 0) > 0 && depth === 0 && (
              <button
                onClick={() => setRepliesOpen((v) => !v)}
                className="text-[10px] text-foreground/40 hover:text-accent transition-colors font-medium"
              >
                {repliesOpen
                  ? 'Hide replies'
                  : `View ${c.repliesCount} ${c.repliesCount === 1 ? 'reply' : 'replies'}`}
              </button>
            )}
          </div>

          {/* Inline reply box */}
          {replyBoxOpen && (
            <div className="flex gap-2 mt-2 items-end">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleReply();
                  }
                }}
                placeholder={`Reply to ${name}…`}
                rows={1}
                className="flex-1 resize-none rounded-lg border border-border bg-background text-foreground px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-muted-foreground/50"
              />
              <button
                onClick={handleReply}
                disabled={!replyText.trim() || createComment.isPending}
                className="p-1.5 rounded-lg bg-accent text-accent-foreground disabled:opacity-40 hover:bg-accent/90 transition-colors shrink-0"
              >
                {createComment.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {repliesOpen && (
        <div className="space-y-0">
          {repliesLoading ? (
            <div className="flex justify-center py-2 ml-8">
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
            </div>
          ) : (
            replies.map((r) => (
              <CommentRow key={r.id} comment={r} postId={postId} depth={depth + 1} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
