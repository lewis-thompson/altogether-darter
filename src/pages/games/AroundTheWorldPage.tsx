import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks'
import { GameHeader, PlayerSection, ScoreComponent, PageLayout } from '../../components'
import { createGame, addGamePlayer, updateGamePlayerScore } from '../../services'
import { saveAroundTheWorldGameState } from '../../services/gameStates'
import { Player, PlayerStatus } from '../../types'

interface AroundTheWorldProps {
  players: Player[]
}

export function AroundTheWorldPage({ players }: AroundTheWorldProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const playerListRef = useRef<HTMLDivElement | null>(null)
  const playerCardRefs = useRef<Record<number, HTMLDivElement | null>>({})

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [currentRound, setCurrentRound] = useState(1)
  const [selectedModifier, setSelectedModifier] = useState<'double' | 'treble' | null>(null)
  const [currentHits, setCurrentHits] = useState<string[]>([])

  const [playerHits, setPlayerHits] = useState<Record<number, string[]>>(() =>
    players.reduce((acc, player) => ({ ...acc, [player.id]: [] }), {})
  )
  const [playerScores, setPlayerScores] = useState<Record<number, number>>(() =>
    players.reduce((acc, player) => ({ ...acc, [player.id]: 0 }), {})
  )
  const [playerStatus, setPlayerStatus] = useState<Record<number, PlayerStatus>>(() =>
    players.reduce((acc, player) => ({ ...acc, [player.id]: 'alive' as PlayerStatus }), {})
  )

  const currentPlayer = players[currentPlayerIndex]
  const currentPlayerStatus = playerStatus[currentPlayer?.id]

  useEffect(() => {
    const currentCard = currentPlayer && playerCardRefs.current[currentPlayer.id]
    currentCard?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [currentPlayerIndex, currentPlayer])

  // TODO: Implement game logic here
  function addHit(target: 'miss' | 'bull' | number) {
    // Implement Around The World scoring logic
    // 1. Progress through numbers 1-20, then bull
    // 2. Player needs to hit current segment (single, double, or treble counts)
    // 3. Once hit, move to next number
    // 4. First to hit all numbers wins
    console.log('Around The World: Add hit', target)
  }

  function removeLastHit() {
    console.log('Around The World: Remove last hit')
  }

  function toggleModifier(modifier: 'double' | 'treble') {
    setSelectedModifier((current) => (current === modifier ? null : modifier))
  }

  if (!user || !currentPlayer) {
    return <PageLayout title="Around The World">Loading...</PageLayout>
  }

  return (
    <PageLayout title="Around The World" showHomeLink={false}>
      <GameHeader
        gameType="Around The World"
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
