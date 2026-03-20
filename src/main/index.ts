import { app, BrowserWindow, shell, protocol, net } from 'electron'
import { join } from 'path'
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
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#FFFFFF',
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
  electronApp.setAppUserModelId('com.videosearch.app')

  // Handle the 'local://' protocol so the renderer can fetch system files safely
  protocol.handle('local', (request) => {
    // request.url is something like "local:///Users/yash/..."
    // We convert it to "file:///Users/yash/..." and fetch it over the native Node.js net module
    const fileUrl = request.url.replace('local://', 'file://')
    return net.fetch(fileUrl)
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
