import ffmpeg from 'fluent-ffmpeg'
import { join, basename } from 'path'
import { existsSync, mkdirSync, readdirSync } from 'fs'
import { VideoInfo } from '../../shared/types'

/**
 * Get metadata about a video file
 */
export function getVideoInfo(filePath: string): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(new Error(`ffprobe failed: ${err.message}`))

      const videoStream = metadata.streams.find(s => s.codec_type === 'video')
      const format = metadata.format

      resolve({
        filePath,
        fileName: basename(filePath),
        duration: format.duration || 0,
        width: videoStream?.width || 0,
        height: videoStream?.height || 0,
        size: format.size || 0
      })
    })
  })
}

/**
 * Extract audio track from video as a WAV file
 */
export function extractAudio(videoPath: string, outputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .noVideo()
      .audioCodec('pcm_s16le')
      .audioFrequency(16000)
      .audioChannels(1)
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(new Error(`Audio extraction failed: ${err.message}`)))
      .run()
  })
}

/**
 * Extract frames from video at a given interval
 * Returns array of paths to extracted frame images
 */
export function extractFrames(
  videoPath: string,
  outputDir: string,
  intervalSeconds: number = 2
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true })
    }

    const fps = 1 / intervalSeconds

    ffmpeg(videoPath)
      .outputOptions([
        `-vf fps=${fps}`,
        '-q:v 2'  // high quality JPEG
      ])
      .output(join(outputDir, 'frame_%06d.jpg'))
      .on('end', () => {
        const frames = readdirSync(outputDir)
          .filter(f => f.startsWith('frame_') && f.endsWith('.jpg'))
          .sort()
          .map(f => join(outputDir, f))
        resolve(frames)
      })
      .on('error', (err) => reject(new Error(`Frame extraction failed: ${err.message}`)))
      .run()
  })
}
