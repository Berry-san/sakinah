'use client';

import { useCreatePost } from '@/apiService/quranFoundationService/hooks';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { motion } from 'framer-motion';
import { Save, Trash2, Maximize2, Minimize2, Loader2, LogIn } from 'lucide-react';
import { toast } from 'sonner';

export function JournalEditor() {
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const { isAuthenticated, login } = useAuth();
  const createPost = useCreatePost();

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  const handleSave = async () => {
    if (!content.trim()) return;
    try {
      await createPost.mutateAsync({ body: content.trim(), draft: false });
      toast.success('Reflection shared with the community.');
      setContent('');
    } catch {
      toast.error('Failed to share reflection. Please try again.');
    }
  };

  return (
    <motion.div
      layout
      className={`${isExpanded ? 'fixed inset-0 z-[100] p-6 bg-background/80 backdrop-blur-xl' : 'relative'}`}
    >
      <GlassCard
        intensity="high"
        className={`flex flex-col ${isExpanded ? 'h-full max-w-4xl mx-auto' : 'h-[400px]'}`}
      >
        {/* Editor Toolbar */}
        <div className="flex justify-between items-center p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest opacity-60">
              New Reflection
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Editor Body */}
        {!isAuthenticated ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
            <p className="text-foreground/40 text-sm">
              Sign in to share your reflections with the community.
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
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What did this verse teach your heart today?"
            className="flex-1 w-full p-8 bg-transparent border-none focus:ring-0 text-xl leading-relaxed resize-none placeholder:text-foreground/20 font-serif"
          />
        )}

        {/* Editor Footer */}
        <div className="p-4 flex justify-between items-center border-t border-border">
          <p className="text-xs text-foreground/40 font-medium">
            {wordCount} Words • {new Date().toLocaleDateString()}
          </p>
          {isAuthenticated && (
            <div className="flex gap-3">
              <button
                onClick={() => setContent('')}
                disabled={!content.trim()}
                className="p-2 text-foreground/40 hover:text-rose-500 transition-colors disabled:opacity-30"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={handleSave}
                disabled={!content.trim() || createPost.isPending}
                className="flex items-center gap-2 px-6 py-2 rounded-full bg-accent text-accent-foreground font-bold hover:bg-accent/90 hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:hover:scale-100"
              >
                {createPost.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {createPost.isPending ? 'Sharing…' : 'Share'}
              </button>
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}
