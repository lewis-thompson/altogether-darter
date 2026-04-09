# Game Pages Structure & Data Storage

## Firebase Setup Status ✅

- ✅ `.env.local` configured with Firebase credentials
- ✅ `firestore.rules` created and ready to deploy
- ✅ Authentication set up (Google sign-in with device persistence)
- ✅ All game pages created with proper structure

## Data Models & Storage

### Core Database Structure
```
users/{userId}/
├── games/{gameId}/
│   ├── players/{playerId}    # Game player state
│   │   ├── playerNumber: number
│   │   ├── score: number
│   │   └── targetScore: number
│   └── state/{gameType}      # Game-specific state
```

### Game State Models

All game state models are in `src/types/gameStates.ts`:

**X01**
```typescript
{
  startingScore: 301 | 501 | 701,
  roundsPlayed: number
}
```

**Around The World**
```typescript
{
  roundsPlayed: number,
  currentSegment: number  // 1-20, then Bull
}
```

**Cricket**
```typescript
{
  roundsPlayed: number,
  closedNumbers: Set<number>  // 15-20, Bull
}
```

**Every Number**
```typescript
{
  roundsPlayed: number,
  targetNumbers: number[]  // 1-20, Bull
}
```

**Score Killer**
```typescript
{
  roundsPlayed: number,
  killerThreshold: number
}
```

**Doubles**
```typescript
{
  roundsPlayed: number
}
```

**Shanghai**
```typescript
{
  roundsPlayed: number,
  currentRound: number  // 1-3
  roundNumbers: number[][]
}
```

**Splitscore**
```typescript
{
  roundsPlayed: number,
  teamsCount: number
}
```

## Game Pages Location

All game pages are in `src/pages/games/`:

| Game | File | Component |
|------|------|-----------|
| X01 | `X01Page.tsx` | `X01Page` |
| Around The World | `AroundTheWorldPage.tsx` | `AroundTheWorldPage` |
| Cricket | `CricketPage.tsx` | `CricketPage` |
| Every Number | `EveryNumberPage.tsx` | `EveryNumberPage` |
| Score Killer | `ScoreKillerPage.tsx` | `ScoreKillerPage` |
| Doubles | `DoublesPage.tsx` | `DoublesPage` |
| Shanghai | `ShanghaiPage.tsx` | `ShanghaiPage` |
| Splitscore | `SplitscorerPage.tsx` | `SplitscorerPage` |

## Reusable Components Used

Every game page uses these shared components:

1. **GameHeader**
   - Displays game name, current player, round
   - Optional: threshold value for applicable games
   ```tsx
   <GameHeader
     gameType="Cricket"
     currentPlayerName="Dave"
     round={3}
   />
   ```

2. **PlayerSection**
   - Displays all players with scores and hits
   - Auto-scrolls to current player
   ```tsx
   <PlayerSection
     players={players}
     currentPlayerIndex={0}
     playerHits={hits}
     playerPoints={scores}
     playerStatus={status}
     onPlayerRef={setPlayerRef}
   />
   ```

3. **ScoreComponent**
   - Number buttons 1-20, Bull, Miss
   - Modifier buttons (Double, Treble)
   - Back button for undo
   ```tsx
   <ScoreComponent
     onAddScore={addHit}
     onRemoveLastHit={undo}
     onToggleModifier={toggleMod}
     selectedModifier={mod}
     currentHits={hits}
     canScoreMore={canScore}
   />
   ```

## Standard Game Page Structure

Every game page follows this pattern:

```typescript
export function GameNamePage({ players, ...gameConfig }: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const playerCardRefs = useRef<Record<number, HTMLDivElement | null>>({})

  // State management
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [currentRound, setCurrentRound] = useState(1)
  const [selectedModifier, setSelectedModifier] = useState<'double' | 'treble' | null>(null)
  const [currentHits, setCurrentHits] = useState<string[]>([])

  // Player tracking
  const [playerHits, setPlayerHits] = useState<Record<number, string[]>>({ ... })
  const [playerScores, setPlayerScores] = useState<Record<number, number>>({ ... })
  const [playerStatus, setPlayerStatus] = useState<Record<number, PlayerStatus>>({ ... })

  // Auto-scroll to current player
  useEffect(() => {
    const card = playerCardRefs.current[currentPlayer.id]
    card?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [currentPlayerIndex, currentPlayer])

  // TODO: Game-specific logic
  function addHit(target: 'miss' | 'bull' | number) {
    // Implement game scoring
    // Update scores
    // Move to next player
    // Save to Firestore
  }

  function removeLastHit() {
    // Undo last hit
  }

  function toggleModifier(modifier: 'double' | 'treble') {
    setSelectedModifier(...)
  }

  // Render with components
  return (
    <PageLayout title="Game Name" showHomeLink={false}>
      <GameHeader ... />
      <PlayerSection ... />
      <ScoreComponent ... />
    </PageLayout>
  )
}
```

## Saving Game Data to Firestore

Each game type has a save function in `src/services/gameStates.ts`:

```typescript
// Example: Save Cricket game state
await saveCricketGameState(userId, gameId, {
  roundsPlayed: 5,
  closedNumbers: new Set([15, 16, 17])
})

// Save player score
await updateGamePlayerScore(userId, gameId, playerId, 150)

// Mark game as finished
await updateGameStatus(userId, gameId, 'finished')
```

## Implementing Game Logic

Each game page has `TODO` comments where you need to implement:

1. **addHit()** - Handle score based on game rules
   - Format the hit (D20, T15, etc.)
   - Calculate points
   - Update player score
   - Check win conditions
   - Move to next player

2. **removeLastHit()** - Undo functionality
   - Remove last hit from currentHits
   - Restore player score
   - Potentially restore previous player

3. The game state management is already set up - you just need to implement the scoring logic

## Adding Routes for Games

Update `src/App.tsx` to include game routes:

```typescript
import { X01Page, CricketPage, ... } from './pages/games'

<Route 
  path="/games/x01" 
  element={<ProtectedRoute element={<X01Page players={...} startingScore={501} />} />} 
/>
```

## Example: Implementing Cricket

```typescript
function addHit(target: 'miss' | 'bull' | number) {
  if (target === 'miss') {
    // Next player turn
    moveToNextPlayer()
    return
  }

  // Format hit with modifier
  const hitValue = formatHit(target)
  
  // Track which number is targeted
  const targetNum = target === 'bull' ? 'B' : target
  
  // Check if player has closed this number
  if (!closedNumbers.has(targetNum)) {
    // Mark as hit
    closedNumbers.add(targetNum)
  } else {
    // Already closed, accumulate points
    playerScores[currentPlayerId] += getPoints(hitValue)
  }

  // Update hits array
  setCurrentHits([...currentHits, hitValue])

  // If 3 darts, next player
  if (currentHits.length === 3) {
    moveToNextPlayer()
  }
}
```

## Quick Start for Now

1. ✅ Firebase is configured and ready
2. ✅ All game pages are created with proper structure
3. ✅ Reusable components are in place
4. ⏳ Next: Implement game-specific logic in each `addHit()` function
5. ⏳ Add Firestore calls to save game progress
6. ⏳ Wire up routes in App.tsx

All the framework is in place - you just need to fill in the game scoring logic!
