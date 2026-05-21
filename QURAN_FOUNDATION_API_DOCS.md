# Sakinah Web Application Documentation
## Quran Foundation API Integration Guide

This document provides a comprehensive overview of the architecture of the **Sakinah** application and a detailed technical explanation of how the **Quran Foundation (QF) APIs** are integrated. 

---

## 1. System Architecture Overview

Sakinah is built using Next.js 15, Tailwind CSS, TypeScript, Zustand, and React Query. The application interacts with two core layers of API resources:
1. **Public/Content Quranic Data**: Chapter lists, verse text, translations, transliterations, reciter resources, and audio timestamps.
2. **Authenticated User Data (Habits & Communities)**: User profiles, reading streaks, daily reading activity tracking, notes, bookmarks, custom collections, goals, prophetic hadith context, and reflections (posts, comments, likes).

### High-Level Request Flow
To prevent CORS issues, manage secure client credentials, and handle silent token refreshment, all API calls to the Quran Foundation endpoints are routed through a local serverless proxy route inside Next.js.

```mermaid
graph TD
    subgraph Client Browser
        UI[UI Components / Pages] --> |useQuery / useMutation| Hooks[React Query Hooks]
        Hooks --> |Fetch / Axios| LibAPI[lib/quran-api.ts / qfService.ts]
    end

    subgraph Next.js Server
        LibAPI --> |HTTP Request| Proxy[Next.js API Proxy: /api/qf/[...path]]
        Proxy --> |PKCE / OAuth Refresh| TokenCheck{Token Expired?}
        TokenCheck -->|Yes| Refresh[Exchange Refresh Token]
        TokenCheck -->|No| AuthInjector[Inject client_id & x-auth-token Headers]
    end

    subgraph Quran Foundation APIs
        AuthInjector --> |User Operations /v1/...| QF_Auth_API[apis-prelive.quran.foundation/auth]
        AuthInjector --> |Social Operations /quran-reflect/...| QF_Reflect_API[apis-prelive.quran.foundation/quran-reflect]
        Proxy --> |Public Content /content/api/v4/...| QF_Content_API[apis.quran.foundation/content/api/v4]
        QF_Content_API --> |Failed?| Fallback[api.quran.com/api/v4]
    end
```

---

## 2. Authentication & Session Management (OAuth2 + PKCE)

User authentication is powered directly by the Quran Foundation identity provider using the **OAuth 2.0 Authorization Code Flow with PKCE** (Proof Key for Code Exchange) to secure single-page application logins.

### 2.1 The Login Flow
Initiated by a request to `GET /api/auth/login`, which handles state generation server-side:
1. Generates a secure random 32-byte `code_verifier` and computes its SHA-256 hash to create the `code_challenge` (base64url encoded).
2. Generates a random `state` and `nonce` parameters.
3. Sets secure, HTTP-only, short-lived cookies: `oauth_state` and `oauth_code_verifier`.
4. Redirects the browser to the QF Identity Provider authorizing endpoint (`prelive-oauth2.quran.foundation/oauth2/auth`) with the following scopes:
   ```env
   openid offline_access profile user collection bookmark note goal streak reading_session activity_day preference comment post
   ```

### 2.2 Callback Handling
Handled at `/callback` (`app/callback/route.ts`):
1. **CSRF Validation**: Compares the incoming `state` parameter against the HTTP-only cookie `oauth_state`.
2. **Token Exchange**: Pulls the `oauth_code_verifier` from cookies and exchanges the authorization `code` at the `/oauth2/token` endpoint. Client credentials (client ID and client secret) are injected via the `Basic` Authorization header.
3. **Profile Fetching**: Requests the `/userinfo` endpoint using the newly acquired `access_token` to load basic profile data (sub, name, family name, email).
4. **Session Cookie**: Encapsulates the tokens (`access_token`, `refresh_token`, `id_token`), expiry timestamp, and user profile into an encrypted/secure HTTP-only cookie called `auth_session`.

### 2.3 Silent Token Refresh
The proxy intercepts requests to ensure the `access_token` does not expire midway:
- If the session token is expiring within **60 seconds**, the Next.js API handler triggers an background token exchange using the `refresh_token`.
- It writes the updated credentials back into the client's `auth_session` cookie seamlessly in the response headers.

### 2.4 RP-Initiated Logout
Initiated at `GET /api/auth/logout`:
1. Destroys the local `auth_session` cookie.
2. Checks for an `id_token` in the active session and triggers a fire-and-forget request to the QF server-side single sign-out endpoint `/oauth2/sessions/logout?id_token_hint=<token>` to sign the user out of the central provider.

---

## 3. Local API Proxy Routing

The proxy endpoint `app/api/qf/[...path]/route.ts` maps Next.js client-side paths to the appropriate QF upstream servers based on path segment prefixes:

| Path Prefix | Destination Service | Base Upstream URL | Description |
| :--- | :--- | :--- | :--- |
| `/api/qf/content/api/v4/...` | Production Content Service | `https://apis.quran.foundation/content/api/v4` | Publicly queryable Quranic text, translations, and audio files. |
| `/api/qf/quran-reflect/...` | Community Reflection Service | `https://apis.quran.foundation/quran-reflect` (prelive) | Forums, reflection feeds, and comments. |
| `/api/qf/v1/...` | Pre-Live Core API | `https://apis.quran.foundation/auth` (prelive) | User-specific goals, note-taking, bookmarks, and streaks. |

> [!TIP]
> **Content Failover Routing:** Prelive credentials are not accepted on the production content API. Therefore, the proxy calls `/content/api/v4` endpoints without auth headers. If the QF content API is unreachable or fails (non-200), the proxy automatically performs a failover fallback request to `https://api.quran.com/api/v4`.

---

## 4. Quran Foundation API Endpoint Implementations

The following sections highlight exactly how these APIs are consumed for specific features.

### 4.1 Quran Reader & Mushaf/Translation Views
The application queries Quranic content through `lib/quran-api.ts`.
- **Surah/Juz/Hizb Lists**: Requests `/chapters` and `/juzs` to render navigation sidebars and list grids.
- **Verse Retrieval**: Calls `/verses/by_chapter/${chapterNumber}`, `/verses/by_juz/${juzNumber}`, `/verses/by_hizb/${hizbNumber}`, and `/verses/by_page/${pageNumber}`.
  - Passes resource IDs for **Saheeh International English translation** (`resource_id: 20`) and **English Transliteration** (`resource_id: 57`).
  - Sets `word_fields` to fetch the word-by-word break down for transliteration popovers.

### 4.2 Tajweed Accentuation rules
Tajweed rules (pronunciation highlights) are retrieved dynamically:
- Word fields query includes `text_uthmani_tajweed` containing embedded HTML-like rules.
- The client-side parser (`components/quran/tajweed-text.tsx`) replaces the `<rule class="[type]">` tags with styled classes (`tj-[type]`) styled dynamically in `app/globals.css`:
  - `.tj-qalqala` (Qalqala - Red)
  - `.tj-ghunnah`, `.tj-ikhafa` (Ghunnah/Ikhafa - Pink/Purple)
  - `.tj-idghaam` (Idghaam - Green)
  - `.tj-silent` (Silent letters - Gray)

### 4.3 Audio Playback Synchronization & Range Listeners
- **Reciter Registry**: Fetches available reciters using `/resources/recitations`.
- **Recitation Playback**: Fetches individual audio file lists for a selected chapter using `/recitations/${reciterId}/by_chapter/${chapterNumber}`.
- **Bismillah Prepending**: When reading from verse 1, if the Surah configuration specifies `bismillah_pre: true`, the audio player retrieves and plays the Bismillah recitation (queried from Verse 1 of Chapter 1 of that reciter) before proceeding.
- **Auto-Scrolling Sync**: The active playing verse key is maintained in a global Zustand store (`store/use-store.ts`). The active verse card automatically triggers `scrollIntoView({ behavior: 'smooth', block: 'center' })` to scroll the viewport dynamically.
- **Range Listeners**: Users can define a subset of verses (e.g. verses 5-10) to loop. The audio manager slices the track array accordingly and loops the selected playlist.

### 4.4 User Activity Tracking & Analytics
Sakinah active-usage tracking runs continuously on the client reader page (`app/quran/page.tsx`):
1. **Duration Tracking**: A background ticker ticks every 5 seconds, checking `document.hidden` to increment read time only when the user is actively viewing the reader tab.
2. **Read Range Aggregation**: As verses enter the viewport or are interacted with, their keys (e.g. `2:5`, `2:6`) are logged. A utility function collapses them into contiguous ranges (e.g. `2:5-2:7`).
3. **Flushing Logs**: Every 30 seconds, a mutation is executed sending a payload to `/v1/activity-days`:
   ```json
   {
     "type": "QURAN",
     "seconds": 30,
     "ranges": ["2:5-2:7"],
     "mushafId": 1
   }
   ```
4. **Cloud Reading Position Sync**: Whenever `currentVerseKey` shifts, a debounced (2-second) request updates `/v1/reading-sessions` with the user's latest reading coordinate.

### 4.5 Habits & Goals Engine
Sakinah features a daily habit tracking dashboard using the `/v1/goals` and `/v1/activity-days` APIs:
- **Daily Goals**: Users create habit targets (e.g., `QURAN_TIME` for duration in minutes, `QURAN_PAGES` for page counts). These are submitted to `POST /v1/goals`.
- **Today's Progress Plan**: Fetches active status from `GET /v1/goals/get-todays-plan`. The app displays circular/linear progress bars comparing logged activity against daily targets.
- **Streaks Dashboard**: Displays the active consistency streak queried from `GET /v1/streaks/current-streak-days?type=QURAN`.

### 4.6 Prophetic Hadith Wisdom
Allows users to explore related prophetic commentary:
- Queries QF API `/hadiths/by_ayah/${verseKey}`.
- Renders Hadith citations linking the Quranic verse to classical Sahih Hadith collections.

### 4.7 Reflections Feed (Social Posts)
Provides community sharing tools powered by Quran Reflect endpoints:
- **Reflections Feed**: Loads a feed of reflections using `/quran-reflect/v1/posts/feed`.
