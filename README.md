# Bifrost

**Semantic video search** — find any moment by what was said or what was shown. Like Ctrl+F for video.

> Import a video. Bifrost transcribes the audio and indexes every frame. Then search by meaning — not just keywords — and click any result to jump straight to that moment.

## Features

- **Transcript search** — find moments by what was *said* (Whisper)
- **Visual search** — find moments by what was *shown* (CLIP)
- **Fully local** — all processing runs on your machine, nothing leaves your device
- **Free** — powered by Ollama, no API keys needed
- **Cross-platform** — macOS, Windows, Linux

## Install

### Prerequisites

| Dependency | Install |
|---|---|
| **Node.js** 18+ | [nodejs.org](https://nodejs.org) |
| **Python** 3.10+ | [python.org](https://python.org) |
| **ffmpeg** | `brew install ffmpeg` (Mac) / `apt install ffmpeg` (Linux) |
| **Ollama** | [ollama.ai](https://ollama.ai) |

### Setup

```bash
git clone https://github.com/YashSingPathania/Bifrost.git
cd Bifrost

# Install dependencies
npm install

# Set up Python ML environment
npm run setup:python

# Pull the embedding model (Ollama must be running)
ollama pull nomic-embed-text

# Start the app
npm run dev
```

### Pre-built Downloads

Download the latest release for your platform from the [Releases](https://github.com/YashSingPathania/Bifrost/releases) page.

> After installing the DMG/EXE/AppImage, you still need **ffmpeg** and **Ollama** installed on your system.

## How It Works

```
Video File
    |
    +--- Audio --> Whisper --> Transcript chunks + timestamps
    |                              |
    |                         Text embeddings (Ollama)
    |
    +--- Frames (1/2s) --> CLIP --> Frame embeddings
                                         |
                                    LanceDB (local)
                                         |
                   Search query ---------+
                         |
                    Merged results --> Click to seek
```

## Stack

| Layer | Technology |
|---|---|
| Shell | Electron |
| UI | React + Vite |
| Transcription | faster-whisper |
| Visual embeddings | CLIP ViT-B/32 |
| Text embeddings | Ollama (nomic-embed-text) |
| Vector DB | LanceDB (embedded) |
| Audio/Video | ffmpeg |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start in dev mode with HMR |
| `npm run build` | Build production bundles |
| `npm run setup:python` | Set up Python venv + ML deps |
| `npm run package:mac` | Package as .dmg |
| `npm run package:win` | Package as .exe |
| `npm run package:linux` | Package as AppImage |

## License

MIT
