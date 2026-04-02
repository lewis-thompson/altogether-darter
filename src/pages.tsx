import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

function PageLayout({
  title,
  children,
}: {
  title: string
  children?: ReactNode
}) {
  return (
    <main className="page">
      <header className="page-header">
        <h1>{title}</h1>
        <Link className="home-link" to="/">
          Home
        </Link>
      </header>
      <div className="page-content">{children}</div>
    </main>
  )
}

export function HomePage() {
  return (
    <main className="page home-page">
      <h1>Altogether Darter</h1>
      <div className="button-grid">
        <Link className="page-button" to="/create-game">
          New Game
        </Link>
        <Link className="page-button" to="/saved-games">
          Continue Game
        </Link>
        <Link className="page-button" to="/statistics">
          Statistics
        </Link>
      </div>
    </main>
  )
}

export function CreateGamePage() {
  return (
    <PageLayout title="Create Game">
      <Link className="page-button" to="/killer">
        Start Game
      </Link>
    </PageLayout>
  )
}

export function KillerPage() {
  return <PageLayout title="Killer" />
}

export function SavedGamesPage() {
  return <PageLayout title="Saved Games" />
}

export function StatisticsPage() {
  return <PageLayout title="statistics" />
}
