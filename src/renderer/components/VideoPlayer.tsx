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
      if (videoEl.current) {
        videoEl.current.currentTime = seconds
        videoEl.current.play().catch(() => {})
      }
    }
  }))

  // Handle file:// protocol for local files
  const videoSrc = src.startsWith('/') ? `file://${src}` : src

  return (
    <div className="video-player">
      <video
        ref={videoEl}
        src={videoSrc}
        controls
        className="video-element"
      />
    </div>
  )
})

VideoPlayer.displayName = 'VideoPlayer'
export default VideoPlayer
