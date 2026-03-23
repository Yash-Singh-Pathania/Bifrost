# Deployment Guide

Instructions for deploying and using Bifrost.

## User Installation (macOS)

### Prerequisites

- macOS 10.12 or later
- 8 GB RAM minimum (16 GB recommended)
- 20 GB free disk space
- Ollama (free, single-click install)

### Setup

1. Download the latest DMG from GitHub Releases
2. Install Ollama from ollama.ai
3. Start Ollama (runs in background)
4. Drag Bifrost.app to Applications folder
5. Launch Bifrost from Applications

### First Run

On first launch, Bifrost will automatically download required models:

- nomic-embed-text (274 MB) — text embeddings
- ViT-L-14 CLIP model (600 MB) — visual embeddings
- Whisper base model (140 MB) — transcription

Total download: approximately 1.3 GB. Models are cached locally for offline use.

Optional: Ollama will also download mistral (4 GB) on first rerank operation if enabled in settings.

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| OS | macOS 10.12 | macOS 12+ |
| RAM | 8 GB | 16 GB |
| Disk | 20 GB free | 50 GB free |
| CPU | 2 cores | 4+ cores |
| GPU | Optional | Apple Silicon (M1/M2/M3) |

## Developer Setup

### Prerequisites

- Node.js 18+
- Python 3.10+
- ffmpeg
- Ollama
- Git

### Installation

```bash
git clone https://github.com/YashSingPathania/Bifrost.git
cd Bifrost
npm install
npm run setup:python
```

The setup script creates a Python virtual environment and installs all ML dependencies.

### Development

```bash
npm run dev
```

Starts Electron with hot reload enabled. Edit source files and see changes immediately.

### Building

```bash
npm run build
```

Creates production bundles in `out/` directory.

```bash
npm run package:mac
```

Builds macOS DMG in `release/` directory. The DMG includes the Electron app and Python virtual environment.

## DMG Contents

The packaged DMG contains:

- Bifrost.app (Electron application)
- python/venv/ (Python environment with all ML dependencies)
  - torch, torchvision
  - open-clip-torch (CLIP implementation)
  - faster-whisper (fast transcription)
  - Pillow, numpy, scipy
  - ollama Python client
  - All other dependencies (300+ packages)

Size: approximately 500 MB compressed, 2 GB uncompressed.

Models are not included (they download on first use):
- CLIP weights (~600 MB)
- Whisper model (~140 MB)
- Ollama models (~1 GB, user-managed via Ollama)

## Deployment Steps

### Before Release

1. Run full test suite
2. Test on clean macOS installation
3. Verify Ollama integration
4. Check download size estimates
5. Verify first-run experience
6. Update documentation
7. Test search quality on sample videos

### Release Process

1. Tag version: git tag v1.0.0
2. Build: npm run package:mac
3. Upload DMG to GitHub Releases
4. Create release notes
5. Announce

### Post-Release

- Monitor GitHub Issues
- Collect user feedback
- Track performance metrics
- Plan next optimization phase

## Troubleshooting

### App Won't Start

- Verify Ollama is running (check System Preferences > Users & Groups)
- Check system logs: /var/log/system.log
- Try restarting Ollama

### Search Returns No Results

- Verify video was fully indexed (check progress notifications)
- Confirm Ollama models are installed: ollama list
- Try simpler search queries first

### Slow Processing

Expected times:
- 5 min video: 20-30 seconds
- 30 min video: 2-3 minutes
- 1 hour video: 4-5 minutes

If significantly slower:
- Check disk space available
- Reduce frame interval in settings
- Use smaller Whisper model (base instead of medium)

### Models Won't Download

- Verify internet connection
- Check disk space (need at least 10 GB free)
- Try manually: ollama pull nomic-embed-text
- Check Ollama logs

## Configuration

Settings stored in:

```
~/Library/Application Support/bifrost/
├── settings.json         # User preferences
├── library.json         # Video library metadata
└── data/               # Video embeddings and metadata
    └── [video-id]/
        ├── audio.wav
        ├── frames/
        ├── embeddings.db
        └── thumb.jpg
```

### Settings File

```json
{
  "embeddingProvider": "ollama",
  "ollamaBaseUrl": "http://localhost:11434",
  "ollamaEmbeddingModel": "nomic-embed-text",
  "transcriptionProvider": "local-whisper",
  "whisperModel": "base",
  "frameIntervalSeconds": 2,
  "enableReranking": true,
  "dataDir": "/path/to/data"
}
```

## Performance Tuning

### For Speed

- Reduce frameIntervalSeconds (skip more frames)
- Use smaller Whisper model (tiny, base)
- Enable GPU acceleration (automatic on Apple Silicon)

### For Accuracy

- Increase frameIntervalSeconds (capture more frames)
- Use larger Whisper model (medium, large)
- Enable LLM reranking in settings

## Uninstallation

```bash
rm -rf /Applications/Bifrost.app
rm -rf ~/Library/Application\ Support/bifrost/
```

## Support

- GitHub Issues: report bugs and feature requests
- Email: contact maintainers
- Documentation: README.md, OPTIMIZATION_PLAN.md, BRAND_BRIEF.md

## Architecture

High-level deployment architecture:

```
User Machine
├── Bifrost.app (Electron)
│   ├── Renderer (React UI)
│   ├── Main Process (Node.js)
│   ├── IPC Bridge
│   └── Python Sidecar (ML)
│       ├── CLIP Server
│       ├── Whisper
│       └── Vector DB
│
├── Python venv (included in DMG)
│   └── torch, torchvision, transformers, etc.
│
├── Ollama (user-installed)
│   ├── nomic-embed-text (text embeddings)
│   └── mistral (optional, for reranking)
│
└── User Data (~/)
    └── Library/Application Support/bifrost/
        ├── settings.json
        ├── library.json
        └── data/ (video embeddings)
```

All processing is local. No data is sent to cloud services.

## Continuous Integration

GitHub Actions workflow (example):

```yaml
name: build
on: [push, pull_request]
jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: 18
      - run: npm install
      - run: npm run build
      - run: npm run package:mac
      - uses: actions/upload-artifact@v2
        with:
          name: DMG
          path: release/*.dmg
```

## Security

- All processing is local
- No network requests except to Ollama (localhost)
- Video files are never uploaded
- Settings files contain only local paths and model names
- No telemetry or analytics

## License

MIT - See LICENSE file for details
