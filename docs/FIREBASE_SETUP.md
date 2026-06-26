# Firebase Setup Guide

## Project Structure Overview

### Components (`src/components/`)
- `PageLayout.tsx` - Reusable page wrapper with header
- `GameHeader.tsx` - Game info section (reusable across game types)
- `PlayerSection.tsx` - Player card display (reusable across game types)
- `ScoreComponent.tsx` - Scoring input (reusable across game types)
- `LoginPage.tsx` - Google sign-in with "remember me"

### Services (`src/services/`)
- `firebase.ts` - Firebase initialization
- `auth.ts` - Authentication logic (Google sign-in, sign-out)
- `firestore.ts` - Firestore database operations (CRUD for all collections)

### Hooks (`src/hooks/`)
- `useAuth.ts` - React hook to access authentication state

### Types (`src/types/`)
- `index.ts` - All TypeScript interfaces and types

## Setup Instructions

### 1. Firebase Console Setup

1. Go to https://console.firebase.google.com
2. Create a new project or select existing
3. Enable Authentication:
   - Go to Authentication
   - Click "Get started"
   - Enable Google sign-in method
4. Enable Firestore:
   - Go to Firestore Database
   - Click "Create database"
   - Start in production mode
5. Get your config:
   - Go to Project Settings
   - Copy config values from "Your apps" section

### 2. Environment Configuration

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Firebase config values in `.env.local`

### 3. Firestore Security Rules

Replace the default security rules with:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      
      match /players/{playerId} {
        allow read, write: if request.auth.uid == userId;
        
        match /stats/{gameType} {
          allow read, write: if request.auth.uid == userId;
        }
      }
      
      match /games/{gameId} {
        allow read, write: if request.auth.uid == userId;
        
        match /players/{playerId} {
          allow read, write: if request.auth.uid == userId;
        }
        
        match /state/{stateDoc} {
          allow read, write: if request.auth.uid == userId;
        }
      }
    }
  }
}
```

## Database Collections

All collections automatically created when data is written:

```
users/{userId}
├── players/{playerId}
│   └── stats/{gameType}
└── games/{gameId}
    ├── players/{playerId}
    └── state/{gameType}
```

## Usage Examples

### Authentication

```typescript
import { useAuth } from './hooks'
import { signOutUser } from './services'

function MyComponent() {
  const { user, isLoading } = useAuth()
  
  if (isLoading) return <div>Loading...</div>
  if (!user) return <div>Not signed in</div>
  
  return <div>Welcome {user.displayName}</div>
}
```

### Firebase Operations

```typescript
import { createPlayer, createGame, updateGamePlayerScore } from './services'

// Create a player
const playerId = await createPlayer(userId, 'Dave')

// Create a game
const gameId = await createGame(userId, 'killer')

// Update player score
await updateGamePlayerScore(userId, gameId, playerId, 45)
```

### Reusable Components

```typescript
import { ScoreComponent, GameHeader, PlayerSection } from './components'

// Use in any game
<GameHeader
  gameType="Killer"
  currentPlayerName={player.name}
  round={currentRound}
  threshold={25}
/>

<PlayerSection
  players={players}
  currentPlayerIndex={currentIndex}
  playerHits={hits}
  playerPoints={points}
  playerStatus={status}
/>

<ScoreComponent
  onAddScore={handleScore}
  onRemoveLastHit={handleUndo}
  onToggleModifier={toggleModifier}
  selectedModifier={modifier}
  currentHits={hits}
  canScoreMore={true}
/>
```

## Adding New Game Types

1. Create new page component in `src/pages/NewGamePage.tsx`
2. Import reusable components
3. Use Firestore service to save game type and state
4. Add route to `App.tsx`

All components work with any game type - just pass different data!
