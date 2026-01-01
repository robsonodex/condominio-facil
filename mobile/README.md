# Mobile App - Meu Condomínio Fácil

Mobile application for the "Meu Condomínio Fácil" SaaS platform, built with Expo and React Native.

## Tech Stack

- **Framework**: Expo SDK 54+
- **Language**: TypeScript 5+
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query v5
- **Backend**: Supabase (shared with web app)
- **Navigation**: Expo Router (file-based)
- **UI Components**: React Native Paper + Custom Components

## Project Structure

```
mobile/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication screens
│   │   ├── login.tsx
│   │   └── _layout.tsx
│   ├── (tabs)/            # Main tab navigation
│   │   ├── home.tsx
│   │   ├── avisos/
│   │   ├── ocorrencias/
│   │   ├── reservas/
│   │   ├── perfil.tsx
│   │   └── _layout.tsx
│   ├── index.tsx          # Root redirect logic
│   └── _layout.tsx        # Root layout with providers
├── components/
│   └── ui/                # Reusable UI components
│       ├── Button.tsx
│       └── Input.tsx
├── hooks/                 # Custom hooks
│   └── useData.ts         # TanStack Query hooks
├── lib/                   # Core utilities
│   ├── api.ts            # API functions
│   ├── store.ts          # Zustand store
│   └── supabase.ts       # Supabase client
├── global.css            # NativeWind styles
└── package.json
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from parent project):
```env
EXPO_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Start development server:
```bash
npx expo start
```

## Features Implemented

### Phase 1: Setup ✅
- Expo project initialization
- NativeWind configuration
- Supabase client setup
- Zustand store for authentication
- Expo Router navigation structure

### Phase 2: Authentication ✅
- Login screen with email/password
- Session persistence with SecureStore
- Profile fetching and role-based data
- Auto-redirect based on auth state

### Phase 3: Core Features ✅
- **Home Dashboard**: Quick actions, recent activity
- **Notices**: List with filtering (all, urgent, official)
- **Occurrences**: List with status filtering, TanStack Query integration
- **Reservations**: Calendar strip, common areas grid
- **Profile**: User info, settings, logout

## Key Features

- **Shared Backend**: Uses same Supabase database as web app
- **Real-time Sync**: Changes propagate instantly between devices
- **Optimistic Updates**: UI updates before server confirmation
- **Offline Support**: TanStack Query caching
- **Type-safe**: Full TypeScript coverage

## Running the App

### Development
```bash
npx expo start
```

### Android
```bash
npx expo start --android
```

### iOS
```bash
npx expo start --ios
```

## Building for Production

```bash
# Build Android APK
eas build --platform android --profile preview

# Build iOS
eas build --platform ios --profile production
```

## Environment Variables

Required:
- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key

## Next Steps

- [ ] Implement real-time synchronization
- [ ] Add image upload (camera/gallery)
- [ ] Implement push notifications
- [ ] Add Síndico dashboard
- [ ] Add Porteiro features
- [ ] Polish UI/UX (animations, dark mode)
