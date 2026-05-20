'use client';

import { Navbar } from '@/components/layout/navbar';
import { useAuth } from '@/lib/auth-context';
import {
  useMyRooms,
  useSearchRooms,
  useRoomMembers,
  useRoomPosts,
  useCreateGroup,
  useCreateRoomPage,
  useJoinGroup,
  useLeaveGroup,
  useFollowPage,
  useUnfollowPage,
  useInviteToRoom,
  type QFRoom
} from '@/apiService/quranFoundationService/hooks';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Plus,
  LogIn,
  Loader2,
  Globe,
  Lock,
  BookOpen,
  ChevronLeft,
  UserPlus,
  X,
  FileText,
  MessageSquare,
  Crown,
  UserCheck
} from 'lucide-react';
import { useState } from 'react';

type Tab = 'my-rooms' | 'discover';
type CreateType = 'group' | 'page';

// ─── Room card ────────────────────────────────────────────────────────────────

function RoomCard({
  room,
  onClick,
  onJoin,
  onLeave,
  onFollow,
  onUnfollow,
  isPending
}: {
  room: QFRoom;
  onClick: () => void;
  onJoin: () => void;
  onLeave: () => void;
  onFollow: () => void;
  onUnfollow: () => void;
  isPending: boolean;
}) {
  const isGroup = room.type === 'group';
  const isMember = room.is_member || room.is_following;

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGroup) {
      isMember ? onLeave() : onJoin();
    } else {
      isMember ? onUnfollow() : onFollow();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-xl border border-border bg-card card-highlight group cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
          {isGroup ? <Users className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground truncate">{room.name}</p>
            <span
              className={cn(
                'text-[10px] font-medium px-1.5 py-0.5 rounded-full border',
                isGroup
                  ? 'text-blue-400 border-blue-400/30 bg-blue-400/10'
                  : 'text-purple-400 border-purple-400/30 bg-purple-400/10'
              )}
            >
              {isGroup ? 'Group' : 'Page'}
            </span>
            {!room.is_public && <Lock className="w-3 h-3 text-muted-foreground" />}
          </div>

          {room.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{room.description}</p>
          )}

          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-muted-foreground">
              {isGroup
                ? `${room.members_count ?? 0} members`
                : `${room.followers_count ?? 0} followers`}
            </span>
            {room.country && <span className="text-xs text-muted-foreground">{room.country}</span>}
          </div>
        </div>

        <button
          onClick={handleAction}
          disabled={isPending || room.is_admin}
          className={cn(
            'shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40',
            isMember
              ? 'text-muted-foreground border border-border hover:text-destructive hover:border-destructive/40'
              : 'bg-accent text-accent-foreground hover:bg-accent/90'
          )}
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isMember ? (
            isGroup ? (
              'Leave'
            ) : (
              'Unfollow'
            )
          ) : isGroup ? (
            'Join'
          ) : (
            'Follow'
          )}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Room detail panel ────────────────────────────────────────────────────────

function RoomDetail({ room, onBack }: { room: QFRoom; onBack: () => void }) {
  const { data: members, isLoading: membersLoading } = useRoomMembers(room.id);
  const { data: posts, isLoading: postsLoading } = useRoomPosts(room.id);
  const inviteUser = useInviteToRoom(room.id);

  const [detailTab, setDetailTab] = useState<'posts' | 'members'>('posts');
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInvite, setShowInvite] = useState(false);

  const handleInvite = async () => {
    const value = inviteEmail.trim();
    if (!value) return;
    const isEmail = value.includes('@');
    await inviteUser.mutateAsync({
      userIds: isEmail ? [] : [value],
      emails: isEmail ? [value] : []
    });
    setInviteEmail('');
    setShowInvite(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            {room.type === 'group' ? (
              <Users className="w-4 h-4" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{room.name}</h2>
            {room.description && (
              <p className="text-xs text-muted-foreground">{room.description}</p>
            )}
          </div>
        </div>
        {room.is_admin && (
          <button
            onClick={() => setShowInvite(true)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent text-xs font-medium hover:bg-accent/20 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Invite
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="flex gap-4">
        <div className="px-4 py-3 rounded-xl border border-border bg-card text-center flex-1">
          <p className="text-xl font-bold text-foreground">
            {room.type === 'group' ? (room.members_count ?? 0) : (room.followers_count ?? 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {room.type === 'group' ? 'Members' : 'Followers'}
          </p>
        </div>
        <div className="px-4 py-3 rounded-xl border border-border bg-card text-center flex-1">
          <p className="text-xl font-bold text-foreground">{posts?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Posts</p>
        </div>
        <div className="px-4 py-3 rounded-xl border border-border bg-card text-center flex-1">
          <div className="flex items-center justify-center gap-1">
            {room.is_public ? (
              <Globe className="w-4 h-4 text-accent" />
            ) : (
              <Lock className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {room.is_public ? 'Public' : 'Private'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-primary border border-border">
        {(['posts', 'members'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setDetailTab(t)}
            className={cn(
              'flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize',
              detailTab === t
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Posts */}
      {detailTab === 'posts' && (
        <div className="space-y-3">
          {postsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : posts && posts.length > 0 ? (
            posts.map((post) => (
              <div key={post.id} className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-xs font-semibold text-accent">
                    {(post.first_name?.[0] ?? post.username?.[0] ?? '?').toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      {[post.first_name, post.last_name].filter(Boolean).join(' ') ||
                        post.username ||
                        'Anonymous'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString('en', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  {post.verse_key && (
                    <span className="ml-auto text-[10px] text-accent font-medium border border-accent/20 px-1.5 py-0.5 rounded-full">
                      {post.verse_key}
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{post.body}</p>
              </div>
            ))
          ) : (
            <div className="py-10 text-center">
              <MessageSquare className="mx-auto w-7 h-7 text-muted-foreground opacity-30 mb-2" />
              <p className="text-sm text-muted-foreground">No posts yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Members */}
      {detailTab === 'members' && (
        <div className="space-y-2">
          {membersLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : members && members.length > 0 ? (
            members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
              >
                <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-xs font-semibold text-accent shrink-0">
                  {(member.first_name?.[0] ?? member.username?.[0] ?? '?').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {[member.first_name, member.last_name].filter(Boolean).join(' ') ||
                      member.username ||
                      'Anonymous'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Joined{' '}
                    {new Date(member.joined_at).toLocaleDateString('en', {
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                {member.is_admin && (
                  <div className="flex items-center gap-1 text-accent text-[10px] font-medium">
                    <Crown className="w-3 h-3" />
                    Admin
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-10 text-center">
              <UserCheck className="mx-auto w-7 h-7 text-muted-foreground opacity-30 mb-2" />
              <p className="text-sm text-muted-foreground">No members yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Invite modal */}
      <AnimatePresence>
        {showInvite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInvite(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 12 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Invite Member</h3>
                <button
                  onClick={() => setShowInvite(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Email or user ID"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                onClick={handleInvite}
                disabled={!inviteEmail.trim() || inviteUser.isPending}
                className="w-full py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-semibold disabled:opacity-40 hover:bg-accent/90 transition-colors"
              >
                {inviteUser.isPending ? 'Sending…' : 'Send Invite'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Create room modal ────────────────────────────────────────────────────────

function CreateRoomModal({
  onClose,
  defaultType
}: {
  onClose: () => void;
  defaultType: CreateType;
}) {
  const [createType, setCreateType] = useState<CreateType>(defaultType);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const createGroup = useCreateGroup();
  const createPage = useCreateRoomPage();

  const handleSubmit = async () => {
    if (!name.trim() || !url.trim()) return;
    if (createType === 'group') {
      await createGroup.mutateAsync({
        name: name.trim(),
        url: url.trim(),
        description: description.trim() || undefined,
        public: isPublic
      });
    } else {
      await createPage.mutateAsync({
        name: name.trim(),
        url: url.trim(),
        description: description.trim() || undefined
      });
    }
    onClose();
  };

  const isPending = createGroup.isPending || createPage.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 12 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Create Room</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Type selector */}
        <div className="flex gap-2">
          {(['group', 'page'] as CreateType[]).map((t) => (
            <button
              key={t}
              onClick={() => setCreateType(t)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border transition-colors capitalize',
                createType === t
                  ? 'bg-accent/10 border-accent/30 text-accent'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {t === 'group' ? (
                <Users className="w-3.5 h-3.5" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              {t}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={createType === 'group' ? 'Group name' : 'Page name'}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URL slug (e.g. my-group)"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
          {createType === 'group' && (
            <button
              onClick={() => setIsPublic((p) => !p)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isPublic ? <Globe className="w-4 h-4 text-accent" /> : <Lock className="w-4 h-4" />}
              {isPublic ? 'Public group' : 'Private group'}
            </button>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!name.trim() || !url.trim() || isPending}
          className="w-full py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-semibold disabled:opacity-40 hover:bg-accent/90 transition-colors"
        >
          {isPending ? 'Creating…' : `Create ${createType === 'group' ? 'Group' : 'Page'}`}
        </button>
      </motion.div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RoomsPage() {
  const { isAuthenticated, login } = useAuth();
  const [tab, setTab] = useState<Tab>('my-rooms');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<QFRoom | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: myRooms, isLoading: myLoading } = useMyRooms();
  const { data: searchResults, isFetching: searchFetching } = useSearchRooms(searchQuery);

  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();
  const followPage = useFollowPage();
  const unfollowPage = useUnfollowPage();

  const rooms = tab === 'my-rooms' ? (myRooms ?? []) : (searchResults ?? []);
  const isLoading = tab === 'my-rooms' ? myLoading : searchFetching;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      <main className="pt-24 px-6 max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <AnimatePresence mode="wait">
          {selectedRoom ? (
            <RoomDetail key="detail" room={selectedRoom} onBack={() => setSelectedRoom(null)} />
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end justify-between"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-accent uppercase tracking-wide">
                    Community
                  </p>
                  <h1 className="text-4xl font-bold tracking-tight">Rooms</h1>
                  <p className="text-muted-foreground text-sm">
                    Join groups and follow pages to share reflections.
                  </p>
                </div>
                {isAuthenticated && (
                  <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    New
                  </button>
                )}
              </motion.div>

              {/* Not signed in */}
              {!isAuthenticated && (
                <div className="py-16 text-center border border-border rounded-2xl bg-card space-y-4">
                  <Users className="mx-auto w-8 h-8 text-muted-foreground opacity-40" />
                  <p className="text-sm text-muted-foreground">
                    Sign in to join groups and follow pages.
                  </p>
                  <button
                    onClick={login}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </button>
                </div>
              )}

              {isAuthenticated && (
                <>
                  {/* Tabs */}
                  <div className="flex gap-1 p-1 rounded-xl bg-primary border border-border">
                    {(
                      [
                        {
                          id: 'my-rooms',
                          label: 'My Rooms',
                          icon: <BookOpen className="w-3.5 h-3.5" />
                        },
                        {
                          id: 'discover',
                          label: 'Discover',
                          icon: <Globe className="w-3.5 h-3.5" />
                        }
                      ] as { id: Tab; label: string; icon: React.ReactNode }[]
                    ).map(({ id, label, icon }) => (
                      <button
                        key={id}
                        onClick={() => setTab(id)}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors',
                          tab === id
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {icon}
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Search bar (Discover tab) */}
                  {tab === 'discover' && (
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search groups and pages…"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                      {searchFetching && (
                        <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  )}

                  {/* Room list */}
                  <div className="space-y-3">
                    {isLoading ? (
                      <div className="flex justify-center py-16">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : rooms.length > 0 ? (
                      rooms.map((room) => (
                        <RoomCard
                          key={room.id}
                          room={room}
                          onClick={() => setSelectedRoom(room)}
                          onJoin={() => joinGroup.mutate(room.id)}
                          onLeave={() => leaveGroup.mutate(room.id)}
                          onFollow={() => followPage.mutate(room.id)}
                          onUnfollow={() => unfollowPage.mutate(room.id)}
                          isPending={
                            joinGroup.isPending ||
                            leaveGroup.isPending ||
                            followPage.isPending ||
                            unfollowPage.isPending
                          }
                        />
                      ))
                    ) : tab === 'my-rooms' ? (
                      <div className="py-16 text-center border border-border rounded-xl bg-card">
                        <Users className="mx-auto mb-3 w-7 h-7 text-muted-foreground opacity-40" />
                        <p className="text-sm text-muted-foreground">
                          You haven&apos;t joined any rooms yet.
                        </p>
                        <button
                          onClick={() => setTab('discover')}
                          className="mt-4 text-xs text-accent hover:underline"
                        >
                          Discover rooms →
                        </button>
                      </div>
                    ) : searchQuery.trim().length > 1 ? (
                      <div className="py-16 text-center border border-border rounded-xl bg-card">
                        <Search className="mx-auto mb-3 w-7 h-7 text-muted-foreground opacity-40" />
                        <p className="text-sm text-muted-foreground">No rooms found.</p>
                      </div>
                    ) : (
                      <div className="py-16 text-center border border-border rounded-xl bg-card">
                        <Search className="mx-auto mb-3 w-7 h-7 text-muted-foreground opacity-40" />
                        <p className="text-sm text-muted-foreground">
                          Search for public groups and pages.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Create room modal */}
      <AnimatePresence>
        {showCreate && <CreateRoomModal onClose={() => setShowCreate(false)} defaultType="group" />}
      </AnimatePresence>
    </div>
  );
}
