import React, { useState } from 'react'
import { VideoLibraryEntry } from '../../shared/types'

interface LibraryProps {
  entries: VideoLibraryEntry[]
  currentId?: string
  onSelect: (entry: VideoLibraryEntry) => void
  onDelete: (id: string) => void
  onImport: () => void
  isHome?: boolean
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatSize(bytes: number): string {
  const mb = bytes / 1024 / 1024
  if (mb >= 1000) return `${(mb / 1024).toFixed(1)} GB`
  return `${mb.toFixed(0)} MB`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function Library({ entries, currentId, onSelect, onDelete, onImport, isHome }: LibraryProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  if (isHome) {
    return (
      <div className="library-home">
        <div className="library-home-header">
          <h1 className="library-home-title">Library</h1>
          <button className="library-home-import-btn" onClick={onImport}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Import Video
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="library-home-empty">
            <div className="library-home-empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <h2 className="library-home-empty-title">No videos yet</h2>
            <p className="library-home-empty-sub">
              Import a video to start searching through it semantically.
              <br />
              You can also drag and drop files anywhere in this window.
            </p>
            <button className="library-home-empty-btn" onClick={onImport}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Import Your First Video
            </button>
            <span className="library-home-empty-formats">
              MP4, MKV, WebM, MOV, AVI, M4V, WMV
            </span>
          </div>
        ) : (
          <div className="library-home-grid">
            {entries.map(entry => (
              <div
                key={entry.id}
                className={`library-home-card ${currentId === entry.id ? 'library-home-card-active' : ''}`}
                onClick={() => {
                  if (confirmDelete !== entry.id) onSelect(entry)
                }}
              >
                <div className="library-home-card-thumb">
                  <img
                    src={`local://${entry.dataDir}/thumb.jpg`}
                    alt=""
                    onError={(e) => {
                      const parent = e.currentTarget.parentElement as HTMLElement
                      parent.innerHTML = `<div class="library-home-card-thumb-fallback"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg></div>`
                    }}
                  />
                  <div className="library-home-card-duration">
                    {formatDuration(entry.duration)}
                  </div>
                </div>
                <div className="library-home-card-info">
                  <p className="library-home-card-name" title={entry.fileName}>
                    {entry.fileName.replace(/\.[^.]+$/, '')}
                  </p>
                  <div className="library-home-card-meta">
                    <span>{formatSize(entry.size)}</span>
                    <span className="library-dot">&middot;</span>
                    <span>{formatDate(entry.indexedAt)}</span>
                  </div>
                </div>
                {/* Delete button */}
                {confirmDelete === entry.id ? (
                  <div className="library-home-card-confirm" onClick={e => e.stopPropagation()}>
                    <button
                      className="library-confirm-yes"
                      onClick={() => { onDelete(entry.id); setConfirmDelete(null) }}
                    >
                      Delete
                    </button>
                    <button
                      className="library-confirm-no"
                      onClick={() => setConfirmDelete(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="library-home-card-delete"
                    onClick={e => { e.stopPropagation(); setConfirmDelete(entry.id) }}
                    title="Delete"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Sidebar mode (when in ready/player state)
  return (
    <aside className="library-sidebar">
      <div className="library-header">
        <h2 className="library-title">Library</h2>
        <button className="library-import-btn" onClick={onImport} title="Import a video">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Import
        </button>
      </div>

      <div className="library-list">
        {entries.length === 0 ? (
          <div className="library-empty">
            <div className="library-empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="2" width="20" height="20" rx="2.5" ry="2.5"></rect>
                <line x1="12" y1="18" x2="12" y2="18"></line>
              </svg>
            </div>
            <p>No videos yet</p>
            <p className="library-empty-sub">Import or drop a video to get started</p>
          </div>
        ) : (
          entries.map(entry => (
            <div
              key={entry.id}
              className={`library-item ${currentId === entry.id ? 'library-item-active' : ''}`}
              onClick={() => {
                if (confirmDelete !== entry.id) onSelect(entry)
              }}
            >
              <div className="library-thumb">
                <img
                  src={`local://${entry.dataDir}/thumb.jpg`}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: 'inherit'
                  }}
                  onError={(e) => {
                    (e.currentTarget.parentElement as HTMLElement).innerHTML = `<span class="library-ext">${entry.fileName.split('.').pop()?.toUpperCase() || ''}</span>`
                  }}
                />
              </div>

              <div className="library-info">
                <p className="library-filename" title={entry.fileName}>
                  {entry.fileName.replace(/\.[^.]+$/, '')}
                </p>
                <div className="library-meta">
                  <span>{formatDuration(entry.duration)}</span>
                  <span className="library-dot">&middot;</span>
                  <span>{formatSize(entry.size)}</span>
                  <span className="library-dot">&middot;</span>
                  <span>{formatDate(entry.indexedAt)}</span>
                </div>
                <div className="library-badges">
                  <span className="library-badge">{entry.chunkCount} segments</span>
                  <span className="library-badge">{entry.frameCount} frames</span>
                </div>
              </div>

              {confirmDelete === entry.id ? (
                <div className="library-confirm" onClick={e => e.stopPropagation()}>
                  <button
                    className="library-confirm-yes"
                    onClick={() => { onDelete(entry.id); setConfirmDelete(null) }}
                  >
                    Delete
                  </button>
                  <button
                    className="library-confirm-no"
                    onClick={() => setConfirmDelete(null)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  className="library-delete-btn"
                  onClick={e => { e.stopPropagation(); setConfirmDelete(entry.id) }}
                  title="Delete"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
