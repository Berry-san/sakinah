'use client';

import { Navbar } from '@/components/layout/navbar';
import { motion } from 'framer-motion';
import Link from 'next/link';

const LAST_UPDATED = 'May 17, 2026';

const sections = [
  {
    title: '1. Acceptance of Terms',
    body: `By accessing or using Sakinah ("the App"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the App.`
  },
  {
    title: '2. Description of Service',
    body: `Sakinah is a Quran companion application that provides Quran reading, audio recitation, personal reflection journaling, goal tracking, and related Islamic content. The App is provided free of charge for personal, non-commercial use.`
  },
  {
    title: '3. User Accounts',
    body: `You may use most features of Sakinah without creating an account. An account is required to save reading progress, reflections, bookmarks, and goals. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.`
  },
  {
    title: '4. Acceptable Use',
    body: `You agree not to misuse the App. Prohibited conduct includes, but is not limited to: attempting to reverse-engineer or disrupt the App, submitting false or misleading information, using the App for any unlawful purpose, or scraping content in bulk without permission.`
  },
  {
    title: '5. Intellectual Property',
    body: `The Sakinah name, logo, and original UI design are the property of its developers. Quranic text, translations, audio recitations, and hadith content are sourced from third-party providers (including the Quran Foundation API) and are subject to their respective licenses. We do not claim ownership of any sacred text.`
  },
  {
    title: '6. Third-Party Services',
    body: `Sakinah integrates with third-party APIs to deliver Quran content and recitations. We are not responsible for the availability, accuracy, or policies of these external services. Use of the App is also subject to the terms of any third-party services it relies upon.`
  },
  {
    title: '7. Disclaimer of Warranties',
    body: `The App is provided "as is" without warranties of any kind, express or implied. We do not guarantee uninterrupted access, error-free operation, or the accuracy of any content. Religious content is provided for educational and spiritual purposes and should not replace scholarly guidance.`
  },
  {
    title: '8. Limitation of Liability',
    body: `To the maximum extent permitted by law, Sakinah and its developers shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of or inability to use the App.`
  },
  {
    title: '9. Changes to Terms',
    body: `We may update these Terms from time to time. Continued use of the App after changes are posted constitutes your acceptance of the revised Terms. We will update the "Last updated" date at the top of this page accordingly.`
  },
  {
    title: '10. Contact',
    body: `If you have questions about these Terms, please reach out via the contact information provided on our website.`
  }
];

export default function TermsPage() {
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
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                Terms & Conditions
              </h1>
              <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
              <p className="text-muted-foreground leading-relaxed">
                Please read these terms carefully before using Sakinah. They govern your access to
                and use of our application.
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
              <Link href="/privacy" className="text-accent hover:underline underline-offset-4">
                Privacy Policy
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
