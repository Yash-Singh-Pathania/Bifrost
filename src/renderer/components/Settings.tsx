import React, { useState, useEffect } from 'react'
import { AppSettings, DEFAULT_SETTINGS } from '../../shared/types'

interface SettingsProps {
  onClose: () => void
}

export default function Settings({ onClose }: SettingsProps) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)
  const [deps, setDeps] = useState<Record<string, boolean>>({})

  useEffect(() => {
    // Load current settings
    window.api.getSettings().then(setSettings)
    // Check dependencies
    window.api.checkDependencies().then(setDeps)
  }, [])

  const handleSave = async () => {
    await window.api.saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const update = (partial: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }))
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="btn-ghost" onClick={onClose}>✕</button>
        </div>

        <div className="settings-body">
          {/* ── System Status ── */}
          <section className="settings-section">
            <h3 className="settings-section-title">System Status</h3>
            <div className="dep-list">
              <DependencyRow name="ffmpeg" installed={deps.ffmpeg} />
              <DependencyRow name="Python 3" installed={deps.python} />
              <DependencyRow name="Ollama" installed={deps.ollama} />
            </div>
          </section>

          {/* ── Embedding Provider ── */}
          <section className="settings-section">
            <h3 className="settings-section-title">Embedding Provider</h3>
            <div className="setting-row">
              <label>Provider</label>
              <select
                value={settings.embeddingProvider}
                onChange={e => update({ embeddingProvider: e.target.value as any })}
              >
                <option value="ollama">Ollama (Local, Free)</option>
                <option value="openai">OpenAI (API Key)</option>
              </select>
            </div>

            {settings.embeddingProvider === 'ollama' && (
              <>
                <div className="setting-row">
                  <label>Ollama URL</label>
                  <input
                    type="text"
                    value={settings.ollamaBaseUrl}
                    onChange={e => update({ ollamaBaseUrl: e.target.value })}
                  />
                </div>
                <div className="setting-row">
                  <label>Embedding Model</label>
                  <input
                    type="text"
                    value={settings.ollamaEmbeddingModel}
                    onChange={e => update({ ollamaEmbeddingModel: e.target.value })}
                  />
                </div>
              </>
            )}

            {settings.embeddingProvider === 'openai' && (
              <>
                <div className="setting-row">
                  <label>API Key</label>
                  <input
                    type="password"
                    value={settings.openaiApiKey || ''}
                    onChange={e => update({ openaiApiKey: e.target.value })}
                    placeholder="sk-..."
                  />
                </div>
              </>
            )}
          </section>

          {/* ── Transcription ── */}
          <section className="settings-section">
            <h3 className="settings-section-title">Transcription</h3>
            <div className="setting-row">
              <label>Whisper Model</label>
              <select
                value={settings.whisperModel}
                onChange={e => update({ whisperModel: e.target.value as any })}
              >
                <option value="tiny">Tiny (fastest, least accurate)</option>
                <option value="base">Base (recommended)</option>
                <option value="small">Small (better accuracy)</option>
                <option value="medium">Medium (high accuracy, slow)</option>
                <option value="large">Large (best accuracy, very slow)</option>
              </select>
            </div>
          </section>

          {/* ── Frame Extraction ── */}
          <section className="settings-section">
            <h3 className="settings-section-title">Frame Extraction</h3>
            <div className="setting-row">
              <label>Interval: every {settings.frameIntervalSeconds}s</label>
              <input
                type="range"
                min="1"
                max="10"
                value={settings.frameIntervalSeconds}
                onChange={e => update({ frameIntervalSeconds: Number(e.target.value) })}
              />
            </div>
            <p className="setting-hint">
              Lower = more frames = better visual search but slower indexing
            </p>
          </section>
        </div>

        <div className="settings-footer">
          <button className="btn-primary" onClick={handleSave}>
            {saved ? '✓ Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DependencyRow({ name, installed }: { name: string; installed?: boolean }) {
  return (
    <div className="dep-row">
      <span className={`dep-status ${installed ? 'dep-ok' : 'dep-missing'}`}>
        {installed === undefined ? '…' : installed ? '✓' : '✗'}
      </span>
      <span className="dep-name">{name}</span>
      {installed === false && (
        <span className="dep-hint">Not found</span>
      )}
    </div>
  )
}
