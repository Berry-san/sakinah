'use client';

import { Navbar } from '@/components/layout/navbar';
import { motion } from 'framer-motion';
import Link from 'next/link';

const LAST_UPDATED = 'May 17, 2026';

const sections = [
  {
    title: '1. Information We Collect',
    body: `When you create an account, we collect your email address and optionally your name. When you use the App, we collect usage data such as reading sessions, bookmarks, reflections, and goals you create. If you sign in via a third-party provider (e.g., Google), we receive basic profile information as permitted by that provider.`
  },
  {
    title: '2. How We Use Your Information',
    body: `We use your information to: operate and improve the App; sync your reading progress, goals, and reflections across sessions; provide streak and activity statistics; and communicate with you about your account if needed. We do not sell your personal data to third parties.`
  },
  {
    title: '3. Data Storage and Security',
    body: `Your account data is stored securely using industry-standard practices. Reflections, bookmarks, and goals are stored server-side so they persist across devices. We take reasonable measures to protect your data, but no system is completely secure, and we cannot guarantee absolute security.`
  },
  {
    title: '4. Third-Party Services',
    body: `Sakinah uses third-party APIs (including the Quran Foundation) to serve Quranic content and recitations. These services may collect technical data such as IP addresses as part of normal API operations. We encourage you to review the privacy policies of these providers.`
  },
  {
    title: '5. Cookies and Local Storage',
    body: `We use browser local storage and cookies to maintain your session and preferences (such as theme, audio settings, and last-read position). No tracking or advertising cookies are used.`
  },
  {
    title: "6. Children's Privacy",
    body: `Sakinah is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us and we will delete it promptly.`
  },
  {
    title: '7. Your Rights',
    body: `You may request access to, correction of, or deletion of your personal data at any time by contacting us. You can also delete your account from the profile settings page, which will permanently remove your stored data.`
  },
  {
    title: '8. Data Retention',
    body: `We retain your data for as long as your account is active. If you delete your account, we will remove your personal data within 30 days, except where retention is required by law.`
  },
  {
    title: '9. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the "Last updated" date. Continued use of the App after changes are posted constitutes your acceptance of the revised policy.`
  },
  {
    title: '10. Contact Us',
    body: `If you have questions or concerns about this Privacy Policy or your data, please contact us via the information provided on our website. We take your privacy seriously and will respond promptly.`
  }
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-28 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-10"
          >
            <div className="space-y-3">
              <p className="text-xs text-accent font-medium uppercase tracking-widest">Legal</p>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
              <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
              <p className="text-muted-foreground leading-relaxed">
                Your privacy matters to us. This policy explains what data Sakinah collects, why we
                collect it, and how we protect it.
              </p>
            </div>

            <div className="space-y-8">
              {sections.map(({ title, body }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.4 }}
                  className="space-y-2"
                >
                  <h2 className="text-base font-semibold text-foreground">{title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                </motion.div>
              ))}
            </div>

            <div className="pt-6 border-t border-border text-sm text-muted-foreground">
              Also see our{' '}
              <Link href="/terms" className="text-accent hover:underline underline-offset-4">
                Terms & Conditions
              </Link>
              .
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="py-10 border-t border-border text-center text-muted-foreground text-sm">
        <p>© 2026 Sakinah — built with sincerity.</p>
      </footer>
    </div>
  );
}
