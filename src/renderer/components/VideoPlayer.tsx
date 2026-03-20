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
  }), [])

  // When source changes, load the new source
  useEffect(() => {
    if (videoEl.current) {
      videoEl.current.load()
    }
  }, [src])

  // Use local:// protocol for local files
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
