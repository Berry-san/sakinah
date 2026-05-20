'use client';

import { Navbar } from '@/components/layout/navbar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { fetchVerseByKey } from '@/lib/quran-api';
import {
  useQFCollections,
  useCreateCollection,
  useDeleteCollection,
  useAddToCollection
} from '@/apiService/quranFoundationService/hooks';
import { collectionsService } from '@/apiService/quranFoundationService/qfService';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookMarked,
  ChevronRight,
  FolderOpen,
  Loader2,
  LogIn,
  Plus,
  Trash2,
  X,
  ArrowLeft
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function CollectionsPage() {
  const { isAuthenticated, login } = useAuth();
  const { data: collections, isLoading } = useQFCollections();
  const createCollection = useCreateCollection();
  const deleteCollection = useDeleteCollection();

  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [openCollectionId, setOpenCollectionId] = useState<number | null>(null);

  const handleCreate = async () => {
    if (!formName.trim()) return;
    await createCollection.mutateAsync({
      name: formName.trim(),
      description: formDesc.trim() || undefined
    });
    setShowForm(false);
    setFormName('');
    setFormDesc('');
  };

  const openCollection = collections?.find((c) => c.id === openCollectionId);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      <main className="pt-24 px-6 max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-end justify-between"
        >
          <div className="space-y-1">
            <p className="text-sm font-medium text-accent uppercase tracking-wide">Verse Library</p>
            <h1 className="text-4xl font-bold tracking-tight">Collections</h1>
            <p className="text-muted-foreground text-sm">Organise saved verses into themed sets.</p>
          </div>
          {isAuthenticated && (
            <button
              onClick={() => setShowForm(true)}
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
            <FolderOpen className="mx-auto w-8 h-8 text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground">
              Sign in to create and manage collections.
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

        {/* Collections list */}
        {isAuthenticated && (
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : collections && collections.length > 0 ? (
              collections.map((col, i) => (
                <motion.div
                  key={col.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-5 rounded-xl border border-border bg-card card-highlight group"
                >
                  <div className="flex items-center justify-between gap-4">
                    <button
                      onClick={() =>
                        setOpenCollectionId(col.id === openCollectionId ? null : col.id)
                      }
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0">
                        <BookMarked className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{col.name}</p>
                        {col.description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {col.description}
                          </p>
                        )}
                      </div>
                    </button>
                    <div className="flex items-center gap-2 shrink-0">
                      {col.bookmarks_count != null && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {col.bookmarks_count} verses
                        </span>
                      )}
                      <button
                        onClick={() =>
                          setOpenCollectionId(col.id === openCollectionId ? null : col.id)
                        }
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary transition-colors"
                      >
                        <ChevronRight
                          className={cn(
                            'w-4 h-4 transition-transform',
                            openCollectionId === col.id && 'rotate-90'
                          )}
                        />
                      </button>
                      <button
                        onClick={() => deleteCollection.mutate(col.id)}
                        disabled={deleteCollection.isPending}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded items */}
                  <AnimatePresence>
                    {openCollectionId === col.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <CollectionItems collectionId={col.id} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            ) : (
              <div className="py-16 text-center border border-border rounded-xl bg-card">
                <FolderOpen className="mx-auto mb-3 w-7 h-7 text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground">No collections yet.</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 text-xs text-accent hover:underline"
                >
                  Create your first collection →
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create collection modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 12 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-sm rounded-2xl border border-border bg-card card-highlight p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">New Collection</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Collection name"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <button
                onClick={handleCreate}
                disabled={!formName.trim() || createCollection.isPending}
                className="w-full py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-semibold disabled:opacity-40 hover:bg-accent/90 transition-colors"
              >
                {createCollection.isPending ? 'Creating…' : 'Create Collection'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CollectionItems({ collectionId }: { collectionId: number }) {
  const { data: items, isLoading } = useQuery({
    queryKey: ['qf-collection-items', collectionId],
    queryFn: () => collectionsService.getItems(collectionId),
    staleTime: 1000 * 60 * 2
  });

  if (isLoading) {
    return (
      <div className="pt-4 flex justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <p className="pt-4 text-xs text-muted-foreground text-center">
        No verses in this collection yet. Add them from the verse detail panel.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {items.map((item) => (
        <CollectionVerseRow key={item.id} verseKey={item.key} />
      ))}
    </div>
  );
}

function CollectionVerseRow({ verseKey }: { verseKey: string }) {
  const { data: verse, isLoading } = useQuery({
    queryKey: ['verse', verseKey],
    queryFn: () => fetchVerseByKey(verseKey),
    staleTime: Infinity,
    retry: false
  });

  return (
    <div className="p-3 rounded-lg border border-border bg-primary/40 space-y-1.5">
      <p className="text-xs font-medium text-accent">{verseKey}</p>
      {isLoading ? (
        <div className="h-4 bg-border rounded animate-pulse w-3/4" />
      ) : verse ? (
        <>
          <p className="font-arabic text-base text-right text-foreground leading-[2]">
            {verse.text_uthmani}
          </p>
          {verse.translations?.[0] && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {(verse.translations[0] as any).text?.replace(/<[^>]*>/g, '')}
            </p>
          )}
        </>
      ) : (
        <p className="text-xs text-muted-foreground">{verseKey}</p>
      )}
    </div>
  );
}
