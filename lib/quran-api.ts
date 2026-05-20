import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.quran.com/api/v4'
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Translation {
  id: number;
  resource_id: number;
  text: string;
  resource_name?: string;
  language_name?: string;
}

export interface Word {
  id: number;
  position: number;
  text_uthmani: string;
  text_uthmani_tajweed?: string;
  text_qpc_hafs: string;
  text_indopak: string;
  transliteration?: { text: string; language_name: string } | null;
  code_v2: string;
  char_type_name: string;
  page_number: number;
  line_number: number;
}

export interface Verse {
  id: number;
  verse_number: number;
  verse_key: string;
  chapter_id?: number;
  juz_number?: number;
  hizb_number?: number;
  page_number?: number;
  text_uthmani: string;
  words: Word[];
  translations?: Translation[];
}

export interface Chapter {
  id: number;
  revelation_place: string;
  revelation_order: number;
  name_simple: string;
  name_complex: string;
  name_arabic: string;
  verses_count: number;
  bismillah_pre: boolean;
  translated_name: {
    language_name: string;
    name: string;
  };
}

export interface ChapterInfo {
  id: number;
  chapter_id: number;
  language_name: string;
  short_text: string;
  source: string;
  text: string;
}

export interface Reciter {
  id: number;
  name: string;
  reciter_name?: string;
  style?: string;
}

export interface TafsirResource {
  id: number;
  name: string;
  author_name: string;
  language_name: string;
  slug: string;
  translation_id: number;
}

export interface TranslationResource {
  id: number;
  name: string;
  author_name: string;
  language_name: string;
  slug: string;
}

export interface HadithReference {
  collection: string;
  hadith_number: string;
  ayah_start_number: number;
  ayah_end_number: number;
  text?: string;
}

export interface SearchResult {
  verse_key: string;
  text: string;
  translations?: Translation[];
}

// Transliteration resource ID — verified from QF API (resource_id: 57 in response)
export const TRANSLITERATION_ID = 57;
// Saheeh International English translation
export const SAHEEH_INTERNATIONAL_ID = 20;

// Common tafsir IDs
export const TAFSIR_IDS = {
  IBN_KATHIR_ABRIDGED: 169,
  IBN_KATHIR_FULL: 14,
  AL_MUYASSAR: 16,
  AL_SADI: 91,
  AL_TABARI: 15,
  AL_QURTUBI: 90,
  FI_ZILAL: 157
} as const;

// ─── Chapters ─────────────────────────────────────────────────────────────────

export const fetchChapters = async (language = 'en') => {
  const { data } = await api.get('/chapters', { params: { language } });
  return data.chapters as Chapter[];
};

export const fetchChapter = async (chapterNumber: number, language = 'en') => {
  const { data } = await api.get(`/chapters/${chapterNumber}`, { params: { language } });
  return data.chapter as Chapter;
};

export const fetchChapterInfo = async (chapterId: number, language = 'en') => {
  const { data } = await api.get(`/chapters/${chapterId}/info`, { params: { language } });
  return data.chapter_info as ChapterInfo;
};

// ─── Verses ───────────────────────────────────────────────────────────────────

const DEFAULT_WORD_FIELDS =
  'text_qpc_hafs,text_uthmani,text_uthmani_tajweed,char_type_name,page_number,line_number,transliteration';

export const fetchVersesByChapter = async (chapterNumber: number, params: any = {}) => {
  const { data } = await api.get(`/verses/by_chapter/${chapterNumber}`, {
    params: {
      language: 'en',
      page: 1,
      per_page: 50,
      fields: 'text_uthmani,juz_number,page_number',
      word_fields: DEFAULT_WORD_FIELDS,
      mushaf: 1,
      ...params,
      words: params.words ? 'true' : 'false'
    }
  });
  return data.verses as Verse[];
};

export const fetchVersesByJuz = async (juzNumber: number, params: any = {}) => {
  const { data } = await api.get(`/verses/by_juz/${juzNumber}`, {
    params: {
      language: 'en',
      page: 1,
      per_page: 50,
      fields: 'text_uthmani,juz_number,page_number',
      word_fields: DEFAULT_WORD_FIELDS,
      mushaf: 1,
      ...params,
      words: params.words ? 'true' : 'false'
    }
  });
  return data.verses as Verse[];
};

export const fetchVerseByKey = async (verseKey: string, params: any = {}) => {
  const { data } = await api.get(`/verses/by_key/${verseKey}`, {
    params: {
      language: 'en',
      fields: 'text_uthmani,juz_number,page_number',
      translations: `${SAHEEH_INTERNATIONAL_ID},${TRANSLITERATION_ID}`,
      translation_fields: 'resource_name,language_name',
      word_fields: DEFAULT_WORD_FIELDS,
      mushaf: 1,
      ...params,
      words: params.words !== undefined ? (params.words ? 'true' : 'false') : 'true'
    }
  });
  return data.verse as Verse;
};

export const fetchVersesByRange = async (
  verseKeyStart: string,
  verseKeyEnd: string,
  params: any = {}
) => {
  const { data } = await api.get('/verses/by_range', {
    params: {
      verse_key_start: verseKeyStart,
      verse_key_end: verseKeyEnd,
      language: 'en',
      fields: 'text_uthmani,juz_number,page_number',
      translations: `${SAHEEH_INTERNATIONAL_ID}`,
      word_fields: DEFAULT_WORD_FIELDS,
      mushaf: 1,
      per_page: 50,
      ...params,
      words: 'true'
    }
  });
  return data.verses as Verse[];
};

export const fetchVersesByHizb = async (hizbNumber: number, params: any = {}) => {
  const { data } = await api.get(`/verses/by_hizb/${hizbNumber}`, {
    params: {
      language: 'en',
      fields: 'text_uthmani,juz_number,page_number',
      translations: `${SAHEEH_INTERNATIONAL_ID}`,
      word_fields: DEFAULT_WORD_FIELDS,
      mushaf: 1,
      per_page: 50,
      ...params,
      words: 'true'
    }
  });
  return data.verses as Verse[];
};

export const fetchVersesByPage = async (pageNumber: number, params: any = {}) => {
  const { data } = await api.get(`/verses/by_page/${pageNumber}`, {
    params: {
      language: 'en',
      fields: 'chapter_id,verse_key,verse_number,page_number,juz_number,hizb_number',
      word_fields: `code_v2,${DEFAULT_WORD_FIELDS}`,
      mushaf: 1,
      ...params,
      words: 'true'
    }
  });
  return data;
};

export const fetchVersesForPageBrowse = async (pageNumber: number, params: any = {}) => {
  const { data } = await api.get(`/verses/by_page/${pageNumber}`, {
    params: {
      language: 'en',
      fields: 'text_uthmani,juz_number,page_number',
      translations: `${SAHEEH_INTERNATIONAL_ID},${TRANSLITERATION_ID}`,
      word_fields: DEFAULT_WORD_FIELDS,
      mushaf: 1,
      per_page: 50,
      ...params,
      words: 'true'
    }
  });
  return data.verses as Verse[];
};

export const fetchRandomAyah = async (params: any = {}) => {
  const { data } = await api.get('/verses/random', {
    params: {
      language: 'en',
      translations: `${SAHEEH_INTERNATIONAL_ID},${TRANSLITERATION_ID}`,
      fields: 'text_uthmani,juz_number',
      translation_fields: 'resource_name',
      ...params
    }
  });
  return data.verse as Verse;
};

// ─── Search ───────────────────────────────────────────────────────────────────

export const searchVerses = async (query: string, params: any = {}) => {
  const { data } = await api.get('/search', {
    params: {
      q: query,
      size: 20,
      page: 1,
      language: 'en',
      translations: `${SAHEEH_INTERNATIONAL_ID}`,
      ...params
    }
  });
  return data as { search: { results: SearchResult[]; total_results: number } };
};

// ─── Audio ────────────────────────────────────────────────────────────────────

export const fetchReciters = async () => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const res = await fetch(`${origin}/api/reciters`);
  const data = await res.json();
  return data.reciters ?? [];
};

export const fetchVerseReciters = async () => {
  const { data } = await api.get('/resources/recitations');
  return { reciters: data.recitations ?? [] };
};

export const fetchChapterAudio = async (reciterId: number, chapterNumber: number) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const res = await fetch(
    `${origin}/api/qf/content/api/v4/chapter_recitations/${reciterId}/${chapterNumber}`
  );
  const data = await res.json();
  return data.audio_file;
};

export const fetchVerseAudioFiles = async (reciterId: number, chapterNumber: number) => {
  const { data } = await api.get(`/recitations/${reciterId}/by_chapter/${chapterNumber}`, {
    params: { per_page: 300 }
  });
  return data.audio_files;
};

export const fetchRecitationsByPage = async (
  reciterId: number,
  pageNumber: number
): Promise<{ verse_key: string; url: string }[]> => {
  const { data } = await api.get(`/recitations/${reciterId}/by_page/${pageNumber}`, {
    params: { per_page: 50 }
  });
  return data.audio_files ?? [];
};

export const getChapterTimestamps = async (
  reciterId: number,
  chapterId: number
): Promise<
  Array<{
    verse_key: string;
    timestamp_from: number;
    timestamp_to: number;
    duration: number;
  }>
> => {
  try {
    const { data } = await api.get(`/audio/reciters/${reciterId}/timestamp`, {
      params: { chapter_number: chapterId }
    });
    return data.timestamp ?? [];
  } catch {
    return [];
  }
};

// ─── Tafsir ───────────────────────────────────────────────────────────────────

export const getTafsir = async (
  verseKey: string,
  tafsirId: number = TAFSIR_IDS.IBN_KATHIR_ABRIDGED
) => {
  const { data } = await api.get(`/tafsirs/${tafsirId}/by_ayah/${verseKey}`);
  return data.tafsir as {
    id: number;
    verse_id: number;
    language_name: string;
    resource_name: string;
    text: string;
  };
};

// ─── Hadith ───────────────────────────────────────────────────────────────────

export const getHadithByAyah = async (
  verseKey: string
): Promise<{ hadith_references: HadithReference[] }> => {
  try {
    const { data } = await api.get(`/hadiths/by_ayah/${verseKey}`);
    return { hadith_references: data.hadith_references ?? [] };
  } catch {
    return { hadith_references: [] };
  }
};

// ─── Translations & Insights ──────────────────────────────────────────────────

export const fetchTranslations = async (chapterNumber: number, resourceId = TRANSLITERATION_ID) => {
  const { data } = await api.get(`/translations/${chapterNumber}`, {
    params: { resource_id: resourceId }
  });
  return data;
};

export const getAnswersByAyah = async (
  _verseKey: string
): Promise<Array<{ question: string; answer: string }>> => {
  return [];
};

export interface QRPost {
  id: number;
  body: string;
  createdAt?: string;
  created_at?: string;
  likesCount?: number;
  commentsCount?: number;
  user?: { name?: string; username?: string; profilePicture?: string };
  references?: Array<{ chapterId: number; from: number; to: number }>;
}

export const getQuranReflectPosts = async (
  params: Record<string, unknown> = {}
): Promise<QRPost[]> => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const url = new URL('/api/qf/quran-reflect/v1/posts/feed', origin);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data ?? []) as QRPost[];
};

// ─── Resources (meta lists for UI dropdowns) ──────────────────────────────────

export const fetchAvailableTranslations = async (language = 'en') => {
  const { data } = await api.get('/resources/translations', { params: { language } });
  return data.translations as TranslationResource[];
};

export const fetchAvailableTafsirs = async (language = 'en') => {
  const { data } = await api.get('/resources/tafsirs', { params: { language } });
  return data.tafsirs as TafsirResource[];
};

export const fetchAvailableLanguages = async () => {
  const { data } = await api.get('/resources/languages');
  return data.languages as Array<{
    id: number;
    name: string;
    native_name: string;
    iso_code: string;
    direction: string;
  }>;
};

// ─── Backward Compatibility Aliases ───────────────────────────────────────────

export const getChapters = fetchChapters;
export const getVersesByChapter = fetchVersesByChapter;
export const getJuzs = async () => {
  const { data } = await api.get('/juzs');
  const seen = new Set<number>();
  return (data.juzs as any[]).filter((j) => {
    if (seen.has(j.juz_number)) return false;
    seen.add(j.juz_number);
    return true;
  });
};
export const fetchJuzs = getJuzs;
export const getVersesByJuz = fetchVersesByJuz;
export const getVerseDetail = fetchVerseByKey;
export const getRandomVerse = fetchRandomAyah;
export const getChapterReciters = fetchReciters;
export const getChapterAudioFile = fetchChapterAudio;
// searchQuran — returns the inner search object so callers can access .results directly
export const searchQuran = async (query: string, params: any = {}) => {
  const data = await searchVerses(query, params);
  return data.search;
};
