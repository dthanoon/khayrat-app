# Khayrat — Mobile App

**فَاسْتَبِقُوا الْخَيْرَاتِ** — "Race to all that is good"

A React Native / Expo mobile app for the Khayrat Islamic accountability platform.  
Connects to the **same Supabase backend** as the web app — shared users, data, and real-time.

---

## Architecture

| Layer | Choice | Why |
|---|---|---|
| Framework | Expo SDK 51 + Expo Router v3 | File-based routing like Next.js, iOS + Android from one codebase |
| Navigation | Expo Router (Stack + Tabs) | Auth group → unauthenticated, Tabs group → authenticated |
| State | Zustand | Lightweight, no boilerplate for auth session + toast |
| Backend | Supabase JS v2 | Same project as web app; realtime subscriptions built-in |
| Auth | Supabase Auth + AsyncStorage | Session persists across app restarts |
| Styling | React Native StyleSheet | Dark theme matching web app, no external UI library |

---

## Project Structure

```
khayrat-app/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout: auth gate, toast overlay
│   ├── index.tsx                 # Entry: redirects based on session
│   ├── (auth)/                   # Unauthenticated screens
│   │   ├── login.tsx
│   │   ├── register.tsx          # 2-step: account → profile
│   │   └── forgot-password.tsx
│   ├── (tabs)/                   # Main authenticated tabs
│   │   ├── index.tsx             # Dashboard (daily logger + stats)
│   │   ├── leaderboard.tsx       # Global rankings with filters
│   │   ├── arenas.tsx            # Arena list + join flow
│   │   └── profile.tsx           # My profile + heatmap
│   ├── arena/[id].tsx            # Arena detail: standings + chat
│   ├── user/[id].tsx             # Public user profile
│   └── settings.tsx              # Edit profile + change password
├── src/
│   ├── components/
│   │   ├── ui/                   # Button, Card, Input, Badge, LoadingSpinner
│   │   ├── DailyLogger.tsx       # 3-checkbox daily activity logger
│   │   ├── PersonalStats.tsx     # Streak, consistency, breakdown bars
│   │   ├── LeaderboardList.tsx   # FlatList with rank rows
│   │   ├── ArenaCard.tsx         # Arena preview card with join/leave
│   │   ├── ArenaChat.tsx         # Realtime chat with emoji reactions
│   │   └── ActivityHeatmap.tsx   # 30-day activity grid
│   ├── services/
│   │   ├── supabase.ts           # Supabase client (AsyncStorage session)
│   │   ├── logs.ts               # Daily log upsert + fetch
│   │   ├── leaderboard.ts        # Rankings, user stats, streak RPC
│   │   ├── arenas.ts             # Arenas CRUD, chat, reactions, notifications
│   │   └── profiles.ts           # Profile upsert, register via web API
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useDailyLog.ts
│   │   ├── useLeaderboard.ts     # useLeaderboard + usePersonalStats
│   │   └── useArenas.ts          # useArenas + useArenaDetail + useArenaChat + useNotifications
│   ├── store/useStore.ts         # Zustand: session, profile, toast
│   ├── types/index.ts            # All TypeScript interfaces
│   ├── constants/theme.ts        # Colors, spacing, typography
│   └── utils/
│       ├── consistency.ts        # Color coding + formatting helpers
│       └── date.ts               # Date formatting + arena status helpers
```

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/your-org/khayrat-app.git
cd khayrat-app
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Your Render deployment URL (for user registration)
EXPO_PUBLIC_API_BASE_URL=https://your-app.onrender.com
```

> **Where to find Supabase keys:**  
> Supabase Dashboard → Your project → Settings → API → Project URL + anon key

> **Do NOT** add `SUPABASE_SERVICE_ROLE_KEY` to the mobile app. The service role key
> lives only on your server (the web app). Registration goes through your web API.

### 3. Configure Supabase Auth redirect URL

In the Supabase dashboard → Authentication → URL Configuration:

Add to **Redirect URLs**:
```
khayrat://reset-password
```

This enables the password reset deep link to open the mobile app.

---

## Running Locally

```bash
# Start Expo dev server
npm start

# Open on iOS simulator (Mac + Xcode required)
npm run ios

# Open on Android emulator
npm run android

# Open in Expo Go (scan QR from the terminal)
npm start
```

> For best results, use Expo Go on your physical device. Scan the QR code that appears after `npm start`.

---

## Building for Production

### Prerequisites

1. Install EAS CLI: `npm install -g eas-cli`
2. Log in: `eas login`
3. Configure project: `eas build:configure`

### iOS (App Store)

```bash
npm run build:ios
```

### Android (Play Store)

```bash
npm run build:android
```

### Both platforms

```bash
npm run build:all
```

---

## Features

| Feature | Status |
|---|---|
| Email + password login | ✅ |
| 2-step registration | ✅ |
| Forgot / reset password | ✅ |
| Daily log (Quran, Fasting, Qiyam) | ✅ |
| Personal stats (streak, consistency %, rank) | ✅ |
| Leaderboard (4 sort modes, gender filter) | ✅ |
| Arena list + join / leave | ✅ |
| Battle arena: team standings | ✅ |
| Group arena: leaderboard | ✅ |
| Arena invite code | ✅ |
| Arena real-time chat | ✅ |
| Emoji reactions (long-press) | ✅ |
| @mention notifications | ✅ |
| 30-day activity heatmap | ✅ |
| Public user profiles | ✅ |
| Profile settings | ✅ |
| Dark theme | ✅ |
| Toast notifications | ✅ |
| Pull-to-refresh | ✅ |

---

## Connecting to Supabase

The mobile app uses the **same Supabase project** as the web app:
- **Same database** → users see the same data on web and mobile
- **Same auth** → existing users can log in immediately  
- **Same RLS policies** → security is enforced at the database level
- **Same realtime channels** → arena chat syncs between web and mobile in real time

Only the **anon key** is needed in the mobile app.  
The **service role key** is never exposed — registration goes through your web API endpoint.

---

## Notes

- The `EXPO_PUBLIC_` prefix is required for env vars to be bundled into the Expo app (equivalent to `NEXT_PUBLIC_` in Next.js)
- Session tokens are stored in `AsyncStorage` and persist across app restarts
- Supabase Realtime subscriptions (arena chat, notifications) are set up via `postgres_changes`
- Deep links use the `khayrat://` scheme (configured in `app.json`)
