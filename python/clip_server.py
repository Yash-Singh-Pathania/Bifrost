#!/usr/bin/env python3
"""
CLIP Server — embeds video frames and text queries into the same vector space.
Communicates via JSON-line protocol over stdin/stdout.

Commands:
  {"action": "embed_frames", "paths": ["/path/to/frame1.jpg", ...], "batch_size": 8}
  {"action": "embed_text", "text": "a red Porsche"}

Responses:
  [{"embedding": [0.1, 0.2, ...]}, ...]   (for embed_frames)
  {"embedding": [0.1, 0.2, ...]}           (for embed_text)
"""

import sys
import json
import time
import torch
import open_clip
from PIL import Image

# ── Lazy model loading ─────────────────────────────────────
_model = None
_preprocess = None
_tokenizer = None
_device = None

def load_model():
    global _model, _preprocess, _tokenizer, _device

    if _model is not None:
        return

    _device = "mps" if torch.backends.mps.is_available() else \
              "cuda" if torch.cuda.is_available() else "cpu"

    # Use ViT-L/14 for better accuracy (768-dim, matches Ollama embeddings)
    # Falls back to ViT-B/32 if ViT-L/14 is unavailable
    try:
        _model, _, _preprocess = open_clip.create_model_and_transforms(
            'ViT-L-14',
            pretrained='openai',
            device=_device
        )
        _tokenizer = open_clip.get_tokenizer('ViT-L-14')
        model_name = 'ViT-L-14'
    except Exception:
        # Fallback to ViT-B/32 if ViT-L/14 fails
        _model, _, _preprocess = open_clip.create_model_and_transforms(
            'ViT-B-32',
            pretrained='laion2b_s34b_b79k',
            device=_device
        )
        _tokenizer = open_clip.get_tokenizer('ViT-B-32')
        model_name = 'ViT-B-32 (fallback)'

    _model.eval()

    print(json.dumps({"status": "model_loaded", "device": _device, "model": model_name}), file=sys.stderr)


def embed_frames(paths: list[str], batch_size: int = 8) -> list[dict]:
    """Embed a list of image frame paths with batching for speed."""
    load_model()
    results = []

    # Process frames in batches for better GPU utilization
    for batch_start in range(0, len(paths), batch_size):
        batch_end = min(batch_start + batch_size, len(paths))
        batch_paths = paths[batch_start:batch_end]

        try:
            # Load and preprocess images in batch
            images = []
            valid_indices = []
            for i, path in enumerate(batch_paths):
                try:
                    img = _preprocess(Image.open(path))
                    images.append(img)
                    valid_indices.append(i)
                except Exception as e:
                    print(json.dumps({"error": str(e), "path": path}), file=sys.stderr)
                    results.append({"embedding": []})

            if images:
                # Stack and embed the batch
                image_batch = torch.stack(images).to(_device)
                with torch.no_grad():
                    embeddings = _model.encode_image(image_batch)
                    embeddings = embeddings / embeddings.norm(dim=-1, keepdim=True)

                    for j, embedding in enumerate(embeddings):
                        results.append({
                            "embedding": embedding.cpu().tolist()
                        })
        except Exception as e:
            print(json.dumps({"error": str(e), "batch": batch_paths}), file=sys.stderr)
            for _ in batch_paths:
                results.append({"embedding": []})

    return results


def embed_text(text: str) -> dict:
    """Embed a text query into CLIP vector space."""
    load_model()

    tokens = _tokenizer([text]).to(_device)
    with torch.no_grad():
        embedding = _model.encode_text(tokens)
        embedding = embedding / embedding.norm(dim=-1, keepdim=True)

    return {"embedding": embedding.cpu().squeeze().tolist()}


def main():
    """Read JSON commands from stdin, process, write results to stdout."""
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        try:
            command = json.loads(line)
            action = command.get("action")

            if action == "embed_frames":
                results = embed_frames(command["paths"])
                print(json.dumps(results), flush=True)

            elif action == "embed_text":
                result = embed_text(command["text"])
                print(json.dumps(result), flush=True)

            else:
                print(json.dumps({"error": f"Unknown action: {action}"}), flush=True)

        except Exception as e:
            print(json.dumps({"error": str(e)}), flush=True)


if __name__ == "__main__":
    main()
