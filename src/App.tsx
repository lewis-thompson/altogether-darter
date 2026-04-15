import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks'
import { useLocation } from 'react-router-dom'
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
  return <X01Page players={state.players || []} startingScore={state.startingScore || 501} />
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
      <Route path="/saved-games" element={<ProtectedRoute element={<SavedGamesPage />} />} />
      <Route path="/statistics" element={<ProtectedRoute element={<StatisticsPage />} />} />
    </Routes>
  )
}

export default App
