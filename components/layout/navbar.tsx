'use client';

import Link from 'next/link';
import { SignOut, List, X, Fire, Sun, Moon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useQFProfile } from '@/apiService/quranFoundationService/hooks';
import { useAuth } from '@/lib/auth-context';
import { useStore } from '@/store/use-store';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { SakinahLogo } from '@/components/ui/SakinahLogo';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-8 h-8" />;
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="flex items-center justify-center w-8 h-8 transition-colors rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/10"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun weight="fill" size={16} /> : <Moon weight="fill" size={16} />}
    </button>
  );
}

const NAV_LINKS = [
  { href: '/dashboard', label: 'Home' },
  { href: '/quran', label: 'Quran' },
  { href: '/recitation', label: 'Recitation' },
  { href: '/discover', label: 'Discover' },
  { href: '/reflections', label: 'Reflections' },
  { href: '/collections', label: 'Collections' },
  // { href: '/rooms', label: 'Rooms' },
  { href: '/goals', label: 'Goals' }
];

export function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, user, logout, login, isLoading } = useAuth();
  const { data: qfProfile } = useQFProfile();
  const { stats } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const firstName = qfProfile?.firstName ?? user?.firstName;
  const lastName = qfProfile?.lastName ?? user?.lastName;
  const photoUrl = qfProfile?.photoUrl;

  const initials = (
    [firstName, lastName].filter(Boolean).join(' ') ||
    user?.email?.split('@')[0] ||
    'U'
  )
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur-md border-border">
        {/* Accent top line */}
        <div className="h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

        <div className="flex items-center justify-between max-w-6xl gap-4 px-5 mx-auto h-14">
          {/* Logo */}
          <Link href={isAuthenticated ? '/dashboard' : '/'} className="shrink-0">
            <SakinahLogo size="xs" />
          </Link>

          {/* Desktop nav */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
              {NAV_LINKS.map(({ href, label }) => {
                const active =
                  pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'relative px-3 py-1.5 rounded-lg text-sm transition-colors',
                      active
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
                    )}
                  >
                    {label}
                    {active && (
                      <motion.span
                        layoutId="navDot"
                        className="absolute bottom-0 w-1 h-1 -translate-x-1/2 rounded-full left-1/2 bg-accent"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-border/50 animate-pulse" />
            ) : isAuthenticated ? (
              <>
                {/* Streak badge */}
                {stats.streak > 0 && (
                  <div className="items-center hidden gap-1 px-2 py-1 text-xs font-medium border rounded-lg sm:flex bg-accent/10 border-accent/20 text-accent">
                    <Fire weight="fill" size={12} />
                    {stats.streak}
                  </div>
                )}

                <ThemeToggle />

                {/* Profile avatar */}
                <Link
                  href="/profile"
                  className={cn(
                    'w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-semibold transition-all ring-1',
                    pathname === '/profile'
                      ? 'bg-accent text-accent-foreground ring-accent/50'
                      : 'bg-accent/15 text-accent ring-accent/30 hover:bg-accent/25 hover:ring-accent/50'
                  )}
                >
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={initials}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <span className={photoUrl ? 'hidden' : ''}>{initials}</span>
                </Link>

                {/* Sign out */}
                <button
                  onClick={logout}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
                  title="Sign out"
                >
                  <SignOut weight="fill" size={14} />
                  <span>Out</span>
                </button>

                {/* Mobile menu toggle */}
                <button
                  onClick={() => setMobileOpen((o) => !o)}
                  className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
                >
                  {mobileOpen ? <X weight="fill" size={16} /> : <List weight="fill" size={16} />}
                </button>
              </>
            ) : (
              <>
                <ThemeToggle />
                <button
                  onClick={login}
                  className="px-4 py-1.5 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[57px] left-0 right-0 z-40 md:hidden bg-background/98 backdrop-blur-md border-b border-border shadow-lg"
          >
            <nav className="px-5 py-3 flex flex-col gap-0.5">
              {NAV_LINKS.map(({ href, label }) => {
                const active =
                  pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'px-3 py-2.5 rounded-lg text-sm transition-colors',
                      active
                        ? 'text-accent font-medium bg-accent/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
              <div className="pt-2 mt-2 border-t border-border">
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
                >
                  <SignOut weight="fill" size={14} />
                  Sign out
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
