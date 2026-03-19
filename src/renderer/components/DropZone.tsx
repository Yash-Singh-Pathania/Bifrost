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
        style={{ cursor: 'pointer' }}
      >
        <div className="dropzone-content">
          <div className="dropzone-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <h2 className="dropzone-title">Drop your video here</h2>
          <p className="dropzone-subtitle">
            MP4, MKV, WebM, MOV, AVI — any video file
          </p>
          <div className="dropzone-hint">
            <span className="hint-dot" />
            We'll transcribe the audio and index every frame
          </div>
          <button
            className="btn-primary dropzone-browse-btn"
            onClick={e => { e.stopPropagation(); onImportClick() }}
            style={{ marginTop: 20 }}
          >
            Browse Files
          </button>
        </div>

        {/* Animated border */}
        <div className="dropzone-border" />
      </div>
    </div>
  )
}
