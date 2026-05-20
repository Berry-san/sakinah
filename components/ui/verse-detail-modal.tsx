'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  BookOpen,
  MessageSquare,
  Quote,
  PenSquare,
  Trash2,
  LogIn,
  FolderOpen,
  Check
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getTafsir, getHadithByAyah, getAnswersByAyah } from '@/lib/quran-api';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/use-store';
import { useAuth } from '@/lib/auth-context';
import {
  useVerseNotes,
  useCreateNote,
  useDeleteNote,
  useQFCollections,
  useAddToCollection
} from '@/apiService/quranFoundationService/hooks';
import { collectionsService } from '@/apiService/quranFoundationService/qfService';

interface VerseDetailModalProps {
  verseKey: string;
  isOpen: boolean;
  onClose: () => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function VerseDetailModal({ verseKey, isOpen, onClose }: VerseDetailModalProps) {
  const [activeTab, setActiveTab] = useState<
    'tafsir' | 'hadith' | 'answers' | 'notes' | 'collections'
  >('tafsir');
  const [noteText, setNoteText] = useState('');
  const { markVerseAsRead } = useStore();
  const { isAuthenticated, login } = useAuth();

  useEffect(() => {
    if (isOpen && verseKey) markVerseAsRead(verseKey);
  }, [isOpen, verseKey, markVerseAsRead]);

  // Reset note input when verse changes
  useEffect(() => {
    setNoteText('');
  }, [verseKey]);

  const { data: tafsir, isLoading: isTafsirLoading } = useQuery({
    queryKey: ['tafsir', verseKey],
    queryFn: () => getTafsir(verseKey),
    enabled: isOpen && activeTab === 'tafsir'
  });

  const { data: hadithData, isLoading: isHadithLoading } = useQuery({
    queryKey: ['hadith', verseKey],
    queryFn: () => getHadithByAyah(verseKey),
    enabled: isOpen && activeTab === 'hadith'
  });

  const { data: answers, isLoading: isAnswersLoading } = useQuery({
    queryKey: ['answers', verseKey],
    queryFn: () => getAnswersByAyah(verseKey),
    enabled: isOpen && activeTab === 'answers'
  });

  const { data: notes, isLoading: isNotesLoading } = useVerseNotes(
    activeTab === 'notes' ? verseKey : ''
  );
  const createNote = useCreateNote(verseKey);
  const deleteNote = useDeleteNote(verseKey);

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    await createNote.mutateAsync(noteText.trim());
    setNoteText('');
  };

  const tabs = [
    { id: 'tafsir' as const, label: 'Tafsir', icon: BookOpen },
    { id: 'hadith' as const, label: 'Hadith', icon: Quote },
    { id: 'answers' as const, label: 'Q&A', icon: MessageSquare },
    { id: 'notes' as const, label: 'My Notes', icon: PenSquare },
    { id: 'collections' as const, label: 'Collections', icon: FolderOpen }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-3xl h-[80vh] flex flex-col rounded-2xl border border-border bg-card card-highlight overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-7 py-5 border-b border-border shrink-0">
              <div>
                <h2 className="font-semibold text-lg text-foreground">Divine Insights</h2>
                <p className="text-sm text-accent mt-0.5">Verse {verseKey}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex px-7 border-b border-border shrink-0 overflow-x-auto">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    'flex items-center gap-2 px-1 py-4 mr-6 text-sm font-medium transition-colors relative shrink-0',
                    activeTab === id
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {activeTab === id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-7 custom-scrollbar min-h-0">
              {activeTab === 'tafsir' &&
                (isTafsirLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <div
                    className="prose prose-sm max-w-none text-muted-foreground leading-relaxed [&_h1]:text-foreground [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-foreground [&_h2]:font-semibold [&_strong]:text-foreground"
                    dangerouslySetInnerHTML={{
                      __html: tafsir?.text || 'No tafsir available for this verse.'
                    }}
                  />
                ))}

              {activeTab === 'hadith' &&
                (isHadithLoading ? (
                  <LoadingSkeleton />
                ) : (hadithData?.hadith_references?.length ?? 0) > 0 ? (
                  <div className="space-y-4">
                    {hadithData!.hadith_references!.map((ref: any, i: number) => (
                      <div key={i} className="p-5 rounded-xl border border-border bg-primary/60">
                        <p className="text-xs text-accent font-medium mb-2">
                          {ref.collection} #{ref.hadith_number}
                        </p>
                        <p className="text-sm text-muted-foreground italic">
                          Linked to Ayah {ref.ayah_start_number}–{ref.ayah_end_number}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No related Hadith found for this verse." />
                ))}

              {activeTab === 'answers' &&
                (isAnswersLoading ? (
                  <LoadingSkeleton />
                ) : answers && answers.length > 0 ? (
                  <div className="space-y-5">
                    {answers.map((answer, i: number) => (
                      <div
                        key={i}
                        className="space-y-3 p-5 rounded-xl border border-border bg-primary/60"
                      >
                        <h3 className="font-semibold text-foreground">{answer.question}</h3>
                        <div
                          className="text-sm text-muted-foreground leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: answer.answer }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No curated Q&A found for this verse." />
                ))}

              {activeTab === 'notes' &&
                (!isAuthenticated ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 py-16 text-center">
                    <PenSquare className="w-8 h-8 text-muted-foreground opacity-40" />
                    <p className="text-sm text-muted-foreground">
                      Sign in to save notes on this verse.
                    </p>
                    <button
                      onClick={login}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
                    >
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Note composer */}
                    <div className="space-y-2">
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Write your reflection or note on this verse…"
                        rows={3}
                        className="w-full p-3 text-sm rounded-xl border border-border bg-primary resize-none focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-muted-foreground/50"
                      />
                      <button
                        onClick={handleSaveNote}
                        disabled={!noteText.trim() || createNote.isPending}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-accent-foreground disabled:opacity-40 hover:bg-accent/90 transition-colors"
                      >
                        {createNote.isPending ? 'Saving…' : 'Save Note'}
                      </button>
                    </div>

                    {/* Notes list */}
                    {isNotesLoading ? (
                      <LoadingSkeleton />
                    ) : notes && notes.length > 0 ? (
                      <div className="space-y-3">
                        {notes.map((note) => (
                          <div
                            key={note.id}
                            className="p-4 rounded-xl border border-border bg-primary/60 group"
                          >
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                              {note.body}
                            </p>
                            <div className="flex items-center justify-between mt-3">
                              <p className="text-xs text-muted-foreground">
                                {formatDate(note.createdAt)}
                              </p>
                              <button
                                onClick={() => deleteNote.mutate(note.id)}
                                disabled={deleteNote.isPending}
                                className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState message="No notes yet for this verse. Write your first reflection above." />
                    )}
                  </div>
                ))}
              {activeTab === 'collections' && (
                <CollectionsTab
                  verseKey={verseKey}
                  isAuthenticated={isAuthenticated}
                  login={login}
                />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function CollectionsTab({
  verseKey,
  isAuthenticated,
  login
}: {
  verseKey: string;
  isAuthenticated: boolean;
  login: () => void;
}) {
  const { data: collections, isLoading } = useQFCollections();
  const addToCollection = useAddToCollection();
  const [added, setAdded] = useState<Set<number>>(new Set());

  const { data: membershipMap } = useQuery({
    queryKey: ['qf-collection-membership', verseKey],
    queryFn: async () => {
      if (!collections) return new Set<number>();
      const results = await Promise.all(
        collections.map((c) =>
          collectionsService
            .getItems(c.id)
            .then((items) => ({ id: c.id, has: items.some((i) => i.key === verseKey) }))
        )
      );
      return new Set(results.filter((r) => r.has).map((r) => r.id));
    },
    enabled: !!collections && collections.length > 0,
    staleTime: 1000 * 60
  });

  const handleAdd = async (collectionId: number) => {
    await addToCollection.mutateAsync({ collectionId, verseKey });
    setAdded((prev) => new Set(prev).add(collectionId));
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 py-16 text-center">
        <FolderOpen className="w-8 h-8 text-muted-foreground opacity-40" />
        <p className="text-sm text-muted-foreground">Sign in to add this verse to a collection.</p>
        <button
          onClick={login}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          <LogIn className="w-4 h-4" />
          Sign In
        </button>
      </div>
    );
  }

  if (isLoading) return <LoadingSkeleton />;

  if (!collections || collections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-center">
        <FolderOpen className="w-8 h-8 text-muted-foreground opacity-40" />
        <p className="text-sm text-muted-foreground">No collections yet.</p>
        <a href="/collections" className="text-xs text-accent hover:underline">
          Create a collection →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Add <span className="text-accent font-medium">{verseKey}</span> to a collection:
      </p>
      {collections.map((col) => {
        const isMember = membershipMap?.has(col.id) || added.has(col.id);
        return (
          <div
            key={col.id}
            className="flex items-center justify-between p-4 rounded-xl border border-border bg-primary/40"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0">
                <FolderOpen className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{col.name}</p>
                {col.bookmarks_count != null && (
                  <p className="text-xs text-muted-foreground">{col.bookmarks_count} verses</p>
                )}
              </div>
            </div>
            <button
              onClick={() => !isMember && handleAdd(col.id)}
              disabled={isMember || addToCollection.isPending}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0',
                isMember
                  ? 'bg-accent/15 text-accent cursor-default'
                  : 'bg-primary hover:bg-accent/10 hover:text-accent text-muted-foreground'
              )}
            >
              {isMember ? (
                <>
                  <Check className="w-3 h-3" />
                  Added
                </>
              ) : (
                'Add'
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[3 / 4, 1, 5 / 6, 1, 2 / 3].map((w, i) => (
        <div key={i} className="h-4 rounded-md bg-primary" style={{ width: `${w * 100}%` }} />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-center py-16 text-sm text-muted-foreground">{message}</p>;
}
