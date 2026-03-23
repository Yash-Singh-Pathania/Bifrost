import { spawn, ChildProcess } from 'child_process'
import { join } from 'path'

/**
 * Persistent process manager — keeps Python servers running for faster repeated use
 * Reduces 2-3 second startup overhead for each video
 */
export class ProcessPool {
  private clipProcess: ChildProcess | null = null
  private clipInput: any = null
  private whisperProcess: ChildProcess | null = null
  private whisperInput: any = null

  private pythonDir: string

  constructor(pythonDir: string) {
    this.pythonDir = pythonDir
  }

  /**
   * Get or start the persistent CLIP server process
   */
  async getClipProcess(): Promise<ChildProcess> {
    if (this.clipProcess && !this.clipProcess.killed) {
      return this.clipProcess
    }

    console.log('[ProcessPool] Starting persistent CLIP server...')
    const scriptPath = join(this.pythonDir, 'clip_server.py')
    const pythonPath = join(this.pythonDir, 'venv', 'bin', 'python3')

    return new Promise((resolve, reject) => {
      const proc = spawn(pythonPath, [scriptPath])

      proc.on('error', (err) => {
        console.error('[ProcessPool] CLIP process error:', err)
        this.clipProcess = null
        reject(err)
      })

      proc.on('close', () => {
        console.log('[ProcessPool] CLIP process closed')
        this.clipProcess = null
      })

      // Wait for model to load
      let stderr = ''
      const onStderr = (data: Buffer) => {
        stderr += data.toString()
        if (stderr.includes('model_loaded')) {
          proc.stderr?.removeListener('data', onStderr)
          console.log('[ProcessPool] CLIP server ready')
          this.clipProcess = proc
          resolve(proc)
        }
      }

      proc.stderr?.on('data', onStderr)

      // Timeout if model doesn't load in 60 seconds
      setTimeout(() => {
        if (!this.clipProcess) {
          proc.kill()
          reject(new Error('CLIP server startup timeout'))
        }
      }, 60000)
    })
  }

  /**
   * Send command to persistent CLIP server and get response
   */
  async clipCommand(command: any): Promise<any> {
    const proc = await this.getClipProcess()

    return new Promise((resolve, reject) => {
      let stdout = ''
      let stderr = ''

      const onStdout = (data: Buffer) => {
        stdout += data.toString()
        try {
          const result = JSON.parse(stdout)
          proc.stdout?.removeListener('data', onStdout)
          proc.stderr?.removeListener('data', onStderr)
          resolve(result)
        } catch {
          // Wait for more data
        }
      }

      const onStderr = (data: Buffer) => {
        stderr += data.toString()
      }

      proc.stdout?.on('data', onStdout)
      proc.stderr?.on('data', onStderr)

      proc.stdin?.write(JSON.stringify(command) + '\n')

      // Timeout after 5 minutes
      setTimeout(() => {
        proc.stdout?.removeListener('data', onStdout)
        proc.stderr?.removeListener('data', onStderr)
        reject(new Error('CLIP command timeout'))
      }, 300000)
    })
  }

  /**
   * Cleanup processes on shutdown
   */
  shutdown(): void {
    if (this.clipProcess && !this.clipProcess.killed) {
      console.log('[ProcessPool] Shutting down CLIP server')
      this.clipProcess.kill()
    }
    if (this.whisperProcess && !this.whisperProcess.killed) {
      console.log('[ProcessPool] Shutting down Whisper server')
      this.whisperProcess.kill()
    }
  }
}

// Global process pool singleton
let globalPool: ProcessPool | null = null

export function getProcessPool(pythonDir: string): ProcessPool {
  if (!globalPool) {
    globalPool = new ProcessPool(pythonDir)
  }
  return globalPool
}

export function shutdownProcessPool(): void {
  if (globalPool) {
    globalPool.shutdown()
    globalPool = null
  }
}
