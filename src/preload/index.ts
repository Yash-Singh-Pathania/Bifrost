import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS, AppSettings, SearchResult, ProcessingProgress } from '../shared/types'

/**
 * Typed API exposed to the renderer process via contextBridge.
 * This is the ONLY way the React UI communicates with the backend.
 */
const api = {
  // ── Video Processing ──────────────────────────────────────
  processVideo: (filePath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.PROCESS_VIDEO, filePath),

  getVideoInfo: (filePath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_VIDEO_INFO, filePath),

  // ── Search ────────────────────────────────────────────────
  search: (query: string): Promise<SearchResult[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.SEARCH, query),

  // ── Settings ──────────────────────────────────────────────
  getSettings: (): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_SETTINGS),

  saveSettings: (settings: AppSettings) =>
    ipcRenderer.invoke(IPC_CHANNELS.SAVE_SETTINGS, settings),

  // ── System ────────────────────────────────────────────────
  checkDependencies: () =>
    ipcRenderer.invoke(IPC_CHANNELS.CHECK_DEPENDENCIES),

  // ── Event listeners (main → renderer) ─────────────────────
  onProcessingProgress: (callback: (progress: ProcessingProgress) => void) => {
    const listener = (_event: any, progress: ProcessingProgress) => callback(progress)
    ipcRenderer.on(IPC_CHANNELS.PROCESSING_PROGRESS, listener)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.PROCESSING_PROGRESS, listener)
  },

  onProcessingComplete: (callback: (result: any) => void) => {
    const listener = (_event: any, result: any) => callback(result)
    ipcRenderer.on(IPC_CHANNELS.PROCESSING_COMPLETE, listener)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.PROCESSING_COMPLETE, listener)
  },

  onProcessingError: (callback: (error: string) => void) => {
    const listener = (_event: any, error: string) => callback(error)
    ipcRenderer.on(IPC_CHANNELS.PROCESSING_ERROR, listener)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.PROCESSING_ERROR, listener)
  }
}

// Expose to renderer as window.api
contextBridge.exposeInMainWorld('api', api)

// Type declaration for the renderer
export type ElectronAPI = typeof api
