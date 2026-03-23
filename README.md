# Bifrost

Semantic video search engine. Find any moment in a video by what was said or shown. Like Ctrl+F for video.

Import a video. Bifrost transcribes the audio and indexes every frame. Search by meaning—not keywords—and click any result to jump straight to that moment.

## Features

- **Transcript search** — Find moments by what was said (powered by Whisper)
- **Visual search** — Find moments by what was shown (powered by CLIP ViT-L/14)
- **Fully local** — All processing runs on your machine, nothing leaves your device
- **Free** — No API keys, no subscriptions, no costs
- **Cross-platform** — macOS, Windows, Linux

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- ffmpeg (brew install ffmpeg on macOS)
- Ollama (free, download from ollama.ai)

### Installation

```bash
git clone https://github.com/YashSingPathania/Bifrost.git
cd Bifrost

npm install
npm run setup:python

ollama pull nomic-embed-text

npm run dev
```

### Packaging

```bash
npm run build
npm run package:mac          # macOS
npm run package:win          # Windows
npm run package:linux        # Linux
```

## How It Works

Video processing pipeline:

```
Video File
    |
    +-- Audio --> Whisper --> Transcript chunks + timestamps
    |                             |
    |                        Text embeddings (Ollama)
    |
    +-- Frames (1/2s) --> CLIP ViT-L/14 --> Visual embeddings
                                                |
                                            LanceDB (local)
                                                |
                           Search query -------+
                                 |
                            Merged results --> Click to seek
```

## Architecture

| Layer | Technology |
|-------|-----------|
| Shell | Electron |
| UI | React + Vite |
| Transcription | faster-whisper (CTranslate2-optimized) |
| Visual embeddings | CLIP ViT-L/14 (OpenCLIP) |
| Text embeddings | Ollama (nomic-embed-text) |
| Vector DB | LanceDB (embedded) |
| Audio/Video | ffmpeg |

## Performance

After optimization (Phase 1-3):

| Video Length | Indexing Time |
|---|---|
| 5 minutes | 20-30 seconds |
| 30 minutes | 2-3 minutes |
| 1 hour | 4-5 minutes |
| 2 hours | 8-10 minutes |

Speed depends on resolution, frame interval, and available GPU (faster on Apple Silicon).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build production bundles |
| `npm run setup:python` | Set up Python venv with ML dependencies |
| `npm run package:mac` | Package as .dmg for macOS |
| `npm run package:win` | Package as .exe for Windows |
| `npm run package:linux` | Package as AppImage for Linux |

## Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) — Setup and deployment guide
- [OPTIMIZATION_PLAN.md](OPTIMIZATION_PLAN.md) — Performance optimization details
- [BRAND_BRIEF.md](BRAND_BRIEF.md) — Brand and logo guidelines

## Project Structure

```
src/
├── main/                    # Electron main process
│   ├── index.ts            # App lifecycle and window setup
│   ├── ipc.ts              # IPC handlers and pipeline orchestration
│   └── pipeline/           # ML processing modules
│       ├── clip.ts         # Visual embedding (CLIP)
│       ├── whisper.ts      # Audio transcription
│       ├── embeddings.ts   # Text embedding adapter
│       ├── ffmpeg.ts       # Audio/video extraction
│       ├── vectordb.ts     # Vector storage and search
│       ├── process-pool.ts # Persistent process management
│       └── reranker.ts     # LLM-based reranking

├── renderer/               # React UI
│   ├── App.tsx            # Main app component
│   ├── components/        # UI components
│   └── styles/            # CSS modules

└── shared/
    └── types.ts           # Shared IPC types

python/
├── clip_server.py         # CLIP embedding sidecar
├── transcribe.py          # Whisper transcription
├── requirements.txt       # Python dependencies
└── setup.sh              # Environment bootstrap

build/
└── icon.*                # App icons (placeholder)

docs/
└── index.html            # GitHub Pages landing site
```

## Development

### First Time Setup

```bash
npm install                 # Install Node dependencies
npm run setup:python        # Create Python venv and install ML packages
```

### Development Server

```bash
npm run dev                 # Start Electron with hot reload
```

The app will start with file watching enabled. Edit source files and see changes immediately.

### Building for Distribution

```bash
npm run build              # Create production bundles
npm run package:mac        # Create macOS DMG
```

The DMG will be in `release/Bifrost-1.0.0-arm64.dmg` and includes:
- Electron application
- Python virtual environment with all ML dependencies
- All source code (for debugging)

Users still need to install Ollama separately (free, 1-click install).

## System Requirements

### Minimum

- macOS 10.12+ (or Windows 10+ / Ubuntu 18.04+)
- 8 GB RAM
- 20 GB free disk space
- CPU with 2+ cores

### Recommended

- macOS 12+ (Monterey or later)
- 16+ GB RAM
- SSD storage
- Apple Silicon (M1/M2/M3) or recent Intel/AMD CPU

### GPU Support

- Apple Silicon (MPS) — automatic
- NVIDIA (CUDA) — automatic if drivers installed
- AMD/Intel — falls back to CPU (slower but works)

## Configuration

Settings are stored in the user data directory and include:

- Embedding provider (Ollama or OpenAI API)
- Whisper model size (tiny, base, small, medium, large)
- Frame extraction interval (default 2 seconds)
- Enable/disable LLM reranking

Configure via the settings panel in the app.

## Known Limitations

- Single video search (search is scoped to one video at a time)
- Requires Ollama installation (cannot bundle due to size)
- Models download on first use (~1.3 GB total)
- macOS development focused (Windows/Linux supported but less tested)

## Future Roadmap

- Cross-video search
- Multi-video transcript indexing
- Query history and saved searches
- Video export with search timestamps
- Fine-tuned CLIP models for video domain
- Ollama app bundling (pending better distribution)

## License

MIT
