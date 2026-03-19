import React, { useState, useRef, useCallback, useEffect } from 'react'
import { SearchResult, ProcessingProgress, VideoLibraryEntry } from '../shared/types'
import DropZone from './components/DropZone'
import VideoPlayer, { VideoPlayerRef } from './components/VideoPlayer'
import SearchBar from './components/SearchBar'
import SearchResults from './components/SearchResults'
import ProcessingStatus from './components/ProcessingStatus'
import Settings from './components/Settings'
import Library from './components/Library'

type AppState = 'idle' | 'processing' | 'ready'

export default function App() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [videoPath, setVideoPath] = useState<string>('')
  const [videoName, setVideoName] = useState<string>('')
  const [currentEntry, setCurrentEntry] = useState<VideoLibraryEntry | null>(null)
  const [progress, setProgress] = useState<ProcessingProgress | null>(null)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [library, setLibrary] = useState<VideoLibraryEntry[]>([])
  const videoRef = useRef<VideoPlayerRef>(null)

  // Load library on mount
  useEffect(() => {
    window.api.getLibrary().then(setLibrary)
  }, [])

  // ── Start processing a video ────────────────────────────
  const startProcessing = useCallback(async (filePath: string, fileName: string) => {
    setVideoPath(filePath)
    setVideoName(fileName)
    setAppState('processing')
    setError(null)
    setResults([])
    setCurrentEntry(null)

    const unsubProgress = window.api.onProcessingProgress((p) => setProgress(p))

    const unsubComplete = window.api.onProcessingComplete((result) => {
      unsubProgress()
      unsubComplete()
      unsubError()
      if (result?.libraryEntry) {
        setCurrentEntry(result.libraryEntry)
        setLibrary(prev => [result.libraryEntry, ...prev])
      }
      setAppState('ready')
    })

    const unsubError = window.api.onProcessingError((err) => {
      setError(err)
      setAppState('idle')
      unsubProgress()
      unsubComplete()
      unsubError()
    })

    await window.api.processVideo(filePath)
  }, [])

  // ── Handle drag-drop ────────────────────────────────────
  const handleVideoDrop = useCallback(async (filePath: string, fileName: string) => {
    startProcessing(filePath, fileName)
  }, [startProcessing])

  // ── Handle upload button click ──────────────────────────
  const handleImportClick = useCallback(async () => {
    const filePath = await window.api.openFileDialog()
    if (!filePath) return
    const fileName = filePath.split('/').pop() || filePath
    startProcessing(filePath, fileName)
  }, [startProcessing])

  // ── Switch to a library video ───────────────────────────
  const handleLibrarySelect = useCallback((entry: VideoLibraryEntry) => {
    setVideoPath(entry.filePath)
    setVideoName(entry.fileName)
    setCurrentEntry(entry)
    setResults([])
    setAppState('ready')
  }, [])

  // ── Delete from library ─────────────────────────────────
  const handleLibraryDelete = useCallback(async (id: string) => {
    await window.api.deleteFromLibrary(id)
    setLibrary(prev => prev.filter(e => e.id !== id))
    if (currentEntry?.id === id) {
      setAppState('idle')
      setCurrentEntry(null)
      setVideoPath('')
      setVideoName('')
      setResults([])
    }
  }, [currentEntry])

  // ── Search ──────────────────────────────────────────────
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim() || !currentEntry) {
      setResults([])
      return
    }
    setIsSearching(true)
    try {
      const searchResults = await window.api.search(query, currentEntry.dataDir)
      setResults(searchResults)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setIsSearching(false)
    }
  }, [currentEntry])

  // ── Seek video ──────────────────────────────────────────
  const handleResultClick = useCallback((result: SearchResult) => {
    videoRef.current?.seekTo(result.timestamp)
  }, [])

  // ── Reset to idle ───────────────────────────────────────
  const handleReset = useCallback(() => {
    setAppState('idle')
    setVideoPath('')
    setVideoName('')
    setResults([])
    setProgress(null)
    setError(null)
    setCurrentEntry(null)
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
              title="Settings"
            >
              ⚙
            </button>
          </div>
        </div>
      </header>

      {/* ── Settings overlay ── */}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}

      {/* ── Main content ── */}
      <div className="app-body">

        {/* ── Sidebar: Library ── */}
        <Library
          entries={library}
          currentId={currentEntry?.id}
          onSelect={handleLibrarySelect}
          onDelete={handleLibraryDelete}
          onImport={handleImportClick}
        />

        {/* ── Main area ── */}
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
            <DropZone onDrop={handleVideoDrop} onImportClick={handleImportClick} />
          )}

          {/* ── State: Processing ── */}
          {appState === 'processing' && (
            <div className="processing-container">
              <h2 className="processing-title">Indexing {videoName}</h2>
              {progress && <ProcessingStatus progress={progress} />}
            </div>
          )}

          {/* ── State: Ready → Player + Search ── */}
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
    </div>
  )
}
