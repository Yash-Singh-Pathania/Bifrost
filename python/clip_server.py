#!/usr/bin/env python3
"""
CLIP Server — embeds video frames and text queries into the same vector space.
Communicates via JSON-line protocol over stdin/stdout.

Commands:
  {"action": "embed_frames", "paths": ["/path/to/frame1.jpg", ...], "interval": 2}
  {"action": "embed_text", "text": "a red Porsche"}

Responses:
  [{"embedding": [0.1, 0.2, ...]}, ...]   (for embed_frames)
  {"embedding": [0.1, 0.2, ...]}           (for embed_text)
"""

import sys
import json
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

    _model, _, _preprocess = open_clip.create_model_and_transforms(
        'ViT-B-32',
        pretrained='laion2b_s34b_b79k',
        device=_device
    )
    _tokenizer = open_clip.get_tokenizer('ViT-B-32')
    _model.eval()

    print(json.dumps({"status": "model_loaded", "device": _device}), file=sys.stderr)


def embed_frames(paths: list[str]) -> list[dict]:
    """Embed a list of image frame paths."""
    load_model()
    results = []

    for path in paths:
        try:
            image = _preprocess(Image.open(path)).unsqueeze(0).to(_device)
            with torch.no_grad():
                embedding = _model.encode_image(image)
                embedding = embedding / embedding.norm(dim=-1, keepdim=True)
                results.append({
                    "embedding": embedding.cpu().squeeze().tolist()
                })
        except Exception as e:
            print(json.dumps({"error": str(e), "path": path}), file=sys.stderr)
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
