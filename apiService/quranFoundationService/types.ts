export interface QFProfileStats {
  totalSecondsRead: number;
  totalPagesRead: number;
  reflectionsCount: number;
  bookmarksCount: number;
  notesCount: number;
  activityDaysCount: number;
}

export interface QFUserProfile {
  id: string;
  createdAt: string;
  email: string;
  firstName: string;
  lastName: string;
  username?: string;
  photoUrl?: string;
  isAdmin?: boolean;
  isPasswordSet?: boolean;
  statistics?: QFProfileStats;
}

export interface QFStreak {
  id: number;
  userId: number;
  count: number;
  startDate: string;
  endDate: string;
  longest: boolean;
}

export interface QFActivityDay {
  date: string;
  seconds: number;
  pages: number;
  readRanges: string[];
}

export interface QFWrappedData {
  profile: QFUserProfile;
  currentStreak: number;
  longestStreak: QFStreak | null;
  totalActivityDays: number;
  recentActivity: QFActivityDay[];
  topMonth: string;
  mostActiveDay: string;
}
