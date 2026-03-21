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
  const [hasSearched, setHasSearched] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [library, setLibrary] = useState<VideoLibraryEntry[]>([])
  
  // Spatial Panel States
  const [isLibraryVisible, setIsLibraryVisible] = useState(true)
  const [isSearchVisible, setIsSearchVisible] = useState(true)
  
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
      
      // Auto-hide library and show search + video in immersive mode
      setIsLibraryVisible(false)
      setIsSearchVisible(true)
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
    setHasSearched(false)
    setAppState('ready')
    // Automatically enter immersive mode on select
    setIsLibraryVisible(false)
    setIsSearchVisible(true)
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
      setHasSearched(false)
    }
  }, [currentEntry])

  // ── Search ──────────────────────────────────────────────
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim() || !currentEntry) {
      setResults([])
      setHasSearched(false)
      return
    }
    setHasSearched(true)
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
    setHasSearched(false)
    setProgress(null)
    setError(null)
    setCurrentEntry(null)
  }, [])

  return (
    <div className="spatial-app">
      {/* ── Invisible Drag Region for Frameless Window ── */}
      <div className="titlebar-drag-region" />

      {/* ── Base Layer: Immersive Background ── */}
      <main className="spatial-background-layer">
        {/* Error overlay */}
        {error && (
          <div className="spatial-toast error-toast">
            <span>⚠️ {error}</span>
            <button className="icon-btn" onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {appState === 'idle' && (
          <div className="idle-container">
            <DropZone
              onDrop={handleVideoDrop}
              onImportClick={() => window.api.openFileDialog()}
            />
          </div>
        )}

        {appState === 'processing' && progress && (
          <div className="processing-container glass-material">
            <ProcessingStatus progress={progress} />
          </div>
        )}

        {appState === 'ready' && currentEntry && (
          <div className="immersive-video-bg">
            <VideoPlayer
              ref={videoRef}
              src={currentEntry.filePath}
            />
          </div>
        )}
      </main>

      {/* ── Z-Layer 1: Floating Panels (Ornaments) ── */}
      
      {/* Settings Modal Component - usually centers itself */}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}

      {/* Library Sliding Glass Panel */}
      <div className={`spatial-panel library-panel ${isLibraryVisible ? 'visible' : 'hidden'}`}>
        <div className="glass-material panel-content">
          <Library
            entries={library}
            currentId={currentEntry?.id}
            onSelect={handleLibrarySelect}
            onDelete={handleLibraryDelete}
            onImport={handleImportClick}
          />
        </div>
      </div>

      {/* Search Floating Glass Panel */}
      {appState === 'ready' && currentEntry && (
        <div className={`spatial-panel search-panel ${isSearchVisible ? 'visible' : 'hidden'} ${isSearching || hasSearched || results.length > 0 ? 'has-results' : 'compact'}`}>
          <div className="glass-material panel-content flex-col">
            <div className="glass-panel-header">
              <h2 className="glass-panel-title">Semantic Search</h2>
              <button 
                className="glass-panel-close"
                onClick={() => setIsSearchVisible(false)}
                title="Hide Search"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="glass-panel-body">
              <SearchBar
                onSearch={handleSearch}
                isSearching={isSearching}
              />
              {(isSearching || hasSearched) && (
                <SearchResults
                  results={results}
                  onResultClick={handleResultClick}
                  isSearching={isSearching}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Left Logo Ornament */}
      <div className="spatial-logo-ornament glass-material-subtle">
        <span className="logo-icon">·</span>
        <span className="logo-text">Bifrost</span>
      </div>

      {/* ── Z-Layer 2: Bottom Toolbar Ornament ── */}
      <div className="toolbar-hover-zone">
        <div className="spatial-toolbar-ornament glass-material">
          <button 
            className={`toolbar-btn ${isLibraryVisible ? 'active' : ''}`}
            onClick={() => setIsLibraryVisible(!isLibraryVisible)}
            title="Toggle Library"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
          </button>

          {appState === 'ready' && (
            <>
              <div className="toolbar-divider" />
              <button 
                className={`toolbar-btn ${isSearchVisible ? 'active' : ''}`}
                onClick={() => setIsSearchVisible(!isSearchVisible)}
                title="Toggle Search"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
              <div className="toolbar-divider" />
              <button className="toolbar-btn" onClick={handleReset} title="New Video">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </>
          )}

          <div className="toolbar-divider" />
          <button 
            className={`toolbar-btn ${showSettings ? 'active' : ''}`}
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
