import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface UserStats {
  streak: number;
  totalReflections: number;
  totalVersesRead: number;
  lastActive: string;
  dailyGoal: number; // in minutes or verses
  progressToday: number;
  dailyActivity: Record<string, number>; // date -> count
}

interface SakinahState {
  user: User | null;
  stats: UserStats;
  isAudioPlaying: boolean;
  isAudioActive: boolean;
  audioRepeatMode: 'none' | 'verse' | 'selection';
  audioRangeStart: string | null;
  audioRangeEnd: string | null;
  currentTimestamp: number;
  currentVerseKey: string | null;
  currentReciter: number;
  currentChapterId: number;
  bookmarks: string[];

  // Actions
  setUser: (user: User | null) => void;
  updateStats: (updates: Partial<UserStats>) => void;
  addBookmark: (verseKey: string) => void;
  removeBookmark: (verseKey: string) => void;
  setAudioPlaying: (playing: boolean) => void;
  setAudioActive: (active: boolean) => void;
  setAudioRepeatMode: (mode: 'none' | 'verse' | 'selection') => void;
  setAudioRangeStart: (key: string | null) => void;
  setAudioRangeEnd: (key: string | null) => void;
  setCurrentTimestamp: (timestamp: number) => void;
  setCurrentVerseKey: (verseKey: string | null) => void;
  setCurrentChapterId: (id: number) => void;
  setCurrentReciter: (id: number) => void;
  incrementStreak: () => void;
  markVerseAsRead: (verseKey: string) => void;
  addReflection: () => void;
}

export const useStore = create<SakinahState>()(
  persist(
    (set) => ({
      user: null,
      stats: {
        streak: 0,
        totalReflections: 0,
        totalVersesRead: 0,
        lastActive: new Date().toISOString(),
        dailyGoal: 5,
        progressToday: 0,
        dailyActivity: {}
      },
      isAudioPlaying: false,
      isAudioActive: false,
      audioRepeatMode: 'none',
      audioRangeStart: null,
      audioRangeEnd: null,
      currentTimestamp: 0,
      currentVerseKey: null,
      currentReciter: 7,
      currentChapterId: 1,
      bookmarks: [],

      setUser: (user) => set({ user }),
      updateStats: (updates) => set((state) => ({ stats: { ...state.stats, ...updates } })),
      addBookmark: (verseKey) =>
        set((state) => ({
          bookmarks: state.bookmarks.includes(verseKey)
            ? state.bookmarks
            : [...state.bookmarks, verseKey]
        })),
      removeBookmark: (verseKey) =>
        set((state) => ({
          bookmarks: state.bookmarks.filter((key) => key !== verseKey)
        })),
      setAudioPlaying: (playing) => set({ isAudioPlaying: playing }),
      setAudioActive: (active) => set({ isAudioActive: active }),
      setAudioRepeatMode: (mode) => set({ audioRepeatMode: mode }),
      setAudioRangeStart: (key) => set({ audioRangeStart: key }),
      setAudioRangeEnd: (key) => set({ audioRangeEnd: key }),
      setCurrentTimestamp: (timestamp) => set({ currentTimestamp: timestamp }),
      setCurrentVerseKey: (verseKey) => set({ currentVerseKey: verseKey }),
      setCurrentChapterId: (id) => set({ currentChapterId: id }),
      setCurrentReciter: (id) => set({ currentReciter: id }),
      incrementStreak: () =>
        set((state) => {
          const today = new Date().toDateString();
          const lastActive = new Date(state.stats.lastActive).toDateString();

          if (today === lastActive) return state; // Already active today

          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const wasActiveYesterday = yesterday.toDateString() === lastActive;

          return {
            stats: {
              ...state.stats,
              streak: wasActiveYesterday ? state.stats.streak + 1 : 1,
              lastActive: new Date().toISOString()
            }
          };
        }),
      markVerseAsRead: (verseKey) =>
        set((state) => {
          const today = new Date().toDateString();
          const currentCount = state.stats.dailyActivity[today] || 0;
          return {
            stats: {
              ...state.stats,
              totalVersesRead: state.stats.totalVersesRead + 1,
              progressToday: state.stats.progressToday + 1,
              dailyActivity: {
                ...state.stats.dailyActivity,
                [today]: currentCount + 1
              }
            }
          };
        }),
      addReflection: () =>
        set((state) => ({
          stats: {
            ...state.stats,
            totalReflections: state.stats.totalReflections + 1
          }
        }))
    }),
    {
      name: 'sakinah-storage'
    }
  )
);
