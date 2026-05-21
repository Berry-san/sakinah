# Sakinah Handover Guide: Video Demo Script

This guide is designed for the team member recording the walk-through video of the **Sakinah** application. It provides a structured flow, visual cues, and a suggested narrative script highlighting the premium design and core integrations.

---

## 💻 Video Recording Recommendations
* **Theme**: Ensure the app is in **Dark Mode** for maximum visual impact (the warm charcoal palette looks extremely premium on video).
* **Length**: Target **2 to 3 minutes** total. Focus on pacing and keeping transitions smooth.
* **Resolution**: Record in 1080p, and zoom the browser in slightly (110%) to make text and Arabic script highly legible on smaller screens.

---

## 🎬 Step-by-Step Demo Script

### Scene 1: The Landing Page & Hook (0:00 - 0:30)
* **Visual**: Start at the root Landing Page (`/`). Scroll down slowly to show the Bismillah callout, the floating layout rules, and the feature grid cards. Hover over a couple of cards to show the micro-interaction transitions.
* **Narrator Guide**:
  > *"Welcome to Sakinah—your premium Quranic companion designed to help the Ummah build a deep, consistent, and reflective relationship with the Quran. We built Sakinah with a modern design system using Next.js 15, Tailwind, and Zustand, and integrated it directly with the Quran Foundation APIs."*
* **Visual**: Click "Sign in" to briefly show the OAuth redirect or hover over your user profile avatar to show that you are logged in.
  > *"Sakinah uses secure OAuth2 authentication with PKCE flows to seamlessly sync your user dashboard, streaks, and personalization across devices."*

---

### Scene 2: Core Quran Reader & Dual Layouts (0:30 - 1:10)
* **Visual**: Click on the **Quran** tab. Show the segmented controls (Surah, Juz, Hizb, Page) and select a Surah (e.g. Al-Fatiha or Surah Al-Mulk).
  > *"At the heart of the app is the Quran Reader. Users can navigate by Surah, Juz, Hizb, or Page. Sakinah features a dual-tabbed reader designed for both traditional and accessible reading."*
* **Visual**: Toggle to **Mushaf** view. Scroll a bit, then toggle back to **Translation** view.
  > *"In 'Mushaf Mode', users get a distraction-free, pure-Arabic layout. In 'Translation Mode', they get high-fidelity Uthmani Arabic script alongside English translation and transliteration to aid pronunciation."*
* **Visual**: Click the **Tajweed** toggle button on and off. Point out how letters change colors.
  > *"With our 'Tajweed Mode' enabled, the app parses and highlights pronunciation rules on-the-fly—making it easy to identify rules like Ghunnah, Madd, and Qalqalah while you read."*

---

### Scene 3: Audio Recitation & Sync (1:10 - 1:45)
* **Visual**: Click the **Play** icon on a verse. Let the audio play for 2-3 seconds. The audio bar will pop up at the bottom.
  > *"Sakinah features an interactive audio engine. Click play on any verse, and a sticky player appears. It fetches audio files from global reciters in real time."*
* **Visual**: Change reciters using the dropdown. Then, select a new verse to show how the page automatically scrolls the active verse into view.
  > *"Notice how the reader automatically scrolls the active verse card to the center of the viewport as recitation progresses. We've also added a custom verse range listener, allowing you to repeat specific ranges to aid in memorization (Hifz)."*

---

### Scene 4: Habit Tracking & Daily Goals (1:45 - 2:15)
* **Visual**: Navigate to the **Home** (Dashboard) and then click on **Goals**. Show the progress bar for today's plan.
  > *"Consistency is key to spiritual growth. The Sakinah dashboard tracks your daily habits. By fetching telemetry data from the Quran Foundation telemetry APIs, we show active streaks, page targets, and reading duration goals."*
* **Visual**: Explain the active logging:
  > *"Under the hood, as you read, the client tracks active usage using viewport detection and idle timers. Every 30 seconds, it batches your progress into verse ranges and flushes them to the QF activity logs, updating your streaks instantly."*

---

### Scene 5: Personal Journal & Wrap Up (2:15 - end)
* **Visual**: Go to **Reflections** to show the feed of Quran Reflect posts. Click the Info icon on a verse to open the details modal showing Tafsirs and Prophetic Hadiths.
  > *"Finally, users can explore Prophetic Hadith context linked to specific verses and read community reflections. Thank you for checking out Sakinah. Built with love for the Ummah."*

---

## 🛠️ Behind-The-Scenes Tech Highlights (For QA/Q&A)
If the judge or team asks technical questions, here are the key talking points:
1. **Local Serverless API Proxy (`/api/qf/[...path]`)**: Avoids CORS issues, handles injection of secure client credentials (`x-auth-token`, `x-client-id`), and updates authorization headers in transit.
2. **Failover Fallback Content Loading**: If the pre-live/production content servers from Quran Foundation fail to return the Quranic verses or reciter lists, the proxy automatically falls back to the public `api.quran.com` endpoints, guaranteeing 100% reader uptime.
3. **Usage Telemetry Batching**: Implements a debounce and range-merging utility (`verseKeysToRanges`) that groups individual verse interactions into unified blocks (e.g. `2:5-2:10`) before uploading to save API requests and server-side processing overhead.
