import React, { useRef, useState, useCallback } from 'react'

interface TimelineMarker {
  timestamp: number
  id: string
  source: 'transcript' | 'visual'
  label: string
  count: number
  startTime: number
  endTime: number
}

interface VideoTimelineProps {
  duration: number
  currentTime: number
  markers: TimelineMarker[]
  onMarkerClick: (timestamp: number) => void
  onSeek: (timestamp: number) => void
}

export default function VideoTimeline({ 
  duration, 
  currentTime, 
  markers, 
  onMarkerClick,
  onSeek 
}: VideoTimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [hoverTime, setHoverTime] = useState<number | null>(null)
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null)

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleTrackClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || duration === 0) return
    const rect = trackRef.current.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const time = Math.max(0, Math.min(duration, percent * duration))
    onSeek(time)
  }, [duration, onSeek])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || duration === 0) return
    const rect = trackRef.current.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const time = Math.max(0, Math.min(duration, percent * duration))
    setHoverTime(time)
  }, [duration])

  const handleMouseLeave = useCallback(() => {
    setHoverTime(null)
  }, [])

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="video-timeline">
      <div className="timeline-track-container">
        <div 
          ref={trackRef}
          className="timeline-track"
          onClick={handleTrackClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Progress fill */}
          <div 
            className="timeline-progress" 
            style={{ width: `${progressPercent}%` }}
          />
          
          {/* Search result markers */}
          {markers.map((marker) => {
            const markerPercent = (marker.timestamp / duration) * 100
            return (
              <div
                key={marker.id}
                className="timeline-marker-wrap"
                style={{ left: `${markerPercent}%` }}
                onMouseEnter={() => setHoveredMarkerId(marker.id)}
                onMouseLeave={() => setHoveredMarkerId(null)}
              >
                {hoveredMarkerId === marker.id && (
                  <div className="timeline-marker-popup">
                    <span className="timeline-marker-popup-source">
                      {marker.source === 'transcript' ? 'TXT' : 'VIS'}
                    </span>
                    <span className="timeline-marker-popup-time">
                      {formatTime(marker.startTime)}{Math.abs(marker.endTime - marker.startTime) >= 1 ? ` – ${formatTime(marker.endTime)}` : ''}
                    </span>
                    {marker.count > 1 && (
                      <span className="timeline-marker-popup-count">{marker.count} hits</span>
                    )}
                  </div>
                )}
                <button
                  className={`timeline-marker timeline-marker-${marker.source}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onMarkerClick(marker.timestamp)
                  }}
                  title={marker.label}
                />
              </div>
            )
          })}
          
          {/* Current time handle */}
          <div 
            className="timeline-handle"
            style={{ left: `${progressPercent}%` }}
          />
        </div>
        
        {/* Hover tooltip */}
        {hoverTime !== null && (
          <div 
            className="timeline-tooltip"
            style={{ 
              left: `${(hoverTime / duration) * 100}%`,
              transform: 'translateX(-50%)'
            }}
          >
            {formatTime(hoverTime)}
          </div>
        )}
      </div>
      
      <div className="timeline-time">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  )
}
