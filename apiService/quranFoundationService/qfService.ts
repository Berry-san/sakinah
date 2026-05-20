const BASE = '/api/qf';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QFNote {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  source?: string;
  ranges?: string[];
  attachedEntities?: { entityId?: string; entityType?: string }[];
}

export interface QFBookmark {
  id: number;
  key: string;
  page?: number;
  chapter_number?: number;
  verse_number?: number;
  chapterNumber?: number;
  verseNumber?: number;
  created_at: string;
}

export interface QFCollection {
  id: number;
  name: string;
  description?: string;
  bookmarks_count?: number;
  created_at?: string;
}

export interface QFCollectionBookmark {
  id: number;
  collection_id: number;
  key: string;
  created_at?: string;
}

export type QFGoalType =
  | 'QURAN_TIME'
  | 'QURAN_PAGES'
  | 'QURAN_RANGE'
  | 'COURSE'
  | 'QURAN_READING_PROGRAM'
  | 'RAMADAN_CHALLENGE';

export type QFGoalCategory = 'QURAN' | 'COURSE' | 'QURAN_READING_PROGRAM' | 'RAMADAN_CHALLENGE';

export interface QFGoal {
  id: number;
  type: QFGoalType;
  amount: number;
  duration?: number;
  category: QFGoalCategory;
  created_at?: string;
}

export interface QFTodayGoalPlan {
  hasGoal: boolean;
  goalId: string;
  id: string;
  progress: number;
  type: string;
  date: string;
  ranges: string[];
  mushafId: number;
  pagesRead: number;
  versesRead: number;
  secondsRead: number;
  dailyTargetPages: number;
  dailyTargetSeconds: number;
  manuallyAddedSeconds: number;
  // injected client-side so we know which goal type this plan belongs to
  goalType?: QFGoalType;
}

export function goalPlanStats(plan: QFTodayGoalPlan): {
  target: number;
  completed: number;
  percentage: number;
  unit: string;
} {
  if (plan.goalType === 'QURAN_TIME') {
    const target = Math.round(plan.dailyTargetSeconds / 60);
    const completed = Math.round((plan.secondsRead + plan.manuallyAddedSeconds) / 60);
    return {
      target,
      completed,
      percentage: target > 0 ? Math.min(100, (completed / target) * 100) : 0,
      unit: 'min'
    };
  }
  const target = plan.dailyTargetPages;
  const completed = plan.pagesRead;
  return {
    target,
    completed,
    percentage: target > 0 ? Math.min(100, (completed / target) * 100) : 0,
    unit: 'pages'
  };
}

export interface QFActivityDay {
  date: string;
  seconds: number;
  pages: number;
  ranges?: string[];
}

// All user-related endpoints live under /v1/ on the pre-live API
const V1 = 'v1';

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function req<T>(
  method: string,
  path: string,
  params?: Record<string, string>,
  body?: unknown,
  extraHeaders?: Record<string, string>
): Promise<T> {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const url = new URL(`${BASE}/${path}`, origin);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    method,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      (data as { error?: string; message?: string })?.error ||
        (data as { error?: string; message?: string })?.message ||
        `QF API ${res.status}`
    );
  // API returns either { result: ... } or { data: ... } depending on endpoint
  return (data.result ?? data.data ?? data) as T;
}

const get = <T>(path: string, params?: Record<string, string>) => req<T>('GET', path, params);
const post = <T>(path: string, body: unknown) => req<T>('POST', path, undefined, body);
const del = (path: string) => req<void>('DELETE', path);

// mushaf 1 = QCF v2 (the default mushaf used in this app)
const MUSHAF_ID = '1';

// ─── Notes ────────────────────────────────────────────────────────────────────

function verseKeyToRange(verseKey: string): string {
  // "2:5" → "2:5-2:5"
  const [chapter, verse] = verseKey.split(':');
  return `${chapter}:${verse}-${chapter}:${verse}`;
}

export const notesService = {
  getByVerse: async (verseKey: string): Promise<QFNote[]> => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const url = new URL(`${BASE}/${V1}/notes/by-verse/${verseKey}`, origin);
    const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message ?? `QF notes ${res.status}`);
    return (data.data ?? []) as QFNote[];
  },

  getAll: async (): Promise<QFNote[]> => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const url = new URL(`${BASE}/${V1}/notes`, origin);
    url.searchParams.set('limit', '50');
    const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message ?? `QF notes ${res.status}`);
    return (data.data ?? []) as QFNote[];
  },

  create: (verseKey: string, body: string) =>
    post<{ success: boolean; data: QFNote }>(`${V1}/notes`, {
      body,
      saveToQR: false,
      ranges: [verseKeyToRange(verseKey)]
    }),

  delete: (id: string) => del(`${V1}/notes/${id}`)
};

// ─── Bookmarks ────────────────────────────────────────────────────────────────

export const bookmarksService = {
  // mushafId is required by the API
  getAll: async () => {
    const items = await get<QFBookmark[]>(`${V1}/bookmarks`, {
      mushafId: MUSHAF_ID,
      type: 'ayah',
      first: '20'
    });
    return items.map((b) => {
      const verse = b.verseNumber ?? b.verse_number;
      return { ...b, key: verse ? `${b.key}:${verse}` : b.key };
    });
  },

  add: (verseKey: string) => {
    const [chapter, verse] = verseKey.split(':').map(Number);
    return post<QFBookmark>(`${V1}/bookmarks`, {
      key: chapter,
      type: 'ayah',
      verseNumber: verse,
      mushafId: Number(MUSHAF_ID)
    });
  },

  delete: (id: number) => del(`${V1}/bookmarks/${id}`)
};

// ─── Collections ─────────────────────────────────────────────────────────────

export const collectionsService = {
  getAll: async () => {
    const items = await get<QFCollection[]>(`${V1}/collections`, { first: '20' });
    return items.filter((c) => String(c.id) !== '__default__');
  },

  create: (name: string, description?: string) =>
    post<QFCollection>(`${V1}/collections`, { name, description }),

  delete: (id: number) => del(`${V1}/collections/${id}`),

  getItems: (collectionId: number) =>
    get<QFCollectionBookmark[]>(`${V1}/collection-bookmarks`, {
      collection_id: String(collectionId)
    }),

  addBookmark: (collectionId: number, verseKey: string) =>
    post<QFCollectionBookmark>(`${V1}/collection-bookmarks`, {
      collection_id: collectionId,
      key: verseKey,
      mushafId: Number(MUSHAF_ID)
    }),

  removeBookmark: (id: number) => del(`${V1}/collection-bookmarks/${id}`)
};

// ─── Goals ────────────────────────────────────────────────────────────────────

const QF_GOAL_TYPES: QFGoalType[] = ['QURAN_TIME', 'QURAN_PAGES', 'QURAN_RANGE'];

export const goalsService = {
  getTodaysPlan: async (): Promise<QFTodayGoalPlan[]> => {
    const tz =
      typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
    const results = await Promise.allSettled(
      QF_GOAL_TYPES.map((type) =>
        req<QFTodayGoalPlan>(
          'GET',
          `${V1}/goals/get-todays-plan`,
          { type, mushafId: MUSHAF_ID },
          undefined,
          { 'x-timezone': tz }
        ).then((plan) => ({ ...plan, goalType: type }))
      )
    );
    return results
      .filter(
        (r) =>
          r.status === 'fulfilled' &&
          (r as PromiseFulfilledResult<QFTodayGoalPlan>).value?.hasGoal === true
      )
      .map((r) => (r as PromiseFulfilledResult<QFTodayGoalPlan>).value);
  },

  create: (goal: Omit<QFGoal, 'id' | 'created_at'>) => {
    const tz =
      typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
    return req<QFGoal>('POST', `${V1}/goals`, { mushafId: MUSHAF_ID }, goal, {
      'x-timezone': tz
    });
  },

  update: (id: number, data: Partial<Omit<QFGoal, 'id'>>) => {
    const tz =
      typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
    return req<QFGoal>('PUT', `${V1}/goals/${id}`, { mushafId: MUSHAF_ID }, data, {
      'x-timezone': tz
    });
  },

  delete: (id: string) =>
    req<void>('DELETE', `${V1}/goals/${id}`, { mushafId: MUSHAF_ID, category: 'QURAN' })
};

// ─── Activity & Streaks ───────────────────────────────────────────────────────

export const activityService = {
  getDays: async (days = 30) => {
    const to = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - (days - 1) * 86_400_000).toISOString().slice(0, 10);
    const raw = await get<Record<string, unknown>[]>(`${V1}/activity-days`, {
      from,
      to,
      type: 'QURAN',
      first: String(days)
    });
    return raw.map((d) => ({
      date: d.date as string,
      seconds: (d.secondsRead ?? d.seconds ?? 0) as number,
      pages: (d.pagesRead ?? d.pages ?? 0) as number,
      ranges: (d.ranges ?? []) as string[]
    })) as QFActivityDay[];
  },

  log: (seconds: number, ranges: string[]) =>
    post<void>(`${V1}/activity-days`, {
      type: 'QURAN',
      seconds,
      ranges,
      mushafId: Number(MUSHAF_ID)
    }),

  getCurrentStreak: async (): Promise<number> => {
    const result = await get<{ days: number }>(`${V1}/streaks/current-streak-days`, {
      type: 'QURAN'
    });
    return result?.days ?? 0;
  }
};

// ─── Content API (server-authed via client_credentials) ──────────────────────

const CONTENT_V4 = 'content/api/v4';

async function contentReq<T>(path: string, params?: Record<string, string>): Promise<T> {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const url = new URL(`${BASE}/${CONTENT_V4}/${path}`, origin);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const attempt = async () => {
    const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    return res;
  };

  let res = await attempt();

  // 401 → token may be stale; retry once (proxy will re-fetch a fresh token)
  if (res.status === 401) {
    res = await attempt();
  }

  // 429 → exponential backoff: 500ms, 1000ms, 2000ms
  if (res.status === 429) {
    for (let i = 0; i < 3; i++) {
      await new Promise((r) => setTimeout(r, 500 * 2 ** i));
      res = await attempt();
      if (res.status !== 429) break;
    }
  }

  if (res.status === 403)
    throw new Error('QF content API: access denied — check client credentials');

  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      (data as { error?: string; message?: string })?.error ||
        (data as { error?: string; message?: string })?.message ||
        `QF Content API ${res.status}`
    );
  return (data.reciters ?? data.result ?? data.data ?? data) as T;
}

// ─── Chapter Reciters ─────────────────────────────────────────────────────────

export interface QFChapterReciterStyle {
  name: string | null;
  language_name: string;
}

export interface QFChapterReciterQirat {
  name: string | null;
  arabic_name: string | null;
}

export interface QFChapterReciter {
  id: number;
  name: string;
  style: QFChapterReciterStyle;
  qirat: QFChapterReciterQirat;
  translated_name: { name: string; language_name: string } | null;
}

export const chapterRecitersService = {
  getAll: (language?: string) =>
    contentReq<QFChapterReciter[]>(
      'resources/chapter_reciters',
      language ? { language } : undefined
    )
};

// ─── Rooms ────────────────────────────────────────────────────────────────────

// All room endpoints live under the quran-reflect service, not auth
const QR = 'quran-reflect/v1';

export type QFRoomType = 'group' | 'page';

export interface QFRoom {
  id: number;
  name: string;
  description?: string;
  type: QFRoomType;
  slug?: string;
  url?: string;
  avatar?: string;
  country?: string;
  public?: boolean;
  is_public?: boolean;
  members_count?: number;
  followers_count?: number;
  is_member?: boolean;
  is_following?: boolean;
  is_admin?: boolean;
  created_at: string;
}

export interface QFRoomMember {
  id: number;
  user_id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  is_admin: boolean;
  joined_at: string;
}

export interface QFRoomPost {
  id: number;
  body: string;
  user_id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  verse_key?: string;
  privacy: 'public' | 'private' | 'room';
  created_at: string;
}

export const roomsService = {
  // GET /v1/rooms — joined and managed rooms
  getMyRooms: () => get<QFRoom[]>(`${QR}/rooms`),

  // GET /v1/rooms/search
  search: (q: string) => get<QFRoom[]>(`${QR}/rooms/search`, { query: q }),

  // GET /v1/rooms/{id}
  getById: (id: number) => get<QFRoom>(`${QR}/rooms/${id}`),

  // GET /v1/rooms/by-url/{url}
  getByUrl: (url: string) => get<QFRoom>(`${QR}/rooms/by-url/${url}`),

  // GET /v1/rooms/{id}/members
  getMembers: (id: number) => get<QFRoomMember[]>(`${QR}/rooms/${id}/members`),

  // GET /v1/rooms/{id}/posts
  getPosts: (id: number) => get<QFRoomPost[]>(`${QR}/rooms/${id}/posts`),

  // POST /v1/rooms/groups
  createGroup: (data: { name: string; url: string; description?: string; public?: boolean }) =>
    post<QFRoom>(`${QR}/rooms/groups`, data),

  // PATCH /v1/rooms/groups/{id}
  updateGroup: (
    id: number,
    data: { name?: string; description?: string; url?: string; public?: boolean; avatar?: string }
  ) => reqPosts<QFRoom>('PATCH', `${QR}/rooms/groups/${id}`, undefined, data),

  // POST /v1/rooms/pages
  createPage: (data: { name: string; url: string; description?: string }) =>
    post<QFRoom>(`${QR}/rooms/pages`, data),

  // PATCH /v1/rooms/pages/{id}
  updatePage: (
    id: number,
    data: {
      name?: string;
      description?: string;
      url?: string;
      avatar?: string;
      country?: string;
      public?: boolean;
    }
  ) => reqPosts<QFRoom>('PATCH', `${QR}/rooms/pages/${id}`, undefined, data),

  // POST /v1/rooms/groups/{id}/join
  joinGroup: (id: number) => post<void>(`${QR}/rooms/groups/${id}/join`, {}),

  // POST /v1/rooms/groups/{id}/leave
  leaveGroup: (id: number) => post<void>(`${QR}/rooms/groups/${id}/leave`, {}),

  // POST /v1/rooms/pages/{id}/follow
  followPage: (id: number) => post<void>(`${QR}/rooms/pages/${id}/follow`, {}),

  // POST /v1/rooms/pages/{id}/unfollow
  unfollowPage: (id: number) => post<void>(`${QR}/rooms/pages/${id}/unfollow`, {}),

  // POST /v1/rooms/{id}/invites
  inviteUser: (id: number, userIds: string[], emails: string[]) =>
    post<void>(`${QR}/rooms/${id}/invites`, { userIds, emails }),

  // POST /v1/rooms/invites/{token}/accept
  acceptInvite: (token: string) => reqPosts<void>('POST', `${QR}/rooms/invites/${token}/accept`),

  // POST /v1/rooms/invites/{token}/reject
  rejectInvite: (token: string) => reqPosts<void>('POST', `${QR}/rooms/invites/${token}/reject`),

  // POST /v1/rooms/accept-by-private-token
  acceptPrivateToken: (token: string) =>
    post<void>(`${QR}/rooms/accept-by-private-token`, { token }),

  // DELETE /v1/rooms/{id}/members/{userId}
  removeMember: (roomId: number, userId: string) => del(`${QR}/rooms/${roomId}/members/${userId}`),

  // PATCH /v1/rooms/{id}/admins
  updateAdminAccess: (roomId: number, userId: string, admin: boolean) =>
    reqPosts<void>('PATCH', `${QR}/rooms/${roomId}/admins`, undefined, { userId, admin }),

  // PATCH /v1/rooms/{roomId}/posts/{postId}/privacy
  updatePostPrivacy: (roomId: number, postId: number, privacy: 'public' | 'private' | 'room') =>
    reqPosts<void>('PATCH', `${QR}/rooms/${roomId}/posts/${postId}/privacy`, undefined, { privacy })
};

// ─── Posts (Quran Reflect) ────────────────────────────────────────────────────

export interface QFPostReference {
  id?: string;
  chapterId: number;
  from: number;
  to: number;
}

export interface QFPostAvatarUrls {
  small: string;
  medium: string;
  large: string;
}

export interface QFPostAuthor {
  id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  memberType?: number;
  verified?: boolean;
  avatarUrls?: QFPostAvatarUrls;
}

export interface QFRecentComment {
  id: number;
  body: string;
  createdAt: string;
  author?: QFPostAuthor;
}

export interface QFPost {
  id: number;
  body: string;
  authorId?: string;
  discussionId?: number;
  draft: boolean;
  verified: boolean;
  global: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  roomId?: number;
  roomPostStatus?: number;
  toxicityScore?: number;
  reported?: boolean;
  moderationStatus?: number;
  reviewStatus?: number;
  featuredAt?: string;
  pushedUpAt?: string;
  estimatedReadingTime?: number;
  weekOrder?: number;
  metadata?: Record<string, unknown>;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  isCommentedOn?: boolean;
  isByFollowedUser?: boolean;
  languageId?: number;
  languageName?: string;
  postTypeId: number;
  postTypeName?: string;
  references?: QFPostReference[];
  tags?: { id: number; name: string; language?: string }[];
  mentions?: unknown[];
  room?: unknown;
  recentComment?: QFRecentComment | null;
  author?: QFPostAuthor;
}

export interface QFPostFeedParams {
  tab?: 'newest' | 'latest' | 'following' | 'trending' | 'popular' | 'public' | 'feed';
  sortBy?: 'latest' | 'popular';
  page?: number;
  limit?: number;
  languages?: string;
  'filter[verifiedOnly]'?: boolean;
  'filter[postTypeIds]'?: string;
  'filter[references][0][chapterId]'?: number;
  'filter[references][0][from]'?: number;
  'filter[references][0][to]'?: number;
}

export interface QFPostPage {
  total: number;
  currentPage: number;
  limit: number;
  pages: number;
  data: QFPost[];
}

async function reqPosts<T>(
  method: string,
  path: string,
  params?: Record<string, string>,
  body?: unknown
): Promise<T> {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const url = new URL(`${BASE}/${path}`, origin);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      (data as { error?: string; message?: string })?.message ||
        (data as { error?: string; message?: string })?.error ||
        `QF posts API ${res.status}`
    );
  return data as T;
}

function toStrParams(
  params: Record<string, string | number | boolean | undefined>
): Record<string, string> {
  const p: Record<string, string> = {};
  Object.entries(params).forEach(([k, v]) => v !== undefined && (p[k] = String(v)));
  return p;
}

type PostComments = {
  total: number;
  currentPage: number;
  limit: number;
  pages: number;
  comments: QFComment[];
};

export const postsService = {
  getFeed: (params: QFPostFeedParams = {}): Promise<QFPostPage> =>
    reqPosts<QFPostPage>(
      'GET',
      `${QR}/posts/feed`,
      toStrParams(params as Record<string, string | number | boolean | undefined>)
    ),

  getById: (id: number): Promise<QFPost> => reqPosts<QFPost>('GET', `${QR}/posts/${id}`),

  getMyPosts: (params: { tab?: string; page?: number; limit?: number } = {}): Promise<QFPostPage> =>
    reqPosts<QFPostPage>('GET', `${QR}/posts/my-posts`, toStrParams(params)),

  getUserPosts: (
    userId: string,
    params: { page?: number; limit?: number } = {}
  ): Promise<QFPostPage> =>
    reqPosts<QFPostPage>('GET', `${QR}/posts/user-posts/${userId}`, toStrParams(params)),

  getRelated: (
    postId: number,
    params: { page?: number; limit?: number } = {}
  ): Promise<QFPostPage> =>
    reqPosts<QFPostPage>('GET', `${QR}/posts/${postId}/related`, toStrParams(params)),

  getComments: (
    postId: number,
    params: { page?: number; limit?: number } = {}
  ): Promise<PostComments> =>
    reqPosts<PostComments>('GET', `${QR}/posts/${postId}/comments`, toStrParams(params)),

  getLikedState: (id: number): Promise<{ liked: boolean }> =>
    reqPosts<{ liked: boolean }>('GET', `${QR}/posts/${id}/liked`),

  trackView: (id: number): Promise<{ success: boolean }> =>
    reqPosts<{ success: boolean }>('GET', `${QR}/posts/viewed/${id}`),

  create: (payload: {
    body: string;
    references?: QFPostReference[];
    draft?: boolean;
    roomId?: number;
    roomPostStatus?: 0 | 1 | 2;
  }): Promise<{ data: QFPost; success: boolean }> =>
    reqPosts<{ data: QFPost; success: boolean }>('POST', `${QR}/posts`, undefined, {
      post: payload
    }),

  edit: (
    id: number,
    payload: Partial<{
      body: string;
      references: QFPostReference[];
      draft: boolean;
      roomId: number;
      roomPostStatus: 0 | 1 | 2;
    }>
  ): Promise<{ data: QFPost; success: boolean }> =>
    reqPosts<{ data: QFPost; success: boolean }>('PATCH', `${QR}/posts/${id}`, undefined, payload),

  delete: (id: number): Promise<{ success: boolean }> =>
    reqPosts<{ success: boolean }>('DELETE', `${QR}/posts/${id}`),

  toggleLike: (id: number): Promise<{ liked: boolean }> =>
    reqPosts<{ liked: boolean }>('POST', `${QR}/posts/${id}/toggle-like`),

  toggleSave: (id: number): Promise<{ saved: boolean }> =>
    reqPosts<{ saved: boolean }>('POST', `${QR}/posts/${id}/toggle-save`),

  report: (id: number, abuse: string, comments?: string): Promise<{ reported: boolean }> =>
    reqPosts<{ reported: boolean }>('POST', `${QR}/posts/${id}/report`, undefined, {
      report: { abuse, comments }
    })
};

// ─── Comments ─────────────────────────────────────────────────────────────────

export interface QFComment {
  id: number;
  postId?: number;
  parentId?: number | null;
  body: string;
  createdAt: string;
  updatedAt?: string;
  likesCount?: number;
  repliesCount?: number;
  isLiked?: boolean;
  author?: QFPostAuthor;
}

export type QFCommentPage = {
  total: number;
  currentPage: number;
  limit: number;
  pages: number;
  data: QFComment[];
};

export const commentsService = {
  // POST /v1/comments — create a comment on a post or reply to an existing comment
  create: (
    postId: number,
    body: string,
    parentId?: number,
    isPrivate = false
  ): Promise<{ data: QFComment; success: boolean }> =>
    reqPosts<{ data: QFComment; success: boolean }>('POST', `${QR}/comments`, undefined, {
      comment: {
        body,
        postId,
        isPrivate,
        ...(parentId !== undefined ? { parentId } : {})
      }
    }),

  // DELETE /v1/comments/{id}
  delete: (id: number): Promise<{ success: boolean }> =>
    reqPosts<{ success: boolean }>('DELETE', `${QR}/comments/${id}`),

  // POST /v1/comments/{id}/toggle-like
  toggleLike: (id: number): Promise<{ liked: boolean }> =>
    reqPosts<{ liked: boolean }>('POST', `${QR}/comments/${id}/toggle-like`),

  // GET /v1/comments/{id}/replies
  getReplies: (
    commentId: number,
    params: { page?: number; limit?: number } = {}
  ): Promise<QFCommentPage> =>
    reqPosts<QFCommentPage>('GET', `${QR}/comments/${commentId}/replies`, toStrParams(params))
};

// ─── User Profile (CRUD) ─────────────────────────────────────────────────────

export interface QFProfileUpdateData {
  firstName?: string;
  lastName?: string;
  username?: string;
  bio?: string;
  photoUrl?: string;
  socialLinks?: Record<string, string>;
}

export interface QFProfilePatchData {
  notifications?: Record<string, boolean>;
  privacy?: { isPublic?: boolean; showActivity?: boolean };
  preferences?: Record<string, unknown>;
}

export const userService = {
  updateProfile: (data: QFProfileUpdateData) =>
    req<Record<string, unknown>>('PUT', `${V1}/users/profile`, undefined, data),

  patchProfile: (data: QFProfilePatchData) =>
    req<Record<string, unknown>>('PATCH', `${V1}/users/profile`, undefined, data)
};

// ─── Followers / Social ───────────────────────────────────────────────────────

export interface QFUserPublicProfile {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  isFollowing?: boolean;
}

export const followersService = {
  getUserProfile: (userId: string): Promise<QFUserPublicProfile> =>
    reqPosts<QFUserPublicProfile>('GET', `${QR}/users/${userId}`),

  getFollowers: (
    userId: string,
    params: { page?: number; limit?: number } = {}
  ): Promise<{ data: QFUserPublicProfile[]; total: number }> =>
    reqPosts<{ data: QFUserPublicProfile[]; total: number }>(
      'GET',
      `${QR}/users/${userId}/followers`,
      toStrParams(params)
    ),

  getFollowing: (
    userId: string,
    params: { page?: number; limit?: number } = {}
  ): Promise<{ data: QFUserPublicProfile[]; total: number }> =>
    reqPosts<{ data: QFUserPublicProfile[]; total: number }>(
      'GET',
      `${QR}/users/${userId}/following`,
      toStrParams(params)
    ),

  toggleFollow: (
    userId: string,
    action: 'follow' | 'unfollow'
  ): Promise<{ isFollowing: boolean }> =>
    reqPosts<{ isFollowing: boolean }>('POST', `${QR}/users/${userId}/toggle-follow`, undefined, {
      action
    }),

  removeFollower: (followerId: string): Promise<{ success: boolean }> =>
    reqPosts<{ success: boolean }>('DELETE', `${QR}/users/followers/${followerId}`),

  getSuggested: (): Promise<QFUserPublicProfile[]> =>
    reqPosts<QFUserPublicProfile[]>('GET', `${QR}/users/suggestions`),

  searchUsers: (q: string): Promise<QFUserPublicProfile[]> =>
    reqPosts<QFUserPublicProfile[]>('GET', `${QR}/users/search`, { q })
};

// ─── Reading Sessions ─────────────────────────────────────────────────────────

export interface QFReadingSession {
  id: number;
  chapter_number: number;
  verse_number: number;
  created_at: string;
}

export const readingSessionsService = {
  update: (chapterNumber: number, verseNumber: number) =>
    post<QFReadingSession>(`${V1}/reading-sessions`, { chapterNumber, verseNumber }),

  getAll: () => get<QFReadingSession[]>(`${V1}/reading-sessions`, { first: '20' })
};
