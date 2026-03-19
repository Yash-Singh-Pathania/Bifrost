#!/usr/bin/env python3
"""
Transcription script using faster-whisper (CTranslate2-based).
Takes an audio file → outputs timestamped segments as JSON to stdout.

Usage:
  python transcribe.py --audio /path/to/audio.wav --model base
"""

import argparse
import json
import sys

def main():
    parser = argparse.ArgumentParser(description="Transcribe audio with faster-whisper")
    parser.add_argument("--audio", required=True, help="Path to audio file (WAV)")
    parser.add_argument("--model", default="base", help="Whisper model size: tiny, base, small, medium, large")
    args = parser.parse_args()

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print(json.dumps({"error": "faster-whisper not installed. Run: pip install faster-whisper"}), file=sys.stderr)
        sys.exit(1)

    # Determine compute device
    device = "cpu"
    compute_type = "int8"

    try:
        import torch
        if torch.backends.mps.is_available():
            # MPS (Apple Silicon) — use CPU with float32 for faster-whisper compat
            device = "cpu"
            compute_type = "float32"
        elif torch.cuda.is_available():
            device = "cuda"
            compute_type = "float16"
    except ImportError:
        pass

    print(json.dumps({"status": "loading_model", "model": args.model, "device": device}), file=sys.stderr)

    model = WhisperModel(args.model, device=device, compute_type=compute_type)

    print(json.dumps({"status": "transcribing"}), file=sys.stderr)

    segments, info = model.transcribe(args.audio, beam_size=5)

    results = []
    for segment in segments:
        results.append({
            "start": round(segment.start, 2),
            "end": round(segment.end, 2),
            "text": segment.text.strip()
        })

    # Output as JSON array to stdout
    print(json.dumps(results))


if __name__ == "__main__":
    main()
