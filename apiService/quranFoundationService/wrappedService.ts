import { QFUserProfile, QFStreak, QFActivityDay, QFWrappedData } from './types';

const PROXY_BASE = '/api/qf';

/**
 * Sakinah Wrapped Service
 *
 * Fetches and aggregates user activity data from Quran Foundation APIs
 * via our secure local proxy.
 */
export const wrappedService = {
  /**
   * Fetches the full user profile including aggregate statistics
   */
  async getProfile(): Promise<QFUserProfile> {
    const res = await fetch(`${PROXY_BASE}/v1/users/profile`);
    if (!res.ok) throw new Error('Failed to fetch QF profile');
    const data = await res.json();
    return data.result ?? data.data;
  },

  async getStreaks(): Promise<QFStreak[]> {
    const res = await fetch(`${PROXY_BASE}/v1/streaks`);
    if (!res.ok) throw new Error('Failed to fetch QF streaks');
    const data = await res.json();
    return data.result ?? data.data ?? [];
  },

  async getCurrentStreakDays(): Promise<number> {
    const res = await fetch(`${PROXY_BASE}/v1/streaks/current-streak-days?type=QURAN`);
    if (!res.ok) throw new Error('Failed to fetch current streak');
    const data = await res.json();
    const payload = data.result ?? data.data;
    return payload?.days ?? payload ?? 0;
  },

  async getActivityDays(days = 30): Promise<QFActivityDay[]> {
    const to = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - (days - 1) * 86_400_000).toISOString().slice(0, 10);
    const res = await fetch(`${PROXY_BASE}/v1/activity-days?from=${from}&to=${to}&type=QURAN`);
    if (!res.ok) throw new Error('Failed to fetch activity days');
    const data = await res.json();
    return data.result ?? data.data ?? [];
  },

  /**
   * Aggregates all data into a single "Wrapped" insights object
   */
  async getWrappedInsights(): Promise<QFWrappedData> {
    const [profile, currentStreak, streaks, activity] = await Promise.all([
      this.getProfile(),
      this.getCurrentStreakDays(),
      this.getStreaks(),
      this.getActivityDays(365) // Fetch up to a year of activity
    ]);

    const longestStreak = streaks.find((s) => s.longest) || null;

    // Logic to find top month/day
    const monthActivity: Record<string, number> = {};
    let mostActiveDay = '';
    let maxDaySeconds = 0;

    activity.forEach((day) => {
      const month = new Date(day.date).toLocaleString('default', { month: 'long' });
      monthActivity[month] = (monthActivity[month] || 0) + day.seconds;

      if (day.seconds > maxDaySeconds) {
        maxDaySeconds = day.seconds;
        mostActiveDay = day.date;
      }
    });

    const topMonth = Object.entries(monthActivity).reduce(
      (a, b) => (a[1] > b[1] ? a : b),
      ['None', 0]
    )[0];

    return {
      profile,
      currentStreak,
      longestStreak,
      totalActivityDays: activity.length,
      recentActivity: activity.slice(0, 30),
      topMonth,
      mostActiveDay
    };
  }
};
