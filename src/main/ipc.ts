import { ipcMain, BrowserWindow, app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import {
  IPC_CHANNELS,
  AppSettings,
  DEFAULT_SETTINGS,
  SearchResult,
  ProcessingProgress,
  VideoInfo
} from '../shared/types'
import { extractAudio, extractFrames, getVideoInfo } from './pipeline/ffmpeg'
import { transcribe } from './pipeline/whisper'
import { embedFrames, embedTextWithClip } from './pipeline/clip'
import { getEmbeddingProvider } from './pipeline/embeddings'
import { VectorStore } from './pipeline/vectordb'

// ── Settings persistence ────────────────────────────────────

function getSettingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

function loadSettings(): AppSettings {
  const settingsPath = getSettingsPath()
  if (existsSync(settingsPath)) {
    try {
      const raw = readFileSync(settingsPath, 'utf-8')
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
    } catch {
      return { ...DEFAULT_SETTINGS, dataDir: join(app.getPath('userData'), 'data') }
    }
  }
  return { ...DEFAULT_SETTINGS, dataDir: join(app.getPath('userData'), 'data') }
}

function saveSettings(settings: AppSettings): void {
  const settingsPath = getSettingsPath()
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
}

// ── Send progress to renderer ───────────────────────────────

function sendProgress(progress: ProcessingProgress): void {
  const windows = BrowserWindow.getAllWindows()
  for (const win of windows) {
    win.webContents.send(IPC_CHANNELS.PROCESSING_PROGRESS, progress)
  }
}

// ── IPC Handler Registration ────────────────────────────────

export function registerIpcHandlers(): void {

  // ── Settings ──────────────────────
  ipcMain.handle(IPC_CHANNELS.GET_SETTINGS, () => {
    return loadSettings()
  })

  ipcMain.handle(IPC_CHANNELS.SAVE_SETTINGS, (_event, settings: AppSettings) => {
    saveSettings(settings)
    return { success: true }
  })

  // ── Video info ────────────────────
  ipcMain.handle(IPC_CHANNELS.GET_VIDEO_INFO, async (_event, filePath: string) => {
    return getVideoInfo(filePath)
  })

  // ── Dependency check ──────────────
  ipcMain.handle(IPC_CHANNELS.CHECK_DEPENDENCIES, async () => {
    // Check for ffmpeg, python, ollama
    const { execSync } = await import('child_process')
    const deps: Record<string, boolean> = {}

    try {
      execSync('ffmpeg -version', { stdio: 'ignore' })
      deps.ffmpeg = true
    } catch {
      deps.ffmpeg = false
    }

    try {
      execSync('python3 --version', { stdio: 'ignore' })
      deps.python = true
    } catch {
      deps.python = false
    }

    try {
      execSync('ollama --version', { stdio: 'ignore' })
      deps.ollama = true
    } catch {
      deps.ollama = false
    }

    return deps
  })

  // ── Process Video Pipeline ────────
  ipcMain.handle(IPC_CHANNELS.PROCESS_VIDEO, async (_event, filePath: string) => {
    const settings = loadSettings()

    // Ensure data directory exists
    if (!existsSync(settings.dataDir)) {
      mkdirSync(settings.dataDir, { recursive: true })
    }

    const vectorStore = new VectorStore(settings.dataDir)

    try {
      // Stage 1: Get video info
      sendProgress({ stage: 'extracting-audio', progress: 0, message: 'Analyzing video...' })
      const videoInfo = await getVideoInfo(filePath)

      // Stage 2: Extract audio
      sendProgress({ stage: 'extracting-audio', progress: 10, message: 'Extracting audio track...' })
      const audioPath = join(settings.dataDir, 'temp_audio.wav')
      await extractAudio(filePath, audioPath)

      // Stage 3: Transcribe
      sendProgress({ stage: 'transcribing', progress: 25, message: 'Transcribing audio with Whisper...' })
      const transcriptChunks = await transcribe(audioPath, settings)

      // Stage 4: Extract frames
      sendProgress({ stage: 'extracting-frames', progress: 45, message: 'Extracting video frames...' })
      const framesDir = join(settings.dataDir, 'frames')
      if (!existsSync(framesDir)) mkdirSync(framesDir, { recursive: true })
      const framePaths = await extractFrames(filePath, framesDir, settings.frameIntervalSeconds)

      // Stage 5: Embed transcript chunks
      sendProgress({ stage: 'embedding-text', progress: 60, message: 'Embedding transcript chunks...' })
      const embeddingProvider = getEmbeddingProvider(settings)
      const texts = transcriptChunks.map(c => c.text)
      const textEmbeddings = await embeddingProvider.embed(texts)

      for (let i = 0; i < transcriptChunks.length; i++) {
        transcriptChunks[i].embedding = textEmbeddings[i]
      }

      // Stage 6: Embed frames with CLIP
      sendProgress({ stage: 'embedding-frames', progress: 75, message: 'Embedding video frames with CLIP...' })
      const frameEmbeddings = await embedFrames(framePaths, settings)

      // Stage 7: Store in vector DB
      sendProgress({ stage: 'storing', progress: 90, message: 'Storing embeddings in database...' })
      await vectorStore.addTranscriptChunks(transcriptChunks)
      await vectorStore.addFrameEmbeddings(frameEmbeddings)

      // Done!
      sendProgress({ stage: 'done', progress: 100, message: 'Video indexed successfully!' })

      const windows = BrowserWindow.getAllWindows()
      for (const win of windows) {
        win.webContents.send(IPC_CHANNELS.PROCESSING_COMPLETE, {
          videoInfo,
          chunkCount: transcriptChunks.length,
          frameCount: frameEmbeddings.length
        })
      }

      return { success: true, videoInfo }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      sendProgress({ stage: 'error', progress: 0, message: errorMessage })

      const windows = BrowserWindow.getAllWindows()
      for (const win of windows) {
        win.webContents.send(IPC_CHANNELS.PROCESSING_ERROR, errorMessage)
      }

      return { success: false, error: errorMessage }
    }
  })

  // ── Search ────────────────────────
  ipcMain.handle(IPC_CHANNELS.SEARCH, async (_event, query: string) => {
    const settings = loadSettings()
    const vectorStore = new VectorStore(settings.dataDir)

    try {
      // Embed the query text for transcript search
      const embeddingProvider = getEmbeddingProvider(settings)
      const [queryEmbedding] = await embeddingProvider.embed([query])

      // Search transcripts
      const transcriptResults = await vectorStore.searchTranscripts(queryEmbedding, 10)

      // Embed query with CLIP for visual search
      const clipQueryEmbedding = await embedTextWithClip(query, settings)

      // Search frames
      const frameResults = await vectorStore.searchFrames(clipQueryEmbedding, 10)

      // Merge and rank results
      const allResults: SearchResult[] = [
        ...transcriptResults.map(r => ({ ...r, source: 'transcript' as const })),
        ...frameResults.map(r => ({ ...r, source: 'visual' as const }))
      ]

      // Sort by score descending and take top 20
      allResults.sort((a, b) => b.score - a.score)
      return allResults.slice(0, 20)
    } catch (error) {
      console.error('Search error:', error)
      return []
    }
  })
}
