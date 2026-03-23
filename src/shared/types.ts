// ============================================================
// Shared types for IPC communication between main and renderer
// ============================================================

/** Represents a single transcript chunk with timing info */
export interface TranscriptChunk {
  id: string
  text: string
  startTime: number   // seconds
  endTime: number     // seconds
  embedding?: number[]
}

/** Represents a single video frame embedding */
export interface FrameEmbedding {
  id: string
  timestamp: number   // seconds
  framePath: string   // path to extracted frame image
  embedding: number[]
}

/** Search result combining transcript and visual matches */
export interface SearchResult {
  id: string
  timestamp: number
  endTime?: number
  snippet: string
  text?: string
  score: number
  normalizedScore?: number
  source: 'transcript' | 'visual'
  framePath?: string
  reranked?: boolean
}

/** Processing pipeline stages */
export type ProcessingStage =
  | 'idle'
  | 'extracting-audio'
  | 'transcribing'
  | 'extracting-frames'
  | 'embedding-text'
  | 'embedding-frames'
  | 'storing'
  | 'done'
  | 'error'

/** Progress update sent from main → renderer */
export interface ProcessingProgress {
  stage: ProcessingStage
  progress: number    // 0-100
  message: string
}

/** App settings persisted to disk */
export interface AppSettings {
  // Embedding provider
  embeddingProvider: 'ollama' | 'openai'
  ollamaBaseUrl: string
  ollamaEmbeddingModel: string
  openaiApiKey?: string
  openaiEmbeddingModel?: string

  // Transcription
  transcriptionProvider: 'local-whisper' | 'openai-whisper'
  whisperModel: 'tiny' | 'base' | 'small' | 'medium' | 'large'

  // Frame extraction
  frameIntervalSeconds: number  // e.g., 2 = 1 frame every 2 seconds

  // Search optimization
  enableReranking: boolean  // Use LLM to rerank top results

  // Paths
  dataDir: string
}

/** Default settings — Ollama-first, fully local */
export const DEFAULT_SETTINGS: AppSettings = {
  embeddingProvider: 'ollama',
  ollamaBaseUrl: 'http://localhost:11434',
  ollamaEmbeddingModel: 'nomic-embed-text',

  transcriptionProvider: 'local-whisper',
  whisperModel: 'base',

  frameIntervalSeconds: 2,
  enableReranking: true,  // Use Mistral for reranking (when Ollama available)

  dataDir: '' // Set at runtime to app.getPath('userData')/data
}

/** Video metadata after import */
export interface VideoInfo {
  filePath: string
  fileName: string
  duration: number     // seconds
  width: number
  height: number
  size: number         // bytes
  thumbnailPath?: string
}

/** An entry in the local video library — persisted to disk */
export interface VideoLibraryEntry {
  id: string             // uuid
  filePath: string
  fileName: string
  duration: number
  width: number
  height: number
  size: number
  indexedAt: string      // ISO date string
  chunkCount: number
  frameCount: number
  dataDir: string        // where the embeddings live
}

// ============================================================
// IPC Channel names
// ============================================================
export const IPC_CHANNELS = {
  // Main process handlers (renderer → main)
  PROCESS_VIDEO: 'pipeline:process-video',
  SEARCH: 'pipeline:search',
  GET_SETTINGS: 'settings:get',
  SAVE_SETTINGS: 'settings:save',
  GET_VIDEO_INFO: 'video:get-info',
  CHECK_DEPENDENCIES: 'system:check-deps',
  OPEN_FILE_DIALOG: 'dialog:open-file',
  GET_LIBRARY: 'library:get',
  SAVE_LIBRARY: 'library:save',
  DELETE_FROM_LIBRARY: 'library:delete',
  SWITCH_VIDEO: 'library:switch',

  // Events (main → renderer)
  PROCESSING_PROGRESS: 'pipeline:progress',
  PROCESSING_ERROR: 'pipeline:error',
  PROCESSING_COMPLETE: 'pipeline:complete',
} as const
