# Bifrost — Deployment & Setup Guide

## For End Users

### Quick Start (macOS)

1. **Download DMG**: Get `Bifrost-1.0.0-arm64.dmg` from Releases
2. **Install Ollama**: Go to [ollama.ai](https://ollama.ai), download and install
3. **Start Ollama**: Run Ollama (it runs in background)
4. **First run**: Bifrost will automatically download required models on first use
5. **Drag & drop**: Import videos via the library interface

### System Requirements
- **macOS** 10.12+ (Monterey recommended)
- **RAM**: 8GB minimum (16GB recommended for fast processing)
- **Disk space**: 20GB free (for models + video storage)
- **Ollama**: Free, runs locally

### What Gets Downloaded On First Use

Ollama automatically fetches:
- `nomic-embed-text` (274 MB) — text embeddings
- `mistral` (4 GB, optional) — for result reranking

CLIP automatically fetches:
- `ViT-L-14` OpenCLIP model (~600 MB)
- Falls back to `ViT-B-32` (~350 MB) if needed

Whisper (in app):
- `base` model (~140 MB) — default transcription

**Total**: ~1.3 GB downloaded on first use, depends on which models you use.

### Features

✅ **100% Local** — Nothing sent to the cloud
✅ **Free** — All models and software are open-source
✅ **Accurate** — ViT-L/14 CLIP visual search + Whisper transcription
✅ **Fast** — Parallel processing, batch embeddings, optimized pipeline

---

## For Developers

### Building from Source

```bash
git clone https://github.com/YashSingPathania/Bifrost.git
cd Bifrost
npm install
npm run setup:python

# Development
npm run dev

# Build DMG
npm run build
npm run package:mac
```

### Architecture

The DMG contains:
- **Bifrost.app** — Electron application
- **python/venv/** — Python environment with:
  - `torch`, `torchvision` — ML frameworks
  - `open-clip-torch` — CLIP embeddings
  - `faster-whisper` — Fast transcription
  - `Pillow` — Image processing
  - `ollama` — Ollama Python client

### Environment Variables

```bash
# Point to custom Python directory (for testing)
PYTHON_DIR=/path/to/python

# Custom Ollama endpoint
OLLAMA_BASE_URL=http://localhost:11434
```

### Development Workflow

1. Make changes in `src/`
2. Run `npm run dev` for hot reload
3. Test the app
4. Commit to `develop` branch
5. When ready: `npm run build && npm run package:mac`

### Code Structure

```
src/
├── main/                  # Electron main process
│   ├── index.ts          # App lifecycle
│   ├── ipc.ts            # IPC handlers (pipeline orchestration)
│   └── pipeline/         # ML processing
│       ├── clip.ts       # Visual embeddings
│       ├── whisper.ts    # Transcription
│       ├── embeddings.ts # Text embeddings adapter
│       ├── ffmpeg.ts     # Audio/video extraction
│       ├── vectordb.ts   # Vector storage & search
│       ├── process-pool.ts # Persistent process management
│       └── reranker.ts   # LLM-based reranking
├── renderer/            # React UI
│   ├── App.tsx
│   ├── components/
│   └── styles/
└── shared/
    └── types.ts         # Shared IPC types

python/
├── clip_server.py       # CLIP embedding sidecar
├── transcribe.py        # Whisper transcription
├── requirements.txt     # Python dependencies
└── setup.sh            # Environment setup script
```

---

## Deployment Checklist

### Before Release

- [ ] Run full test suite
- [ ] Test on clean macOS machine
- [ ] Verify Ollama integration works
- [ ] Check model download size expectations
- [ ] Update README with latest features
- [ ] Test first-run experience
- [ ] Verify app code signing (if distributing via App Store)

### Release Process

1. **Tag version**: `git tag v1.0.0`
2. **Build**: `npm run package:mac`
3. **Sign** (optional, for App Store): Requires Developer ID
4. **Upload to Releases**: GitHub releases
5. **Announce**: Twitter, Discord, etc.

### Post-Release Support

- Monitor GitHub Issues
- Collect performance metrics from users
- Plan next optimization phase
- Gather feedback on features

---

## Performance Benchmarks

After optimizations (Phase 1-3), expected times:

| Video Length | Indexing Time | Notes |
|---|---|---|
| 5 min | 20-30s | Fast insertion, good for testing |
| 30 min | 2-3 min | Typical YouTube video |
| 1 hour | 4-5 min | Long presentation |
| 2 hour | 8-10 min | Movie/conference |

**Factors that affect speed**:
- Video resolution (higher = more frames)
- Frame extraction interval (default 2 sec = 1,800 frames/hr)
- Whisper model size (base=fast, large=accurate)
- GPU availability (MPS on Apple Silicon = fast)

---

## Known Limitations

1. **Ollama required** — User must install separately (can't bundle easily due to size)
2. **Model downloads** — First run downloads ~1.3 GB
3. **No GPU acceleration for Ollama** — CPU-based on macOS (unless using custom Metal)
4. **macOS only** — Windows/Linux builds available but not tested as thoroughly
5. **Single video search** — Search is scoped to one video at a time (by design)

---

## Future Improvements

- [ ] Ollama app bundling (awaiting Ollama distribution improvements)
- [ ] Windows/Linux first-class support
- [ ] Multi-video search
- [ ] Cross-video transcript indexing
- [ ] Query history and saved searches
- [ ] Video export with search timestamps
- [ ] Fine-tuned CLIP models for video domain
