'use client';

import { motion } from 'framer-motion';
import { FloatingLights } from '@/components/ui/floating-lights';
import { GlassCard } from '@/components/ui/glass-card';
import { Sparkles, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';

export default function SignupPage() {
  const { login, isAuthenticated } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleSignup = () => {
    setIsRedirecting(true);
    login(); // Quran Foundation handles both login and signup via the same OAuth flow
  };

  if (isAuthenticated) {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
    return null;
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6">
      <FloatingLights />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-10 space-y-8" intensity="high">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-primary mx-auto flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-7 h-7 text-accent" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Join Sakinah</h1>
            <p className="text-foreground/60">Begin your journey with the Quran</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-foreground/70">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xs font-bold">
                  ✓
                </div>
                <span>Sync your Quran.com bookmarks & progress</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-foreground/70">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xs font-bold">
                  ✓
                </div>
                <span>Track your daily reading streaks</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-foreground/70">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xs font-bold">
                  ✓
                </div>
                <span>AI-powered Quran companion</span>
              </div>
            </div>

            <button
              onClick={handleSignup}
              disabled={isRedirecting}
              className="w-full h-14 bg-primary text-white font-bold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-60"
            >
              {isRedirecting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign up with Quran Foundation
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-foreground/60">
              Already have an account?{' '}
              <Link href="/login" className="text-accent font-bold hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="text-xs text-foreground/40 hover:text-foreground/60 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
