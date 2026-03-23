import React, { useState, useCallback, useEffect, DragEvent } from 'react'

interface DragOverlayProps {
  onDrop: (filePath: string, fileName: string) => void
}

const ACCEPTED_EXTENSIONS = ['.mp4', '.mkv', '.webm', '.mov', '.avi', '.m4v', '.wmv']

export default function DragOverlay({ onDrop }: DragOverlayProps) {
  const [isDragging, setIsDragging] = useState(false)
  const dragCountRef = React.useRef(0)

  useEffect(() => {
    const handleDragEnter = (e: globalThis.DragEvent) => {
      e.preventDefault()
      dragCountRef.current++
      if (dragCountRef.current === 1) setIsDragging(true)
    }

    const handleDragLeave = (e: globalThis.DragEvent) => {
      e.preventDefault()
      dragCountRef.current--
      if (dragCountRef.current === 0) setIsDragging(false)
    }

    const handleDragOver = (e: globalThis.DragEvent) => {
      e.preventDefault()
    }

    const handleDrop = (e: globalThis.DragEvent) => {
      e.preventDefault()
      dragCountRef.current = 0
      setIsDragging(false)

      const files = e.dataTransfer?.files
      if (!files || files.length === 0) return

      const file = files[0]
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()

      if (!ACCEPTED_EXTENSIONS.includes(ext)) return

      onDrop((file as any).path, file.name)
    }

    document.addEventListener('dragenter', handleDragEnter)
    document.addEventListener('dragleave', handleDragLeave)
    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('drop', handleDrop)

    return () => {
      document.removeEventListener('dragenter', handleDragEnter)
      document.removeEventListener('dragleave', handleDragLeave)
      document.removeEventListener('dragover', handleDragOver)
      document.removeEventListener('drop', handleDrop)
    }
  }, [onDrop])

  if (!isDragging) return null

  return (
    <div className="drag-overlay">
      <div className="drag-overlay-border">
        <div className="drag-overlay-content">
          <div className="drag-overlay-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <p className="drag-overlay-text">Drop to import</p>
        </div>
      </div>
    </div>
  )
}
