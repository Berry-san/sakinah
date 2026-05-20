'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function ContinuityLine() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [opacity, setOpacity] = useState(0.3);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(scrollPercent);

      // Opacity varies based on scroll position
      // Stronger during key sections, lighter elsewhere
      const sections = [
        { start: 10, end: 20, peak: 0.6 }, // Hero to Problem
        { start: 30, end: 40, peak: 0.8 }, // Problem to Insight
        { start: 50, end: 60, peak: 0.9 }, // Insight to Solution
        { start: 70, end: 85, peak: 0.7 } // Solution to Closing
      ];

      let currentOpacity = 0.2;
      sections.forEach((section) => {
        if (scrollPercent >= section.start && scrollPercent <= section.end) {
          const positionInSection = (scrollPercent - section.start) / (section.end - section.start);
          const distFromPeak = Math.abs(positionInSection - 0.5);
          currentOpacity = section.peak * (1 - distFromPeak);
        }
      });

      setOpacity(Math.max(0.2, currentOpacity));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.div
      className="fixed left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-amber-400 dark:via-amber-600 to-transparent pointer-events-none -translate-x-1/2"
      style={{
        opacity: opacity,
        scaleY: scrollProgress / 100,
        transformOrigin: 'top'
      }}
      transition={{ opacity: { duration: 0.3 } }}
    />
  );
}
