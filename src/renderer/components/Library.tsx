import React, { useState } from 'react'
import { VideoLibraryEntry } from '../../shared/types'

interface LibraryProps {
  entries: VideoLibraryEntry[]
  currentId?: string
  onSelect: (entry: VideoLibraryEntry) => void
  onDelete: (id: string) => void
  onImport: () => void
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

export default function Library({ entries, currentId, onSelect, onDelete, onImport }: LibraryProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  return (
    <aside className="library-sidebar">
      {/* Header */}
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

      {/* List */}
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
              {/* Thumbnail placeholder with extension badge */}
              <div className="library-thumb">
                <span className="library-ext">{entry.fileName.split('.').pop()?.toUpperCase()}</span>
              </div>

              {/* Info */}
              <div className="library-info">
                <p className="library-filename" title={entry.fileName}>
                  {entry.fileName.replace(/\.[^.]+$/, '')}
                </p>
                <div className="library-meta">
                  <span>{formatDuration(entry.duration)}</span>
                  <span className="library-dot">·</span>
                  <span>{formatSize(entry.size)}</span>
                  <span className="library-dot">·</span>
                  <span>{formatDate(entry.indexedAt)}</span>
                </div>
                <div className="library-badges">
                  <span className="library-badge">{entry.chunkCount} segments</span>
                  <span className="library-badge">{entry.frameCount} frames</span>
                </div>
              </div>

              {/* Delete */}
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
                  ✕
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
