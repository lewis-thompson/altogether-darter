import './App.css'
import { Routes, Route } from 'react-router-dom'
import {
  HomePage,
  CreateGamePage,
  KillerPage,
  SavedGamesPage,
  StatisticsPage,
} from './pages'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/create-game" element={<CreateGamePage />} />
      <Route path="/killer" element={<KillerPage />} />
      <Route path="/saved-games" element={<SavedGamesPage />} />
      <Route path="/statistics" element={<StatisticsPage />} />
    </Routes>
  )
}

export default App
