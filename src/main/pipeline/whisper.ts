import { spawn } from 'child_process'
import { join } from 'path'
import { AppSettings, TranscriptChunk } from '../../shared/types'
import { v4 as uuid } from 'uuid'

/**
 * Transcription provider interface — swap implementations easily
 */
export interface TranscriptionProvider {
  transcribe(audioPath: string): Promise<TranscriptChunk[]>
}

/**
 * Get the Python executable inside the venv
 */
function getPythonPath(): string {
  // PYTHON_DIR is set by index.ts from app.getAppPath() when running in Electron.
  // Falls back to relative path when running via tsx directly.
  const pythonDir = process.env.PYTHON_DIR || join(__dirname, '../../../python')
  return join(pythonDir, 'venv', 'bin', 'python3')
}

/**
 * Local Whisper transcription via Python sidecar (faster-whisper)
 */
class LocalWhisperProvider implements TranscriptionProvider {
  private model: string

  constructor(model: string = 'base') {
    this.model = model
  }

  async transcribe(audioPath: string): Promise<TranscriptChunk[]> {
    const pythonPath = getPythonPath()
    const pythonDir = process.env.PYTHON_DIR || join(__dirname, '../../../python')
    const scriptPath = join(pythonDir, 'transcribe.py')

    return new Promise((resolve, reject) => {
      const proc = spawn(pythonPath, [
        scriptPath,
        '--audio', audioPath,
        '--model', this.model
      ])

      let stdout = ''
      let stderr = ''

      proc.stdout.on('data', (data) => { stdout += data.toString() })
      proc.stderr.on('data', (data) => { stderr += data.toString() })

      proc.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(`Whisper transcription failed (code ${code}): ${stderr}`))
        }

        try {
          const segments = JSON.parse(stdout)
          const chunks: TranscriptChunk[] = segments.map((seg: any) => ({
            id: uuid(),
            text: seg.text.trim(),
            startTime: seg.start,
            endTime: seg.end
          }))
          resolve(chunks)
        } catch (e) {
          reject(new Error(`Failed to parse transcription output: ${e}`))
        }
      })
    })
  }
}

/**
 * Get the right transcription provider based on settings
 */
function getTranscriptionProvider(settings: AppSettings): TranscriptionProvider {
  switch (settings.transcriptionProvider) {
    case 'local-whisper':
      return new LocalWhisperProvider(settings.whisperModel)
    // Future: case 'openai-whisper': return new OpenAIWhisperProvider(settings)
    default:
      return new LocalWhisperProvider(settings.whisperModel)
  }
}

/**
 * Transcribe an audio file → timestamped chunks
 */
export async function transcribe(
  audioPath: string,
  settings: AppSettings
): Promise<TranscriptChunk[]> {
  const provider = getTranscriptionProvider(settings)
  return provider.transcribe(audioPath)
}
