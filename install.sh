#!/bin/bash
# ============================================================================
# TEMPORAL COGNITION MODULE - INSTALLATION SCRIPT
# ============================================================================
# 
# This script installs the Temporal Cognition Module plugin for OpenClaw
#
# Usage: ./install.sh
#
# Requirements:
#   - Node.js 18+
#   - npm or pnpm
#   - OpenClaw installed and configured
#
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPENCLAW_DIR="${OPENCLAW_DIR:-$HOME/.openclaw}"
EXTENSIONS_DIR="$OPENCLAW_DIR/extensions"
PLUGIN_DIR="$EXTENSIONS_DIR/temporal-cognition"

echo "=============================================="
echo "  Temporal Cognition Module Installer"
echo "=============================================="
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "   Please install Node.js 18+ and try again."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Found: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v) detected"

# Check for npm/pnpm
if command -v pnpm &> /dev/null; then
    PKG_MGR="pnpm"
elif command -v npm &> /dev/null; then
    PKG_MGR="npm"
else
    echo "❌ npm or pnpm is required but not installed."
    exit 1
fi
echo "✅ Package manager: $PKG_MGR"

# Check for OpenClaw
if [ ! -d "$OPENCLAW_DIR" ]; then
    echo "❌ OpenClaw directory not found at $OPENCLAW_DIR"
    echo "   Please install OpenClaw first or set OPENCLAW_DIR environment variable."
    exit 1
fi
echo "✅ OpenClaw directory found"

# Create extensions directory if needed
mkdir -p "$EXTENSIONS_DIR"

# Copy plugin files
echo ""
echo "📦 Installing plugin..."
if [ -d "$PLUGIN_DIR" ]; then
    echo "   Removing existing installation..."
    rm -rf "$PLUGIN_DIR"
fi

cp -r "$SCRIPT_DIR" "$PLUGIN_DIR"
cd "$PLUGIN_DIR"

# Install dependencies
echo ""
echo "📥 Installing dependencies..."
$PKG_MGR install

# Build
echo ""
echo "🔨 Building plugin..."
$PKG_MGR run build

# Update OpenClaw config
CONFIG_FILE="$OPENCLAW_DIR/openclaw.json"
if [ -f "$CONFIG_FILE" ]; then
    echo ""
    echo "📝 Configuration file found at $CONFIG_FILE"
    echo ""
    echo "Please add the following to your plugins.entries section:"
    echo ""
    cat << 'CONFIGEOF'
    "temporal-cognition": {
      "enabled": true,
      "config": {
        "enabled": true,
        "timePerception": { "enabled": true },
        "taskEstimator": { "enabled": true },
        "temporalTranslator": { "enabled": true },
        "priorityScheduler": { "enabled": true },
        "cycleManager": {
          "enabled": true,
          "phases": {
            "active": { "start": "08:00", "end": "18:00" },
            "passive": { "start": "18:00", "end": "22:00" },
            "autonomous": { "start": "22:00", "end": "02:00" },
            "consolidation": { "start": "02:00", "end": "04:00" },
            "maintenance": { "start": "04:00", "end": "08:00" }
          }
        },
        "crossChannelSync": { "enabled": true, "channels": ["discord", "telegram"] },
        "temporalMemory": { "enabled": true }
      }
    }
CONFIGEOF
    echo ""
fi

# Register with OpenClaw
echo ""
echo "🔗 Registering plugin..."
if command -v openclaw &> /dev/null; then
    openclaw plugins install -l "$PLUGIN_DIR" 2>/dev/null || echo "   Manual registration may be needed"
else
    echo "   openclaw CLI not found in PATH - manual registration required"
fi

echo ""
echo "=============================================="
echo "  ✅ Installation Complete!"
echo "=============================================="
echo ""
echo "Next steps:"
echo "  1. Add plugin config to $CONFIG_FILE (see above)"
echo "  2. Restart OpenClaw: openclaw gateway restart"
echo "  3. Test: openclaw temporal status"
echo ""
echo "Available tools:"
echo "  - temporal_now          Get current temporal context"
echo "  - temporal_estimate     Estimate task duration"
echo "  - temporal_start_task   Start tracking a task"
echo "  - temporal_complete_task Complete task for learning"
echo "  - temporal_schedule_task Schedule with deadline/priority"
echo "  - temporal_get_next_task Get highest priority task"
echo "  - temporal_list_tasks   List all tasks"
echo "  - temporal_get_phase    Get current cycle phase"
echo "  - temporal_sync_status  Cross-channel sync status"
echo "  - temporal_memory_search Search with temporal decay"
echo "  - temporal_memory_add   Add memory with context"
echo ""
