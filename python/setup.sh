#!/bin/bash
# ============================================================
# Video Search — Python Environment Setup
# Creates a venv and installs all dependencies.
# Run from the project root: npm run setup:python
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/venv"

echo "🔧 Setting up Python environment for Video Search..."

# 1. Create venv if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
  echo "📦 Creating virtual environment at $VENV_DIR..."
  python3 -m venv "$VENV_DIR"
else
  echo "✅ Virtual environment already exists"
fi

# 2. Activate venv
source "$VENV_DIR/bin/activate"

# 3. Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip --quiet

# 4. Install requirements
echo "📥 Installing Python dependencies..."
pip install -r "$SCRIPT_DIR/requirements.txt"

# 5. Check Ollama and pull embedding model
echo ""
echo "🔍 Checking Ollama..."
if command -v ollama &> /dev/null; then
  echo "✅ Ollama is installed"
  echo "📥 Pulling nomic-embed-text model (for text embeddings)..."
  ollama pull nomic-embed-text || echo "⚠️  Could not pull model — make sure Ollama is running"
else
  echo "⚠️  Ollama not found. Install it from https://ollama.ai"
  echo "   Ollama is needed for text embeddings (free, local)."
fi

echo ""
echo "✅ Setup complete! You can now run the app with: npm run dev"
