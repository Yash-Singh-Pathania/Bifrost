import React, { useRef, useImperativeHandle, forwardRef, useEffect, useState, useCallback } from 'react'
import VideoTimeline from './VideoTimeline'

export interface VideoPlayerRef {
  seekTo: (seconds: number) => void
  togglePlayPause: () => void
}

export interface VideoTimelineMarker {
  id: string
  timestamp: number
  source: 'transcript' | 'visual'
  label: string
  count: number
  startTime: number
  endTime: number
}

interface VideoPlayerProps {
  src: string
  markers?: VideoTimelineMarker[]
  onMarkersDismiss?: () => void
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({ src, markers = [], onMarkersDismiss }, ref) => {
  const videoEl = useRef<HTMLVideoElement>(null)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [dismissAtTime, setDismissAtTime] = useState<number | null>(null)

  useImperativeHandle(ref, () => ({
    seekTo: (seconds: number) => {
      const v = videoEl.current
      if (!v) return

      // Wait for the seek to complete before playing
      const onSeeked = () => {
        v.play().catch(() => {})
        v.removeEventListener('seeked', onSeeked)
      }
      v.addEventListener('seeked', onSeeked)
      v.currentTime = seconds
    },
    togglePlayPause: () => {
      const v = videoEl.current
      if (!v) return

      if (v.paused) {
        v.play().catch(() => {})
      } else {
        v.pause()
      }
    }
  }), [])

  // When source changes, reload the video element
  useEffect(() => {
    if (videoEl.current) {
      videoEl.current.load()
    }
  }, [src])

  const handleTimeUpdate = useCallback(() => {
    if (videoEl.current) {
      const nextTime = videoEl.current.currentTime
      setCurrentTime(nextTime)

      if (dismissAtTime !== null && nextTime >= dismissAtTime) {
        onMarkersDismiss?.()
        setDismissAtTime(null)
      }
    }
  }, [dismissAtTime, onMarkersDismiss])

  const handleLoadedMetadata = useCallback(() => {
    if (videoEl.current) {
      setDuration(videoEl.current.duration)
    }
  }, [])

  const handleVideoClick = useCallback(() => {
    const v = videoEl.current
    if (!v) return

    if (v.paused) {
      v.play().catch(() => {})
    } else {
      v.pause()
    }
  }, [])

  const handleSeek = useCallback((time: number) => {
    if (videoEl.current) {
      const onSeeked = () => {
        videoEl.current?.play().catch(() => {})
        videoEl.current?.removeEventListener('seeked', onSeeked)
      }

      videoEl.current.addEventListener('seeked', onSeeked)
      videoEl.current.currentTime = time
      setDismissAtTime(time + 3)
    }
  }, [])

  // Use local:// protocol for local files — this routes through
  // our custom Electron protocol handler that supports Range requests
  const videoSrc = src.startsWith('/') ? `local://${src}` : src

  return (
    <div className="video-player">
      <video
        ref={videoEl}
        src={videoSrc}
        preload="auto"
        className="video-element"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={handleVideoClick}
      />
      <VideoTimeline
        duration={duration}
        currentTime={currentTime}
        markers={markers}
        onMarkerClick={handleSeek}
        onSeek={handleSeek}
      />
    </div>
  )
})

VideoPlayer.displayName = 'VideoPlayer'
export default VideoPlayer
