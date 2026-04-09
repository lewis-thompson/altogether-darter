import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks'
import { GameHeader, PlayerSection, ScoreComponent, PageLayout } from '../../components'
import { createGame, addGamePlayer, updateGamePlayerScore } from '../../services'
import { saveX01GameState } from '../../services/gameStates'
import { Player, PlayerStatus } from '../../types'

interface X01Props {
  players: Player[]
  startingScore: number
}

export function X01Page({ players, startingScore }: X01Props) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const playerListRef = useRef<HTMLDivElement | null>(null)
  const playerCardRefs = useRef<Record<number, HTMLDivElement | null>>({})

  // Game state
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [currentRound, setCurrentRound] = useState(1)
  const [selectedModifier, setSelectedModifier] = useState<'double' | 'treble' | null>(null)
  const [currentHits, setCurrentHits] = useState<string[]>([])

  // Player state tracking
  const [playerHits, setPlayerHits] = useState<Record<number, string[]>>(() =>
    players.reduce((acc, player) => ({ ...acc, [player.id]: [] }), {})
  )
  const [playerScores, setPlayerScores] = useState<Record<number, number>>(() =>
    players.reduce((acc, player) => ({ ...acc, [player.id]: startingScore }), {})
  )
  const [playerStatus, setPlayerStatus] = useState<Record<number, PlayerStatus>>(() =>
    players.reduce((acc, player) => ({ ...acc, [player.id]: 'alive' as PlayerStatus }), {})
  )

  const currentPlayer = players[currentPlayerIndex]
  const currentPlayerStatus = playerStatus[currentPlayer?.id]

  // Scroll to current player
  useEffect(() => {
    const currentCard = currentPlayer && playerCardRefs.current[currentPlayer.id]
    currentCard?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [currentPlayerIndex, currentPlayer])

  // TODO: Implement game logic here
  function addHit(target: 'miss' | 'bull' | number) {
    // Implement X01 scoring logic
    // 1. Format the hit (D20, T15, etc based on modifier)
    // 2. Calculate points for this hit
    // 3. Subtract from player's current score
    // 4. If player reaches exactly 0 with last dart as double → wins
    // 5. If busts (goes below 0) → lose turn, revert score
    // 6. Update player score and move to next player
    // 7. Save to Firestore
    console.log('X01: Add hit', target)
  }

  function removeLastHit() {
    // Implement undo logic
    console.log('X01: Remove last hit')
  }

  function toggleModifier(modifier: 'double' | 'treble') {
    setSelectedModifier((current) => (current === modifier ? null : modifier))
  }

  if (!user || !currentPlayer) {
    return <PageLayout title="X01">Loading...</PageLayout>
  }

  return (
    <PageLayout title="X01" showHomeLink={false}>
      <GameHeader
        gameType="X01"
        currentPlayerName={currentPlayer.name}
        round={currentRound}
      />

      <PlayerSection
        players={players}
        currentPlayerIndex={currentPlayerIndex}
        playerHits={playerHits}
        playerPoints={Object.fromEntries(Object.entries(playerScores).map(([k, v]) => [k, String(v)]))}
        playerStatus={playerStatus}
        onPlayerRef={(playerId, element) => {
          playerCardRefs.current[playerId] = element
        }}
      />

      <ScoreComponent
        onAddScore={addHit}
        onRemoveLastHit={removeLastHit}
        onToggleModifier={toggleModifier}
        selectedModifier={selectedModifier}
        currentHits={currentHits}
        canScoreMore={currentHits.length < 3 && currentPlayerStatus === 'alive'}
      />
    </PageLayout>
  )
}
