# Refactoring Summary - Altogether Darter

## What I've Done

### 1. **File Structure Refactoring** ✅
Created a clean, modular architecture:

```
src/
├── components/        # Reusable UI components
├── services/          # Firebase & business logic
├── hooks/             # Custom React hooks
├── types/             # TypeScript definitions
└── pages/             # Page components (existing)
```

### 2. **Reusable Components** ✅
Extracted from old pages.tsx into individual files:

- **`GameHeader.tsx`** - Display game info (threshold, current player, round, buyback toggle)
- **`PlayerSection.tsx`** - Display all player cards with consistent styling
- **`ScoreComponent.tsx`** - Reusable score input for any game type
- **`PageLayout.tsx`** - Wrapper for consistent page structure

These components work with ANY game type - just pass different props!

### 3. **Firebase Authentication** ✅
- **`auth.ts`** - Google sign-in with 2 persistence options:
  - "Remember me" → stays signed in after browser closes
  - Default → only for current session
- **`LoginPage.tsx`** - Clean sign-in UI with checkbox
- **`ProtectedRoute`** in App.tsx - Redirects unauthenticated users to login

### 4. **Firestore Database Service** ✅
**`firestore.ts`** contains functions for:

**User Management:**
- `createOrUpdateUser()` - Save user to Firestore

**Players:**
- `createPlayer()` - Create new player
- `getPlayers()` - Fetch all players

**Games:**
- `createGame()` - Start new game
- `addGamePlayer()` - Add player to game with target score
- `updateGamePlayerScore()` - Update player score
- `updateGameStatus()` - Mark game as finished/abandoned

**Stats:**
- `getPlayerStats()` - Fetch stats for a game type
- `updatePlayerStats()` - Update wins, averages, etc.

**Game-Specific State:**
- `saveKillerGameState()` - Save killer game config
- `getKillerGameState()` - Fetch killer game config

### 5. **Type Safety** ✅
All types organized in `src/types/index.ts`:
- `Player`, `PlayerStatus` - Game entities
- `GameState`, `GameCompleteState` - Game flow
- `User` - Authentication
- `Firestore*` types - Database schemas

## What You Need to Do

### 1. **Setup Firebase** (Required!)
Follow [docs/FIREBASE_SETUP.md](./FIREBASE_SETUP.md):
1. Create Firebase project
2. Enable Google authentication
3. Enable Firestore
4. Copy `.env.example` → `.env.local`
5. Add your Firebase config to `.env.local`

### 2. **Update pages.tsx** (High Priority)
The old `pages.tsx` still has old code. Refactor each page:

**Example - KillerPage should now look like:**
```typescript
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './hooks'
import { GameHeader, PlayerSection, ScoreComponent, PageLayout } from './components'
import { createGame, addGamePlayer, updateGamePlayerScore } from './services'
import type { GameState } from './types'

export function KillerPage() {
  const { user } = useAuth()
  const location = useLocation()
  const state = location.state as GameState | null

  // Your game logic here...
  
  return (
    <PageLayout title="Killer" showHomeLink={false}>
      <GameHeader
        gameType="Killer"
        currentPlayerName={currentPlayer.name}
        round={round}
        threshold={25}
      />
      <PlayerSection
        players={players}
        currentPlayerIndex={currentPlayerIndex}
        playerHits={playerHits}
        playerPoints={playerPoints}
        playerStatus={playerStatus}
      />
      <ScoreComponent
        onAddScore={addHit}
        onRemoveLastHit={removeLastHit}
        onToggleModifier={toggleModifier}
        selectedModifier={selectedModifier}
        currentHits={currentHits}
        canScoreMore={currentHits.length < 3}
      />
    </PageLayout>
  )
}
```

### 3. **Wire Up Database Calls** (High Priority)
When game state changes, save to Firestore:

```typescript
// When starting a game
const gameId = await createGame(user!.uid, 'killer', 'in_progress')
for (const player of players) {
  const playerId = await createPlayer(user!.uid, player.name)
  await addGamePlayer(user!.uid, gameId, playerId, number, targetScore)
}

// When score updates
await updateGamePlayerScore(user!.uid, gameId, playerId, newScore)

// When game finishes
await updateGameStatus(user!.uid, gameId, 'finished')
```

### 4. **Add to HomePage** (Medium Priority)
Show users' saved games and stats:

```typescript
import { getPlayers } from './services'

export function HomePage() {
  const { user } = useAuth()
  const [players, setPlayers] = useState([])

  useEffect(() => {
    if (user) {
      getPlayers(user.uid).then(setPlayers)
    }
  }, [user])

  // Display players and games...
}
```

## Important Notes

### Environment Variables
Create `.env.local` with:
```
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
```

### Firebase Rules
Set Firestore rules to only allow users to access their own data (see FIREBASE_SETUP.md)

### Reusing Components
The three main components work with ANY game type:
- Pick different numbers for score buttons
- Adjust threshold/statistics
- Display different game-specific info

### Adding New Game Types
To add "X01 game":
1. Create `X01Page.tsx` using same components
2. Create `saveX01GameState()` in firestore.ts
3. Add route to App.tsx
Done! All UI logic reused.

## File Structure Summary

| File | Purpose |
|------|---------|
| `src/components/GameHeader.tsx` | Game info display |
| `src/components/PlayerSection.tsx` | Player cards |
| `src/components/ScoreComponent.tsx` | Score input |
| `src/components/LoginPage.tsx` | Sign-in page |
| `src/services/auth.ts` | Google sign-in logic |
| `src/services/firestore.ts` | Database operations |
| `src/hooks/useAuth.ts` | Auth state hook |
| `src/types/index.ts` | All TypeScript types |
| `src/App.tsx` | Routes + auth protection |
| `.env.local` | Firebase config (create from .env.example) |

## Next Steps for You

1. ✅ Read FIREBASE_SETUP.md
2. ✅ Set up Firebase project
3. ✅ Create .env.local with config
4. ✅ Update KillerPage using new components
5. ✅ Add database calls to save/load game data
6. ✅ Repeat for other game pages (CreateGame, etc.)
7. ✅ Update HomePage to fetch and display saved games

This structure will make it much easier to add new game types and maintain the code going forward!
