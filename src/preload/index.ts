import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS, AppSettings, SearchResult, ProcessingProgress } from '../shared/types'

const api = {
  // ── File Dialog ───────────────────────────────────────────
  openFileDialog: (): Promise<string | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.OPEN_FILE_DIALOG),

  // ── Video Processing ──────────────────────────────────────
  processVideo: (filePath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.PROCESS_VIDEO, filePath),

  getVideoInfo: (filePath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_VIDEO_INFO, filePath),

  // ── Search (pass current video's dataDir) ─────────────────
  search: (query: string, videoDataDir: string): Promise<SearchResult[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.SEARCH, query, videoDataDir),

  // ── Library ───────────────────────────────────────────────
  getLibrary: () =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_LIBRARY),

  deleteFromLibrary: (id: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.DELETE_FROM_LIBRARY, id),

  // ── Settings ──────────────────────────────────────────────
  getSettings: (): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_SETTINGS),

  saveSettings: (settings: AppSettings) =>
    ipcRenderer.invoke(IPC_CHANNELS.SAVE_SETTINGS, settings),

  // ── System ────────────────────────────────────────────────
  checkDependencies: () =>
    ipcRenderer.invoke(IPC_CHANNELS.CHECK_DEPENDENCIES),

  // ── Events (main → renderer) ──────────────────────────────
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

contextBridge.exposeInMainWorld('api', api)
export type ElectronAPI = typeof api
