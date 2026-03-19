import { connect, Table, Connection } from '@lancedb/lancedb'
import { join } from 'path'
import { TranscriptChunk, FrameEmbedding, SearchResult } from '../../shared/types'

/**
 * LanceDB vector store — embedded, no server needed
 * Manages two tables: transcript_chunks and video_frames
 */
export class VectorStore {
  private dbPath: string
  private db: Connection | null = null

  constructor(dataDir: string) {
    this.dbPath = join(dataDir, 'vectordb')
  }

  private async getDb(): Promise<Connection> {
    if (!this.db) {
      this.db = await connect(this.dbPath)
    }
    return this.db
  }

  /**
   * Store transcript chunks with their text embeddings
   */
  async addTranscriptChunks(chunks: TranscriptChunk[]): Promise<void> {
    if (chunks.length === 0) return

    const db = await this.getDb()

    const data = chunks
      .filter(c => c.embedding && c.embedding.length > 0)
      .map(c => ({
        id: c.id,
        text: c.text,
        start_time: c.startTime,
        end_time: c.endTime,
        vector: c.embedding!
      }))

    if (data.length === 0) return

    try {
      const tableNames = await db.tableNames()
      if (tableNames.includes('transcript_chunks')) {
        const table = await db.openTable('transcript_chunks')
        await table.add(data)
      } else {
        await db.createTable('transcript_chunks', data)
      }
    } catch (error) {
      console.error('Failed to add transcript chunks:', error)
      throw error
    }
  }

  /**
   * Store frame embeddings from CLIP
   */
  async addFrameEmbeddings(frames: FrameEmbedding[]): Promise<void> {
    if (frames.length === 0) return

    const db = await this.getDb()

    const data = frames.map(f => ({
      id: f.id,
      timestamp: f.timestamp,
      frame_path: f.framePath,
      vector: f.embedding
    }))

    try {
      const tableNames = await db.tableNames()
      if (tableNames.includes('video_frames')) {
        const table = await db.openTable('video_frames')
        await table.add(data)
      } else {
        await db.createTable('video_frames', data)
      }
    } catch (error) {
      console.error('Failed to add frame embeddings:', error)
      throw error
    }
  }

  /**
   * Search transcript chunks by embedding similarity
   */
  async searchTranscripts(queryEmbedding: number[], limit: number = 10): Promise<SearchResult[]> {
    const db = await this.getDb()

    try {
      const tableNames = await db.tableNames()
      if (!tableNames.includes('transcript_chunks')) return []

      const table = await db.openTable('transcript_chunks')
      const results = await table
        .search(queryEmbedding)
        .limit(limit)
        .toArray()

      return results.map((r: any) => ({
        id: r.id,
        timestamp: r.start_time,
        endTime: r.end_time,
        snippet: r.text,
        score: 1 - (r._distance || 0),
        source: 'transcript' as const
      }))
    } catch {
      return []
    }
  }

  /**
   * Search video frames by CLIP embedding similarity
   */
  async searchFrames(queryEmbedding: number[], limit: number = 10): Promise<SearchResult[]> {
    const db = await this.getDb()

    try {
      const tableNames = await db.tableNames()
      if (!tableNames.includes('video_frames')) return []

      const table = await db.openTable('video_frames')
      const results = await table
        .search(queryEmbedding)
        .limit(limit)
        .toArray()

      return results.map((r: any) => ({
        id: r.id,
        timestamp: r.timestamp,
        snippet: `Visual match at ${formatTime(r.timestamp)}`,
        score: 1 - (r._distance || 0),
        source: 'visual' as const,
        framePath: r.frame_path
      }))
    } catch {
      return []
    }
  }
}

/**
 * Format seconds to MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
