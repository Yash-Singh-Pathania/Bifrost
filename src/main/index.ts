import { app, BrowserWindow, shell, protocol, net } from 'electron'
import { join } from 'path'
import { createReadStream, statSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './ipc'
import { DEFAULT_SETTINGS } from '../shared/types'

// Expose the real project root to bundled pipeline modules
process.env.PYTHON_DIR = join(app.getAppPath(), 'python')

// Register a custom protocol to safely load local files
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'local',
    privileges: {
      bypassCSP: true,
      secure: true,
      supportFetchAPI: true,
      stream: true
    }
  }
])

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    show: false,
    frame: false,             // Frameless window
    transparent: true,        // Physical transparency
    vibrancy: 'fullscreen-ui',// macOS system-level blur
    visualEffectState: 'followWindow',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 20 },
    backgroundColor: '#00000000', // Fully transparent background
    title: 'Bifrost',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false // Allow loading local file:// URIs for video playback
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Dev server in development, file:// in production
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Set default data directory
DEFAULT_SETTINGS.dataDir = join(app.getPath('userData'), 'data')

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.bifrost.app')

  // Handle the 'local://' protocol with proper Range request support for video seeking
  protocol.handle('local', (request) => {
    // Convert local:///path → /path
    let filePath = decodeURIComponent(request.url.replace('local://', ''))
    // On macOS/Linux the path starts with /; on Windows it might start with /C:
    // Remove leading slash on Windows drives
    if (process.platform === 'win32' && filePath.match(/^\/[A-Za-z]:/)) {
      filePath = filePath.slice(1)
    }

    try {
      const stat = statSync(filePath)
      const fileSize = stat.size

      // Determine MIME type from extension
      const ext = filePath.split('.').pop()?.toLowerCase() || ''
      const mimeTypes: Record<string, string> = {
        mp4: 'video/mp4', mkv: 'video/x-matroska', webm: 'video/webm',
        mov: 'video/quicktime', avi: 'video/x-msvideo', m4v: 'video/mp4',
        wmv: 'video/x-ms-wmv', wav: 'audio/wav', mp3: 'audio/mpeg'
      }
      const contentType = mimeTypes[ext] || 'application/octet-stream'

      // Check for Range header (critical for video seeking)
      const rangeHeader = request.headers.get('Range')

      if (rangeHeader) {
        // Parse "bytes=START-END"
        const match = rangeHeader.match(/bytes=(\d+)-(\d*)/)
        if (match) {
          const start = parseInt(match[1], 10)
          const end = match[2] ? parseInt(match[2], 10) : fileSize - 1
          const chunkSize = end - start + 1

          const stream = createReadStream(filePath, { start, end })

          return new Response(stream as any, {
            status: 206,
            headers: {
              'Content-Type': contentType,
              'Content-Length': String(chunkSize),
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'Accept-Ranges': 'bytes'
            }
          })
        }
      }

      // No Range header — return the full file
      const stream = createReadStream(filePath)
      return new Response(stream as any, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': String(fileSize),
          'Accept-Ranges': 'bytes'
        }
      })
    } catch (err) {
      return new Response('File not found', { status: 404 })
    }
  })

  // Default open/close behaviour for dev tools
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Register all IPC handlers
  registerIpcHandlers()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

export { mainWindow }
