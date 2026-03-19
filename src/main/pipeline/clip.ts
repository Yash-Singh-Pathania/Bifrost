import { spawn } from 'child_process'
import { join } from 'path'
import { AppSettings, FrameEmbedding } from '../../shared/types'
import { v4 as uuid } from 'uuid'

/**
 * Get the Python executable inside the venv
 */
function getPythonPath(): string {
  const pythonDir = process.env.PYTHON_DIR || join(__dirname, '../../../python')
  return join(pythonDir, 'venv', 'bin', 'python3')
}

/**
 * Embed video frames using CLIP via the Python sidecar
 * Returns frame embeddings with timestamps
 */
export async function embedFrames(
  framePaths: string[],
  settings: AppSettings
): Promise<FrameEmbedding[]> {
  const pythonPath = getPythonPath()
  const pythonDir = process.env.PYTHON_DIR || join(__dirname, '../../../python')
  const scriptPath = join(pythonDir, 'clip_server.py')

  return new Promise((resolve, reject) => {
    const proc = spawn(pythonPath, [scriptPath])

    // Send the command via stdin
    const command = {
      action: 'embed_frames',
      paths: framePaths,
      interval: settings.frameIntervalSeconds
    }

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (data) => { stdout += data.toString() })
    proc.stderr.on('data', (data) => { stderr += data.toString() })

    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`CLIP frame embedding failed (code ${code}): ${stderr}`))
      }

      try {
        const results = JSON.parse(stdout)
        const embeddings: FrameEmbedding[] = results.map((r: any, i: number) => ({
          id: uuid(),
          timestamp: i * settings.frameIntervalSeconds,
          framePath: framePaths[i],
          embedding: r.embedding
        }))
        resolve(embeddings)
      } catch (e) {
        reject(new Error(`Failed to parse CLIP output: ${e}`))
      }
    })

    proc.stdin.write(JSON.stringify(command) + '\n')
    proc.stdin.end()
  })
}

/**
 * Embed a text query using CLIP for visual search
 */
export async function embedTextWithClip(
  query: string,
  settings: AppSettings
): Promise<number[]> {
  const pythonPath = getPythonPath()
  const pythonDir = process.env.PYTHON_DIR || join(__dirname, '../../../python')
  const scriptPath = join(pythonDir, 'clip_server.py')

  return new Promise((resolve, reject) => {
    const proc = spawn(pythonPath, [scriptPath])

    const command = {
      action: 'embed_text',
      text: query
    }

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (data) => { stdout += data.toString() })
    proc.stderr.on('data', (data) => { stderr += data.toString() })

    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`CLIP text embedding failed (code ${code}): ${stderr}`))
      }

      try {
        const result = JSON.parse(stdout)
        resolve(result.embedding)
      } catch (e) {
        reject(new Error(`Failed to parse CLIP text output: ${e}`))
      }
    })

    proc.stdin.write(JSON.stringify(command) + '\n')
    proc.stdin.end()
  })
}
