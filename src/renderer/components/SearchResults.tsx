import React from 'react'
import { SearchResult } from '../../shared/types'

interface SearchResultsProps {
  results: SearchResult[]
  onResultClick: (result: SearchResult) => void
  isSearching: boolean
}

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

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
        {results.map((result, index) => (
          <button
            key={result.id || `result-${index}`}
            className="result-card"
            onClick={() => onResultClick(result)}
            type="button"
          >
            <div className="result-left">
              <span className={`result-source-badge ${result.source}`}>
                {result.source === 'transcript' ? 'TXT' : 'IMG'}
              </span>
              <span className="result-timestamp">{formatTime(result.timestamp)}</span>
            </div>
            <div className="result-middle">
              <p className="result-snippet">{result.snippet}</p>
              <ScoreBar score={result.score} />
            </div>
            <div className="result-right">
              <span className="result-play-icon">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
