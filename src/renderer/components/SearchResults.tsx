import React, { useMemo } from 'react'
import { SearchResult } from '../../shared/types'
import { clusterSearchResults } from '../utils/searchClusters'

interface SearchResultsProps {
  results: SearchResult[]
  onResultClick: (result: SearchResult) => void
  isSearching: boolean
}

// ── Formatting helpers ──────────────────────────────────────

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatTimeRange(start: number, end: number): string {
  if (Math.abs(end - start) < 1) return formatTime(start)
  return `${formatTime(start)} – ${formatTime(end)}`
}

// ── Component ───────────────────────────────────────────────

export default function SearchResults({ results, onResultClick, isSearching }: SearchResultsProps) {
  const clusters = useMemo(() => clusterSearchResults(results), [results])

  if (isSearching) {
    return (
      <div className="results-container">
        <div className="results-loading">
          <div className="loading-pulse" />
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
        <span className="results-count">
          {clusters.length} segment{clusters.length !== 1 ? 's' : ''}
          <span className="results-count-detail"> from {results.length} matches</span>
        </span>
      </div>
      <div className="results-list">
        {clusters.map((cluster, index) => (
          <button
            key={`cluster-${index}`}
            className="result-card"
            onClick={() => onResultClick(cluster.best)}
            type="button"
          >
            {cluster.source === 'visual' && cluster.best.framePath && (
              <div className="result-thumbnail">
                <img src={`file://${cluster.best.framePath}`} alt="Frame" />
              </div>
            )}
            {cluster.source === 'transcript' && (
              <div className="result-thumbnail result-thumbnail-placeholder">TXT</div>
            )}
            <div className="result-middle">
              <p className="result-snippet">{cluster.snippet}</p>
              <div className="result-meta-row">
                <span className="result-timestamp">
                  {formatTimeRange(cluster.startTime, cluster.endTime)}
                </span>
                {cluster.results.length > 1 && (
                  <span className="result-hit-count">
                    {cluster.results.length} hits
                  </span>
                )}
              </div>
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
