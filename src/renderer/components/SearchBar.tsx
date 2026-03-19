import React, { useState, useCallback, useRef, useEffect } from 'react'

interface SearchBarProps {
  onSearch: (query: string) => void
  isSearching: boolean
}

export default function SearchBar({ onSearch, isSearching }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced search — 400ms after user stops typing
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      onSearch(value)
    }, 400)
  }, [onSearch])

  // Immediate search on Enter
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      onSearch(query)
    }
  }, [onSearch, query])

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <div className="search-bar">
      <div className="search-input-wrapper">
        <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Search for anything — spoken words, visual content..."
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        {isSearching && <div className="search-spinner" />}
      </div>
      <div className="search-hints">
        <span className="hint-badge">🎤 "pricing discussion"</span>
        <span className="hint-badge">👁 "red car"</span>
        <span className="hint-badge">🎤 "conclusion"</span>
      </div>
    </div>
  )
}
