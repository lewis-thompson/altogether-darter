import './App.css'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './hooks'
import { useLocation } from 'react-router-dom'
import React from 'react'
import { LoginPage } from './components'
import {
  HomePage,
  CreateGamePage,
  GameCompletePage,
  SavedGamesPage,
  StatisticsPage,
} from './pages'
import { DummyKillerPage } from './pages/DummyKillerPage'
import {
  X01Page,
  AroundTheWorldPage,
  CricketPage,
  EveryNumberPage,
  ScoreKillerPage,
  DoublesPage,
  ShanghaiPage,
  SplitscorerPage,
  KillerPage,
} from './pages/games'

// Wrapper components to pass location state as props
function KillerPageWrapper() {
  const location = useLocation()
  const state = location.state as any || {}
  return <KillerPage state={state} />
}

function X01PageWrapper() {
  const location = useLocation()
  const state = location.state as any || {}
  return <X01Page players={state.players || []} startingScore={state.startingScore || 501} legsPerSet={state.legsPerSet || 3} setsPerGame={state.setsPerGame || 3} doubleIn={state.doubleIn ?? false} doubleOut={state.doubleOut ?? true} />
}

function AroundTheWorldPageWrapper() {
  const location = useLocation()
  const state = location.state as any || {}
  return <AroundTheWorldPage players={state.players || []} />
}

function CricketPageWrapper() {
  const location = useLocation()
  const state = location.state as any || {}
  return <CricketPage players={state.players || []} />
}

function EveryNumberPageWrapper() {
  const location = useLocation()
  const state = location.state as any || {}
  return <EveryNumberPage players={state.players || []} />
}

function ScoreKillerPageWrapper() {
  const location = useLocation()
  const state = location.state as any || {}
  return <ScoreKillerPage players={state.players || []} livesPerPlayer={state.livesPerPlayer || 3} />
}

function DoublesPageWrapper() {
  const location = useLocation()
  const state = location.state as any || {}
  return <DoublesPage players={state.players || []} />
}

function ShanghaiPageWrapper() {
  const location = useLocation()
  const state = location.state as any || {}
  return <ShanghaiPage players={state.players || []} />
}

function SplitscorerPageWrapper() {
  const location = useLocation()
  const state = location.state as any || {}
  return <SplitscorerPage players={state.players || []} />
}

function KillerPageTestWrapper() {
  const dummyState = {
    players: [
      { id: 1, name: 'Player A', selectedNumber: 5 },
      { id: 2, name: 'Player B', selectedNumber: 12 },
      { id: 3, name: 'Player C', selectedNumber: 18 },
      { id: 4, name: 'Player D', selectedNumber: 3 },
    ],
    bullseyeBuyback: false,
    bullseyeRounds: null,
    killerThreshold: 5,
  }
  return <KillerPage state={dummyState} />
}

function GameCompleteTestWrapper() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as any

  // Create dummy game complete state
  const dummyGameComplete = {
    winner: { id: 1, name: 'Player A', selectedNumber: 5 },
    winnerPoints: 25,
    totalPlayers: 4,
    totalRounds: 8,
    totalAttempts: 42,
    totalHits: 38,
    totalMisses: 4,
    bullseyeBuybackEnabled: false,
    bullseyeRounds: null,
    finalStandings: [
      { id: 1, name: 'Player A', selectedNumber: 5, points: 25, status: 'alive' as const },
      { id: 2, name: 'Player B', selectedNumber: 8, points: 15, status: 'alive' as const },
      { id: 3, name: 'Player C', selectedNumber: 12, points: 8, status: 'out-recovery' as const },
      { id: 4, name: 'Player D', selectedNumber: 20, points: -5, status: 'dead' as const },
    ],
  }

  // Navigate to game-complete with dummy state
  React.useEffect(() => {
    if (!state) {
      navigate('/game-complete', { state: dummyGameComplete, replace: true })
    }
  }, [navigate, state])

  return state ? <GameCompletePage /> : <PageLayout title="Game Complete"><p>Loading test data...</p></PageLayout>
}

function PageLayout({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <main className="page">
      <header className="page-header">
        <h1>{title}</h1>
      </header>
      <div className="page-content">{children}</div>
    </main>
  )
}

function ProtectedRoute({ element }: { element: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="page"><p>Loading...</p></div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return element
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute element={<HomePage />} />} />
      <Route path="/create-game" element={<ProtectedRoute element={<CreateGamePage />} />} />
      <Route path="/killer" element={<ProtectedRoute element={<KillerPageWrapper />} />} />
      <Route path="/killer-test" element={<ProtectedRoute element={<KillerPageTestWrapper />} />} />
      <Route path="/dummy-killer" element={<ProtectedRoute element={<DummyKillerPage />} />} />
      <Route path="/x01" element={<ProtectedRoute element={<X01PageWrapper />} />} />
      <Route path="/around-the-world" element={<ProtectedRoute element={<AroundTheWorldPageWrapper />} />} />
      <Route path="/cricket" element={<ProtectedRoute element={<CricketPageWrapper />} />} />
      <Route path="/every-number" element={<ProtectedRoute element={<EveryNumberPageWrapper />} />} />
      <Route path="/score-killer" element={<ProtectedRoute element={<ScoreKillerPageWrapper />} />} />
      <Route path="/doubles" element={<ProtectedRoute element={<DoublesPageWrapper />} />} />
      <Route path="/shanghai" element={<ProtectedRoute element={<ShanghaiPageWrapper />} />} />
      <Route path="/splitscore" element={<ProtectedRoute element={<SplitscorerPageWrapper />} />} />
      <Route path="/game-complete" element={<ProtectedRoute element={<GameCompletePage />} />} />
      <Route path="/game-complete-test" element={<ProtectedRoute element={<GameCompleteTestWrapper />} />} />
      <Route path="/saved-games" element={<ProtectedRoute element={<SavedGamesPage />} />} />
      <Route path="/statistics" element={<ProtectedRoute element={<StatisticsPage />} />} />
    </Routes>
  )
}

export default App
