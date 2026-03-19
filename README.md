# Video Search 🔍🎬

**Semantic video search engine** — find any moment in a video by what was said or what was shown. Like "Ctrl+F" for video content.

> Drop a video → we transcribe the audio and index every frame → search by text or visual content → click to jump to that moment.

## Features

- 🎤 **Transcript Search** — Find moments by what was _said_ (powered by Whisper)
- 👁 **Visual Search** — Find moments by what was _shown_ (powered by CLIP)
- 🔒 **Fully Local & Free** — All processing runs on your machine via Ollama. No API keys needed.
- 🔄 **Swappable Providers** — Clean adapter pattern lets you plug in OpenAI, Gemini, etc. when needed
- 🖥 **Cross-Platform** — Electron-based app runs on Mac, Windows, and Linux
- 💾 **Embedded Vector DB** — LanceDB stores everything locally, no server required

## Quick Start

### Prerequisites

- **Node.js** 18+
- **Python** 3.10+
- **ffmpeg** — `brew install ffmpeg` (Mac) / `apt install ffmpeg` (Linux)
- **Ollama** — [Install from ollama.ai](https://ollama.ai)

### Setup

```bash
# 1. Install Node.js dependencies
npm install

# 2. Set up Python venv + install ML dependencies
npm run setup:python

# 3. Pull the embedding model (make sure Ollama is running)
ollama pull nomic-embed-text

# 4. Start the app
npm run dev
```

### How It Works

```
Video File
    │
    ├─── Audio → Whisper → Transcript chunks + timestamps
    │                              │
    │                         Text embeddings (Ollama)
    │
    └─── Frames (1 per 2 sec) → CLIP → Frame embeddings
                                         │
                                    LanceDB (local)
                                         │
                   Search query ─────────┘
                         │
                    Merged results → Click to seek
```

## Architecture

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Shell | Electron | Cross-platform desktop app |
| UI | React + Vite | Video player, search, settings |
| Transcription | faster-whisper (Python venv) | Audio → timestamped text |
| Visual Embeddings | CLIP ViT-B/32 (Python venv) | Frames → vectors |
| Text Embeddings | Ollama (nomic-embed-text) | Text → vectors |
| Vector DB | LanceDB (embedded) | Store & search embeddings |
| Audio/Video | ffmpeg | Extract audio & frames |

## Project Structure

```
src/
├── main/               # Electron main process
│   ├── index.ts         # App lifecycle, window
│   ├── ipc.ts           # IPC handlers (pipeline orchestration)
│   └── pipeline/        # Backend processing
│       ├── ffmpeg.ts    # Audio/frame extraction
│       ├── whisper.ts   # Transcription adapter
│       ├── clip.ts      # CLIP sidecar communication
│       ├── embeddings.ts # Text embedding adapter (Ollama/OpenAI)
│       └── vectordb.ts  # LanceDB wrapper
├── preload/
│   └── index.ts         # Secure IPC bridge
├── renderer/            # React UI
│   ├── App.tsx          # Main app + state management
│   ├── App.css          # Dark glassmorphism theme
│   └── components/      # UI components
│       ├── DropZone.tsx
│       ├── VideoPlayer.tsx
│       ├── SearchBar.tsx
│       ├── SearchResults.tsx
│       ├── ProcessingStatus.tsx
│       └── Settings.tsx
└── shared/
    └── types.ts         # Shared TypeScript types (IPC contract)

python/
├── clip_server.py       # CLIP embedding sidecar
├── transcribe.py        # Whisper transcription script
├── requirements.txt     # Python dependencies
└── setup.sh             # Venv bootstrap script
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start in development mode with HMR |
| `npm run build` | Build production bundles |
| `npm run setup:python` | Create Python venv and install ML deps |
| `npm run package:mac` | Package as .dmg for macOS |
| `npm run package:win` | Package as .exe for Windows |
| `npm run package:linux` | Package as AppImage for Linux |

## Settings

The app supports two modes:

| Mode | Provider | Cost | Privacy |
|------|----------|------|---------|
| **Local (default)** | Ollama + Whisper + CLIP | Free | 100% on-device |
| **Cloud** | OpenAI APIs | ~$0.002/hr video | Transcript sent to API |

Configure via the ⚙ settings panel in the app.

## License

MIT
