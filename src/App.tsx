import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks'
import { LoginPage } from './components'
import {
  HomePage,
  CreateGamePage,
  KillerPage,
  GameCompletePage,
  SavedGamesPage,
  StatisticsPage,
} from './pages'

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
      <Route path="/killer" element={<ProtectedRoute element={<KillerPage />} />} />
      <Route path="/game-complete" element={<ProtectedRoute element={<GameCompletePage />} />} />
      <Route path="/saved-games" element={<ProtectedRoute element={<SavedGamesPage />} />} />
      <Route path="/statistics" element={<ProtectedRoute element={<StatisticsPage />} />} />
    </Routes>
  )
}

export default App
