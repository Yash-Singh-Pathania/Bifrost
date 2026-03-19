import React, { useState, useRef, useCallback } from 'react'
import { SearchResult, ProcessingProgress } from '../shared/types'
import DropZone from './components/DropZone'
import VideoPlayer, { VideoPlayerRef } from './components/VideoPlayer'
import SearchBar from './components/SearchBar'
import SearchResults from './components/SearchResults'
import ProcessingStatus from './components/ProcessingStatus'
import Settings from './components/Settings'

type AppState = 'idle' | 'processing' | 'ready'

export default function App() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [videoPath, setVideoPath] = useState<string>('')
  const [videoName, setVideoName] = useState<string>('')
  const [progress, setProgress] = useState<ProcessingProgress | null>(null)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<VideoPlayerRef>(null)

  // ── Handle video drop ──────────────────────────────────
  const handleVideoDrop = useCallback(async (filePath: string, fileName: string) => {
    setVideoPath(filePath)
    setVideoName(fileName)
    setAppState('processing')
    setError(null)
    setResults([])

    // Listen for progress updates
    const unsubProgress = window.api.onProcessingProgress((p) => {
      setProgress(p)
    })

    const unsubComplete = window.api.onProcessingComplete(() => {
      setAppState('ready')
      unsubProgress()
      unsubComplete()
      unsubError()
    })

    const unsubError = window.api.onProcessingError((err) => {
      setError(err)
      setAppState('idle')
      unsubProgress()
      unsubComplete()
      unsubError()
    })

    // Start processing
    await window.api.processVideo(filePath)
  }, [])

  // ── Handle search ──────────────────────────────────────
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setIsSearching(true)
    try {
      const searchResults = await window.api.search(query)
      setResults(searchResults)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setIsSearching(false)
    }
  }, [])

  // ── Handle result click → seek video ───────────────────
  const handleResultClick = useCallback((result: SearchResult) => {
    videoRef.current?.seekTo(result.timestamp)
  }, [])

  // ── Handle reset ───────────────────────────────────────
  const handleReset = useCallback(() => {
    setAppState('idle')
    setVideoPath('')
    setVideoName('')
    setResults([])
    setProgress(null)
    setError(null)
  }, [])

  return (
    <div className="app">
      {/* ── Titlebar / drag region ── */}
      <header className="titlebar">
        <div className="titlebar-drag" />
        <div className="titlebar-content">
          <div className="titlebar-logo">
            <span className="logo-icon">◉</span>
            <span className="logo-text">Video Search</span>
          </div>
          <div className="titlebar-actions">
            {appState === 'ready' && (
              <button className="btn-ghost" onClick={handleReset}>
                ← New Video
              </button>
            )}
            <button
              className="btn-ghost"
              onClick={() => setShowSettings(!showSettings)}
            >
              ⚙
            </button>
          </div>
        </div>
      </header>

      {/* ── Settings overlay ── */}
      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} />
      )}

      {/* ── Main content ── */}
      <main className="main-content">
        {/* ── Error banner ── */}
        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {/* ── State: Idle → Show DropZone ── */}
        {appState === 'idle' && (
          <DropZone onDrop={handleVideoDrop} />
        )}

        {/* ── State: Processing → Show progress ── */}
        {appState === 'processing' && (
          <div className="processing-container">
            <h2 className="processing-title">Processing {videoName}</h2>
            {progress && <ProcessingStatus progress={progress} />}
          </div>
        )}

        {/* ── State: Ready → Show player + search ── */}
        {appState === 'ready' && (
          <div className="search-layout">
            <div className="video-column">
              <VideoPlayer ref={videoRef} src={videoPath} />
            </div>
            <div className="search-column">
              <SearchBar onSearch={handleSearch} isSearching={isSearching} />
              <SearchResults
                results={results}
                onResultClick={handleResultClick}
                isSearching={isSearching}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
