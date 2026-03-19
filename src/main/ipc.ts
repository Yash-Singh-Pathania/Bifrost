import { ipcMain, BrowserWindow, app, dialog } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'fs'
import {
  IPC_CHANNELS,
  AppSettings,
  DEFAULT_SETTINGS,
  SearchResult,
  ProcessingProgress,
  VideoInfo,
  VideoLibraryEntry
} from '../shared/types'
import { extractAudio, extractFrames, getVideoInfo } from './pipeline/ffmpeg'
import { transcribe } from './pipeline/whisper'
import { embedFrames, embedTextWithClip } from './pipeline/clip'
import { getEmbeddingProvider } from './pipeline/embeddings'
import { VectorStore } from './pipeline/vectordb'
import { v4 as uuid } from 'uuid'

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
  writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2))
}

// ── Library persistence ──────────────────────────────────────

function getLibraryPath(): string {
  return join(app.getPath('userData'), 'library.json')
}

function loadLibrary(): VideoLibraryEntry[] {
  const libPath = getLibraryPath()
  if (existsSync(libPath)) {
    try {
      return JSON.parse(readFileSync(libPath, 'utf-8'))
    } catch {
      return []
    }
  }
  return []
}

function saveLibrary(library: VideoLibraryEntry[]): void {
  writeFileSync(getLibraryPath(), JSON.stringify(library, null, 2))
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

  // ── File Dialog ───────────────────
  ipcMain.handle(IPC_CHANNELS.OPEN_FILE_DIALOG, async () => {
    const result = await dialog.showOpenDialog({
      title: 'Import Video',
      buttonLabel: 'Import',
      filters: [
        { name: 'Videos', extensions: ['mp4', 'mkv', 'webm', 'mov', 'avi', 'm4v', 'wmv'] }
      ],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  // ── Library ───────────────────────
  ipcMain.handle(IPC_CHANNELS.GET_LIBRARY, () => {
    return loadLibrary()
  })

  ipcMain.handle(IPC_CHANNELS.DELETE_FROM_LIBRARY, (_event, id: string) => {
    const library = loadLibrary()
    const entry = library.find(e => e.id === id)
    if (entry && existsSync(entry.dataDir)) {
      try { rmSync(entry.dataDir, { recursive: true }) } catch {}
    }
    const newLibrary = library.filter(e => e.id !== id)
    saveLibrary(newLibrary)
    return { success: true }
  })

  // ── Settings ──────────────────────
  ipcMain.handle(IPC_CHANNELS.GET_SETTINGS, () => loadSettings())

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
    const { execSync } = await import('child_process')
    const deps: Record<string, boolean> = {}

    try { execSync('ffmpeg -version', { stdio: 'ignore' }); deps.ffmpeg = true }
    catch { deps.ffmpeg = false }

    try { execSync('python3 --version', { stdio: 'ignore' }); deps.python = true }
    catch { deps.python = false }

    try { execSync('ollama --version', { stdio: 'ignore' }); deps.ollama = true }
    catch { deps.ollama = false }

    return deps
  })

  // ── Process Video Pipeline ────────
  ipcMain.handle(IPC_CHANNELS.PROCESS_VIDEO, async (_event, filePath: string) => {
    const settings = loadSettings()
    const videoId = uuid()

    // Each video gets its own isolated data directory
    const videoDataDir = join(settings.dataDir, videoId)
    if (!existsSync(videoDataDir)) mkdirSync(videoDataDir, { recursive: true })

    const vectorStore = new VectorStore(videoDataDir)

    try {
      // Stage 1: Get video info
      sendProgress({ stage: 'extracting-audio', progress: 0, message: 'Analyzing video...' })
      const videoInfo = await getVideoInfo(filePath)

      // Stage 2: Extract audio
      sendProgress({ stage: 'extracting-audio', progress: 10, message: 'Extracting audio track...' })
      const audioPath = join(videoDataDir, 'audio.wav')
      await extractAudio(filePath, audioPath)

      // Stage 3: Transcribe
      sendProgress({ stage: 'transcribing', progress: 25, message: 'Transcribing audio with Whisper...' })
      const transcriptChunks = await transcribe(audioPath, settings)

      // Stage 4: Extract frames
      sendProgress({ stage: 'extracting-frames', progress: 45, message: 'Extracting video frames...' })
      const framesDir = join(videoDataDir, 'frames')
      if (!existsSync(framesDir)) mkdirSync(framesDir, { recursive: true })
      const framePaths = await extractFrames(filePath, framesDir, settings.frameIntervalSeconds)

      // Stage 5: Embed transcript chunks
      sendProgress({ stage: 'embedding-text', progress: 60, message: 'Embedding transcript with Ollama...' })
      const embeddingProvider = getEmbeddingProvider(settings)
      const texts = transcriptChunks.map(c => c.text)
      const textEmbeddings = await embeddingProvider.embed(texts)
      for (let i = 0; i < transcriptChunks.length; i++) {
        transcriptChunks[i].embedding = textEmbeddings[i]
      }

      // Stage 6: Embed frames with CLIP
      sendProgress({ stage: 'embedding-frames', progress: 75, message: 'Embedding frames with CLIP...' })
      const frameEmbeddings = await embedFrames(framePaths, settings)

      // Stage 7: Store in vector DB
      sendProgress({ stage: 'storing', progress: 90, message: 'Storing in database...' })
      await vectorStore.addTranscriptChunks(transcriptChunks)
      await vectorStore.addFrameEmbeddings(frameEmbeddings)

      // Stage 8: Save to library
      const library = loadLibrary()
      const entry: VideoLibraryEntry = {
        id: videoId,
        filePath,
        fileName: videoInfo.fileName,
        duration: videoInfo.duration,
        width: videoInfo.width,
        height: videoInfo.height,
        size: videoInfo.size,
        indexedAt: new Date().toISOString(),
        chunkCount: transcriptChunks.length,
        frameCount: frameEmbeddings.length,
        dataDir: videoDataDir
      }
      library.unshift(entry)  // newest first
      saveLibrary(library)

      sendProgress({ stage: 'done', progress: 100, message: 'Video indexed successfully!' })

      const windows = BrowserWindow.getAllWindows()
      for (const win of windows) {
        win.webContents.send(IPC_CHANNELS.PROCESSING_COMPLETE, {
          videoInfo,
          libraryEntry: entry,
          chunkCount: transcriptChunks.length,
          frameCount: frameEmbeddings.length
        })
      }

      return { success: true, videoInfo, libraryEntry: entry }
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

  // ── Search (scoped to one video) ──
  ipcMain.handle(IPC_CHANNELS.SEARCH, async (_event, query: string, videoDataDir: string) => {
    const settings = loadSettings()
    const vectorStore = new VectorStore(videoDataDir)

    try {
      const embeddingProvider = getEmbeddingProvider(settings)
      const [queryEmbedding] = await embeddingProvider.embed([query])
      const transcriptResults = await vectorStore.searchTranscripts(queryEmbedding, 10)
      const clipQueryEmbedding = await embedTextWithClip(query, settings)
      const frameResults = await vectorStore.searchFrames(clipQueryEmbedding, 10)

      const allResults: SearchResult[] = [
        ...transcriptResults.map(r => ({ ...r, source: 'transcript' as const })),
        ...frameResults.map(r => ({ ...r, source: 'visual' as const }))
      ]
      allResults.sort((a, b) => b.score - a.score)
      return allResults.slice(0, 20)
    } catch (error) {
      console.error('Search error:', error)
      return []
    }
  })
}
