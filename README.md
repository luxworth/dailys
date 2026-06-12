# dailys

A minimalist, gamified daily challenge mobile app built with **React Native** and **Expo**.

Every day you receive exactly one unique task. Complete it by submitting proof — a photo, number, or text answer — before midnight local time.

## Features

- **Daily Challenge** — One deterministic task per calendar day with bold typography and status tracking (Pending, Submitted, Failed)
- **Dynamic submissions** — UI adapts to task type: camera/upload for images, number pad for counts, text field for open answers
- **Midnight countdown** — Live timer until the next challenge unlocks
- **History & streaks** — 30-day calendar grid (green = completed, red = missed) plus consecutive-day streak counter
- **Offline-first** — All progress persisted locally via AsyncStorage

## Tech Stack

- React Native + Expo SDK 56
- TypeScript
- React Navigation (bottom tabs)
- AsyncStorage for local persistence
- expo-image-picker for photo proof

## Project Structure

```
dailys/
├── App.tsx                          # Root component
├── app.json                         # Expo config
├── src/
│   ├── components/
│   │   ├── CalendarGrid.tsx         # 30-day history calendar
│   │   ├── CountdownTimer.tsx       # Midnight countdown
│   │   ├── ImageSubmission.tsx      # Photo/camera input
│   │   ├── NumberSubmission.tsx     # Numeric input
│   │   ├── StatusBadge.tsx          # Pending/Submitted/Failed badge
│   │   ├── SubmissionForm.tsx       # Dynamic form router + submit
│   │   └── TextSubmission.tsx       # Text input
│   ├── data/
│   │   └── tasks.ts                 # Mock task database (10 tasks)
│   ├── hooks/
│   │   ├── useDailyChallenge.ts     # Today's challenge state
│   │   └── useHistory.ts            # History & streak state
│   ├── navigation/
│   │   └── AppNavigator.tsx         # Bottom tab navigation
│   ├── screens/
│   │   ├── DailyChallengeScreen.tsx # Main daily view
│   │   └── HistoryScreen.tsx        # Streak & calendar view
│   ├── storage/
│   │   └── storage.ts               # AsyncStorage layer
│   ├── theme/
│   │   └── colors.ts                # Dark mode palette
│   ├── types/
│   │   └── index.ts                 # Shared TypeScript types
│   └── utils/
│       ├── dateUtils.ts             # Date helpers & countdown
│       ├── streakUtils.ts           # Streak calculation
│       └── taskUtils.ts             # Daily task selection
```

## Getting Started

```bash
npm install
npm start
```

Then scan the QR code with **Expo Go** on your phone, or press `i` for iOS simulator / `a` for Android emulator.

## Task Types

| Type | Example | Submission UI |
|------|---------|---------------|
| `NUMBER` | Count bathroom tiles | Number pad input |
| `IMAGE` | Photo of a dog | Camera or photo library |
| `TEXT` | Gratitude journal entry | Multiline text field |

## Daily Logic

1. Each calendar day maps to one task via a deterministic hash of the date string
2. On app launch, any past `PENDING` entries are marked `FAILED`
3. Submitting locks the answer for the day (`SUBMITTED`)
4. At midnight local time, a new task unlocks automatically
