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

  // Handle local:// protocol for local files
  // Using 'local://' instead of 'file://' routes through Electron's net.fetch
  // which properly supports HTTP byte-range requests for seamless video scrubbing.
  const videoSrc = src.startsWith('/') ? `local://${src}` : src

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
