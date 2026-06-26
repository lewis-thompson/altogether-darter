import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface PageLayoutProps {
  title: string
  children?: ReactNode
  showHomeLink?: boolean
}

export function PageLayout({ title, children, showHomeLink = true }: PageLayoutProps) {
  return (
    <main className="page">
      <header className="page-header">
        <h1>{title}</h1>
        {showHomeLink && (
          <Link className="home-link" to="/">
            Home
          </Link>
        )}
      </header>
      <div className="page-content">{children}</div>
    </main>
  )
}
