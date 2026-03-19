import { join } from 'path'
import { extractAudio, extractFrames, getVideoInfo } from './src/main/pipeline/ffmpeg'
import { transcribe } from './src/main/pipeline/whisper'
import { embedFrames, embedTextWithClip } from './src/main/pipeline/clip'
import { getEmbeddingProvider } from './src/main/pipeline/embeddings'
import { VectorStore } from './src/main/pipeline/vectordb'
import { DEFAULT_SETTINGS, TranscriptChunk } from './src/shared/types'
import fs from 'fs'

async function runEndToEnd() {
  const videoPath = '/Users/yash/Documents/My Personal Coding Projects/Video Search/testvideo.mp4'
  const dataDir = join(__dirname, 'data')
  const audioPath = join(dataDir, 'audio.wav')
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  const db = new VectorStore(dataDir)
  const embedder = getEmbeddingProvider(DEFAULT_SETTINGS)

  console.log('1. Getting video info...')
  const info = await getVideoInfo(videoPath)
  console.log('Video duration:', info.duration, 'seconds')

  console.log('\n2. Extracting audio...')
  await extractAudio(videoPath, audioPath)
  console.log('Audio extracted to:', audioPath)

  console.log('\n3. Transcribing audio...')
  const transcript = await transcribe(audioPath, DEFAULT_SETTINGS)
  console.log(`Extracted ${transcript.length} transcript segments`)

  console.log('\n4. Extracting frames (1 frame every 2s)...')
  const frames = await extractFrames(videoPath, dataDir, 2)
  console.log(`Extracted ${frames.length} frames`)

  console.log('\n5. Creating text embeddings...')
  const chunksToStore: TranscriptChunk[] = []
  for (const t of transcript) {
    const embedding = (await embedder.embed([t.text]))[0]
    chunksToStore.push({ ...t, embedding })
    console.log(`Embedded transcript [${t.startTime}s]: "${t.text.substring(0, 30)}..."`)
  }

  console.log('\n6. Creating visual embeddings...')
  const frameEmbeddings = await embedFrames(frames, DEFAULT_SETTINGS)
  console.log(`Embedded ${frameEmbeddings.length} frames`)

  console.log('\n7. Storing in LanceDB...')
  await db.addTranscriptChunks(chunksToStore)
  await db.addFrameEmbeddings(frameEmbeddings)
  
  console.log('\n8. Testing Search...')
  const searchVisual = await db.searchFrames(await embedTextWithClip('a person talking', DEFAULT_SETTINGS), 1)
  console.log('Search visual for "a person talking":', searchVisual)
  
  const searchText = await db.searchTranscripts((await embedder.embed(['what was said']))[0], 1)
  console.log('Search text for "what was said":', searchText)

  console.log('\n✅ Pipeline End-to-End Test Complete!')
}

runEndToEnd().catch(console.error)
