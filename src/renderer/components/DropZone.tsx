import React, { useState, useCallback, DragEvent } from 'react'

interface DropZoneProps {
  onDrop: (filePath: string, fileName: string) => void
  onImportClick: () => void
}

const ACCEPTED_EXTENSIONS = ['.mp4', '.mkv', '.webm', '.mov', '.avi', '.m4v', '.wmv']

export default function DropZone({ onDrop, onImportClick }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length === 0) return

    const file = files[0]
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      alert(`Unsupported format: ${ext}\nSupported: ${ACCEPTED_EXTENSIONS.join(', ')}`)
      return
    }

    // Electron provides the full path via .path property
    onDrop((file as any).path, file.name)
  }, [onDrop])

  return (
    <div className="dropzone-container">
      <div
        className={`dropzone ${isDragging ? 'dropzone-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={onImportClick}
      >
        <div className="dropzone-content">
          <div className="dropzone-icon-shell">
            <div className="dropzone-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
          </div>
          <h2 className="dropzone-title">Import your video</h2>
          <p className="dropzone-subtitle">
            Drag and drop a file here, or choose one from your computer.
          </p>
          <div className="dropzone-actions" onClick={e => e.stopPropagation()}>
            <button
              className="dropzone-browse-btn"
              onClick={onImportClick}
            >
              Browse Files
            </button>
            <span className="dropzone-drag-label">or drop video here</span>
          </div>
          <div className="dropzone-meta">
            <span>Supports {ACCEPTED_EXTENSIONS.join(', ')}</span>
            <span className="dropzone-meta-dot">•</span>
            <span>Audio + visual indexing enabled</span>
          </div>
        </div>
      </div>
    </div>
  )
}
