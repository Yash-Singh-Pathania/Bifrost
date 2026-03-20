import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react'

export interface VideoPlayerRef {
  seekTo: (seconds: number) => void
}

interface VideoPlayerProps {
  src: string
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({ src }, ref) => {
  const videoEl = useRef<HTMLVideoElement>(null)

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
    }
  }), [])

  // When source changes, reload the video element
  useEffect(() => {
    if (videoEl.current) {
      videoEl.current.load()
    }
  }, [src])

  // Use local:// protocol for local files — this routes through
  // our custom Electron protocol handler that supports Range requests
  const videoSrc = src.startsWith('/') ? `local://${src}` : src

  return (
    <div className="video-player">
      <video
        ref={videoEl}
        src={videoSrc}
        controls
        preload="auto"
        className="video-element"
      />
    </div>
  )
})

VideoPlayer.displayName = 'VideoPlayer'
export default VideoPlayer
