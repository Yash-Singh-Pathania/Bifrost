import React from 'react'
import { SearchResult } from '../../shared/types'

interface SearchResultsProps {
  results: SearchResult[]
  onResultClick: (result: SearchResult) => void
  isSearching: boolean
}

/**
 * Format seconds to MM:SS or HH:MM:SS
 */
function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Relevance score bar
 */
function ScoreBar({ score }: { score: number }) {
  const percentage = Math.round(score * 100)
  return (
    <div className="score-bar">
      <div className="score-fill" style={{ width: `${percentage}%` }} />
    </div>
  )
}

export default function SearchResults({ results, onResultClick, isSearching }: SearchResultsProps) {
  if (isSearching) {
    return (
      <div className="results-container">
        <div className="results-loading">
          <div className="loading-pulse" />
          <p>Searching across transcript and video frames...</p>
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="results-container">
        <div className="results-empty">
          <p className="results-empty-text">
            Type a query above to search your video.
            <br />
            <span className="results-empty-sub">
              Search by spoken words or visual content
            </span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="results-container">
      <div className="results-header">
        <span className="results-count">{results.length} result{results.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="results-list">
        {results.map((result) => (
          <button
            key={result.id}
            className="result-card"
            onClick={() => onResultClick(result)}
          >
            <div className="result-left">
              <span className={`result-source-badge ${result.source}`}>
                {result.source === 'transcript' ? '🎤' : '👁'}
              </span>
              <span className="result-timestamp">{formatTime(result.timestamp)}</span>
            </div>
            <div className="result-middle">
              <p className="result-snippet">{result.snippet}</p>
              <ScoreBar score={result.score} />
            </div>
            <div className="result-right">
              <span className="result-play-icon">▶</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
