import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { wrappedService } from './wrappedService';
import {
  activityService,
  bookmarksService,
  collectionsService,
  commentsService,
  followersService,
  goalsService,
  notesService,
  postsService,
  readingSessionsService,
  roomsService,
  userService,
  type QFComment,
  type QFGoal,
  type QFPost,
  type QFPostFeedParams,
  type QFPostReference,
  type QFProfilePatchData,
  type QFProfileUpdateData,
  type QFRoom
} from './qfService';

// ─── Wrapped / Streak / Profile (existing) ────────────────────────────────────

export function useQFProfile() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['qf-profile'],
    queryFn: () => wrappedService.getProfile(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5
  });
}

export function useQFStreaks() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['qf-streaks'],
    queryFn: () => wrappedService.getStreaks(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5
  });
}

export function useQFCurrentStreak() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['qf-current-streak'],
    queryFn: () => activityService.getCurrentStreak(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5
  });
}

export function useQFWrappedInsights() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['qf-wrapped-insights'],
    queryFn: () => wrappedService.getWrappedInsights(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 10
  });
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export function useQFActivityDays(limit = 30) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['qf-activity', limit],
    queryFn: () => activityService.getDays(limit),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 10
  });
}

export function useLogActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ seconds, ranges }: { seconds: number; ranges: string[] }) =>
      activityService.log(seconds, ranges),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qf-activity'] })
  });
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export function useVerseNotes(verseKey: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['qf-notes', verseKey],
    queryFn: () => notesService.getByVerse(verseKey),
    enabled: isAuthenticated && !!verseKey,
    staleTime: 1000 * 60
  });
}

export function useAllNotes() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['qf-notes-all'],
    queryFn: () => notesService.getAll(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5
  });
}

export function useCreateNote(verseKey: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => notesService.create(verseKey, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qf-notes', verseKey] });
      qc.invalidateQueries({ queryKey: ['qf-notes-all'] });
    }
  });
}

export function useDeleteNote(verseKey: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notesService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qf-notes', verseKey] });
      qc.invalidateQueries({ queryKey: ['qf-notes-all'] });
    }
  });
}

// ─── Bookmarks ────────────────────────────────────────────────────────────────

export function useQFBookmarks() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['qf-bookmarks'],
    queryFn: () => bookmarksService.getAll(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2
  });
}

export function useAddQFBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (verseKey: string) => bookmarksService.add(verseKey),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qf-bookmarks'] })
  });
}

export function useDeleteQFBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => bookmarksService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qf-bookmarks'] })
  });
}

// ─── Collections ─────────────────────────────────────────────────────────────

export function useQFCollections() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['qf-collections'],
    queryFn: () => collectionsService.getAll(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5
  });
}

export function useCreateCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      collectionsService.create(name, description),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qf-collections'] })
  });
}

export function useDeleteCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => collectionsService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qf-collections'] })
  });
}

export function useAddToCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ collectionId, verseKey }: { collectionId: number; verseKey: string }) =>
      collectionsService.addBookmark(collectionId, verseKey),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qf-collections'] })
  });
}

// ─── Goals ────────────────────────────────────────────────────────────────────

export function useQFTodayGoalPlan() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['qf-today-goals'],
    queryFn: () => goalsService.getTodaysPlan(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (goal: Omit<QFGoal, 'id' | 'created_at'>) => goalsService.create(goal),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qf-goals'] });
      qc.invalidateQueries({ queryKey: ['qf-today-goals'] });
    }
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<QFGoal, 'id' | 'created_at'>> }) =>
      goalsService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qf-goals'] });
      qc.invalidateQueries({ queryKey: ['qf-today-goals'] });
    }
  });
}

// ─── Reading Sessions ─────────────────────────────────────────────────────────

export function useUpdateReadingSession() {
  return useMutation({
    mutationFn: ({ chapterNumber, verseNumber }: { chapterNumber: number; verseNumber: number }) =>
      readingSessionsService.update(chapterNumber, verseNumber)
  });
}

export function useReadingSessions() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['qf-reading-sessions'],
    queryFn: () => readingSessionsService.getAll(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => goalsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qf-goals'] });
      qc.invalidateQueries({ queryKey: ['qf-today-goals'] });
    }
  });
}

// ─── Rooms ────────────────────────────────────────────────────────────────────

export function useMyRooms() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['qf-rooms'],
    queryFn: () => roomsService.getMyRooms(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2
  });
}

export function useSearchRooms(q: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['qf-rooms-search', q],
    queryFn: () => roomsService.search(q),
    enabled: isAuthenticated && q.trim().length > 1,
    staleTime: 1000 * 30
  });
}

export function useRoomById(id: number | null) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['qf-room', id],
    queryFn: () => roomsService.getById(id!),
    enabled: isAuthenticated && id !== null,
    staleTime: 1000 * 60
  });
}

export function useRoomMembers(id: number | null) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['qf-room-members', id],
    queryFn: () => roomsService.getMembers(id!),
    enabled: isAuthenticated && id !== null,
    staleTime: 1000 * 60
  });
}

export function useRoomPosts(id: number | null) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['qf-room-posts', id],
    queryFn: () => roomsService.getPosts(id!),
    enabled: isAuthenticated && id !== null,
    staleTime: 1000 * 30
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; url: string; description?: string; public?: boolean }) =>
      roomsService.createGroup(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qf-rooms'] })
  });
}

export function useCreateRoomPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; url: string; description?: string }) =>
      roomsService.createPage(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qf-rooms'] })
  });
}

export function useJoinGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => roomsService.joinGroup(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qf-rooms'] });
      qc.invalidateQueries({ queryKey: ['qf-rooms-search'] });
      qc.invalidateQueries({ queryKey: ['qf-room'] });
    }
  });
}

export function useLeaveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => roomsService.leaveGroup(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qf-rooms'] });
      qc.invalidateQueries({ queryKey: ['qf-rooms-search'] });
      qc.invalidateQueries({ queryKey: ['qf-room'] });
    }
  });
}

export function useFollowPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => roomsService.followPage(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qf-rooms'] });
      qc.invalidateQueries({ queryKey: ['qf-rooms-search'] });
      qc.invalidateQueries({ queryKey: ['qf-room'] });
    }
  });
}

export function useUnfollowPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => roomsService.unfollowPage(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qf-rooms'] });
      qc.invalidateQueries({ queryKey: ['qf-rooms-search'] });
      qc.invalidateQueries({ queryKey: ['qf-room'] });
    }
  });
}

export function useInviteToRoom(roomId: number) {
  return useMutation({
    mutationFn: ({ userIds, emails }: { userIds: string[]; emails: string[] }) =>
      roomsService.inviteUser(roomId, userIds, emails)
  });
}

export function useAcceptRoomInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => roomsService.acceptInvite(token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qf-rooms'] })
  });
}

export function useRejectRoomInvite() {
  return useMutation({
    mutationFn: (token: string) => roomsService.rejectInvite(token)
  });
}

export function useRemoveRoomMember(roomId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => roomsService.removeMember(roomId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qf-room-members', roomId] })
  });
}

export function useUpdateRoomAdmin(roomId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) =>
      roomsService.updateAdminAccess(roomId, userId, isAdmin),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qf-room-members', roomId] })
  });
}

// ─── Posts (Quran Reflect) ────────────────────────────────────────────────────

export function usePostsFeed(params: QFPostFeedParams = {}) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['qr-posts-feed', params],
    queryFn: () => postsService.getFeed(params),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2
  });
}

export function useMyPosts(params: { tab?: string; page?: number; limit?: number } = {}) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['qr-my-posts', params],
    queryFn: () => postsService.getMyPosts(params),
    enabled: isAuthenticated,
    staleTime: 1000 * 60
  });
}

export function usePost(id: number | null) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['qr-post', id],
    queryFn: () => postsService.getById(id!),
    enabled: isAuthenticated && id !== null,
    staleTime: 1000 * 60 * 5
  });
}

export function usePostComments(postId: number | null) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['qr-post-comments', postId],
    queryFn: () => postsService.getComments(postId!),
    enabled: isAuthenticated && postId !== null,
    staleTime: 1000 * 30
  });
}

export function useRelatedPosts(postId: number | null) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['qr-related-posts', postId],
    queryFn: () => postsService.getRelated(postId!),
    enabled: isAuthenticated && postId !== null,
    staleTime: 1000 * 60 * 5
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      body: string;
      references?: QFPostReference[];
      draft?: boolean;
      roomId?: number;
      roomPostStatus?: 0 | 1 | 2;
    }) => postsService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qr-posts-feed'] });
      qc.invalidateQueries({ queryKey: ['qr-my-posts'] });
    }
  });
}

export function useEditPost(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      payload: Partial<{ body: string; references: QFPostReference[]; draft: boolean }>
    ) => postsService.edit(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qr-post', id] });
      qc.invalidateQueries({ queryKey: ['qr-posts-feed'] });
      qc.invalidateQueries({ queryKey: ['qr-my-posts'] });
    }
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => postsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qr-posts-feed'] });
      qc.invalidateQueries({ queryKey: ['qr-my-posts'] });
    }
  });
}

export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => postsService.toggleLike(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['qr-posts-feed'] });
      const prev = qc.getQueriesData<{ data: QFPost[] }>({ queryKey: ['qr-posts-feed'] });
      qc.setQueriesData<{ data: QFPost[] }>({ queryKey: ['qr-posts-feed'] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((p) =>
            p.id === id
              ? { ...p, isLiked: !p.isLiked, likesCount: p.likesCount + (p.isLiked ? -1 : 1) }
              : p
          )
        };
      });
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) ctx.prev.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['qr-posts-feed'] })
  });
}

export function useToggleSave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => postsService.toggleSave(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qr-posts-feed'] })
  });
}

// ─── User Profile Update ─────────────────────────────────────────────────────

export function useUpdateUserProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: QFProfileUpdateData) => userService.updateProfile(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qf-profile'] })
  });
}

export function usePatchUserProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: QFProfilePatchData) => userService.patchProfile(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qf-profile'] })
  });
}

// ─── Followers / Social ───────────────────────────────────────────────────────

export function useUserProfile(userId: string | null) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['qr-user-profile', userId],
    queryFn: () => followersService.getUserProfile(userId!),
    enabled: isAuthenticated && !!userId,
    staleTime: 1000 * 60 * 5
  });
}

export function useUserFollowers(
  userId: string | null,
  params?: { page?: number; limit?: number }
) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['qr-user-followers', userId, params],
    queryFn: () => followersService.getFollowers(userId!, params),
    enabled: isAuthenticated && !!userId,
    staleTime: 1000 * 60
  });
}

export function useUserFollowing(
  userId: string | null,
  params?: { page?: number; limit?: number }
) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['qr-user-following', userId, params],
    queryFn: () => followersService.getFollowing(userId!, params),
    enabled: isAuthenticated && !!userId,
    staleTime: 1000 * 60
  });
}

export function useFollowUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => followersService.toggleFollow(userId, 'follow'),
    onSuccess: (_data, userId) => {
      qc.invalidateQueries({ queryKey: ['qr-user-profile', userId] });
      qc.invalidateQueries({ queryKey: ['qr-posts-feed'] });
    }
  });
}

export function useUnfollowUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => followersService.toggleFollow(userId, 'unfollow'),
    onSuccess: (_data, userId) => {
      qc.invalidateQueries({ queryKey: ['qr-user-profile', userId] });
      qc.invalidateQueries({ queryKey: ['qr-posts-feed'] });
    }
  });
}

export function useRemoveFollower() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (followerId: string) => followersService.removeFollower(followerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qr-user-followers'] })
  });
}

export function useSuggestedUsers() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['qr-suggested-users'],
    queryFn: () => followersService.getSuggested(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 10
  });
}

export function useSearchUsers(q: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['qr-search-users', q],
    queryFn: () => followersService.searchUsers(q),
    enabled: isAuthenticated && q.trim().length > 1,
    staleTime: 1000 * 30
  });
}

// ─── Rooms — new endpoints ────────────────────────────────────────────────────

export function useRoomByUrl(url: string | null) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['qf-room-url', url],
    queryFn: () => roomsService.getByUrl(url!),
    enabled: isAuthenticated && !!url,
    staleTime: 1000 * 60
  });
}

export function useUpdateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data
    }: {
      id: number;
      data: {
        name?: string;
        description?: string;
        url?: string;
        public?: boolean;
        avatar?: string;
      };
    }) => roomsService.updateGroup(id, data),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['qf-room', id] });
      qc.invalidateQueries({ queryKey: ['qf-rooms'] });
    }
  });
}

export function useUpdateRoomPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data
    }: {
      id: number;
      data: {
        name?: string;
        description?: string;
        url?: string;
        avatar?: string;
        country?: string;
        public?: boolean;
      };
    }) => roomsService.updatePage(id, data),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['qf-room', id] });
      qc.invalidateQueries({ queryKey: ['qf-rooms'] });
    }
  });
}

export function useAcceptPrivateToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => roomsService.acceptPrivateToken(token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qf-rooms'] })
  });
}

export function useUpdatePostPrivacy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      postId,
      privacy
    }: {
      roomId: number;
      postId: number;
      privacy: 'public' | 'private' | 'room';
    }) => roomsService.updatePostPrivacy(roomId, postId, privacy),
    onSuccess: (_d, { roomId }) => qc.invalidateQueries({ queryKey: ['qf-room-posts', roomId] })
  });
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export function useCommentReplies(
  commentId: number | null,
  params?: { page?: number; limit?: number }
) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['qr-comment-replies', commentId, params],
    queryFn: () => commentsService.getReplies(commentId!, params),
    enabled: isAuthenticated && commentId !== null,
    staleTime: 1000 * 30
  });
}

export function useCreateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, body, parentId }: { postId: number; body: string; parentId?: number }) =>
      commentsService.create(postId, body, parentId),
    onSuccess: (_d, { postId, parentId }) => {
      qc.invalidateQueries({ queryKey: ['qr-post-comments', postId] });
      if (parentId) qc.invalidateQueries({ queryKey: ['qr-comment-replies', parentId] });
      qc.invalidateQueries({ queryKey: ['qr-posts-feed'] });
    }
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, postId }: { id: number; postId: number }) =>
      commentsService.delete(id).then((r) => ({ ...r, postId })),
    onSuccess: (_d, { postId }) => {
      qc.invalidateQueries({ queryKey: ['qr-post-comments', postId] });
      qc.invalidateQueries({ queryKey: ['qr-posts-feed'] });
    }
  });
}

export function useToggleCommentLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, postId }: { id: number; postId: number }) =>
      commentsService.toggleLike(id).then((r) => ({ ...r, postId })),
    onSuccess: (_d, { postId }) => qc.invalidateQueries({ queryKey: ['qr-post-comments', postId] })
  });
}

// re-export type for page use
export type { QFComment, QFRoom };
